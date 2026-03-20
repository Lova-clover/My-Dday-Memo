"use client";

import Image from "next/image";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import s from "./duck-memo-web.module.css";

const STORAGE_KEY = "dday-v3";
const DAY = 86400000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const COLORS = [
  { bg: "#FFF7ED", left: "#F97316", memo: "#FFF3E8" },
  { bg: "#FFFBEB", left: "#FBBF24", memo: "#FFFBEB" },
  { bg: "#F0FDF4", left: "#22C55E", memo: "#F0FDF4" },
  { bg: "#EFF6FF", left: "#3B82F6", memo: "#EFF6FF" },
  { bg: "#FDF4FF", left: "#A855F7", memo: "#FDF4FF" },
  { bg: "#FFF1F2", left: "#F43F5E", memo: "#FFF1F2" },
];

const QUICK_DATES = [
  { label: "오늘", offset: 0 },
  { label: "내일", offset: 1 },
  { label: "+3일", offset: 3 },
  { label: "+7일", offset: 7 },
];

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

function dday(value) {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / DAY);
}

function fmt(value) {
  const date = parseDate(value);
  if (!date) return "날짜 없음";
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. (${WEEKDAYS[date.getDay()]})`;
}

function relative(value) {
  const diff = dday(value);
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
  };
}

function sampleItems() {
  return [
    { id: createId(), title: "프로젝트 마감", date: todayISO(2), memo: "최종 보고서 제출과 발표 준비", color: 0 },
    { id: createId(), title: "매일 운동하기", date: null, memo: "스쿼트 50개, 플랭크 1분", color: 2 },
    { id: createId(), title: "생일 파티", date: todayISO(14), memo: "케이크 예약과 선물 구매", color: 5 },
    { id: createId(), title: "팀 미팅", date: todayISO(6), memo: "노트북과 발표자료 챙기기", color: 3 },
  ];
}

function loadItems(seed = true) {
  if (typeof window === "undefined") return sampleItems();

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

function cardBadge(item) {
  const diff = dday(item.date);
  if (diff === null) return { label: "고정", className: s.badgePin };
  if (diff === 0) return { label: "D-0", className: s.badgeToday };
  if (diff <= 3) return { label: `D-${diff}`, className: s.badgeUrgent };
  if (diff <= 7) return { label: `D-${diff}`, className: s.badgeSoon };
  if (diff > 7) return { label: `D-${diff}`, className: s.badgeFar };
  return { label: `D+${Math.abs(diff)}`, className: s.badgePast };
}

function emptyDraft() {
  return { title: "", date: todayISO(0), memo: "", color: 1, hasDate: true };
}

function draftFromItem(item) {
  if (!item) return emptyDraft();
  return {
    title: item.title,
    date: item.date || todayISO(0),
    memo: item.memo || "",
    color: item.color ?? 1,
    hasDate: Boolean(item.date),
  };
}

function MemoCard({ item, onEdit, onDelete }) {
  const color = COLORS[item.color ?? 1];
  const badge = cardBadge(item);

  return (
    <div className={s.itemCard} style={{ background: color.bg, borderLeftColor: color.left, borderColor: `${color.left}22` }}>
      <div className={s.itemActions}>
        <button className={s.actBtn} onClick={() => onEdit(item)} type="button">
          수정
        </button>
        <button className={`${s.actBtn} ${s.deleteBtn}`} onClick={() => onDelete(item.id)} type="button">
          삭제
        </button>
      </div>
      <div className={s.itemTop}>
        <div className={s.itemTitle}>{item.title}</div>
        <span className={`${s.itemBadge} ${badge.className}`}>{badge.label}</span>
      </div>
      <div className={s.itemDate}>{item.date ? fmt(item.date) : "날짜 없음 · 상단 고정 메모"}</div>
      {item.memo ? <div className={s.itemMemo} style={{ background: color.memo }}>{item.memo}</div> : null}
    </div>
  );
}

function TodayCard({ item, onEdit, onDelete }) {
  const color = COLORS[item.color ?? 1];

  return (
    <div className={s.todayCard} style={{ borderColor: color.left }}>
      <div className={s.todayActions}>
        <button className={s.actBtn} onClick={() => onEdit(item)} type="button">
          수정
        </button>
        <button className={`${s.actBtn} ${s.deleteBtn}`} onClick={() => onDelete(item.id)} type="button">
          삭제
        </button>
      </div>
      <div className={s.todayTag}>오늘 확인</div>
      <div className={s.todayTitle}>{item.title}</div>
      <div className={s.todayDateTxt}>{fmt(item.date)}</div>
      {item.memo ? <div className={s.todayMemo}>{item.memo}</div> : null}
    </div>
  );
}

export default function DuckMemoWeb() {
  const importInputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [pastOpen, setPastOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  useEffect(() => {
    persist(items);
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const ua = window.navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua) || window.innerWidth <= 820) {
      window.location.replace("/dday-v3.html");
      return undefined;
    }

    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setItems(loadItems(false));
    };

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || Boolean(window.navigator.standalone));
    window.addEventListener("storage", onStorage);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const filtered = items.filter((item) => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.memo.toLowerCase().includes(q);
  });

  const todayItems = filtered.filter((item) => item.date && dday(item.date) === 0);
  const fixedItems = filtered.filter((item) => !item.date);
  const futureItems = filtered
    .filter((item) => item.date && dday(item.date) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastItems = filtered
    .filter((item) => item.date && dday(item.date) < 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const openAdd = (offset = 0) => {
    setEditId(null);
    setDraft({ ...emptyDraft(), date: todayISO(offset), hasDate: true });
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
    startTransition(() => setItems((current) => current.filter((item) => item.id !== id)));
  };

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      return;
    }

    if (typeof window !== "undefined") {
      window.alert("아이폰은 Safari 공유 메뉴의 '홈 화면에 추가', 크롬은 메뉴의 '앱 설치'를 사용하면 됩니다.");
    }
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
      if (typeof window !== "undefined") window.alert("가져올 메모가 없어요.");
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

  const now = new Date();
  const todayLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 (${WEEKDAYS[now.getDay()]})`;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <div className={s.duckRow}>
                <Image alt="짱귀요미 오리" className={s.duckImg} height={64} src="/duck-hero.png" width={64} />
            <div className={s.heroInfo}>
              <div className={s.heroTitle}>짱귀요미 오리 D-DAY 웹</div>
              <div className={s.heroDate}>{todayLabel}</div>
            </div>
            <div className={s.heroRight}>
              <div className={`${s.todayPill} ${todayItems.length ? s.todayHas : s.todayNone}`}>
                {todayItems.length ? `오늘 ${todayItems.length}개` : "오늘 없음"}
              </div>
              <div className={s.totalTxt}>전체 {items.length}개</div>
            </div>
          </div>

          <div className={s.searchWrap}>
            <input
              className={s.searchInp}
              onChange={(event) => startTransition(() => setQuery(event.target.value))}
              placeholder="검색하기…"
              value={query}
            />
            <span className={s.searchIco}>🔎</span>
          </div>
        </div>
      </header>

      <main className={s.content}>
        <div className={s.board}>
          <section>
            {todayItems.length ? (
              <>
                <div className={s.secHd}>
                  <span>오늘</span>
                  <span className={s.secCnt}>{todayItems.length}</span>
                </div>
                <div className={s.todayGrid}>
                  {todayItems.map((item) => (
                    <TodayCard item={item} key={item.id} onDelete={deleteItem} onEdit={openEdit} />
                  ))}
                </div>
              </>
            ) : null}
          </section>

          <section>
            <div className={s.secHd}>
              <span>고정 메모</span>
              <span className={s.secCnt}>{fixedItems.length}</span>
            </div>
            {fixedItems.length ? (
              <div className={s.cardGrid}>
                {fixedItems.map((item) => (
                  <MemoCard item={item} key={item.id} onDelete={deleteItem} onEdit={openEdit} />
                ))}
              </div>
            ) : (
              <div className={s.empty}>날짜 없는 메모는 여기에 모입니다.</div>
            )}
          </section>

          <section>
            <div className={s.secHd}>
              <span>D-DAY</span>
              <span className={s.secCnt}>{futureItems.length}</span>
            </div>
            {futureItems.length ? (
              <div className={s.cardGrid}>
                {futureItems.map((item) => (
                  <MemoCard item={item} key={item.id} onDelete={deleteItem} onEdit={openEdit} />
                ))}
              </div>
            ) : (
              <div className={s.empty}>다가오는 일정이 없습니다.</div>
            )}
          </section>

          <section>
            <div className={`${s.secHd} ${s.clickable}`} onClick={() => setPastOpen((current) => !current)} role="button" tabIndex={0}>
              <span>지난 일정</span>
              <span className={s.secCnt}>{pastItems.length}</span>
              <span className={s.foldTxt}>{pastOpen ? "접기" : "펼치기"}</span>
            </div>
            {pastOpen && pastItems.length ? (
              <div className={s.pastGrid}>
                {pastItems.map((item) => (
                  <MemoCard item={item} key={item.id} onDelete={deleteItem} onEdit={openEdit} />
                ))}
              </div>
            ) : pastItems.length ? (
              <div className={s.empty}>클릭해서 지난 일정 {pastItems.length}개 보기</div>
            ) : (
              <div className={s.empty}>지나간 일정이 없습니다.</div>
            )}
          </section>
        </div>

        <aside className={s.sideRail}>
          <div className={s.panel}>
            <div className={s.panelTitle}>빠른 추가</div>
            <div className={s.quickRow}>
              {QUICK_DATES.map((item) => (
                <button className={s.quickBtn} key={item.label} onClick={() => openAdd(item.offset)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
            <button className={s.primaryBtn} onClick={() => openAdd(0)} type="button">
              + 새 메모
            </button>
          </div>

          <div className={s.panel}>
            <div className={s.panelTitle}>앱처럼 설치</div>
            <div className={s.panelText}>
              {isStandalone
                ? "이미 앱처럼 설치된 상태입니다."
                : "브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 누르면 앱처럼 사용할 수 있습니다."}
            </div>
            <button className={s.installBtn} onClick={installApp} type="button">
              {installPrompt ? "앱 설치하기" : "설치 방법 보기"}
            </button>
          </div>

          <div className={s.panel}>
            <div className={s.panelTitle}>내보내기 / 가져오기</div>
            <div className={s.panelText}>컴퓨터에서 JSON으로 내보낸 뒤, 모바일에서 같은 파일을 가져오면 이어서 쓸 수 있습니다.</div>
            <div className={s.quickRow}>
              <button className={s.quickBtn} onClick={exportItems} type="button">
                내보내기
              </button>
              <button
                className={s.quickBtn}
                onClick={() => importInputRef.current?.click()}
                type="button"
              >
                가져오기
              </button>
            </div>
            <input
              accept="application/json,.json"
              hidden
              onChange={importItems}
              ref={importInputRef}
              type="file"
            />
          </div>

          <div className={s.mascotCard}>
            <Image alt="오리 마스코트" className={s.mascotImg} height={220} src="/profile-duck.png" width={220} />
            <div className={s.panelTitle}>모바일과 같은 감성</div>
            <div className={s.panelText}>원본 모바일 톤을 그대로 가져오고, 데스크톱에서는 보기 편하게 폭만 넓혔습니다.</div>
            <a className={s.mobileLink} href="/dday-v3.html">
              모바일 원본 보기
            </a>
          </div>
        </aside>
      </main>

      <button className={s.fab} onClick={() => openAdd(0)} type="button">
        +
      </button>

      {modalOpen ? (
        <div className={s.overlay} onClick={(event) => event.target === event.currentTarget && closeModal()} role="presentation">
          <form className={s.modal} onSubmit={saveDraft}>
            <div className={s.modalHead}>
              <div className={s.modalTtl}>{editId ? "메모 수정하기" : "새로 추가하기"}</div>
              <button className={s.modalX} onClick={closeModal} type="button">
                ✕
              </button>
            </div>

            <div className={s.fgroup}>
              <label className={s.field}>
                <span className={s.flabel}>제목</span>
                <input
                  className={s.finput}
                  maxLength={80}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="제목을 입력하세요"
                  value={draft.title}
                />
              </label>

              <div className={s.field}>
                <div className={s.rowHd}>
                  <span className={s.flabel}>날짜</span>
                  <div className={s.togWrap}>
                    <span className={s.togTxt}>{draft.hasDate ? "날짜 있음" : "상시 고정"}</span>
                    <button
                      className={`${s.tog} ${draft.hasDate ? s.togOn : ""}`}
                      onClick={() => setDraft((current) => ({ ...current, hasDate: !current.hasDate }))}
                      type="button"
                    >
                      <span className={s.togK} />
                    </button>
                  </div>
                </div>
                {draft.hasDate ? (
                  <input
                    className={s.finput}
                    onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                    type="date"
                    value={draft.date}
                  />
                ) : (
                  <div className={s.helper}>날짜를 끄면 고정 메모로 저장됩니다.</div>
                )}
              </div>

              <label className={s.field}>
                <span className={s.flabel}>메모</span>
                <textarea
                  className={s.finput}
                  onChange={(event) => setDraft((current) => ({ ...current, memo: event.target.value }))}
                  placeholder="세부 내용을 적어두세요"
                  rows={5}
                  value={draft.memo}
                />
              </label>

              <div className={s.field}>
                <span className={s.flabel}>색상</span>
                <div className={s.cdots}>
                  {COLORS.map((color, index) => (
                    <button
                      className={`${s.cdot} ${draft.color === index ? s.cdotActive : ""}`}
                      key={color.left}
                      onClick={() => setDraft((current) => ({ ...current, color: index }))}
                      style={{ background: color.left }}
                      type="button"
                    />
                  ))}
                </div>
              </div>

              <div className={s.quickRow}>
                {QUICK_DATES.map((item) => (
                  <button
                    className={s.quickBtn}
                    key={`modal-${item.label}`}
                    onClick={() => setDraft((current) => ({ ...current, hasDate: true, date: todayISO(item.offset) }))}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <button className={s.sbtn} disabled={!draft.title.trim()} type="submit">
                {editId ? "수정 완료" : "추가하기"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
