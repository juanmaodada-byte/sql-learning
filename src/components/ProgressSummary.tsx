type ProgressSummaryProps = {
  completedCount: number;
  unlockedCount: number;
  totalCount: number;
};

export function ProgressSummary({
  completedCount,
  unlockedCount,
  totalCount,
}: ProgressSummaryProps) {
  return (
    <section className="progress-summary" aria-label="学习进度">
      <div>
        <span>身份</span>
        <strong>数据分析实习生</strong>
      </div>
      <div>
        <span>已完成</span>
        <strong>{completedCount} / {totalCount}</strong>
      </div>
      <div>
        <span>已解锁</span>
        <strong>{unlockedCount} / {totalCount}</strong>
      </div>
      <div>
        <span>当前任务</span>
        <strong>第 {completedCount + 1} 节</strong>
      </div>
    </section>
  );
}
