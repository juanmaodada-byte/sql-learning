import type { TaskEvaluation } from "../engine/evaluator";

type TaskFeedbackProps = {
  evaluation: TaskEvaluation | null;
  solutionExplanation?: string;
};

export function TaskFeedback({ evaluation, solutionExplanation }: TaskFeedbackProps) {
  if (!evaluation) {
    return null;
  }

  return (
    <section className={`task-feedback task-feedback--${evaluation.status}`} aria-live="polite">
      <div className="task-feedback__heading">
        <div>
          <span className="panel-kicker">自动校验</span>
          <h2>{evaluation.title}</h2>
        </div>
        <strong>{evaluation.status === "passed" ? "通过" : evaluation.status === "partial" ? "部分正确" : "未通过"}</strong>
      </div>
      <p>{evaluation.message}</p>
      <ul>
        {evaluation.checks.map((check) => (
          <li className={check.passed ? "check-passed" : "check-failed"} key={check.message}>
            <span aria-hidden="true">{check.passed ? "✓" : "!"}</span>
            {check.message}
          </li>
        ))}
      </ul>
      {evaluation.status === "passed" && solutionExplanation && (
        <div className="solution-review">
          <span className="panel-kicker">答案复盘</span>
          <p>{solutionExplanation}</p>
        </div>
      )}
    </section>
  );
}
