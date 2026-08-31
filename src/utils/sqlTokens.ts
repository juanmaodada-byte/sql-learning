export type SqlToken = {
  label: string;
  value: string;
  kind: "keyword" | "column" | "table" | "value" | "punctuation";
};

export function tokenizeSql(sql: string): SqlToken[] {
  return (sql.match(/'[^']*'|>=|<=|<>|!=|[(),;*=<>]|[A-Za-z_][A-Za-z0-9_.]*|\S/g) ?? []).map((token) => {
    const upperToken = token.toUpperCase();
    const kind = token.startsWith("'") || /^\d/.test(token)
      ? "value"
      : /^[(),;*=<>]|^(>=|<=|<>|!=)$/.test(token)
        ? "punctuation"
        : ["SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "ON", "AS", "DISTINCT", "UNION", "GROUP", "BY", "HAVING", "ORDER", "LIMIT", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "CASE", "WHEN", "THEN", "ELSE", "END", "AND", "OR", "NOT", "IN", "IS", "NULL", "EXISTS", "COUNT", "SUM", "AVG", "MAX", "IFNULL"].includes(upperToken)
          ? "keyword"
          : token.includes(".") || /^[A-Za-z_]/.test(token)
            ? "column"
            : "value";

    return { label: token, value: token, kind };
  });
}
