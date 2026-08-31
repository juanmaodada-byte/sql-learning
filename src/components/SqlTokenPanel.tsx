import type { SqlToken } from "../utils/sqlTokens";

type SqlTokenPanelProps = {
  tokens: SqlToken[];
  onInsertToken: (token: string) => void;
};


export function SqlTokenPanel({ tokens, onInsertToken }: SqlTokenPanelProps) {
  return (
    <aside className="sql-token-panel" aria-label="SQL 语句字段">
      <p className="panel-kicker">语句字段</p>
      <p className="panel-description">按任务顺序点击，字段会写入编辑器。</p>
      <div className="sql-token-list">
        {tokens.map((token, index) => (
          <button
            className={`sql-token sql-token--${token.kind}`}
            key={`${token.value}-${index}`}
            onClick={() => onInsertToken(token.value)}
            type="button"
          >
            {token.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

