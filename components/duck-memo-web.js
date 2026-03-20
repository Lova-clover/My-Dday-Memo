"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import s from "./duck-memo-web.module.css";

const STORAGE_KEY = "dday-v3";
const DAY = 86400000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const COLORS = [
  { bg: "#FFF7ED", left: "#F97316", memo: "#FFF3E8" },
  { bg: "#FFFBEB", left: "#FBBF24", memo: "#FFF9D8" },
  { bg: "#F0FDF4", left: "#22C55E", memo: "#E9FBEF" },
  { bg: "#EFF6FF", left: "#3B82F6", memo: "#EAF3FF" },
  { bg: "#FDF4FF", left: "#A855F7", memo: "#F9EAFF" },
  { bg: "#FFF1F2", left: "#F43F5E", memo: "#FFE7EC" },
];

const QUICK_DATES = [
  { label: "오늘", offset: 0 },
  { label: "내일", offset: 1 },
  { label: "+3일", offset: 3 },
  { label: "+7일", offset: 7 },
];

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "today", label: "오늘" },
  { value: "fixed", label: "고정 메모" },
  { value: "upcoming", label: "예정" },
  { value: "past", label: "지난 기록" },
];

const BRAND_NAME = "나만의 D-DAY";
const BRAND_LOGO = "/my-dday-logo.png";
const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Windows Phone/i;

function createId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function todayISO(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function annualOccurrence(value, year) {
  const base = parseDate(value);
  if (!base) return null;

  const month = base.getMonth();
  const day = base.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

function effectiveDate(value, repeatYearly = false) {
  const base = parseDate(value);
  if (!base) return null;
  if (!repeatYearly) return base;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let candidate = annualOccurrence(value, today.getFullYear());
  candidate.setHours(0, 0, 0, 0);

  if (candidate < today) {
    candidate = annualOccurrence(value, today.getFullYear() + 1);
    candidate.setHours(0, 0, 0, 0);
  }

  return candidate;
}

function dday(value, repeatYearly = false) {
  const date = effectiveDate(value, repeatYearly);
  if (!date) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((date.getTime() - today.getTime()) / DAY);
}

function formatDate(value, repeatYearly = false) {
  const date = parseDate(value);
  if (!date) return "날짜 없는 고정 메모";
  if (repeatYearly) return `매년 ${date.getMonth() + 1}. ${date.getDate()}.`;
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. (${WEEKDAYS[date.getDay()]})`;
}

function relativeLabel(value, repeatYearly = false) {
  const diff = dday(value, repeatYearly);
  if (diff === null) return "상시 메모";
  if (diff === 0) return "오늘";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function normalizeItem(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;

  const color = Number.isInteger(raw.color) && raw.color >= 0 && raw.color < COLORS.length ? raw.color : 1;

  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `memo-${index}-${createId()}`,
    title,
    date: typeof raw.date === "string" && raw.date ? raw.date : null,
    memo: typeof raw.memo === "string" ? raw.memo.trim() : "",
    color,
    repeatYearly: Boolean(raw.repeatYearly) && Boolean(raw.date),
  };
}

function sampleItems() {
  return [
    {
      id: createId(),
      title: "프로젝트 마감",
      date: todayISO(2),
      memo: "최종 점검하고 제출 파일까지 한 번에 정리하기",
      color: 0,
    },
    {
      id: createId(),
      title: "매일 운동하기",
      date: null,
      memo: "저녁에 30분만이라도 꾸준히 몸 풀기",
      color: 2,
    },
    {
      id: createId(),
      title: "엄마 생신",
      date: todayISO(14),
      memo: "매년 돌아오는 일정이라 선물과 식사 예약 미리 챙기기",
      color: 5,
      repeatYearly: true,
    },
    {
      id: createId(),
      title: "팀 미팅 준비",
      date: todayISO(6),
      memo: "발표 자료 검토하고 질문 포인트 메모",
      color: 3,
    },
  ];
}

function loadItems(seed = true) {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw === null && seed) {
    const seeded = sampleItems();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeItem).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function persist(items) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function emptyDraft() {
  return { title: "", date: todayISO(0), memo: "", color: 1, hasDate: true, repeatYearly: false };
}

function draftFromItem(item) {
  if (!item) return emptyDraft();

  return {
    title: item.title,
    date: item.date || todayISO(0),
    memo: item.memo || "",
    color: item.color ?? 1,
    hasDate: Boolean(item.date),
    repeatYearly: Boolean(item.repeatYearly),
  };
}

function cardBadge(item) {
  const diff = dday(item.date, item.repeatYearly);

  if (diff === null) return { label: "고정", className: s.badgePin };
  if (diff === 0) return { label: "D-0", className: s.badgeToday };
  if (diff <= 3) return { label: `D-${diff}`, className: s.badgeUrgent };
  if (diff <= 7) return { label: `D-${diff}`, className: s.badgeSoon };
  if (diff > 7) return { label: `D-${diff}`, className: s.badgeFar };
  return { label: `D+${Math.abs(diff)}`, className: s.badgePast };
}

function EmptyState({ title, description }) {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyMark}>오리멍</div>
      <div className={s.emptyTitle}>{title}</div>
      <div className={s.emptyText}>{description}</div>
    </div>
  );
}

function TodayCard({ item, onEdit, onDelete }) {
  const color = COLORS[item.color ?? 1];

  return (
    <article
      className={s.todayCard}
      style={{
        background: `linear-gradient(135deg, #fffef5 0%, ${color.bg} 100%)`,
        borderColor: color.left,
        boxShadow: `0 18px 40px ${color.left}20`,
      }}
    >
      <div className={s.cardActions}>
        <button className={s.actionBtn} onClick={() => onEdit(item)} type="button">
          수정
        </button>
        <button className={`${s.actionBtn} ${s.actionDelete}`} onClick={() => onDelete(item.id)} type="button">
          삭제
        </button>
      </div>

      <div className={s.todayTag}>오늘 바로 확인</div>
      <div className={s.todayTitle}>{item.title}</div>
      <div className={s.todayDate}>{formatDate(item.date, item.repeatYearly)}</div>
      {item.memo ? <div className={s.todayMemo}>{item.memo}</div> : null}
      <div className={s.todayFoot}>
        <span className={s.softPill}>오늘 마감</span>
        {item.repeatYearly ? <span className={s.repeatChip}>매년 반복</span> : null}
      </div>
    </article>
  );
}

function MemoCard({ item, onEdit, onDelete }) {
  const color = COLORS[item.color ?? 1];
  const badge = cardBadge(item);

  return (
    <article
      className={s.memoCard}
      style={{
        background: color.bg,
        borderColor: `${color.left}26`,
        borderLeftColor: color.left,
      }}
    >
      <div className={s.cardActions}>
        <button className={s.actionBtn} onClick={() => onEdit(item)} type="button">
          수정
        </button>
        <button className={`${s.actionBtn} ${s.actionDelete}`} onClick={() => onDelete(item.id)} type="button">
          삭제
        </button>
      </div>

      <div className={s.memoTop}>
        <div className={s.memoTitle}>{item.title}</div>
        <span className={`${s.memoBadge} ${badge.className}`}>{badge.label}</span>
      </div>

      <div className={s.memoMeta}>
        <span className={s.metaPill}>{relativeLabel(item.date, item.repeatYearly)}</span>
        <span className={s.memoDate}>{formatDate(item.date, item.repeatYearly)}</span>
        {item.repeatYearly ? <span className={s.repeatChip}>매년 반복</span> : null}
      </div>

      {item.memo ? (
        <div className={s.memoBody} style={{ background: color.memo }}>
          {item.memo}
        </div>
      ) : (
        <div className={s.memoHint}>메모 내용은 비어 있어요. 제목만 저장된 카드예요.</div>
      )}
    </article>
  );
}

function PastCard({ item, onEdit, onDelete }) {
  return (
    <article className={s.pastCard}>
      <div className={s.cardActions}>
        <button className={s.actionBtn} onClick={() => onEdit(item)} type="button">
          수정
        </button>
        <button className={`${s.actionBtn} ${s.actionDelete}`} onClick={() => onDelete(item.id)} type="button">
          삭제
        </button>
      </div>

      <div className={s.pastTop}>
        <div className={s.pastTitle}>{item.title}</div>
        <span className={s.pastBadge}>{relativeLabel(item.date, item.repeatYearly)}</span>
      </div>
      <div className={s.pastDate}>{formatDate(item.date, item.repeatYearly)}</div>
      {item.memo ? <div className={s.pastMemo}>{item.memo}</div> : null}
    </article>
  );
}

function LoadingShell() {
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.heroCard}>
            <div className={s.heroRow}>
              <div className={s.brandBlock}>
                <div className={s.brandMark}>
                  <img alt={`${BRAND_NAME} 로고`} className={s.duckImg} height="72" loading="eager" src={BRAND_LOGO} width="72" />
                </div>
                <div>
                  <div className={s.heroEyebrow}>Desktop board</div>
                  <h1 className={s.heroTitle}>{BRAND_NAME} 보드</h1>
                  <p className={s.heroLead}>모바일 원본 느낌을 유지한 채 데스크톱 보드를 불러오는 중이에요.</p>
                </div>
              </div>
            </div>
            <div className={s.loadingBar} />
          </div>
        </div>
      </header>
    </div>
  );
}

export default function DuckMemoWeb() {
  const importInputRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [pastOpen, setPastOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setItems(loadItems());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    persist(items);
  }, [items, ready]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    if (MOBILE_UA.test(window.navigator.userAgent || "")) {
      window.location.replace("/dday-v3.html");
      return undefined;
    }

    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) {
        setItems(loadItems(false));
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => item.title.toLowerCase().includes(normalizedQuery) || item.memo.toLowerCase().includes(normalizedQuery))
    : items;

  const todayItems = filteredItems.filter((item) => item.date && dday(item.date, item.repeatYearly) === 0);
  const fixedItems = filteredItems.filter((item) => !item.date);
  const upcomingItems = filteredItems
    .filter((item) => item.date && dday(item.date, item.repeatYearly) > 0)
    .sort((a, b) => effectiveDate(a.date, a.repeatYearly) - effectiveDate(b.date, b.repeatYearly));
  const pastItems = filteredItems
    .filter((item) => item.date && dday(item.date, item.repeatYearly) < 0)
    .sort((a, b) => effectiveDate(b.date, b.repeatYearly) - effectiveDate(a.date, a.repeatYearly));

  const nextUpcoming = upcomingItems[0] ?? null;
  const urgentUpcomingCount = upcomingItems.filter((item) => {
    const diff = dday(item.date, item.repeatYearly);
    return diff !== null && diff <= 3;
  }).length;
  const weekCount = upcomingItems.filter((item) => {
    const diff = dday(item.date, item.repeatYearly);
    return diff !== null && diff <= 7;
  }).length;
  const countsByFilter = {
    all: filteredItems.length,
    today: todayItems.length,
    fixed: fixedItems.length,
    upcoming: upcomingItems.length,
    past: pastItems.length,
  };
  const totalLabel = normalizedQuery ? `검색 ${filteredItems.length}개 · 전체 ${items.length}개` : `전체 ${items.length}개`;
  const canReset = activeFilter !== "all" || Boolean(query.trim());
  const pastExpanded = activeFilter === "past" || pastOpen;
  const openAdd = (offset = 0) => {
    setEditId(null);
    setDraft({ ...emptyDraft(), date: todayISO(offset), hasDate: true });
    setModalOpen(true);
  };

  const openPinnedAdd = () => {
    setEditId(null);
    setDraft({ ...emptyDraft(), hasDate: false, repeatYearly: false });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditId(item.id);
    setDraft(draftFromItem(item));
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditId(null);
    setModalOpen(false);
  };

  const saveDraft = (event) => {
    event.preventDefault();

    const title = draft.title.trim();
    if (!title) return;

    const nextItem = {
      id: editId || createId(),
      title,
      date: draft.hasDate ? draft.date : null,
      memo: draft.memo.trim(),
      color: draft.color,
      repeatYearly: draft.hasDate ? draft.repeatYearly : false,
    };

    startTransition(() => {
      setItems((current) =>
        editId ? current.map((item) => (item.id === editId ? nextItem : item)) : [nextItem, ...current],
      );
    });

    closeModal();
  };

  const deleteItem = (id) => {
    if (typeof window !== "undefined" && !window.confirm("정말 삭제할까요?")) return;

    startTransition(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    });
  };

  const exportItems = () => {
    if (typeof window === "undefined") return;

    const stamp = new Date().toISOString().replaceAll(":", "-");
    const payload = {
      exportedAt: new Date().toISOString(),
      source: "duck-memo",
      items,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `duck-memo-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const mergeImportedItems = (incoming) => {
    const normalized = incoming.map(normalizeItem).filter(Boolean);

    if (!normalized.length) {
      if (typeof window !== "undefined") {
        window.alert("가져올 메모가 없어요.");
      }
      return;
    }

    startTransition(() => {
      setItems((current) => {
        const map = new Map(current.map((item) => [item.id, item]));
        normalized.forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      });
    });

    if (typeof window !== "undefined") {
      window.alert(`${normalized.length}개의 메모를 가져왔어요.`);
    }
  };

  const importItems = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const incoming = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : null;

      if (!incoming) {
        throw new Error("invalid");
      }

      mergeImportedItems(incoming);
    } catch {
      if (typeof window !== "undefined") {
        window.alert("가져오기 파일 형식을 읽지 못했어요.");
      }
    } finally {
      event.target.value = "";
    }
  };

  const selectFilter = (value) => {
    setActiveFilter(value);
    if (value === "past") {
      setPastOpen(true);
    }
  };

  const resetView = () => {
    setQuery("");
    setActiveFilter("all");
  };

  const handlePastToggleKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setPastOpen((current) => !current);
  };

  const now = new Date();
  const todayLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${WEEKDAYS[now.getDay()]})`;

  if (!ready) {
    return <LoadingShell />;
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.heroCard}>
            <div className={s.heroRow}>
              <div className={s.brandBlock}>
                <div className={s.brandMark}>
                  <img alt={`${BRAND_NAME} 로고`} className={s.duckImg} height="72" loading="eager" src={BRAND_LOGO} width="72" />
                </div>
                <div className={s.heroText}>
                  <div className={s.heroEyebrow}>Desktop board</div>
                  <h1 className={s.heroTitle}>{BRAND_NAME}</h1>
                  <p className={s.heroLead}>필요한 메모와 일정만 차분하게 정리하는 데스크톱 보드예요.</p>
                  <div className={s.heroDate}>{todayLabel}</div>
                </div>
              </div>

              <div className={s.heroMeta}>
                <div className={`${s.todayPill} ${todayItems.length ? s.todayHas : s.todayNone}`}>
                  {todayItems.length ? `오늘 ${todayItems.length}개` : "오늘 일정 없음"}
                </div>
                <div className={s.totalTxt}>{totalLabel}</div>
                <div className={s.heroMiniList}>
                  <span>고정 {fixedItems.length}</span>
                  <span>예정 {upcomingItems.length}</span>
                  <span>이번 주 {weekCount}</span>
                </div>
                <div className={s.heroLinkRow}>
                  <Link className={s.heroPrimaryLink} href="/app">
                    APP 다운로드
                  </Link>
                  <Link className={s.heroSecondaryLink} href="/dday-v3.html">
                    모바일 원본
                  </Link>
                </div>
              </div>
            </div>

            <div className={s.toolbar}>
              <div className={s.searchWrap}>
                <span className={s.searchIco}>⌕</span>
                <input
                  className={s.searchInp}
                  onChange={(event) => startTransition(() => setQuery(event.target.value))}
                  placeholder="제목이나 메모로 검색하기"
                  value={query}
                />
              </div>

              <div className={s.filterWrap}>
                {FILTERS.map((filter) => (
                  <button
                    className={`${s.filterBtn} ${activeFilter === filter.value ? s.filterBtnActive : ""}`}
                    key={filter.value}
                    onClick={() => selectFilter(filter.value)}
                    type="button"
                  >
                    <span>{filter.label}</span>
                    <span className={s.filterCount}>{countsByFilter[filter.value]}</span>
                  </button>
                ))}

                {canReset ? (
                  <button className={s.resetBtn} onClick={resetView} type="button">
                    초기화
                  </button>
                ) : null}
              </div>
            </div>

            <div className={s.statsRow}>
              <div className={s.statCard}>
                <div className={s.statLabel}>전체 보드</div>
                <div className={s.statValue}>{items.length}개</div>
                <div className={s.statHint}>지금 저장된 모든 메모와 일정</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statLabel}>오늘 집중</div>
                <div className={s.statValue}>{todayItems.length}개</div>
                <div className={s.statHint}>지금 바로 확인해야 하는 카드</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statLabel}>가장 가까운 일정</div>
                <div className={s.statValue}>{nextUpcoming ? relativeLabel(nextUpcoming.date, nextUpcoming.repeatYearly) : "-"}</div>
                <div className={s.statHint}>{nextUpcoming ? nextUpcoming.title : "예정된 일정이 아직 없어요."}</div>
              </div>
              <div className={s.statCard}>
                <div className={s.statLabel}>급한 일정</div>
                <div className={s.statValue}>{urgentUpcomingCount}개</div>
                <div className={s.statHint}>3일 안에 다가오는 일정</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={s.content}>
        <div className={s.board}>
          {!items.length ? (
            <EmptyState title="아직 메모가 없어요" description="오른쪽 패널이나 플러스 버튼으로 첫 메모를 추가해보세요." />
          ) : !filteredItems.length ? (
            <EmptyState title="검색 결과가 없어요" description="다른 키워드로 찾거나 필터를 초기화해서 다시 확인해보세요." />
          ) : (
            <>
              {activeFilter !== "fixed" && activeFilter !== "upcoming" && activeFilter !== "past" ? (
                todayItems.length ? (
                  <section className={s.sectionShell}>
                    <div className={s.sectionHead}>
                      <div className={s.sectionText}>
                        <div className={s.sectionEyebrow}>Today focus</div>
                        <div className={s.sectionTitleRow}>
                          <h2 className={s.sectionTitle}>오늘</h2>
                          <span className={s.sectionCount}>{todayItems.length}</span>
                        </div>
                        <p className={s.sectionDesc}>가장 먼저 확인해야 하는 D-DAY 카드만 따로 모았어요.</p>
                      </div>
                    </div>
                    <div className={s.todayGrid}>
                      {todayItems.map((item) => (
                        <TodayCard item={item} key={item.id} onDelete={deleteItem} onEdit={openEdit} />
                      ))}
                    </div>
                  </section>
                ) : activeFilter === "today" ? (
                  <section className={s.sectionShell}>
                    <EmptyState title="오늘 일정이 없어요" description="오늘 처리할 항목이 없어서 한결 여유로운 보드예요." />
                  </section>
                ) : null
              ) : null}

              {activeFilter !== "today" && activeFilter !== "upcoming" && activeFilter !== "past" ? (
                fixedItems.length ? (
                  <section className={s.sectionShell}>
                    <div className={s.sectionHead}>
                      <div className={s.sectionText}>
                        <div className={s.sectionEyebrow}>Pinned memo</div>
                        <div className={s.sectionTitleRow}>
                          <h2 className={s.sectionTitle}>고정 메모</h2>
                          <span className={s.sectionCount}>{fixedItems.length}</span>
                        </div>
                        <p className={s.sectionDesc}>날짜 없이 상단에 두고 자주 보는 메모들만 모아둔 영역이에요.</p>
                      </div>
                    </div>
                    <div className={s.cardGrid}>
                      {fixedItems.map((item) => (
                        <MemoCard item={item} key={item.id} onDelete={deleteItem} onEdit={openEdit} />
                      ))}
                    </div>
                  </section>
                ) : activeFilter === "fixed" ? (
                  <section className={s.sectionShell}>
                    <EmptyState title="고정 메모가 없어요" description="반복해서 보는 체크리스트나 상시 메모를 추가해보세요." />
                  </section>
                ) : null
              ) : null}

              {activeFilter !== "today" && activeFilter !== "fixed" && activeFilter !== "past" ? (
                upcomingItems.length ? (
                  <section className={s.sectionShell}>
                    <div className={s.sectionHead}>
                      <div className={s.sectionText}>
                        <div className={s.sectionEyebrow}>Upcoming</div>
                        <div className={s.sectionTitleRow}>
                          <h2 className={s.sectionTitle}>다가오는 일정</h2>
                          <span className={s.sectionCount}>{upcomingItems.length}</span>
                        </div>
                        <p className={s.sectionDesc}>날짜가 가까운 순서대로 정렬해서 데스크톱에서 한눈에 보이게 만들었어요.</p>
                      </div>
                    </div>
                    <div className={s.cardGrid}>
                      {upcomingItems.map((item) => (
                        <MemoCard item={item} key={item.id} onDelete={deleteItem} onEdit={openEdit} />
                      ))}
                    </div>
                  </section>
                ) : activeFilter === "upcoming" ? (
                  <section className={s.sectionShell}>
                    <EmptyState title="다가오는 일정이 없어요" description="미래 일정이 비어 있어서 지금은 고정 메모 위주로 정리하면 돼요." />
                  </section>
                ) : null
              ) : null}

              {activeFilter === "past" || pastItems.length ? (
                <section className={s.sectionShell}>
                  <div className={s.sectionHead}>
                    <div className={s.sectionText}>
                      <div className={s.sectionEyebrow}>Archive</div>
                      <div className={s.sectionTitleRow}>
                        <h2 className={s.sectionTitle}>지난 기록</h2>
                        <span className={s.sectionCount}>{pastItems.length}</span>
                      </div>
                      <p className={s.sectionDesc}>지나간 일정은 접어두고 필요할 때만 펼쳐보도록 정리했어요.</p>
                    </div>

                    {activeFilter !== "past" ? (
                      <button
                        className={s.foldBtn}
                        onClick={() => setPastOpen((current) => !current)}
                        onKeyDown={handlePastToggleKeyDown}
                        type="button"
                      >
                        {pastExpanded ? "접기" : "펼치기"}
                      </button>
                    ) : null}
                  </div>

                  {pastItems.length ? (
                    pastExpanded ? (
                      <div className={s.pastGrid}>
                        {pastItems.map((item) => (
                          <PastCard item={item} key={item.id} onDelete={deleteItem} onEdit={openEdit} />
                        ))}
                      </div>
                    ) : (
                      <div className={s.foldHint}>지난 기록 {pastItems.length}개가 접혀 있어요.</div>
                    )
                  ) : (
                    <EmptyState title="지난 일정이 없어요" description="지난 기록이 쌓이면 여기에서 차분하게 다시 볼 수 있어요." />
                  )}
                </section>
              ) : null}
            </>
          )}
        </div>

        <aside className={s.sideRail}>
          <div className={`${s.panel} ${s.panelStrong}`}>
            <div className={s.panelEyebrow}>Board summary</div>
            <div className={s.panelHero}>{todayItems.length ? `오늘 처리할 일정 ${todayItems.length}개` : "오늘은 한결 여유로운 보드예요."}</div>
            <div className={s.panelText}>
              {nextUpcoming
                ? `가장 가까운 일정은 "${nextUpcoming.title}"이고 ${relativeLabel(nextUpcoming.date, nextUpcoming.repeatYearly)} 상태예요.`
                : "다가오는 일정이 아직 없어서 고정 메모 정리나 아이디어 수집에 집중하기 좋아요."}
            </div>
            <div className={s.summaryList}>
              <div className={s.summaryItem}>
                <span>전체 보드</span>
                <strong>{items.length}개</strong>
              </div>
              <div className={s.summaryItem}>
                <span>이번 주 일정</span>
                <strong>{weekCount}개</strong>
              </div>
              <div className={s.summaryItem}>
                <span>고정 메모</span>
                <strong>{fixedItems.length}개</strong>
              </div>
            </div>
          </div>

          <div className={s.panel}>
            <div className={s.panelTitle}>빠르게 추가하기</div>
            <div className={s.panelText}>자주 쓰는 입력 흐름만 남겨서 데스크톱에서 바로 적고 닫기 편하게 정리했어요.</div>
            <div className={s.quickRow}>
              {QUICK_DATES.map((item) => (
                <button className={s.quickBtn} key={item.label} onClick={() => openAdd(item.offset)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
            <button className={s.primaryBtn} onClick={() => openAdd(0)} type="button">
              새 일정 메모 만들기
            </button>
            <button className={s.secondaryBtn} onClick={openPinnedAdd} type="button">
              날짜 없는 고정 메모 만들기
            </button>
          </div>

          <div className={s.panel}>
            <div className={s.panelTitle}>백업과 앱</div>
            <div className={s.panelText}>
              웹은 계속 브라우저에서 보고, 앱은 별도로 다운로드할 수 있게 분리해뒀어요. 데이터 이동은 JSON
              내보내기와 가져오기로 이어가면 됩니다.
            </div>
            <div className={s.quickRow}>
              <button className={s.quickBtn} onClick={exportItems} type="button">
                내보내기
              </button>
              <button className={s.quickBtn} onClick={() => importInputRef.current?.click()} type="button">
                가져오기
              </button>
            </div>
            <input accept="application/json,.json" hidden onChange={importItems} ref={importInputRef} type="file" />
            <div className={s.panelActionStack}>
              <Link className={s.secondaryBtn} href="/app">
                APP 다운로드 페이지
              </Link>
              <Link className={s.mobileLink} href="/dday-v3.html">
                모바일 원본 보기
              </Link>
            </div>
          </div>
        </aside>
      </main>

      {modalOpen ? (
        <div className={s.overlay} onClick={(event) => event.target === event.currentTarget && closeModal()} role="presentation">
          <form className={s.modal} onSubmit={saveDraft}>
            <div className={s.modalHead}>
              <div>
                <div className={s.modalEyebrow}>{editId ? "Edit memo" : "New memo"}</div>
                <div className={s.modalTitle}>{editId ? "메모 수정하기" : "새 메모 추가하기"}</div>
              </div>
              <button className={s.modalClose} onClick={closeModal} type="button">
                닫기
              </button>
            </div>

            <div className={s.formGrid}>
              <label className={s.field}>
                <span className={s.label}>제목</span>
                <input
                  className={s.input}
                  maxLength={80}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="기억할 제목을 적어주세요"
                  value={draft.title}
                />
              </label>

              <div className={s.field}>
                <div className={s.rowHead}>
                  <span className={s.label}>날짜</span>
                  <div className={s.toggleWrap}>
                    <span className={s.toggleText}>{draft.hasDate ? "날짜 있음" : "고정 메모"}</span>
                    <button
                      className={`${s.toggle} ${draft.hasDate ? s.toggleOn : ""}`}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          hasDate: !current.hasDate,
                          date: current.date || todayISO(0),
                          repeatYearly: current.hasDate ? false : current.repeatYearly,
                        }))
                      }
                      type="button"
                    >
                      <span className={s.toggleKnob} />
                    </button>
                  </div>
                </div>

                {draft.hasDate ? (
                  <>
                    <input
                      className={s.input}
                      onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                      type="date"
                      value={draft.date}
                    />
                    <div className={s.repeatRow}>
                      <button
                        className={`${s.repeatBtn} ${draft.repeatYearly ? s.repeatBtnActive : ""}`}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            repeatYearly: !current.repeatYearly,
                          }))
                        }
                        type="button"
                      >
                        {draft.repeatYearly ? "매년 반복 켜짐" : "매년 반복 끔"}
                      </button>
                      <span className={s.repeatText}>생일이나 기념일처럼 매년 같은 날 다시 보여줘요.</span>
                    </div>
                  </>
                ) : (
                  <div className={s.helper}>날짜를 끄면 데스크톱과 모바일 모두에서 고정 메모로 보여요.</div>
                )}
              </div>

              <label className={s.field}>
                <span className={s.label}>메모</span>
                <textarea
                  className={`${s.input} ${s.textarea}`}
                  onChange={(event) => setDraft((current) => ({ ...current, memo: event.target.value }))}
                  placeholder="조금 더 자세한 메모를 남겨보세요"
                  rows={5}
                  value={draft.memo}
                />
              </label>

              <div className={s.field}>
                <span className={s.label}>색상</span>
                <div className={s.colorRow}>
                  {COLORS.map((color, index) => (
                    <button
                      className={`${s.colorDot} ${draft.color === index ? s.colorDotActive : ""}`}
                      key={color.left}
                      onClick={() => setDraft((current) => ({ ...current, color: index }))}
                      style={{ background: color.left }}
                      type="button"
                    />
                  ))}
                </div>
              </div>

              <div className={s.field}>
                <span className={s.label}>빠른 날짜</span>
                <div className={s.quickRow}>
                  {QUICK_DATES.map((item) => (
                    <button
                      className={s.quickBtn}
                      key={`modal-${item.label}`}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          hasDate: true,
                          date: todayISO(item.offset),
                        }))
                      }
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button className={s.submitBtn} disabled={!draft.title.trim()} type="submit">
                {editId ? "수정 완료" : "추가하기"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
