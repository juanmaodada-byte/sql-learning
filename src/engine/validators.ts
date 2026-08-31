import type { ValidationRule } from "../data/types";
import type { SqlCellValue, SqlTableResult } from "./database";

export type ValidationCheck = {
  passed: boolean;
  message: string;
};

function normalizeValue(value: SqlCellValue) {
  if (value instanceof Uint8Array) {
    return Array.from(value).join(",");
  }

  return value === null ? "NULL" : String(value);
}

function normalizeColumn(column: string) {
  return column.trim().toLowerCase();
}

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase().replace(/\s+/g, " ");
}

function rowsEqual(left: SqlCellValue[][], right: SqlCellValue[][]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((row, rowIndex) => {
    const expectedRow = right[rowIndex];
    return row.length === expectedRow.length && row.every(
      (value, columnIndex) => normalizeValue(value) === normalizeValue(expectedRow[columnIndex])
    );
  });
}

function sortedRows(rows: SqlCellValue[][]) {
  return [...rows].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function isOrdered(result: SqlTableResult, by: string, direction: "asc" | "desc") {
  const columnIndex = result.columns.findIndex(
    (column) => normalizeColumn(column) === normalizeColumn(by)
  );

  if (columnIndex < 0) {
    return false;
  }

  for (let index = 1; index < result.rows.length; index += 1) {
    const previous = result.rows[index - 1][columnIndex];
    const current = result.rows[index][columnIndex];
    const previousNumber = typeof previous === "number" ? previous : Number(previous);
    const currentNumber = typeof current === "number" ? current : Number(current);

    if (Number.isFinite(previousNumber) && Number.isFinite(currentNumber)) {
      if (direction === "asc" && previousNumber > currentNumber) return false;
      if (direction === "desc" && previousNumber < currentNumber) return false;
      continue;
    }

    const comparison = normalizeValue(previous).localeCompare(normalizeValue(current));
    if (direction === "asc" && comparison > 0) return false;
    if (direction === "desc" && comparison < 0) return false;
  }

  return true;
}

export function validateRule(
  rule: ValidationRule,
  actual: SqlTableResult,
  sql: string
): ValidationCheck {
  switch (rule.type) {
    case "requiredColumns": {
      const actualColumns = new Set(actual.columns.map(normalizeColumn));
      const missingColumns = rule.columns.filter((column) => !actualColumns.has(normalizeColumn(column)));
      return {
        passed: missingColumns.length === 0,
        message:
          missingColumns.length === 0
            ? `字段检查通过：包含 ${rule.columns.join(", ")}。`
            : `缺少字段：${missingColumns.join(", ")}。`,
      };
    }
    case "expectedRowCount":
      return {
        passed: actual.rows.length === rule.count,
        message:
          actual.rows.length === rule.count
            ? `行数检查通过：返回 ${rule.count} 行。`
            : `行数不正确：当前返回 ${actual.rows.length} 行，应为 ${rule.count} 行。`,
      };
    case "requiredKeyword": {
      const normalizedSql = sql.toLowerCase().replace(/\s+/g, " ");
      const keyword = normalizeKeyword(rule.keyword);
      return {
        passed: normalizedSql.includes(keyword),
        message: normalizedSql.includes(keyword)
          ? `语法检查通过：使用了 ${rule.keyword.toUpperCase()}。`
          : `语法不符合本节要求：需要使用 ${rule.keyword.toUpperCase()}。`,
      };
    }
    case "ordered":
      return {
        passed: isOrdered(actual, rule.by, rule.direction),
        message: isOrdered(actual, rule.by, rule.direction)
          ? `排序检查通过：${rule.by} 已按${rule.direction === "asc" ? "升序" : "降序"}排列。`
          : `排序不正确：请检查 ${rule.by} 的排序方向。`,
      };
  }
}

/**
 * 把 actual 的列按 expected 的列顺序重排，并同步重排每行的值。
 * 字段是同一集合但顺序不同时也能对齐；字段不一致（数量不同或缺少标准列）返回 null。
 */
function alignColumnsToExpected(actual: SqlTableResult, expected: SqlTableResult) {
  if (actual.columns.length !== expected.columns.length) return null;

  const columnIndexes = expected.columns.map((expectedColumn) =>
    actual.columns.findIndex((column) => normalizeColumn(column) === normalizeColumn(expectedColumn))
  );
  if (columnIndexes.some((index) => index < 0)) return null;

  return {
    columns: expected.columns,
    rows: actual.rows.map((row) => columnIndexes.map((index) => row[index])),
  };
}

export function compareResultSets(actual: SqlTableResult, expected: SqlTableResult) {
  const aligned = alignColumnsToExpected(actual, expected);
  const columnsMatch = aligned !== null;
  const orderedRowsMatch = aligned !== null && rowsEqual(aligned.rows, expected.rows);
  const unorderedRowsMatch = aligned !== null && rowsEqual(sortedRows(aligned.rows), sortedRows(expected.rows));

  return {
    columnsMatch,
    orderedRowsMatch,
    unorderedRowsMatch,
  };
}


