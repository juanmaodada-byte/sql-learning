import type { TaskEvaluation } from "../engine/evaluator";

const MODE_KEY = "sql-learning-mode";
const LEGACY_STORAGE_KEY = "sql-learning-progress-v1";
const STORAGE_KEYS = {
  official: "sql-learning-progress-official-v1",
  demo: "sql-learning-progress-demo-v1",
} as const;

/** 进度持久化 API（由 Vite 插件在同源提供，文件落盘，跟浏览器来源无关）。 */
const REMOTE_ENDPOINT = "/api/progress";
const REMOTE_MODE_ENDPOINT = "/api/mode";
const REMOTE_TIMEOUT_MS = 1500;

export type ProgressMode = keyof typeof STORAGE_KEYS;

export type ChapterProgress = {
  completed: boolean;
  attempts: number;
  hintsUsed: number;
  bestScore: number;
  completedTasks?: number[];
};

export type ProgressState = {
  unlockedChapterIds: number[];
  chapters: Record<string, ChapterProgress>;
  /** 每个章节里尚未提交的 SQL 草稿，重启后也能恢复。 */
  drafts: Record<string, string>;
  /** 上次打开的章节，用于重启后直接回到原处。 */
  lastChapterId: number | null;
};

function emptyChapterProgress(): ChapterProgress {
  return {
    completed: false,
    attempts: 0,
    hintsUsed: 0,
    bestScore: 0,
    completedTasks: [],
  };
}

export function createInitialProgress(totalChapters: number): ProgressState {
  const chapters: Record<string, ChapterProgress> = {};
  for (let chapterId = 1; chapterId <= totalChapters; chapterId += 1) {
    chapters[String(chapterId)] = emptyChapterProgress();
  }

  return {
    unlockedChapterIds: [1],
    chapters,
    drafts: {},
    lastChapterId: null,
  };
}

function isProgressState(value: unknown): value is ProgressState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProgressState>;
  return Array.isArray(candidate.unlockedChapterIds) && Boolean(candidate.chapters);
}

/** 把任意来源的对象规整成合法、完整的 ProgressState，避免脏数据导致崩溃。 */
function normalizeProgress(raw: ProgressState, totalChapters: number): ProgressState {
  const initial = createInitialProgress(totalChapters);
  const chapters: Record<string, ChapterProgress> = { ...initial.chapters };
  for (const [chapterId, progress] of Object.entries(raw.chapters ?? {})) {
    if (!progress) continue;
    chapters[chapterId] = {
      completed: Boolean(progress.completed),
      attempts: Number(progress.attempts) || 0,
      hintsUsed: Number(progress.hintsUsed) || 0,
      bestScore: Number(progress.bestScore) || 0,
      completedTasks: Array.isArray(progress.completedTasks)
        ? progress.completedTasks.filter((taskId) => taskId >= 1 && taskId <= 3)
        : progress.completed
          ? [1, 2, 3]
          : [],
    };
  }
  const unlocked = Array.from(
    new Set([1, ...(raw.unlockedChapterIds ?? []).filter((id) => id >= 1 && id <= totalChapters)])
  ).sort((left, right) => left - right);

  const lastChapterId =
    typeof raw.lastChapterId === "number" &&
    raw.lastChapterId >= 1 &&
    raw.lastChapterId <= totalChapters
      ? raw.lastChapterId
      : null;

  return {
    unlockedChapterIds: unlocked,
    chapters,
    drafts: raw.drafts && typeof raw.drafts === "object" ? { ...raw.drafts } : {},
    lastChapterId,
  };
}

/** 无损合并两份进度：已完成的取并集，次数/分数取最大值，解锁取并集。 */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const chapters: Record<string, ChapterProgress> = {};
  const ids = new Set([...Object.keys(a.chapters), ...Object.keys(b.chapters)]);
  for (const id of ids) {
    const ca = a.chapters[id];
    const cb = b.chapters[id];
    chapters[id] = {
      completed: Boolean(ca?.completed) || Boolean(cb?.completed),
      attempts: Math.max(ca?.attempts ?? 0, cb?.attempts ?? 0),
      hintsUsed: Math.max(ca?.hintsUsed ?? 0, cb?.hintsUsed ?? 0),
      bestScore: Math.max(ca?.bestScore ?? 0, cb?.bestScore ?? 0),
      completedTasks: Array.from(new Set([...(ca?.completedTasks ?? []), ...(cb?.completedTasks ?? [])])).sort(),
    };
  }
  const unlocked = Array.from(new Set([...a.unlockedChapterIds, ...b.unlockedChapterIds])).sort(
    (left, right) => left - right
  );
  const drafts = { ...a.drafts, ...b.drafts };
  const lastChapterId = a.lastChapterId ?? b.lastChapterId ?? null;
  return { unlockedChapterIds: unlocked, chapters, drafts, lastChapterId };
}

/** 读取用户选择的版本；未选择或非法值返回 null。 */
export function loadMode(): ProgressMode | null {
  try {
    const raw = localStorage.getItem(MODE_KEY);
    return raw === "official" || raw === "demo" ? raw : null;
  } catch {
    return null;
  }
}

/** 记住用户选择的版本，下次启动直接进入该版本。 */
export function saveMode(mode: ProgressMode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // ignore
  }
  void pushRemoteMode(mode);
}

/** 当 localStorage 里没有 mode 时，从后端恢复上次选择的版本。 */
export async function loadModeFromRemote(): Promise<ProgressMode | null> {
  return fetchRemoteMode();
}

/**
 * 把旧版单一 key 的进度一次性迁移到正式版 key。
 * 幂等：正式版 key 已存在则不覆盖，迁移后删除旧 key，重复调用无副作用。
 */
export function migrateLegacyProgressToOfficial() {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === null) return;
    if (localStorage.getItem(STORAGE_KEYS.official) === null) {
      localStorage.setItem(STORAGE_KEYS.official, legacy);
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** 同步读取 localStorage 中的进度（用于首屏渲染与入口页统计）。 */
export function loadProgress(mode: ProgressMode, totalChapters: number): ProgressState {
  const initial = createInitialProgress(totalChapters);

  if (mode === "official") {
    migrateLegacyProgressToOfficial();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS[mode]);
    if (!stored) return initial;

    const parsed: unknown = JSON.parse(stored);
    if (!isProgressState(parsed)) return initial;

    return normalizeProgress(
      {
        ...parsed,
        unlockedChapterIds: Array.from(
          new Set([1, ...parsed.unlockedChapterIds.filter((id) => id >= 1 && id <= totalChapters)])
        ),
      },
      totalChapters
    );
  } catch {
    return initial;
  }
}

/** 读取上次打开的章节（用于重启后直接回到原处）。 */
export function loadLastChapterId(mode: ProgressMode): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[mode]);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<ProgressState>;
    return typeof parsed.lastChapterId === "number" ? parsed.lastChapterId : null;
  } catch {
    return null;
  }
}

async function fetchRemote(mode: ProgressMode): Promise<ProgressState | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
    const response = await fetch(`${REMOTE_ENDPOINT}?mode=${mode}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return isProgressState(data) ? (data as ProgressState) : null;
  } catch {
    return null;
  }
}

async function fetchRemoteMode(): Promise<ProgressMode | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
    const response = await fetch(REMOTE_MODE_ENDPOINT, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return data === "official" || data === "demo" ? data : null;
  } catch {
    return null;
  }
}

async function pushRemote(mode: ProgressMode, progress: ProgressState): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
    await fetch(`${REMOTE_ENDPOINT}?mode=${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progress),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // 后端不可用（例如纯静态部署）时静默降级为仅 localStorage。
  }
}

async function pushRemoteMode(mode: ProgressMode): Promise<void> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);
    await fetch(REMOTE_MODE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // ignore
  }
}

/**
 * 把进度同时写入 localStorage（即时、离线可用）和后端文件（跨来源/重启持久）。
 * 后端写入是尽力而为，失败时自动降级。
 */
export function saveProgress(mode: ProgressMode, progress: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEYS[mode], JSON.stringify(progress));
  } catch {
    // ignore
  }
  void pushRemote(mode, progress);
}

/**
 * 启动后从后端拉取进度并与本地合并，保证换端口/换预览地址后进度不丢。
 * 后端无数据（本地够用）或不可用时返回 base 本身；后端有数据时以服务器状态为准，
 * 这样开发阶段初始化进度后，浏览器里遗留的旧缓存不会再次覆盖初始化结果。
 */
export async function hydrateFromRemote(
  mode: ProgressMode,
  totalChapters: number,
  base: ProgressState
): Promise<ProgressState> {
  const remote = await fetchRemote(mode);
  if (!remote) return base;
  return normalizeProgress(remote, totalChapters);
}

export function recordAttempt(
  mode: ProgressMode,
  progress: ProgressState,
  chapterId: number,
  taskId: number,
  evaluation: TaskEvaluation,
  usedHint: boolean,
  totalChapters: number
): ProgressState {
  const current = progress.chapters[String(chapterId)] ?? emptyChapterProgress();
  const nextProgress: ProgressState = {
    ...progress,
    chapters: {
      ...progress.chapters,
      [String(chapterId)]: {
        completed: current.completed || (evaluation.status === "passed" && new Set([...(current.completedTasks ?? []), taskId]).size >= 3),
        attempts: current.attempts + 1,
        hintsUsed: current.hintsUsed + (usedHint ? 1 : 0),
        bestScore: Math.max(current.bestScore, evaluation.score),
        completedTasks: evaluation.status === "passed"
          ? Array.from(new Set([...(current.completedTasks ?? []), taskId])).sort((a, b) => a - b)
          : current.completedTasks ?? [],
      },
    },
    unlockedChapterIds: [...progress.unlockedChapterIds],
  };

  if (evaluation.status === "passed" && nextProgress.chapters[String(chapterId)].completed && chapterId < totalChapters) {
    nextProgress.unlockedChapterIds = Array.from(
      new Set([...nextProgress.unlockedChapterIds, chapterId + 1])
    ).sort((left, right) => left - right);
  }

  saveProgress(mode, nextProgress);
  return nextProgress;
}

export function recordHintUsage(
  mode: ProgressMode,
  progress: ProgressState,
  chapterId: number
): ProgressState {
  const current = progress.chapters[String(chapterId)] ?? emptyChapterProgress();
  const nextProgress: ProgressState = {
    ...progress,
    chapters: {
      ...progress.chapters,
      [String(chapterId)]: {
        ...current,
        hintsUsed: current.hintsUsed + 1,
      },
    },
  };
  saveProgress(mode, nextProgress);
  return nextProgress;
}

export function getChapterProgress(progress: ProgressState, chapterId: number) {
  return progress.chapters[String(chapterId)] ?? emptyChapterProgress();
}

/** 更新某章节的 SQL 草稿并持久化。 */
export function saveDraft(
  mode: ProgressMode,
  progress: ProgressState,
  draftKey: string,
  sql: string
): ProgressState {
  const nextProgress: ProgressState = {
    ...progress,
    drafts: { ...progress.drafts, [draftKey]: sql },
  };
  saveProgress(mode, nextProgress);
  return nextProgress;
}

/** 记录上次打开的章节。 */
export function saveLastChapter(
  mode: ProgressMode,
  progress: ProgressState,
  chapterId: number
): ProgressState {
  const nextProgress: ProgressState = { ...progress, lastChapterId: chapterId };
  saveProgress(mode, nextProgress);
  return nextProgress;
}


