import { readFile } from "node:fs/promises";
import console from "node:console";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import initSqlJs from "sql.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

async function readSource(relativePath) {
  const source = await readFile(join(root, relativePath), "utf8");
  return ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true);
}

function stringPropertyValues(sourceFile, propertyNames) {
  const values = [];
  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      propertyNames.has(node.name.text) &&
      (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))
    ) {
      values.push(node.initializer.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return values;
}

function exportedTemplateValue(sourceFile, variableName) {
  let value = null;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName) {
      if (node.initializer && ts.isNoSubstitutionTemplateLiteral(node.initializer)) {
        value = node.initializer.text;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (value === null) throw new Error(`未找到 ${variableName}`);
  return value;
}

const [chaptersSource, extraTasksSource, schemaSource, seedSource] = await Promise.all([
  readSource("src/data/chapters.ts"),
  readSource("src/data/chapterTaskRequirements.ts"),
  readSource("src/data/schema.ts"),
  readSource("src/data/seedData.ts"),
]);

const statements = [
  ...stringPropertyValues(chaptersSource, new Set(["expectedSql"])),
  ...stringPropertyValues(extraTasksSource, new Set(["sql"])),
];
const schemaSql = exportedTemplateValue(schemaSource, "createSchemaSql");
const seedSql = exportedTemplateValue(seedSource, "seedDataSql");
const SQL = await initSqlJs();
const failures = [];

for (const [index, statement] of statements.entries()) {
  const database = new SQL.Database();
  try {
    database.run(schemaSql);
    database.run(seedSql);
    database.exec(statement);
  } catch (error) {
    failures.push({ task: index + 1, sql: statement, error: error instanceof Error ? error.message : String(error) });
  } finally {
    database.close();
  }
}

if (statements.length !== 102) {
  failures.push({ task: "配置数量", sql: "", error: `应有 102 条标准 SQL，实际找到 ${statements.length} 条。` });
}

if (failures.length > 0) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`已验证 ${statements.length} 条任务 SQL：所有表和字段均存在，语句均可执行。`);
}
