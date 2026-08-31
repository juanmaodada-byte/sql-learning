export type CharacterId =
  | "mentor"
  | "sales"
  | "warehouse"
  | "boss"
  | "hr"
  | "support"
  | "finance";

export type ValidationStatus = "passed" | "failed" | "partial";

export type ValidationRule =
  | {
      type: "requiredColumns";
      columns: string[];
    }
  | {
      type: "expectedRowCount";
      count: number;
    }
  | {
      type: "requiredKeyword";
      keyword: string;
    }
  | {
      type: "ordered";
      by: string;
      direction: "asc" | "desc";
    };

export type TaskRequirement = {
  goal: string;
  initialSql: string;
  expectedSql: string;
  solutionExplanation?: string;
  hints: string[];
  validationRules: ValidationRule[];
};

export type ChapterTask = {
  id: number;
  label: "入门热身" | "进阶任务" | "综合挑战";
  title: string;
  story: string;
  requirement: TaskRequirement;
};

export type KnowledgeExample = {
  sql: string;
  explanation: string;
  fieldPart: string;
  tablePart: string;
  sqlFieldNames?: string[];
  sqlTableNames?: string[];
};

export type Character = {
  id: CharacterId;
  name: string;
  role: string;
  department: string;
  color: string;
  avatarText: string;
  description: string;
};

export type Chapter = {
  id: number;
  section: "basic" | "advanced";
  title: string;
  knowledgePoint: string;
  knowledgeUsage?: string;
  knowledgeSyntax?: string;
  knowledgeExamples?: KnowledgeExample[];
  taskBreakdown?: string[];
  characterId: CharacterId;
  story: string;
  knowledge: string;
  requirement: TaskRequirement;
  tasks?: ChapterTask[];
};



