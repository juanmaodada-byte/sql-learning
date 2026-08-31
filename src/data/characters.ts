import type { Character } from "./types";

export const characters: Character[] = [
  {
    id: "mentor",
    name: "林予",
    role: "数据分析负责人",
    department: "数据团队",
    color: "#1f6feb",
    avatarText: "导",
    description: "讲解 SQL 思路，提供提示和答案复盘。",
  },
  {
    id: "sales",
    name: "周可",
    role: "销售运营同事",
    department: "销售部",
    color: "#0f8f6f",
    avatarText: "销",
    description: "关注订单、客户和销售额，提出业务查询需求。",
  },
  {
    id: "warehouse",
    name: "秦川",
    role: "库存管理员",
    department: "库管部",
    color: "#936316",
    avatarText: "库",
    description: "关注商品、库存、入库和出库数据。",
  },
  {
    id: "boss",
    name: "沈总",
    role: "业务负责人",
    department: "管理层",
    color: "#7c3aed",
    avatarText: "总",
    description: "关注经营指标、趋势和综合分析结论。",
  },
  {
    id: "hr",
    name: "许宁",
    role: "HR 专员",
    department: "人力资源部",
    color: "#d14343",
    avatarText: "HR",
    description: "关注员工、部门和组织关系数据。",
  },
  {
    id: "support",
    name: "唐溪",
    role: "客服专员",
    department: "客服部",
    color: "#c2410c",
    avatarText: "客",
    description: "关注客户信息、反馈文本和工单问题。",
  },
  {
    id: "finance",
    name: "赵铭",
    role: "财务分析同事",
    department: "财务部",
    color: "#0e7490",
    avatarText: "财",
    description: "关注收入、付款、退款和成本分析。",
  },
];

export const characterById = Object.fromEntries(
  characters.map((character) => [character.id, character])
) as Record<Character["id"], Character>;
