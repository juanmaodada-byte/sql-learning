import type { SqlCellValue, SqlTableResult } from "../engine/database";

type ResultTableProps = {
  result: SqlTableResult | null;
};

function formatCell(value: SqlCellValue) {
  if (value instanceof Uint8Array) {
    return `[二进制数据：${value.byteLength} bytes]`;
  }

  return value === null ? "NULL" : String(value);
}

export function ResultTable({ result }: ResultTableProps) {
  if (!result) {
    return (
      <div className="result-placeholder">
        <span>运行 SQL 后，结果会显示在这里。</span>
      </div>
    );
  }

  if (result.rows.length === 0) {
    return <div className="result-placeholder">查询成功，但没有返回数据。</div>;
  }

  return (
    <div className="result-table-wrap">
      <table className="result-table">
        <thead>
          <tr>
            {result.columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, columnIndex) => (
                <td key={`${rowIndex}-${columnIndex}`}>{formatCell(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
