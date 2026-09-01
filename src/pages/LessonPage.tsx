import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { characterById } from "../data/characters";
import { ResultTable } from "../components/ResultTable";
import { TaskFeedback } from "../components/TaskFeedback";
import { SchemaPanel } from "../components/SchemaPanel";
import { SqlTokenPanel } from "../components/SqlTokenPanel";
import { tokenizeSql } from "../utils/sqlTokens";
import { getReferencedTables } from "../utils/sqlMetadata";
import { SqlEditor } from "../components/SqlEditor";
import { evaluateChapter, type TaskEvaluation } from "../engine/evaluator";
import { loadProgress, recordAttempt, recordHintUsage, type ProgressMode, type ProgressState } from "../state/progressStore";
import { runSql, type SqlRunResult, type SqlTableResult } from "../engine/database";
import type { Chapter, KnowledgeExample } from "../data/types";
import { applyChapterTaskStories } from "../data/chapterTaskStories";

function example(sql: string, explanation: string, fieldPart: string, tablePart: string): KnowledgeExample {
  return { sql, explanation, fieldPart, tablePart };
}
function extractNames(part: string) {
  return part
    .replace(/（.*?）/g, "")
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function collectExampleTerms(example: KnowledgeExample) {
  const fieldNames = [...extractNames(example.fieldPart), ...(example.sqlFieldNames ?? [])];
  const tableNames = [...extractNames(example.tablePart), ...(example.sqlTableNames ?? [])];
  return {
    fieldNames: [...new Set(fieldNames)],
    tableNames: [...new Set(tableNames)],
  };
}

type SqlMatchKind = "field" | "table";

function highlightExampleSql(example: KnowledgeExample) {
  const collectedTerms = collectExampleTerms(example);
  const terms = [
    ...collectedTerms.fieldNames.map((term) => ({ term, kind: "field" as SqlMatchKind })),
    ...collectedTerms.tableNames.map((term) => ({ term, kind: "table" as SqlMatchKind })),
  ].sort((left, right) => right.term.length - left.term.length);

  const matches: Array<{ start: number; end: number; kind: SqlMatchKind; term: string }> = [];

  for (const { term, kind } of terms) {
    if (!term) continue;
    let startIndex = 0;
    while (startIndex < example.sql.length) {
      const index = example.sql.indexOf(term, startIndex);
      if (index === -1) break;
      matches.push({ start: index, end: index + term.length, kind, term });
      startIndex = index + term.length;
    }
  }

  matches.sort((left, right) => {
    if (left.start !== right.start) return left.start - right.start;
    return right.end - left.end;
  });

  const selected: Array<{ start: number; end: number; kind: SqlMatchKind; term: string }> = [];
  let lastEnd = -1;
  for (const match of matches) {
    if (match.start < lastEnd) continue;
    selected.push(match);
    lastEnd = match.end;
  }

  const fragments: ReactNode[] = [];
  let cursor = 0;

  selected.forEach((match, index) => {
    if (match.start > cursor) {
      fragments.push(<span key={`text-${cursor}`}>{example.sql.slice(cursor, match.start)}</span>);
    }
    fragments.push(
      <span className={`example-sql__term example-sql__term--${match.kind}`} key={`${match.term}-${match.start}-${index}`}>
        {example.sql.slice(match.start, match.end)}
      </span>,
    );
    cursor = match.end;
  });

  if (cursor < example.sql.length) {
    fragments.push(<span key={`text-${cursor}`}>{example.sql.slice(cursor)}</span>);
  }

  return fragments;
}

function createChapterSeed(chapterId: number) {
  return chapterId * 9301 + 49297;
}

function shuffleSqlTokens<T>(tokens: T[], chapterId: number) {
  const shuffled = [...tokens];
  let seed = createChapterSeed(chapterId);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 233 + 12345) % 233280;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
type SyntaxPart = {
  label: string;
  value: string;
  description: string;
  tone: "select" | "from" | "where" | "join" | "result";
};

function buildSyntaxParts(chapter: Chapter): SyntaxPart[] {
  const point = chapter.knowledgePoint.toLowerCase();
  if (point.includes("多行子查询")) {
    return [
      { label: "SELECT 字段", value: "查什么信息", description: "外层 SELECT 决定最终要展示给用户看的业务字段，例如学员编号和学员姓名。", tone: "select" },
      { label: "FROM 主表", value: "从哪张主表查", description: "外层 FROM 指定最终结果来自哪张表，例如 learners。", tone: "from" },
      { label: "WHERE student_id IN (...) ", value: "用编号名单筛选", description: "IN 左边是主表中的编号字段，括号里是一组可匹配的编号。只要主表 learner_code 出现在这组编号里，就保留这一行。", tone: "where" },
      { label: "SELECT 关联字段 FROM 关联表", value: "先找编号名单", description: "括号里的子查询先去关联表里找出多个编号，例如报名过某门课程的 learner_ref。", tone: "result" },
    ];
  }
  if (point.includes("where")) {
    return [
      { label: "SELECT 字段", value: "查什么列", description: "决定结果里显示哪些字段。", tone: "select" },
      { label: "FROM 表", value: "从哪张表查", description: "指定数据来源。", tone: "from" },
      { label: "WHERE 条件", value: "只保留满足条件的行", description: "条件可以是等于、大于、小于、包含某个文本等。", tone: "where" },
    ];
  }
  if (point.includes("order by")) {
    return [
      { label: "SELECT 字段", value: "展示哪些列", description: "先决定结果中要看到哪些字段。", tone: "select" },
      { label: "FROM 表", value: "读取哪张表", description: "指定这些字段来自哪张数据表。", tone: "from" },
      { label: "ORDER BY 字段 DESC", value: "按这个字段排序", description: "ORDER BY 不筛选数据，只改变结果顺序；DESC 表示从大到小排列。", tone: "result" },
    ];
  }
  if (point.includes("join") || point.includes("连接")) {
    return [
      { label: "FROM 表A", value: "主表", description: "先确定主要读取的表。", tone: "from" },
      { label: "JOIN 表B", value: "补充另一张表", description: "把另一张表中相关的信息拼接进来。", tone: "join" },
      { label: "ON 关联条件", value: "两表怎么匹配", description: "ON 后写两张表之间的编号对应关系。", tone: "where" },
      { label: "SELECT 字段", value: "展示组合后的字段", description: "可以同时选择两张表中的字段。", tone: "select" },
    ];
  }
  if (point.includes("group") || point.includes("聚合") || point.includes("count")) {
    return [
      { label: "SELECT 分组字段", value: "按谁统计", description: "分组字段决定每一组代表什么。", tone: "select" },
      { label: "COUNT / SUM / AVG", value: "算什么指标", description: "聚合函数把多行数据计算成一个统计值。", tone: "result" },
      { label: "FROM 表", value: "从哪张表统计", description: "指定统计数据的来源。", tone: "from" },
      { label: "GROUP BY 字段", value: "分组规则", description: "GROUP BY 让 SQL 分组后分别计算指标。", tone: "where" },
    ];
  }
  return [
    { label: "SELECT 字段", value: "结果显示什么", description: "SELECT 后写最终想看到的字段或表达式。", tone: "select" },
    { label: "FROM 表", value: "数据从哪里来", description: "FROM 后写提供数据的数据表。", tone: "from" },
    { label: "条件 / 计算 / 排序", value: "按本节知识点处理", description: "后续子句根据当前知识点完成筛选、连接、统计或排序。", tone: "where" },
  ];
}

function buildKnowledgeExamples(chapter: Chapter): KnowledgeExample[] {
  const point = chapter.knowledgePoint.toLowerCase();
  if (point.includes("where")) {
    return [example(
      "SELECT full_name, class_level FROM learners WHERE hometown = '成都';",
      "这条语句表示：从 learners 表中读取 full_name 和 class_level 两个字段，但只返回 hometown 等于“成都”的学员。WHERE 后面的 hometown = '成都' 是筛选条件，SELECT 后面的字段决定结果中展示姓名和班级。",
      "full_name、class_level、hometown（字段）",
      "learners（表）",
    )];
  }
  if (point.includes("and / or / not")) {
    return [example(
      "SELECT item_title FROM stationery_items WHERE item_type = '笔记本' AND stock_total >= 10;",
      "这条语句表示：从 stationery_items 表中读取 item_title，只保留 item_type 等于“笔记本”并且 stock_total 大于等于 10 的物品。AND 连接两个条件，两个条件都满足时该物品才会进入结果。",
      "item_title、item_type、stock_total（字段）",
      "stationery_items（表）",
    )];
  }
  if (point.includes("in / between")) {
    return [example(
      "SELECT book_title FROM reading_books WHERE book_kind IN ('小说', '历史') AND page_total BETWEEN 100 AND 500;",
      "这条语句表示：从 reading_books 表中读取 book_title，只保留 book_kind 属于“小说”或“历史”，并且 page_total 在 100 到 500 之间的书。IN 处理多个候选类别，BETWEEN 处理连续数值范围。",
      "book_title、book_kind、page_total（字段）",
      "reading_books（表）",
    )];
  }
  if (point.includes("like")) {
    return [example(
      "SELECT school_title FROM campus_list WHERE school_title LIKE '%实验%';",
      "这条语句表示：从 campus_list 表中读取 school_title，只保留学校名称中包含“实验”的记录。前后的百分号代表“实验”前后都可以还有其他字符。",
      "school_title（字段）",
      "campus_list（表）",
    )];
  }
  if (point.includes("is null")) {
    return [example(
      "SELECT member_full_name FROM fitness_members WHERE contact_mobile IS NULL;",
      "这条语句表示：从 fitness_members 表中读取 member_full_name，只保留 contact_mobile 没有填写的会员。NULL 代表缺失值，需要用 IS NULL 判断，不能写成 = NULL。",
      "member_full_name、contact_mobile（字段）",
      "fitness_members（表）",
    )];
  }
  if (point.includes("order by")) {
    return [example(
      "SELECT runner_full_name, finish_seconds FROM race_results ORDER BY finish_seconds ASC;",
      "这条语句表示：从 race_results 表中读取 runner_full_name 和 finish_seconds，并按照 finish_seconds 从小到大排列。ORDER BY 决定结果展示顺序，ASC 表示升序，所以用时更短的选手会排在前面。",
      "runner_full_name、finish_seconds（字段）",
      "race_results（表）",
    )];
  }
  if (point.includes("limit")) {
    return [example(
      "SELECT movie_title FROM movie_scores ORDER BY audience_score DESC LIMIT 5;",
      "这条语句表示：先从 movie_scores 表中读取 movie_title，并按 audience_score 从高到低排序，再只保留前 5 行。LIMIT 控制返回行数，通常和排序一起使用。",
      "movie_title、audience_score（字段）",
      "movie_scores（表）",
    )];
  }
  if (point.includes("count")) {
    return [example(
      "SELECT COUNT(*) AS learner_total FROM learners;",
      "这条语句表示：统计 learners 表中一共有多少名学员，并把统计结果命名为 learner_total。COUNT(*) 不是读取某个字段值，而是计算行数。",
      "COUNT(*)、learner_total（聚合表达式和别名）",
      "learners（表）",
    )];
  }
  if (point.includes("distinct") || point.includes("去重")) {
    return [example(
      "SELECT DISTINCT hometown FROM campus_visitors;",
      "这条语句表示：从 campus_visitors 表中读取 hometown，并把重复出现的城市合并成一条。DISTINCT 影响的是最终返回的字段组合。",
      "hometown（字段）",
      "campus_visitors（表）",
    )];
  }
  if (point.includes("自我外连接")) {
    return [example(
      "SELECT learner_full_name, study_group FROM learners WHERE tutor_ref IS NULL;",
      "这条语句表示：从 learners 表中读取 learner_full_name 和 study_group，只保留 tutor_ref 为空的学员。它常用于找出没有导师或没有关联对象的数据。",
      "learner_full_name、study_group、tutor_ref（字段）",
      "learners（表）",
    )];
  }
  if (point.includes("外连接") || point.includes("left join")) {
    return [example(
      "SELECT book.book_title FROM library_books book LEFT JOIN borrow_records borrow ON book.book_code = borrow.book_code WHERE borrow.borrow_code IS NULL;",
      "这条语句表示：保留 library_books 表中的全部图书，尝试匹配 borrow_records 借阅记录；如果某本书没有借阅记录，borrow.borrow_code 会是 NULL，因此可以找出从未被借出的图书。",
      "book.book_title、book.book_code、borrow.book_code、borrow.borrow_code（字段）",
      "library_books、borrow_records（表）",
    )];
  }
  if (point.includes("自连接")) {
    return [example(
      "SELECT learner.full_name, tutor.full_name AS tutor_full_name FROM learners learner INNER JOIN learners tutor ON learner.tutor_ref = tutor.learner_code;",
      "这条语句表示：把 learners 表同时当作 learner 和 tutor 两个角色使用，用 learner.tutor_ref 匹配 tutor.learner_code，从而在一行中展示学员和他的导师姓名。",
      "learner.full_name、tutor.full_name、learner.tutor_ref、tutor.learner_code（字段）",
      "learners（同一张表的两个角色）",
    )];
  }
  if (point.includes("join") || point.includes("连接")) {
    return [example(
      "SELECT learner.full_name, cohort.cohort_title FROM learners learner INNER JOIN cohorts cohort ON learner.cohort_ref = cohort.cohort_code;",
      "这条语句表示：把 learners 和 cohorts 按 learner.cohort_ref = cohort.cohort_code 关联起来，只返回能匹配到班级的学员，并展示学员姓名和班级名称。",
      "learner.full_name、cohort.cohort_title、learner.cohort_ref、cohort.cohort_code（字段）",
      "learners、cohorts（表）",
    )];
  }
  if (point.includes("group by + having")) {
    return [example(
      "SELECT cohort_title, COUNT(*) AS learner_total FROM cohort_roster GROUP BY cohort_title HAVING COUNT(*) > 30;",
      "这条语句表示：按 cohort_title 对 cohort_roster 分组，统计每个班有多少学员，并只保留人数大于 30 的班级。GROUP BY 负责分组，HAVING 负责筛选统计结果。",
      "cohort_title、COUNT(*)、learner_total（字段、聚合表达式和别名）",
      "cohort_roster（表）",
    )];
  }
  if (point.includes("聚合函数")) {
    return [example(
      "SELECT SUM(exam_score) AS total_score, AVG(exam_score) AS average_score, MAX(exam_score) AS highest_score FROM score_cards;",
      "这条语句表示：在 score_cards 表中对 exam_score 计算总分、平均分和最高分，并分别命名为 total_score、average_score 和 highest_score。它返回的是汇总指标。",
      "exam_score、total_score、average_score、highest_score（字段和别名）",
      "score_cards（表）",
    )];
  }
  if (point.includes("group") || point.includes("聚合")) {
    return [example(
      "SELECT lesson_title, COUNT(*) AS signup_total FROM class_signups GROUP BY lesson_title;",
      "这条语句表示：按 lesson_title 对 class_signups 分组，并统计每门课有多少条报名记录。结果中每一行代表一个课程分组，而不是原始明细行。",
      "lesson_title、COUNT(*)、signup_total（字段、聚合表达式和别名）",
      "class_signups（表）",
    )];
  }
  if (point.includes("union")) {
    return [example(
      "SELECT learner_full_name FROM morning_roster UNION SELECT learner_full_name FROM evening_roster;",
      "这条语句表示：分别从 morning_roster 和 evening_roster 中读取 learner_full_name，然后把两个名单合并成一个结果集。UNION 要求两边返回的字段数量一致，并默认去除重复姓名。",
      "learner_full_name（字段）",
      "morning_roster、evening_roster（表）",
    )];
  }
  if (point.includes("多行子查询")) {
    return [example(
      "SELECT full_name FROM learners WHERE learner_code IN (SELECT learner_ref FROM course_enrollments WHERE course_title = 'Python入门');",
      "这条语句表示：子查询先从 course_enrollments 中找出报名“Python入门”的一组 learner_ref，外层再从 learners 中查这些 learner_code 对应的 full_name。IN 用来匹配多行结果。",
      "full_name、learner_code、learner_ref、course_title（字段）",
      "learners、course_enrollments（表）",
    )];
  }
  if (point.includes("多列子查询")) {
    return [example(
      "SELECT learner_full_name FROM score_cards WHERE (lesson_title, exam_score) IN (SELECT lesson_title, top_score FROM lesson_top_scores);",
      "这条语句表示：外层用 lesson_title 和 exam_score 组成字段组合，去匹配 lesson_top_scores 返回的课程和最高分组合。两个括号中的字段数量和顺序必须一致。",
      "learner_full_name、lesson_title、exam_score、top_score（字段）",
      "score_cards、lesson_top_scores（表）",
    )];
  }
  if (point.includes("相关子查询")) {
    return [example(
      "SELECT card.learner_full_name FROM score_cards card WHERE card.exam_score = (SELECT MAX(peer.exam_score) FROM score_cards peer WHERE peer.lesson_title = card.lesson_title);",
      "这条语句表示：外层遍历 score_cards 的每一行，子查询根据当前行的 lesson_title 计算该课程的最高 exam_score，再保留分数等于最高分的学员。",
      "card.learner_full_name、card.exam_score、card.lesson_title、peer.exam_score、peer.lesson_title（字段）",
      "score_cards（同一张表的两个角色）",
    )];
  }
  if (point.includes("exists")) {
    return [example(
      "SELECT club.club_title FROM school_clubs club WHERE EXISTS (SELECT 1 FROM club_roster roster WHERE roster.club_ref = club.club_code);",
      "这条语句表示：对 school_clubs 的每一行，检查 club_roster 中是否存在 club_ref 等于当前社团编号的成员；存在则保留这个社团。",
      "club.club_title、club.club_code、roster.club_ref（字段）",
      "school_clubs、club_roster（表）",
    )];
  }
  if (point.includes("select 中的子查询")) {
    return [example(
      "SELECT cohort.cohort_title, (SELECT COUNT(*) FROM learners learner WHERE learner.cohort_ref = cohort.cohort_code) AS learner_total FROM cohorts cohort;",
      "这条语句表示：外层读取 cohorts 的 cohort_title，同时子查询为每个班统计 learners 中匹配的学员数，并把统计结果显示为 learner_total。",
      "cohort.cohort_title、cohort.cohort_code、learner.cohort_ref、learner_total（字段和别名）",
      "cohorts、learners（表）",
    )];
  }
  if (point.includes("子查询")) {
    return [example(
      "SELECT learner_full_name FROM score_cards WHERE exam_score > (SELECT AVG(exam_score) FROM score_cards);",
      "这条语句表示：子查询先计算 score_cards 中 exam_score 的平均值，外层再找出 exam_score 高于平均分的 learner_full_name。括号内结果提供给外层条件使用。",
      "learner_full_name、exam_score（字段）",
      "score_cards（表）",
    )];
  }
  if (point.includes("date") || point.includes("日期")) {
    return [example(
      "SELECT event_title, date(start_day, '+7 day') AS followup_day FROM campus_events;",
      "这条语句表示：从 campus_events 中读取 event_title，并把 start_day 向后推 7 天，计算结果显示为 followup_day。date 函数负责日期计算。",
      "event_title、start_day、followup_day（字段和别名）",
      "campus_events（表）",
    )];
  }
  if (point.includes("创建") || point.includes("create")) {
    return [example(
      "CREATE TABLE honor_learners AS SELECT learner_full_name FROM score_cards WHERE exam_score >= 90;",
      "这条语句表示：根据 score_cards 中 exam_score 大于等于 90 的查询结果创建一张新表 honor_learners。新表的字段和数据来自 AS 后面的 SELECT。",
      "learner_full_name、exam_score（字段）",
      "honor_learners、score_cards（表）",
    )];
  }
  if (point.includes("insert") || point.includes("插入")) {
    return [example(
      "INSERT INTO learners (learner_code, full_name) VALUES (101, '李雷');",
      "这条语句表示：向 learners 表插入一名学员，learner_code 写入 101，full_name 写入“李雷”。字段顺序必须和 VALUES 中的值顺序一致。",
      "learner_code、full_name（字段）",
      "learners（表）",
    )];
  }
  if (point.includes("update") || point.includes("更新")) {
    return [example(
      "UPDATE learners SET hometown = '杭州' WHERE learner_code = 101;",
      "这条语句表示：把 learners 表中 learner_code 等于 101 的那一行的 hometown 修改为“杭州”。SET 写修改内容，WHERE 限定修改范围。",
      "hometown、learner_code（字段）",
      "learners（表）",
    )];
  }
  if (point.includes("delete") || point.includes("删除")) {
    return [example(
      "DELETE FROM learners WHERE learner_code = 101;",
      "这条语句表示：从 learners 表中删除 learner_code 等于 101 的学员记录。DELETE FROM 指定表，WHERE 决定具体删除哪一行。",
      "learner_code（字段）",
      "learners（表）",
    )];
  }
  if (point.includes("case")) {
    return [example(
      "SELECT learner_full_name, CASE WHEN exam_score >= 90 THEN '优秀' ELSE '继续努力' END AS score_band FROM score_cards;",
      "这条语句表示：读取 score_cards 时，根据 exam_score 生成一个 score_band 字段；分数大于等于 90 时显示“优秀”，否则显示“继续努力”。",
      "learner_full_name、exam_score、score_band（字段和别名）",
      "score_cards（表）",
    )];
  }
  if (point.includes("ifnull")) {
    return [example(
      "SELECT IFNULL(display_alias, '未设置昵称') AS shown_alias FROM app_profiles;",
      "这条语句表示：从 app_profiles 中读取 display_alias，如果它是 NULL，就在结果中显示“未设置昵称”，并把这一列命名为 shown_alias。",
      "display_alias、shown_alias（字段和别名）",
      "app_profiles（表）",
    )];
  }
  return [example(
    "SELECT full_name, class_level FROM learners;",
    "这条语句表示：从 learners 表中读取 full_name 和 class_level 两个字段，结果只展示学员姓名和班级。SELECT 决定展示字段，FROM 决定数据来源。",
    "full_name、class_level（字段）",
    "learners（表）",
  )];
}
function buildSyntaxTemplate(chapter: Chapter) {
  if (chapter.knowledgeSyntax) return chapter.knowledgeSyntax;
  const point = chapter.knowledgePoint.toLowerCase();
  if (point.includes("order by")) return "SELECT 字段 FROM 表 ORDER BY 字段 ASC|DESC;";
  if (point.includes("limit")) return "SELECT 字段 FROM 表 ORDER BY 字段 DESC LIMIT 数量;";
  if (point.includes("count")) return "SELECT COUNT(*) AS 别名 FROM 表;";
  if (point.includes("in / between")) return "SELECT 字段 FROM 表 WHERE 字段 IN (值1, 值2) AND 字段 BETWEEN 最小值 AND 最大值;";
  if (point.includes("like")) return "SELECT 字段 FROM 表 WHERE 字段 LIKE '%关键词%';";
  if (point.includes("is null")) return "SELECT 字段 FROM 表 WHERE 字段 IS NULL;";
  if (point.includes("and / or / not")) return "SELECT 字段 FROM 表 WHERE 条件1 AND|OR 条件2;";
  if (point.includes("distinct") || point.includes("去重")) return "SELECT DISTINCT 字段 FROM 表;";
  if (point.includes("自我外连接")) return "SELECT 字段 FROM 表 WHERE 关系字段 IS NULL;";
  if (point.includes("外连接") || point.includes("left join")) return "SELECT 表A.字段 FROM 表A LEFT JOIN 表B ON 关联条件 WHERE 表B.id IS NULL;";
  if (point.includes("自连接")) return "SELECT 当前表.字段, 上级表.字段 FROM 表 当前表 INNER JOIN 表 上级表 ON 关联条件;";
  if (point.includes("join") || point.includes("连接")) return "SELECT 表A.字段, 表B.字段 FROM 表A INNER JOIN 表B ON 表A.id = 表B.student_id;";
  if (point.includes("group by + having")) return "SELECT 分组字段, COUNT(*) FROM 表 GROUP BY 分组字段 HAVING 聚合条件;";
  if (point.includes("聚合函数")) return "SELECT SUM(字段), AVG(字段), MAX(字段) FROM 表;";
  if (point.includes("group") || point.includes("聚合")) return "SELECT 分组字段, COUNT(*) FROM 表 GROUP BY 分组字段;";
  if (point.includes("insert") || point.includes("插入")) return "INSERT INTO 表 (字段1, 字段2) VALUES (值1, 值2);";
  if (point.includes("update") || point.includes("更新")) return "UPDATE 表 SET 字段 = 值 WHERE 条件;";
  if (point.includes("delete") || point.includes("删除")) return "DELETE FROM 表 WHERE 条件;";
  if (point.includes("date") || point.includes("日期")) return "SELECT 字段, date(日期字段, '修正量') FROM 表;";
  if (point.includes("union")) return "SELECT 字段 FROM 表A UNION SELECT 字段 FROM 表B;";
  if (point.includes("exists")) return "SELECT 字段 FROM 表A WHERE EXISTS (SELECT 1 FROM 表B WHERE 关联条件);";
  if (point.includes("多行子查询")) return "SELECT 字段 FROM 表 WHERE student_id IN (SELECT 关联字段 FROM 关联表);";
  if (point.includes("多列子查询")) return "SELECT 字段 FROM 表 WHERE (字段1, 字段2) IN (SELECT 字段1, 字段2 FROM 关联表);";
  if (point.includes("相关子查询")) return "SELECT 外层字段 FROM 表 外层 WHERE 字段 = (SELECT MAX(字段) FROM 表 内层 WHERE 关联条件);";
  if (point.includes("select 中的子查询")) return "SELECT 外层字段, (SELECT 聚合值 FROM 关联表 WHERE 关联条件) AS 别名 FROM 表 外层;";
  if (point.includes("子查询")) return "SELECT 字段 FROM 表 WHERE 字段 > (SELECT 聚合值 FROM 表);";
  if (point.includes("创建") || point.includes("create")) return "CREATE TABLE 新表 AS SELECT 字段 FROM 表;";
  return "SELECT 字段 FROM 表 WHERE 条件;";
}

function buildKnowledgeDetails(chapter: Chapter) {
  const point = chapter.knowledgePoint.toLowerCase();
  if (point.includes("order by")) return "排序字段写在 ORDER BY 后面，ASC 是升序，DESC 是降序。排序只改变结果的展示顺序，不会改变表中的原始数据。";
  if (point.includes("limit")) return "LIMIT 通常放在 ORDER BY 之后，先确定优先级再截取结果。LIMIT 的数字表示最多返回多少行。";
  if (point.includes("date") || point.includes("日期")) return "日期函数返回新的日期文本，可以放在 SELECT 中展示，也可以放在 WHERE 中计算筛选边界。使用日期函数时要明确原始日期字段和计算后的日期含义。";
  if (point.includes("自我外连接")) return "本节利用关系字段为空来识别没有直属上级的记录。虽然主题属于组织关系，但实际查询只需要对关系字段使用 IS NULL。";
  if (point.includes("外连接") || point.includes("left join")) return "LEFT JOIN 会保留左表全部记录，右表没有匹配时对应字段为 NULL。再检查右表主键为 NULL，就能找出左表中没有关联记录的对象。";
  if (point.includes("自连接")) return "自连接把同一张表当作两个角色使用，例如员工和直属上级。两个别名分别代表当前记录和关联记录，再通过关系字段连接。";
  if (point.includes("join") || point.includes("连接")) return "连接条件通常写在 ON 后面，用两张表的关联字段匹配记录。INNER JOIN 只保留匹配成功的行，LEFT JOIN 会保留左表的全部行。";
  if (point.includes("多行子查询")) return "可以把多行子查询理解成先拿到一张“编号名单”，再用外层查询去查这些编号对应的完整信息。比如先从 course_enrollments 中找出报名某门课程的 learner_ref，再去 learners 表查询这些学员的姓名。";
  if (point.includes("多列子查询")) return "多列子查询返回由多个字段组成的组合，外层也必须用相同顺序的字段组合进行匹配。字段数量和顺序不一致都会导致语义错误。";
  if (point.includes("相关子查询")) return "相关子查询会引用外层当前行的字段，因此会随着外层每一行重新计算。它适合比较当前记录与所属分组的统计值。";
  if (point.includes("select 中的子查询")) return "子查询可以放在 SELECT 字段列表中，为每一条外层记录计算一个新字段。外层客户和内层订单通过关联字段连接。";
  if (point.includes("子查询")) return "子查询放在括号中，先得到一个中间结果，再由外层查询继续筛选、匹配或展示。要注意子查询返回的是单个值、单列多行，还是多列组合。";
  if (point.includes("group by + having")) return "GROUP BY 先形成分组，HAVING 再筛选分组后的聚合结果。WHERE 过滤明细行，HAVING 过滤统计后的分组。";
  if (point.includes("聚合函数")) return "SUM、AVG、MAX 等函数会把多行压缩成汇总指标。本节统计整张表的整体指标，因此不需要 GROUP BY。";
  if (point.includes("group") || point.includes("聚合")) return "聚合函数会把多行压缩成统计结果，GROUP BY 决定每组如何计算。若要筛选聚合后的结果，应使用 HAVING，而不是 WHERE。";
  if (point.includes("insert") || point.includes("插入")) return "INSERT 的字段顺序必须和 VALUES 中的值一一对应。写入前要确认字段类型和主键值，避免重复主键或字段错位。";
  if (point.includes("update") || point.includes("更新")) return "SET 指定要修改的新值，WHERE 决定修改范围。没有 WHERE 的 UPDATE 可能影响整张表，因此必须先确认筛选条件。";
  if (point.includes("delete") || point.includes("删除")) return "DELETE 会删除满足 WHERE 条件的行。执行前应先用同样的 WHERE 写 SELECT 检查命中记录，确认删除范围准确。";
  if (point.includes("case")) return "CASE 按 WHEN 条件从上到下判断，THEN 返回满足条件的结果。ELSE 用于覆盖其他情况，END 表示表达式结束。";
  if (point.includes("ifnull")) return "IFNULL 的第一个参数是要检查的字段，第二个参数是字段为 NULL 时的替代值。它只改变查询输出，不会修改原表中的 NULL。";
  if (point.includes("distinct") || point.includes("去重")) return "DISTINCT 会对 SELECT 返回的整组字段去重，而不是只对某一个字段单独去重。选择多个字段时，字段组合完全相同才会被视为重复。";
  if (point.includes("union")) return "UNION 两侧的 SELECT 必须返回相同数量且类型兼容的列。UNION 默认会去重，如需保留重复行应使用 UNION ALL。";
  return "先确定结果需要展示的字段，再确定数据来源和筛选条件。关键字的书写顺序会影响 SQL 的语义，完成后应结合样例数据检查结果。";
}

function buildSyntaxExplanation(chapter: Chapter) {
  const point = chapter.knowledgePoint.toLowerCase();
  if (point.includes("order by")) return "ORDER BY 后面写排序字段，ASC 表示从小到大或从早到晚，DESC 表示从大到小或从晚到早。模板中的第二个“字段”就是排序依据，它决定结果行的排列顺序。";
  if (point.includes("limit")) return "LIMIT 放在排序之后，用于截取排序结果。模板中的“数量”要替换成实际需要保留的行数。";
  if (point.includes("date") || point.includes("日期")) return "date 的第一个参数通常是日期字段，第二个参数是日期修正表达式。计算结果可以作为 SELECT 字段，也可以作为 WHERE 的比较边界。";
  if (point.includes("自我外连接")) return "关系字段放在 WHERE 后并使用 IS NULL，表示只保留没有关联上级的记录。";
  if (point.includes("外连接") || point.includes("left join")) return "LEFT JOIN 保留左表记录，右表未匹配时产生 NULL。结合 WHERE 过滤右表 NULL，可以找出没有关联数据的左表记录。";
  if (point.includes("自连接")) return "同一张表在 FROM 和 JOIN 中出现两次，并使用不同别名区分两个角色。ON 后写当前记录与关联记录之间的关系字段。";
  if (point.includes("join") || point.includes("连接")) return "SELECT 列出要展示的字段，JOIN 指定被连接的表，ON 写出两表之间的关联条件。表名较多时建议使用别名，避免字段来源不清楚。";
  if (point.includes("多行子查询")) return "IN 左边写外层表的编号字段，括号里写能返回多个编号的子查询。SQL 会逐行判断外层编号是否出现在子查询返回的编号名单里。";
  if (point.includes("多列子查询")) return "外层括号中的字段组合必须和子查询返回的字段组合保持数量和顺序一致。";
  if (point.includes("相关子查询")) return "子查询内部引用外层别名，形成相关条件。外层每处理一行，子查询都会针对该行计算对应统计值。";
  if (point.includes("select 中的子查询")) return "子查询放在 SELECT 字段列表中，并通过 AS 生成一个展示列。它通常需要引用外层表的关联字段。";
  if (point.includes("子查询")) return "外层查询负责最终结果，括号中的 SELECT 负责提供中间值或匹配集合。模板中的子查询位置必须和它返回的数据类型相匹配。";
  if (point.includes("group by + having")) return "GROUP BY 后写分组字段，聚合函数写在 SELECT 中，HAVING 用于筛选分组后的统计结果。";
  if (point.includes("聚合函数")) return "SUM、AVG、MAX 都直接对表中的目标字段进行整体计算。AS 可以为每个统计结果设置清晰的列名。";
  if (point.includes("group") || point.includes("聚合")) return "GROUP BY 后写分组字段，聚合函数写在 SELECT 中。需要筛选统计结果时再追加 HAVING。";
  if (point.includes("insert") || point.includes("插入")) return "INSERT INTO 后先列出目标表和字段，再用 VALUES 按相同顺序提供数据。多行插入时，每一组括号代表一行。";
  if (point.includes("update") || point.includes("更新")) return "UPDATE 指定目标表，SET 指定新值，WHERE 限定目标行。三个部分共同决定修改的对象和内容。";
  if (point.includes("delete") || point.includes("删除")) return "DELETE FROM 指定目标表，WHERE 指定需要删除的行。删除语句没有字段列表，安全边界完全由 WHERE 决定。";
  if (point.includes("union")) return "UNION 连接两个结构兼容的 SELECT 结果。两侧字段数量要一致，默认会对合并后的结果去重。";
  return "模板中的“字段”代表要展示或处理的列，“表”代表数据来源，“条件”代表筛选或关联规则。请根据当前任务替换这些占位信息。";
}
type LessonPageProps = {
  chapter?: Chapter;
  isLocked: boolean;
  unlockAllTasks?: boolean;
  onBack: () => void;
  onProgressChange: (progress: ProgressState) => void;
  totalChapters: number;
  mode: ProgressMode;
  initialDrafts?: Record<string, string>;
  onDraftChange?: (draftKey: string, sql: string) => void;
};

export function LessonPage({ chapter, isLocked, unlockAllTasks = false, onBack, onProgressChange, totalChapters, mode, initialDrafts = {}, onDraftChange }: LessonPageProps) {
  const [activeTaskId, setActiveTaskId] = useState(1);
  const [sql, setSql] = useState("");
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sqlRef = useRef(sql);
  const onDraftChangeRef = useRef(onDraftChange);
  const [result, setResult] = useState<SqlRunResult | null>(null);
  const [evaluation, setEvaluation] = useState<TaskEvaluation | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // 让 ref 始终持有最新值：在 effect 中写入，而不是在渲染期写入。
  useEffect(() => {
    sqlRef.current = sql;
  }, [sql]);
  useEffect(() => {
    onDraftChangeRef.current = onDraftChange;
  }, [onDraftChange]);

  // 离开章节或卸载前，把未提交的 SQL 草稿兜底落盘，避免重启后丢失。
  useEffect(() => {
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
      onDraftChangeRef.current?.(`${chapter?.id ?? 0}-${activeTaskId}`, sqlRef.current);
    };
  }, [activeTaskId, chapter?.id]);

  function handleSqlChange(value: string) {
    setSql(value);
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => onDraftChangeRef.current?.(`${chapter?.id ?? 0}-${activeTaskId}`, value), 400);
  }

  // 锁定视图或章节不存在时不渲染课程；但所有 Hook 必须在条件返回之前执行。
  const isLockedView = !chapter || isLocked;

  // 任务相关派生值：锁定视图下用安全兜底（仅供 Hook 的依赖与判断使用）。
  const tasks = chapter
    ? applyChapterTaskStories(chapter.tasks ?? [
        { id: 1, label: "入门热身", title: chapter.title, story: chapter.story, requirement: chapter.requirement },
        { id: 2, label: "进阶任务", title: `${chapter.title} · 进阶`, story: "基础口径已经确认。现在把业务方补充的条件加入查询，保持结果范围准确。", requirement: chapter.requirement },
        { id: 3, label: "综合挑战", title: `${chapter.title} · 综合挑战`, story: "最后一次交付前，请按完整业务口径输出结果，并检查字段、顺序和边界记录。", requirement: chapter.requirement },
      ], chapter.id)
    : [];
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0];
  const taskKey = activeTask ? `${chapter?.id ?? 0}-${activeTask.id}` : "locked";
  const savedDraft = activeTask ? initialDrafts[taskKey] : undefined;
  const isLegacyAnswerDraft = Boolean(
    activeTask &&
      savedDraft &&
      [activeTask.requirement.initialSql, activeTask.requirement.expectedSql].some(
        (answer) => answer.trim() === savedDraft.trim(),
      ),
  );

  // 切换任务 / 章节时重置编辑器状态：采用 React 官方推荐的“根据变化调整 state”写法，
  // 避免在 effect 里同步 setState 造成级联渲染。
  const [prevTaskKey, setPrevTaskKey] = useState<string | null>(null);
  if (prevTaskKey !== taskKey) {
    setPrevTaskKey(taskKey);
    setSql(isLegacyAnswerDraft ? "" : savedDraft ?? "");
    setResult(null);
    setEvaluation(null);
    setHintVisible(false);
    setHintUsed(false);
  }

  // 命中历史答案的旧草稿从存储中清掉（纯副作用，放在 effect 中执行）。
  useEffect(() => {
    if (isLegacyAnswerDraft) {
      onDraftChangeRef.current?.(taskKey, "");
    }
  }, [isLegacyAnswerDraft, taskKey]);

  if (isLockedView) {
    return (
      <main className="lesson-shell">
        <button className="back-button" onClick={onBack} type="button">
          返回任务大厅
        </button>
        <section className="lesson-lock-panel">
          <span className="lock-mark" aria-hidden="true">锁</span>
          <p className="eyebrow">章节暂未解锁</p>
          <h1>先完成前置任务</h1>
          <p>当前章节需要完成前面的学习任务后才能进入。</p>
        </section>
      </main>
    );
  }

  // 走到这里说明章节存在且已解锁，activeChapter 一定有值。
  const activeChapter = chapter as Chapter;
  const chapterProgress = loadProgress(mode, totalChapters).chapters[String(activeChapter.id)];
  // completedTasks 是唯一的任务解锁依据；章节 completed 只表示三项任务均已完成，
  // 不再把缺少明细的旧数据误判为当前三个任务都可进入。
  const completedTasks = chapterProgress?.completedTasks ?? [];
  const taskRequirement = activeTask.requirement;
  const character = characterById[activeChapter.characterId];
  const tableResult: SqlTableResult | null = result?.type === "rows" ? result : null;
  const errorMessage = result?.type === "error" ? result.message : null;
  const successMessage = result?.type === "success" ? result.message : null;
  const knowledgeExamples = buildKnowledgeExamples(activeChapter);
  const syntaxTemplate = buildSyntaxTemplate(activeChapter);
  const sqlTokens = shuffleSqlTokens(tokenizeSql(taskRequirement.expectedSql), activeChapter.id + activeTask.id);
  const referencedTables = getReferencedTables(taskRequirement.expectedSql);
  const knowledgeDetails = buildKnowledgeDetails(activeChapter);
  const syntaxExplanation = buildSyntaxExplanation(activeChapter);
  const syntaxParts = buildSyntaxParts(activeChapter);
  const hasNextChapter = activeChapter.id < totalChapters;
  const lessonStatus = completedTasks.includes(activeTask.id) || evaluation?.status === "passed" ? "已完成" : "进行中";


  function goToNextChapter() {
    if (!hasNextChapter) return;
    if (activeTask.id < tasks.length) setActiveTaskId(activeTask.id + 1);
    else if (hasNextChapter) window.location.hash = `#/lessons/${activeChapter.id + 1}`;
  }
  async function handleRunSql() {
    setIsRunning(true);
    const nextResult = await runSql(sql);
    const nextEvaluation = await evaluateChapter({ ...activeChapter, requirement: taskRequirement }, sql, nextResult);
    setResult(nextResult);
    setEvaluation(nextEvaluation);
    const nextProgress = recordAttempt(mode, loadProgress(mode, totalChapters), activeChapter.id, activeTask.id, nextEvaluation, false, totalChapters);
    onProgressChange(nextProgress);
    setIsRunning(false);
  }

  function resetSql() {
    setSql("");
    if (draftTimer.current) clearTimeout(draftTimer.current);
      onDraftChangeRef.current?.(taskKey, "");
    setResult(null);
    setEvaluation(null);
    setHintVisible(false);
    setHintUsed(false);
  }

  function handleHintToggle() {
    if (!hintVisible && !hintUsed) {
      recordHintUsage(mode, loadProgress(mode, totalChapters), activeChapter.id);
      setHintUsed(true);
    }
    setHintVisible((visible) => !visible);
  }

  function insertSqlToken(token: string) {
    setSql((currentSql) => {
      const current = currentSql.trimEnd();
      if (token === ";") {
        return current.endsWith(";") ? current : `${current};`;
      }
      if (token === ",") {
        return `${current},`;
      }
      return current ? `${current} ${token}` : token;
    });
  }

  return (
    <main className="lesson-shell">
      <div className="lesson-toolbar">
        <button className="back-button" onClick={onBack} type="button">
          返回任务大厅
        </button>
        <span className="lesson-breadcrumb">基础篇 / 第 {activeChapter.id} 节</span>
      </div>

      <section className="lesson-layout">
        <aside className="lesson-story-panel">
          <div className="lesson-character">
            <span className="avatar lesson-avatar" style={{ backgroundColor: character.color }}>
              {character.avatarText}
            </span>
            <div>
              <strong>{character.name}</strong>
              <span>{character.department} · {character.role}</span>
            </div>
          </div>
          <p className="eyebrow">剧情任务</p>
          <h1>{activeChapter.title}</h1>
          <div className="chapter-progress-head"><span>章节进度</span><strong>{completedTasks.length} / {tasks.length}</strong></div>
          <div className="task-stepper" aria-label="章节任务进度">
            {tasks.map((task) => {
              const done = completedTasks.includes(task.id);
              const unlocked = unlockAllTasks || task.id === 1 || done || completedTasks.includes(task.id - 1);
              const locked = !unlocked;
              const developmentUnlocked = unlockAllTasks && task.id > 1 && !done && !completedTasks.includes(task.id - 1);
              return <button className={`task-step ${task.id === activeTask.id ? "is-active" : ""} ${done ? "is-done" : ""} ${developmentUnlocked ? "is-development-unlocked" : ""}`} disabled={locked} key={task.id} onClick={() => { if (unlocked) setActiveTaskId(task.id); }} type="button"><span>{done ? "✓" : task.id}</span><strong>任务 {task.id}</strong><small>{developmentUnlocked ? "开发解锁" : task.label}</small></button>;
            })}
          </div>
          <p className="lesson-story">{activeTask.story}</p>
          <div className="lesson-goal">
            <span>任务目标</span>
            <strong>{taskRequirement.goal}</strong>
            <span>涉及数据表：{referencedTables.join("、") || "未识别"}</span>
          </div>
          <div className="knowledge-block">
            <span className="panel-kicker">知识点用法</span>
            <h2>{activeChapter.knowledgePoint}</h2>
            <p>{activeChapter.knowledgeUsage ?? activeChapter.knowledge}</p>
            <p>{knowledgeDetails}</p>
          </div>
          <div className="knowledge-examples">
            <span className="panel-kicker">语法模板</span>
            <p className="example-note">先记住这类语句的基本结构，再把示例中的字段、表和值替换成任务需要的内容。</p>
            <pre className="syntax-template"><code>{syntaxTemplate}</code></pre>
            <p className="syntax-explanation">{syntaxExplanation}</p>
            <div className="syntax-breakdown" aria-label="语法拆解">
              {syntaxParts.map((part) => (
                <div className={`syntax-part syntax-part--${part.tone}`} key={part.label}>
                  <strong>{part.label}</strong>
                  <span>{part.value}</span>
                  <p>{part.description}</p>
                </div>
              ))}
            </div>
            <span className="panel-kicker">示例语句</span>
            <p className="example-note">以下示例只用于理解语法，不是本题答案。</p>
            {knowledgeExamples.map((example) => (
              <div className="knowledge-example" key={example.sql}>
                <pre><code>{highlightExampleSql(example)}</code></pre>
                <div className="example-parts">
                  <span><strong>字段：</strong>{example.fieldPart}</span>
                  <span><strong>表：</strong>{example.tablePart}</span>
                </div>
                <p>{example.explanation}</p>
              </div>
            ))}
          </div>
          <div className="task-breakdown">
            <span className="panel-kicker">任务拆解</span>
            <ol>
              {(activeChapter.taskBreakdown ?? [`先明确本节知识点：${activeChapter.knowledgePoint}。`, `根据任务目标确定需要使用的字段、表和条件：${taskRequirement.goal}`, "按上方语法结构组织 SQL，并检查关键字和条件顺序。"]).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </aside>

        <section className="lesson-workspace" aria-label="SQL 编辑区">
          <div className="workspace-heading">
            <div>
              <span className="panel-kicker">SQL 编辑器</span>
              <h2>自己写出查询</h2>
            </div>
            <span className="lesson-status">{lessonStatus}</span>
          </div>
          <SqlTokenPanel tokens={sqlTokens} onInsertToken={insertSqlToken} />
          <SqlEditor value={sql} onChange={handleSqlChange} />
          <div className="editor-actions">
            <button className="primary-action" disabled={isRunning} onClick={handleRunSql} type="button">
              {isRunning ? "运行中..." : "运行 SQL"}
            </button>
            <button className="secondary-action" disabled={isRunning} onClick={resetSql} type="button">
              清空 SQL
            </button>
            <button className="secondary-action" onClick={handleHintToggle} type="button">
              {hintVisible ? "隐藏提示" : "查看提示"}
            </button>
          </div>
          {hintVisible && (
            <div className="hint-panel">
              <span className="panel-kicker">导师提示</span>
              <p>{activeChapter.requirement.hints[0]}</p>
            </div>
          )}
          {errorMessage && <p className="sql-error">{errorMessage}</p>}
          {successMessage && <p className="sql-success">{successMessage}</p>}
          <TaskFeedback evaluation={evaluation} solutionExplanation={taskRequirement.solutionExplanation} />
          {evaluation?.status === "passed" ? (
            <div className="next-lesson-panel">
              <div>
                <span className="panel-kicker">任务已通过</span>
                <strong>{activeTask.id < tasks.length ? `继续任务 ${activeTask.id + 1}` : hasNextChapter ? `继续第 ${activeChapter.id + 1} 节` : "章节已完成"}</strong>
              </div>
              <button className="primary-action" onClick={goToNextChapter} type="button">
                {activeTask.id < tasks.length ? "进入下一任务" : hasNextChapter ? "下一节" : "返回任务大厅"}
              </button>
            </div>
          ) : null}
          <div className="lesson-result">
            <div className="workspace-heading">
              <div>
                <span className="panel-kicker">运行结果</span>
                <h2>查询结果</h2>
              </div>
            </div>
            <ResultTable result={tableResult} />
          </div>
        </section>

        <SchemaPanel tableNames={referencedTables} />
      </section>
    </main>
  );
}


































