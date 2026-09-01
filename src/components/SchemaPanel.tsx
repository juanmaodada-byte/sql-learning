import { useEffect, useState } from "react";
import { tableSchemas } from "../data/schema";
import { runSql, type SqlTableResult } from "../engine/database";

type SchemaPanelProps = {
  tableNames: string[];
  open: boolean;
  onClose: () => void;
};

type TableData = {
  name: string;
  description: string;
  schemaColumns: string[];
  columnLabels: Record<string, string>;
  result: SqlTableResult | null;
};

function displayColumn(column: string, labels: Record<string, string>) {
  const label = labels[column];
  return label ? `${column}（${label}）` : column;
}

export function SchemaPanel({ tableNames, open, onClose }: SchemaPanelProps) {
  const tableKey = tableNames.join(",");
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedTableKey, setLoadedTableKey] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    async function loadTables() {
      const nextData = await Promise.all(
        (tableKey ? tableKey.split(",") : []).map(async (tableName) => {
          const schema = tableSchemas.find((table) => table.name === tableName);
          const result = await runSql(`SELECT * FROM ${tableName};`);
          return {
            name: tableName,
            description: schema?.description ?? "数据表",
            schemaColumns: schema?.columns ?? [],
            columnLabels: schema?.columnLabels ?? {},
            result: result.type === "rows" ? result : null,
          };
        })
      );

      if (active) {
        setTableData(nextData);
        setLoadedTableKey(tableKey);
        setIsLoading(false);
      }
    }

    void loadTables();
    return () => {
      active = false;
    };
  }, [tableKey, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <aside
        className="schema-panel"
        role="dialog"
        aria-modal="true"
        aria-label="任务数据表"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="schema-modal__header">
          <div>
            <p className="panel-kicker">任务数据表</p>
            <h2>当前任务涉及的数据表</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="关闭弹窗">
            ×
          </button>
        </div>
        <p className="panel-description">以下是当前任务 SQL 涉及的全部数据表、字段和完整样例数据。</p>

        {isLoading || loadedTableKey !== tableKey ? <p className="panel-description">正在加载样例数据...</p> : null}
        {tableData.map((table) => {
          const columns = table.result?.columns.length ? table.result.columns : table.schemaColumns;
          const rows = table.result?.rows ?? [];

          return (
            <section className="schema-table-section" key={table.name}>
              <div>
                <p className="panel-kicker">{table.description}</p>
                <h2>{table.name}</h2>
              </div>
              <div className="schema-columns">
                {columns.map((column) => (
                  <span key={column}>{displayColumn(column, table.columnLabels)}</span>
                ))}
              </div>
              <div className="sample-block">
                <p className="panel-kicker">完整样例数据 · {rows.length} 行</p>
                <div className="sample-table-wrap">
                  <table className="sample-table">
                    <thead>
                      <tr>
                        {columns.map((column) => <th key={column}>{displayColumn(column, table.columnLabels)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={`${table.name}-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${table.name}-${rowIndex}-${cellIndex}`}>{cell === null ? "NULL" : String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          );
        })}
      </aside>
    </div>
  );
}
