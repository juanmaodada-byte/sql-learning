import type { Chapter, ValidationStatus } from "../data/types";
import { runSql, type SqlRunResult, type SqlTableResult } from "./database";
import { compareResultSets, validateRule, type ValidationCheck } from "./validators";

export type TaskEvaluation = {
  status: ValidationStatus;
  title: string;
  message: string;
  checks: ValidationCheck[];
  score: number;
};
function evaluateMutation(
  chapter: Chapter,
  sql: string,
  actual: Extract<SqlRunResult, { type: "success" }>,
  expected: SqlRunResult
): TaskEvaluation {
  if (expected.type !== "success") {
    return {
      status: "failed",
      title: "校验配置错误",
      message: "标准答案没有成功执行，暂时无法完成自动校验。",
      checks: [{ passed: false, message: "标准答案执行失败。" }],
      score: 0,
    };
  }

  const checks: ValidationCheck[] = [
    { passed: true, message: actual.message },
    {
      passed: actual.affectedRows === expected.affectedRows,
      message:
        actual.affectedRows === expected.affectedRows
          ? `影响行数正确：${actual.affectedRows} 行。`
          : `影响行数不正确：应影响 ${expected.affectedRows} 行，实际影响 ${actual.affectedRows} 行。`,
    },
  ];
  const normalizedSql = sql.toLowerCase().replace(/\s+/g, " ");

  for (const rule of chapter.requirement.validationRules) {
    if (rule.type !== "requiredKeyword") continue;
    const keyword = rule.keyword.toLowerCase().replace(/\s+/g, " ");
    const passed = normalizedSql.includes(keyword);
    checks.push({
      passed,
      message: passed
        ? `语法检查通过：使用了 ${rule.keyword.toUpperCase()}。`
        : `语法不符合本节要求：需要使用 ${rule.keyword.toUpperCase()}。`,
    });
  }

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const status: ValidationStatus = passedCount === checks.length ? "passed" : "partial";

  return {
    status,
    title: status === "passed" ? "任务通过" : "部分正确",
    message: status === "passed" ? "写操作执行正确，数据变更仅存在于当前任务副本。" : `已通过 ${passedCount} / ${checks.length} 项检查。`,
    checks,
    score,
  };
}

export async function evaluateChapter(
  chapter: Chapter,
  sql: string,
  actualResult?: SqlRunResult
): Promise<TaskEvaluation> {
  const actual = actualResult ?? await runSql(sql);

  if (actual.type === "error") {
    const message = actual.message;
    return {
      status: "failed",
      title: "暂未通过",
      message,
      checks: [{ passed: false, message }],
      score: 0,
    };
  }

  const expectedResult = await runSql(chapter.requirement.expectedSql);

  if (actual.type === "success") {
    return evaluateMutation(chapter, sql, actual, expectedResult);
  }

  if (expectedResult.type !== "rows") {
    return {
      status: "failed",
      title: "校验配置错误",
      message: "标准答案没有返回查询结果，暂时无法完成自动校验。",
      checks: [{ passed: false, message: "标准答案没有返回查询结果。" }],
      score: 0,
    };
  }

  const checks: ValidationCheck[] = [];
  const resultComparison = compareResultSets(actual, expectedResult);
  checks.push({
    passed: resultComparison.columnsMatch,
    message: resultComparison.columnsMatch
      ? "结果字段与标准结果一致。"
      : "结果字段与标准结果不一致。",
  });
  checks.push({
    passed: resultComparison.unorderedRowsMatch,
    message: resultComparison.unorderedRowsMatch
      ? "返回数据与标准结果一致。"
      : "返回数据与标准结果不一致。",
  });

  for (const rule of chapter.requirement.validationRules) {
    checks.push(validateRule(rule, actual, sql));
  }

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const status: ValidationStatus =
    passedCount === checks.length ? "passed" : passedCount > 0 ? "partial" : "failed";

  return {
    status,
    title: status === "passed" ? "任务通过" : status === "partial" ? "部分正确" : "暂未通过",
    message:
      status === "passed"
        ? "查询结果正确，可以继续复盘本节知识点。"
        : `已通过 ${passedCount} / ${checks.length} 项检查，请根据反馈调整 SQL。`,
    checks,
    score,
  };
}

export function isTableResult(result: SqlRunResult | null): result is SqlTableResult {
  return result?.type === "rows";
}


