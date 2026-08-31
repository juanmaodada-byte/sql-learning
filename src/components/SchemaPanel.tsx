import { useEffect, useState } from "react";
import { tableSchemas } from "../data/schema";
import { runSql, type SqlTableResult } from "../engine/database";

type SchemaPanelProps = {
  tableNames: string[];
};

type TableData = {
  name: string;
  description: string;
  schemaColumns: string[];
  result: SqlTableResult | null;
};

export function SchemaPanel({ tableNames }: SchemaPanelProps) {
  const tableKey = tableNames.join(",");
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedTableKey, setLoadedTableKey] = useState("");

  useEffect(() => {
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
  }, [tableKey]);

  return (
    <aside className="schema-panel" aria-label="当前任务相关表结构和完整样例数据">
      <div>
        <p className="panel-kicker">任务数据表</p>
        <p className="panel-description">以下是当前任务 SQL 涉及的全部数据表、字段和完整样例数据。</p>
      </div>

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
                <span key={column}>{column}</span>
              ))}
            </div>
            <div className="sample-block">
              <p className="panel-kicker">完整样例数据 · {rows.length} 行</p>
              <div className="sample-table-wrap">
                <table className="sample-table">
                  <thead>
                    <tr>
                      {columns.map((column) => <th key={column}>{column}</th>)}
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
  );
}




