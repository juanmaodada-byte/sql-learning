import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { chapters } from "../data/chapters";
import { characterById } from "../data/characters";
import { LessonPage } from "../pages/LessonPage";
import { ProgressSummary } from "../components/ProgressSummary";
import {
  hydrateFromRemote,
  loadProgress,
  saveDraft,
  saveLastChapter,
  saveProgress,
  type ProgressMode,
  type ProgressState,
} from "../state/progressStore";

type View =
  | { type: "home" }
  | { type: "lesson"; chapterId: number };

function getViewFromHash(): View {
  const match = window.location.hash.match(/^#\/lessons\/(\d+)$/);
  return match ? { type: "lesson", chapterId: Number(match[1]) } : { type: "home" };
}

export function App() {
  const mode: ProgressMode = "official";
  // 每次启动统一进入任务大厅；章节只在用户主动点击后打开。
  const [view, setView] = useState<View>({ type: "home" });
  const [progress, setProgress] = useState<ProgressState>(() =>
    loadProgress(mode, chapters.length)
  );
  // 记录已完成远端恢复的版本，避免切换版本时把空进度写回覆盖磁盘数据。
  const hydratedModeRef = useRef<ProgressMode | null>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const handleHashChange = () => setView(getViewFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // 进入章节或切换章节时从页面顶部开始，避免浏览器沿用大厅的滚动位置。
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);
  // 启动后从后端（文件落盘、跨来源）拉取进度并与本地合并，确保重启/换端口不丢进度。
  useEffect(() => {
    if (!mode) return;
    hydratedModeRef.current = null;
    let cancelled = false;
    hydrateFromRemote(mode, chapters.length, progressRef.current).then((merged) => {
      if (cancelled) return;
      hydratedModeRef.current = mode;
      setProgress(merged);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // 进度变化后持久化（防抖，避免每次按键都打网络）。hydration 完成前不写，防止覆盖远端。
  useEffect(() => {
    if (!mode || hydratedModeRef.current !== mode) return;
    const timer = setTimeout(() => {
      saveProgress(mode, progressRef.current);
    }, 400);
    return () => clearTimeout(timer);
  }, [progress, mode]);

  // 页面关闭/刷新前兜底把最新进度落盘。
  useEffect(() => {
    if (!mode) return;
    const flush = () => {
      if (hydratedModeRef.current === mode) {
        saveProgress(mode, progressRef.current);
      }
    };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [mode]);

  // 开发解锁只在试玩版生效，切回正式版时绝不会泄漏为"全部解锁"。
  const devUnlockAllActive = false;

  function openChapter(chapterId: number) {
    setView({ type: "lesson", chapterId });
    setProgress((prev) => saveLastChapter(mode!, prev, chapterId));
  }

  function handleDraftChange(draftKey: string, sql: string) {
    setProgress((prev) => saveDraft(mode!, prev, draftKey, sql));
  }

  function returnHome() {
    if (mode) setProgress(loadProgress(mode, chapters.length));
    setView({ type: "home" });
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function selectMode(nextMode: ProgressMode) {
    setProgress(loadProgress(nextMode, chapters.length));
    setView({ type: "home" });
    // 清除残留的 #/lessons/N，保证选择版本后落在该版本的任务大厅。
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  function switchToEntry() {
    setView({ type: "home" });
  }

  void selectMode;
  void switchToEntry;

  if (view.type === "lesson") {
    const chapter = chapters.find((item) => item.id === view.chapterId);
    return (
      <LessonPage
        key={chapter?.id ?? "locked"}
        chapter={chapter}
        isLocked={!devUnlockAllActive && !progress.unlockedChapterIds.includes(view.chapterId)}
        unlockAllTasks={devUnlockAllActive}
        onBack={returnHome}
        onProgressChange={setProgress}
        totalChapters={chapters.length}
        mode={mode}
        initialDrafts={progress.drafts}
        onDraftChange={(draftKey: string, sql: string) => handleDraftChange(draftKey, sql)}
      />
    );
  }

  const basicChapters = chapters.filter((chapter) => chapter.section === "basic");
  const completedChapterIds = new Set(
    Object.entries(progress.chapters)
      .filter(([, chapterProgress]) => chapterProgress.completed)
      .map(([chapterId]) => Number(chapterId))
  );
  const unlockedChapterIds = new Set(progress.unlockedChapterIds);

  return (
    <main className="app-shell">
      <section className="hero-band task-hall-hero">
        <div>
          <p className="eyebrow">任务大厅 · 电商数据团队</p>
          <h1>开始你的 SQL 任务</h1>
          <p className="intro">
            你将以数据分析实习生的身份，协助不同部门完成真实业务需求。
          </p>
        </div>
        <div className="status-panel" aria-label="学习状态">
          <span>当前学习路径</span>
          <strong>基础篇 · 第 {completedChapterIds.size + 1} 节</strong>
          <small>{devUnlockAllActive ? "开发模式：章节与任务均已解锁" : "完成当前任务后解锁下一节"}</small>
        </div>
      </section>

      <section className="hall-section">
        <ProgressSummary
          completedCount={completedChapterIds.size}
          unlockedCount={unlockedChapterIds.size}
          totalCount={basicChapters.length}
        />

        <div className="section-heading hall-heading">
          <p className="eyebrow">任务地图</p>
          <h2>按学习路径完成任务</h2>
          <p>进度会自动保存，刷新页面后仍然保留。</p>
        </div>

        <div className="track-section">
          <div className="track-heading">
            <div>
              <span className="track-kicker">基础篇</span>
              <h3>SQL 查询基础</h3>
            </div>
            <span className="track-count">{basicChapters.length} 节</span>
          </div>

          <div className="chapter-grid">
            {basicChapters.map((chapter) => {
              const character = characterById[chapter.characterId];
              const chapterProgress = progress.chapters[String(chapter.id)];
              const completedTaskCount = chapterProgress?.completedTasks?.length ?? (chapterProgress?.completed ? 3 : 0);
              const isCompleted = completedChapterIds.has(chapter.id);
              const isUnlocked = unlockedChapterIds.has(chapter.id);
              const canEnter = isUnlocked || devUnlockAllActive;
              const status = isCompleted ? "已完成" : canEnter ? (devUnlockAllActive && !isUnlocked ? "测试解锁" : "已解锁") : "未解锁";

              return (
                <article
                  className={`chapter-card ${canEnter ? "is-unlocked" : "is-locked"} ${isCompleted ? "is-completed" : ""}`}
                  key={chapter.id}
                >
                  <div className="chapter-card__topline">
                    <span>第 {chapter.id} 节</span>
                    <strong>{status}</strong>
                  </div>

                  <div className="chapter-card__character">
                    <span className="avatar" style={{ backgroundColor: character.color }}>
                      {character.avatarText}
                    </span>
                    <div>
                      <strong>{character.name}</strong>
                      <span>{character.department} · {character.role}</span>
                    </div>
                  </div>

                  <h4>{chapter.title}</h4>
                  <p className="knowledge">{chapter.knowledgePoint}</p>
                  <p>{chapter.requirement.goal}</p>
                  <div className="chapter-task-progress" aria-label={`已完成 ${completedTaskCount} / 3 个任务`}>
                    <span>任务进度</span>
                    <strong>{completedTaskCount} / 3</strong>
                    <div className="chapter-task-progress__bar"><i style={{ width: `${(completedTaskCount / 3) * 100}%` }} /></div>
                  </div>
                  {chapterProgress?.attempts ? (
                    <small className="chapter-progress-detail">
                      尝试 {chapterProgress.attempts} 次 · 最好评分 {chapterProgress.bestScore}
                    </small>
                  ) : null}

                  <button
                    className="chapter-action"
                    disabled={!canEnter}
                    onClick={() => openChapter(chapter.id)}
                    type="button"
                  >
                    {canEnter ? (completedTaskCount ? "继续学习" : "进入章节") : "完成前置任务后解锁"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="locked-tracks">
          <section className="locked-track" aria-label="进阶篇">
            <div>
              <span className="track-kicker">进阶篇</span>
              <h3>窗口函数与高级分析</h3>
              <p>完成基础篇后解锁 12 个进阶任务。</p>
            </div>
            <span className="lock-label">锁定</span>
          </section>
          <section className="locked-track" aria-label="最终项目">
            <div>
              <span className="track-kicker">最终项目</span>
              <h3>老板的季度经营分析会</h3>
              <p>完成基础篇和进阶篇后解锁综合项目。</p>
            </div>
            <span className="lock-label">锁定</span>
          </section>
        </div>
      </section>
    </main>
  );
}


