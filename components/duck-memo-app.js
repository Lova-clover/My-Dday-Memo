"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "duck-memo.tasks.v1";
const EMPTY_FORM = { title: "", note: "", dueDate: "" };
const EMPTY_QUICK_FORM = { title: "", dueDate: "" };
const DAY_MS = 1000 * 60 * 60 * 24;
const FILTERS = [
  { id: "all", label: "전체" },
  { id: "dday", label: "D-DAY" },
  { id: "normal", label: "평상시" },
  { id: "dated", label: "날짜 메모" },
];

function normalizeTask(task) {
  const now = new Date().toISOString();

  return {
    id: task?.id ?? crypto.randomUUID(),
    title: String(task?.title ?? ""),
    note: String(task?.note ?? ""),
    dueDate: task?.dueDate || null,
    isDone: Boolean(task?.isDone),
    createdAt: task?.createdAt ?? now,
    updatedAt: task?.updatedAt ?? now,
  };
}

function parseDateAtMidnight(value) {
  return new Date(`${value}T00:00:00`);
}

function getInputDate(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createSampleTasks() {
  const now = new Date().toISOString();

  return [
    normalizeTask({
      title: "병원 예약 확인 전화",
      note: "오전 10시 전에 병원에 전화하고 캘린더에도 다시 적어두기.",
      dueDate: getInputDate(0),
      createdAt: now,
      updatedAt: now,
    }),
    normalizeTask({
      title: "장보기 메모",
      note: "계란, 과일, 우유. 날짜는 없지만 계속 보여야 하는 일.",
      dueDate: null,
      createdAt: now,
      updatedAt: now,
    }),
    normalizeTask({
      title: "블로그 썸네일 문구 정리",
      note: "표지 문구와 버튼 문구 톤을 같이 맞춰보기.",
      dueDate: null,
      createdAt: now,
      updatedAt: now,
    }),
    normalizeTask({
      title: "촬영 파일 백업",
      note: "외장하드와 클라우드 둘 다 확인해서 누락 없이 정리하기.",
      dueDate: getInputDate(3),
      createdAt: now,
      updatedAt: now,
    }),
    normalizeTask({
      title: "다음 주 미팅 자료 정리",
      note: "발표 순서와 링크를 한 번 더 정리해두기.",
      dueDate: getInputDate(7),
      createdAt: now,
      updatedAt: now,
    }),
  ];
}

function getDayDifference(dueDate) {
  if (!dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = parseDateAtMidnight(dueDate);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

function getBucket(dueDate) {
  const diff = getDayDifference(dueDate);

  if (diff === 0) return "dday";
  if (diff === null) return "normal";
  return "dated";
}

function formatFullDate(dueDate) {
  if (!dueDate) return "날짜 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseDateAtMidnight(dueDate));
}

function formatShortDate(dueDate) {
  if (!dueDate) return "평상시";

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(parseDateAtMidnight(dueDate));
}

function formatUpdatedAt(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getDatePrimaryLabel(dueDate) {
  const diff = getDayDifference(dueDate);

  if (diff === null) return "평상시";
  if (diff === 0) return "D-DAY";
  return formatShortDate(dueDate);
}

function getDateSecondaryLabel(dueDate) {
  const diff = getDayDifference(dueDate);

  if (diff === null) return "날짜 없음";
  if (diff === 0) return formatFullDate(dueDate);
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function matchesSearch(task, query) {
  if (!query) return true;
  return `${task.title} ${task.note} ${task.dueDate ?? ""}`.toLowerCase().includes(query);
}

function matchesFilter(task, filter) {
  if (filter === "all") return true;
  return getBucket(task.dueDate) === filter;
}

function sortOpenTasks(tasks) {
  return [...tasks].sort((left, right) => {
    const order = { dday: 0, normal: 1, dated: 2 };
    const leftBucket = getBucket(left.dueDate);
    const rightBucket = getBucket(right.dueDate);

    if (order[leftBucket] !== order[rightBucket]) {
      return order[leftBucket] - order[rightBucket];
    }

    if (leftBucket === "dated") {
      const byDistance =
        Math.abs(getDayDifference(left.dueDate)) - Math.abs(getDayDifference(right.dueDate));

      if (byDistance !== 0) {
        return byDistance;
      }

      return (
        parseDateAtMidnight(left.dueDate).getTime() -
        parseDateAtMidnight(right.dueDate).getTime()
      );
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function sortDoneTasks(tasks) {
  return [...tasks].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function getFilterCount(tasks, filterId) {
  if (filterId === "all") return tasks.length;
  return tasks.filter((task) => matchesFilter(task, filterId)).length;
}

function getDateCellClasses(bucket) {
  if (bucket === "dday") {
    return "border-orange-200 bg-orange-400 text-white";
  }

  if (bucket === "normal") {
    return "border-amber-100 bg-amber-50 text-amber-950";
  }

  return "border-orange-100 bg-orange-50/70 text-amber-950";
}

export default function DuckMemoApp() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [quickForm, setQuickForm] = useState(EMPTY_QUICK_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showArchive, setShowArchive] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setTasks(parsed.map(normalizeTask));
        }
      } else if (new URLSearchParams(window.location.search).get("demo") === "1") {
        setTasks(createSampleTasks());
      }
    } catch (error) {
      console.error("Failed to load memo tasks", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [isReady, tasks]);

  const openTasks = sortOpenTasks(tasks.filter((task) => !task.isDone));
  const doneTasks = sortDoneTasks(tasks.filter((task) => task.isDone));
  const query = searchQuery.trim().toLowerCase();
  const visibleOpenTasks = openTasks.filter(
    (task) => matchesSearch(task, query) && matchesFilter(task, activeFilter),
  );
  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? openTasks[0] ?? doneTasks[0] ?? null;

  useEffect(() => {
    if (!selectedTaskId && selectedTask) {
      setSelectedTaskId(selectedTask.id);
      return;
    }

    if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(openTasks[0]?.id ?? doneTasks[0]?.id ?? null);
    }
  }, [doneTasks, openTasks, selectedTask, selectedTaskId, tasks]);

  const counts = {
    dday: openTasks.filter((task) => getBucket(task.dueDate) === "dday").length,
    normal: openTasks.filter((task) => getBucket(task.dueDate) === "normal").length,
    dated: openTasks.filter((task) => getBucket(task.dueDate) === "dated").length,
    completionRate: tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
  };

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleQuickChange(event) {
    const { name, value } = event.target;
    setQuickForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

    const now = new Date().toISOString();

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? {
                ...task,
                title: form.title.trim(),
                note: form.note.trim(),
                dueDate: form.dueDate || null,
                updatedAt: now,
              }
            : task,
        ),
      );
      setSelectedTaskId(editingId);
    } else {
      const nextTask = normalizeTask({
        title: form.title.trim(),
        note: form.note.trim(),
        dueDate: form.dueDate || null,
        createdAt: now,
        updatedAt: now,
      });

      setTasks((current) => [nextTask, ...current]);
      setSelectedTaskId(nextTask.id);
    }

    resetForm();
  }

  function handleQuickSubmit(event) {
    event.preventDefault();
    if (!quickForm.title.trim()) return;

    const now = new Date().toISOString();
    const nextTask = normalizeTask({
      title: quickForm.title.trim(),
      note: "",
      dueDate: quickForm.dueDate || null,
      createdAt: now,
      updatedAt: now,
    });

    setTasks((current) => [nextTask, ...current]);
    setQuickForm(EMPTY_QUICK_FORM);
    setSelectedTaskId(nextTask.id);
    setActiveFilter("all");
  }

  function handleEdit(task) {
    setEditingId(task.id);
    setSelectedTaskId(task.id);
    setForm({
      title: task.title,
      note: task.note,
      dueDate: task.dueDate ?? "",
    });
  }

  function handleToggle(taskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              isDone: !task.isDone,
              updatedAt: new Date().toISOString(),
            }
          : task,
      ),
    );
  }

  function handleDelete(taskId) {
    setTasks((current) => current.filter((task) => task.id !== taskId));

    if (editingId === taskId) {
      resetForm();
    }
  }

  function loadSampleBoard() {
    const sample = createSampleTasks();
    setTasks(sample);
    setSelectedTaskId(sample[0]?.id ?? null);
    setActiveFilter("all");
  }

  function clearFinished() {
    setTasks((current) => current.filter((task) => !task.isDone));
  }

  let previousBucket = null;

  return (
    <main
      className="min-h-screen bg-[#FFFDF7]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(245, 158, 11, 0.12) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="mx-auto max-w-[1680px] px-5 py-5 xl:px-8">
        <header className="mb-5 flex flex-col gap-4 rounded-full border border-orange-100 bg-white/85 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/profile-duck.png"
              alt="프로필 이미지"
              className="h-12 w-12 rounded-2xl border-2 border-white object-cover shadow-sm"
            />
            <div>
              <p className="text-sm font-black text-zinc-900">My D-day Memo</p>
              <p className="text-sm text-zinc-500">
                메모를 하나의 넓은 리스트로 보고, D-DAY와 평상시 메모를 한 번에 관리합니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-sm font-semibold text-zinc-600">
              D-DAY <span className="ml-1 font-black text-orange-500">{counts.dday}</span>
            </div>
            <div className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-600">
              평상시 <span className="ml-1 font-black text-orange-500">{counts.normal}</span>
            </div>
            <div className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-600">
              날짜 메모 <span className="ml-1 font-black text-orange-500">{counts.dated}</span>
            </div>
            <div className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-600">
              완료율 <span className="ml-1 font-black text-orange-500">{counts.completionRate}%</span>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-8">
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500">
                    Wide Memo Board
                  </span>
                  <h1 className="mt-3 text-4xl font-black tracking-[-0.03em] text-zinc-900 lg:text-5xl">
                    좌측 메모 보드를 넓게 쓰는 데스크톱 대시보드
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-500 lg:text-base">
                    검색, 필터, 빠른 추가, 넓은 리스트 테이블을 한곳에 묶었습니다. 정렬은
                    D-DAY, 평상시, 날짜 메모 순서로 유지됩니다.
                  </p>
                </div>

                {tasks.length === 0 ? (
                  <button
                    type="button"
                    className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
                    onClick={loadSampleBoard}
                  >
                    샘플 메모 불러오기
                  </button>
                ) : null}
              </div>

              <div className="rounded-2xl border border-orange-100 bg-yellow-50/60 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="제목이나 메모 내용으로 검색"
                    className="h-12 flex-1 rounded-full border border-orange-100 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-orange-200"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      className="rounded-full border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-zinc-700"
                      onClick={() => setSearchQuery("")}
                    >
                      지우기
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        activeFilter === filter.id
                          ? "border border-orange-200 bg-orange-100 text-orange-600"
                          : "border border-orange-100 bg-white text-zinc-600 hover:bg-gray-50"
                      }`}
                      onClick={() => setActiveFilter(filter.id)}
                    >
                      {filter.label} {getFilterCount(openTasks, filter.id)}
                    </button>
                  ))}
                </div>

                <form className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_auto]" onSubmit={handleQuickSubmit}>
                  <input
                    type="text"
                    name="title"
                    value={quickForm.title}
                    onChange={handleQuickChange}
                    placeholder="빠르게 한 줄 메모 추가"
                    maxLength={80}
                    className="h-12 rounded-full border border-orange-100 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-orange-200"
                  />
                  <input
                    type="date"
                    name="dueDate"
                    value={quickForm.dueDate}
                    onChange={handleQuickChange}
                    className="h-12 rounded-full border border-orange-100 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-orange-200"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
                  >
                    빠른 추가
                  </button>
                </form>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-orange-100">
                <div className="hidden grid-cols-[86px_minmax(0,1fr)_160px_148px] gap-4 bg-orange-50/70 px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 lg:grid">
                  <span>상태</span>
                  <span>메모</span>
                  <span>수정 시각</span>
                  <span>날짜 칸</span>
                </div>

                <div className="divide-y divide-orange-100">
                  {visibleOpenTasks.length === 0 ? (
                    <div className="rounded-b-2xl bg-white px-5 py-10">
                      <p className="text-base font-bold text-zinc-900">
                        {query ? "검색 결과가 없어요" : "아직 메모가 없어요"}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {query
                          ? "검색어를 바꾸거나 다른 필터를 눌러보세요."
                          : "오른쪽 새 메모 작성 폼 또는 위의 빠른 추가 입력창부터 사용해보세요."}
                      </p>
                    </div>
                  ) : (
                    visibleOpenTasks.map((task) => {
                      const bucket = getBucket(task.dueDate);
                      const divider =
                        activeFilter === "all" && previousBucket !== bucket ? bucket : null;
                      previousBucket = bucket;

                      return (
                        <div key={task.id}>
                          {divider ? (
                            <div className="bg-yellow-50/60 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                              {divider === "dday"
                                ? "D-DAY 우선"
                                : divider === "normal"
                                  ? "평상시 메모"
                                  : "날짜 있는 메모"}
                            </div>
                          ) : null}

                          <article
                            className={`grid cursor-pointer gap-4 bg-white px-5 py-5 transition hover:bg-gray-50 lg:grid-cols-[86px_minmax(0,1fr)_160px_148px] ${
                              selectedTaskId === task.id ? "bg-orange-50/50" : ""
                            }`}
                            onClick={() => setSelectedTaskId(task.id)}
                          >
                            <div className="flex items-center">
                              <button
                                type="button"
                                className="w-full rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-gray-50"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggle(task.id);
                                }}
                              >
                                완료
                              </button>
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                  <h2 className="truncate text-lg font-bold text-zinc-900">
                                    {task.title}
                                  </h2>
                                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                                    {task.note || "메모는 비어 있지만 제목만으로도 붙잡아둘 수 있어요."}
                                  </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <button
                                    type="button"
                                    className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-gray-50"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleEdit(task);
                                    }}
                                  >
                                    수정
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-gray-50"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDelete(task.id);
                                    }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col justify-center">
                              <span className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-400">
                                Updated
                              </span>
                              <strong className="mt-2 text-sm font-semibold text-zinc-700">
                                {formatUpdatedAt(task.updatedAt)}
                              </strong>
                            </div>

                            <div
                              className={`flex flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center ${getDateCellClasses(
                                bucket,
                              )}`}
                            >
                              <strong className="text-xl font-black">
                                {getDatePrimaryLabel(task.dueDate)}
                              </strong>
                              <span className="mt-1 text-xs font-bold">
                                {getDateSecondaryLabel(task.dueDate)}
                              </span>
                            </div>
                          </article>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500">
                      Archive
                    </span>
                    <h2 className="mt-3 text-xl font-black text-zinc-900">완료한 메모</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {doneTasks.length > 0 ? (
                      <button
                        type="button"
                        className="rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
                        onClick={clearFinished}
                      >
                        완료 비우기
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
                      onClick={() => setShowArchive((current) => !current)}
                    >
                      {showArchive ? "접기" : `펼치기 ${doneTasks.length}`}
                    </button>
                  </div>
                </div>

                {showArchive ? (
                  <div className="mt-4 space-y-3">
                    {doneTasks.length > 0 ? (
                      doneTasks.map((task) => (
                        <article
                          key={task.id}
                          className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 xl:flex-row xl:items-center xl:justify-between"
                        >
                          <div>
                            <p className="font-bold text-zinc-900">{task.title}</p>
                            <p className="mt-1 text-sm text-zinc-500">
                              {task.note || "메모 없이 완료한 카드"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-600">
                              {getDatePrimaryLabel(task.dueDate)}
                            </span>
                            <button
                              type="button"
                              className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                              onClick={() => setSelectedTaskId(task.id)}
                            >
                              보기
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                              onClick={() => handleToggle(task.id)}
                            >
                              다시 열기
                            </button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500">완료한 메모가 아직 없어요.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="col-span-12 xl:col-span-4">
            <div className="space-y-5 xl:sticky xl:top-4">
              <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="overflow-hidden rounded-2xl border border-orange-100 bg-orange-50">
                  <img
                    src="/profile-duck.png"
                    alt="프로필 이미지"
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <div className="mt-4">
                  <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500">
                    Profile
                  </span>
                  <h2 className="mt-3 text-xl font-black text-zinc-900">내 프사 기반 메모 보드</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    우측 패널은 스크롤해도 따라다니도록 고정했습니다. 프로필과 새 메모
                    작성 폼을 한눈에 볼 수 있게 정리했습니다.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500">
                      Selected memo
                    </span>
                    <h2 className="mt-3 text-xl font-black text-zinc-900">선택한 메모 보기</h2>
                  </div>
                  {selectedTask ? (
                    <span className="rounded-full border border-orange-100 bg-white px-3 py-2 text-xs font-bold text-zinc-500">
                      {selectedTask.isDone ? "완료" : "열림"}
                    </span>
                  ) : null}
                </div>

                {selectedTask ? (
                  <>
                    <h3 className="mt-4 text-lg font-black text-zinc-900">{selectedTask.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {selectedTask.note || "메모 내용은 비어 있지만 제목만으로도 기록된 상태예요."}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-orange-100 bg-yellow-50 p-3">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
                          Date slot
                        </span>
                        <strong className="mt-2 block text-base font-black text-zinc-900">
                          {getDatePrimaryLabel(selectedTask.dueDate)}
                        </strong>
                      </div>
                      <div className="rounded-2xl border border-orange-100 bg-yellow-50 p-3">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
                          Detail
                        </span>
                        <strong className="mt-2 block text-sm font-bold text-zinc-700">
                          {getDateSecondaryLabel(selectedTask.dueDate)}
                        </strong>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!selectedTask.isDone ? (
                        <button
                          type="button"
                          className="rounded-full bg-orange-400 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
                          onClick={() => handleEdit(selectedTask)}
                        >
                          이 메모 수정
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-full border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-zinc-700"
                        onClick={() => handleToggle(selectedTask.id)}
                      >
                        {selectedTask.isDone ? "다시 열기" : "완료 처리"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">
                    왼쪽 리스트에서 메모를 누르면 여기서 자세히 볼 수 있어요.
                  </p>
                )}
              </section>

              <form
                className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                onSubmit={handleSubmit}
              >
                <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500">
                  {editingId ? "Edit memo" : "New memo"}
                </span>
                <h2 className="mt-3 text-xl font-black text-zinc-900">
                  {editingId ? "메모 수정하기" : "새 메모 작성"}
                </h2>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-700">제목</span>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      placeholder="예: 이번 주 업로드 문구 마무리"
                      maxLength={80}
                      className="h-12 w-full rounded-2xl border border-orange-100 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-700">메모</span>
                    <textarea
                      name="note"
                      value={form.note}
                      onChange={handleFormChange}
                      rows={6}
                      placeholder="준비물, 체크 포인트, 맥락을 적어두세요."
                      className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-zinc-700">날짜 칸</span>
                    <input
                      type="date"
                      name="dueDate"
                      value={form.dueDate}
                      onChange={handleFormChange}
                      className="h-12 w-full rounded-2xl border border-orange-100 bg-white px-4 text-sm outline-none transition focus:ring-2 focus:ring-orange-200"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                      onClick={() => setForm((current) => ({ ...current, dueDate: "" }))}
                    >
                      평상시
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                      onClick={() =>
                        setForm((current) => ({ ...current, dueDate: getInputDate(0) }))
                      }
                    >
                      오늘
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                      onClick={() =>
                        setForm((current) => ({ ...current, dueDate: getInputDate(1) }))
                      }
                    >
                      내일
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-zinc-700"
                      onClick={() =>
                        setForm((current) => ({ ...current, dueDate: getInputDate(3) }))
                      }
                    >
                      +3일
                    </button>
                  </div>

                  <div className="rounded-2xl border border-orange-100 bg-yellow-50/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
                      Preview
                    </p>
                    <div className="mt-3 rounded-2xl border border-orange-100 bg-white p-4 text-center">
                      <strong className="block text-xl font-black text-zinc-900">
                        {getDatePrimaryLabel(form.dueDate || null)}
                      </strong>
                      <span className="mt-1 block text-xs font-bold text-zinc-500">
                        {getDateSecondaryLabel(form.dueDate || null)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {editingId ? (
                      <button
                        type="button"
                        className="rounded-full border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-zinc-700"
                        onClick={resetForm}
                      >
                        수정 취소
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      className="rounded-full bg-orange-400 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
                    >
                      {editingId ? "수정 저장" : "메모 추가"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
