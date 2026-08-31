export type VersionSummary = {
  completed: number;
  unlocked: number;
};

type EntryPageProps = {
  total: number;
  official: VersionSummary;
  demo: VersionSummary;
  onSelectOfficial: () => void;
  onSelectDemo: () => void;
};

export function EntryPage({ total, official, demo, onSelectOfficial, onSelectDemo }: EntryPageProps) {
  return (
    <main className="app-shell">
      <section className="hero-band entry-hero">
        <p className="eyebrow">SQL 学习平台</p>
        <h1>选择学习版本</h1>
        <p className="intro">
          选择正式版开始完整学习，或进入试玩版自由体验。两个版本的进度互不影响，各自独立保存。
        </p>
      </section>

      <section className="hall-section">
        <div className="entry-grid">
          <article className="entry-card">
            <div className="entry-card__body">
              <span className="track-kicker">正式版</span>
              <h2 className="entry-card__title">正式学习</h2>
              <p className="entry-card__desc">
                按章节顺序逐步解锁，进度长期保存。每次进入都会接着上次的进度继续学习。
              </p>
              <p className="entry-card__progress">
                已完成 {official.completed}/{total} 节 · 已解锁 {official.unlocked} 节
              </p>
            </div>
            <button className="entry-card__action" type="button" onClick={onSelectOfficial}>
              进入正式版
            </button>
          </article>

          <article className="entry-card entry-card--demo">
            <div className="entry-card__body">
              <span className="track-kicker">试玩版</span>
              <h2 className="entry-card__title">自由探索</h2>
              <p className="entry-card__desc">
                开发调试用，支持一键解锁全部章节，适合浏览内容与尝试各种 SQL 写法。进度独立保存。
              </p>
              <p className="entry-card__progress">
                已完成 {demo.completed}/{total} 节 · 已解锁 {demo.unlocked} 节
              </p>
            </div>
            <button className="entry-card__action" type="button" onClick={onSelectDemo}>
              进入试玩版
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}
