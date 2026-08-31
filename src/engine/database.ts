import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { createSchemaSql } from "../data/schema";
import { seedDataSql } from "../data/seedData";

export type SqlCellValue = number | string | Uint8Array | null;

export type SqlTableResult = {
  type: "rows";
  columns: string[];
  rows: SqlCellValue[][];
};

export type SqlSuccessResult = {
  type: "success";
  message: string;
  affectedRows: number;
};

export type SqlErrorResult = {
  type: "error";
  message: string;
};

export type SqlRunResult = SqlTableResult | SqlSuccessResult | SqlErrorResult;

type SqlJsModule = Awaited<ReturnType<typeof initSqlJs>>;
type SqlDatabase = InstanceType<SqlJsModule["Database"]>;

let sqlModulePromise: Promise<SqlJsModule> | null = null;
let database: SqlDatabase | null = null;

function loadSqlModule() {
  sqlModulePromise ??= initSqlJs({ locateFile: () => wasmUrl });
  return sqlModulePromise;
}

export async function initializeDatabase() {
  if (database) {
    return database;
  }

  const SQL = await loadSqlModule();
  database = new SQL.Database();
  database.run(createSchemaSql);
  database.run(seedDataSql);
  return database;
}

export async function resetDatabase() {
  if (database) {
    database.close();
    database = null;
  }

  return initializeDatabase();
}

function normalizeSql(sql: string) {
  return sql.trim().replace(/;\s*$/, "");
}

function hasMultipleStatements(sql: string) {
  return normalizeSql(sql).includes(";");
}

function isSupportedStatement(sql: string) {
  return /^(select|with|insert|update|delete|create)\b/i.test(sql);
}

function isQueryStatement(sql: string) {
  return /^(select|with)\b/i.test(sql);
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message.replace(/^Error:\s*/i, "");
  }

  return "SQL 执行失败，请检查语法后重试。";
}

export async function runSql(sql: string): Promise<SqlRunResult> {
  const trimmedSql = sql.trim();

  if (!trimmedSql) {
    return { type: "error", message: "请输入要执行的 SQL。" };
  }

  if (hasMultipleStatements(trimmedSql)) {
    return { type: "error", message: "当前一次只能执行一条 SQL 语句。" };
  }

  if (!isSupportedStatement(trimmedSql)) {
    return {
      type: "error",
      message: "当前支持 SELECT、INSERT、UPDATE、DELETE 和 CREATE 语句。",
    };
  }

  const baseDatabase = await initializeDatabase();
  const SQL = await loadSqlModule();
  const taskDatabase = new SQL.Database(baseDatabase.export());

  try {
    const resultSets = taskDatabase.exec(trimmedSql);

    if (isQueryStatement(trimmedSql)) {
      if (resultSets.length === 0) {
        return { type: "rows", columns: [], rows: [] };
      }

      const [firstResultSet] = resultSets;
      return {
        type: "rows",
        columns: firstResultSet.columns,
        rows: firstResultSet.values,
      };
    }

    const affectedRows = taskDatabase.getRowsModified();
    return {
      type: "success",
      affectedRows,
      message: `SQL 执行成功，影响 ${affectedRows} 行。`,
    };
  } catch (error) {
    return { type: "error", message: formatError(error) };
  } finally {
    taskDatabase.close();
  }
}

