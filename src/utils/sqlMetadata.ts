import { tableSchemas } from "../data/schema";

const knownTableNames = tableSchemas.map((table) => table.name);

export function getReferencedTables(sql: string) {
  const normalizedSql = sql.toLowerCase();
  return knownTableNames.filter((tableName) => normalizedSql.includes(tableName.toLowerCase()));
}
