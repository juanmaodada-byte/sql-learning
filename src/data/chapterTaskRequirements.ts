import type { TaskRequirement } from "./types";

type TaskSpec = {
  goal: string;
  sql: string;
  keyword: string;
  hints?: string[];
};

function requirement(spec: TaskSpec): TaskRequirement {
  return {
    goal: spec.goal,
    initialSql: "",
    expectedSql: spec.sql,
    hints: spec.hints ?? [
      `本题需要使用 ${spec.keyword.toUpperCase()}。`,
      "先核对任务要求的表和字段，再组织 SQL。",
    ],
    validationRules: [{ type: "requiredKeyword", keyword: spec.keyword }],
    solutionExplanation: `标准查询使用 ${spec.keyword.toUpperCase()} 完成任务，并且只引用当前数据库中真实存在的表和字段。`,
  };
}

// 第 1 项任务沿用 chapters.ts；这里配置每章独立的任务 2、任务 3。
export const chapterExtraTaskRequirements: Record<number, [TaskRequirement, TaskRequirement]> = {
  1: [
    requirement({ goal: "查询 employees 表中的员工编号、姓名和部门，供门禁系统核对。", sql: "SELECT id, name, department FROM employees;", keyword: "select" }),
    requirement({ goal: "从 employees 表提取姓名、岗位和入职日期，整理成人员基础清单。", sql: "SELECT name, job_title, hire_date FROM employees;", keyword: "select" }),
  ],
  2: [
    requirement({ goal: "查询销售部门员工的姓名、岗位和部门。", sql: "SELECT name, job_title, department FROM employees WHERE department = '销售部';", keyword: "where" }),
    requirement({ goal: "查询岗位为数据分析师的员工姓名与入职日期。", sql: "SELECT name, hire_date FROM employees WHERE job_title = '数据分析师';", keyword: "where" }),
  ],
  3: [
    requirement({ goal: "查询金额低于 500 的订单编号、金额和状态。", sql: "SELECT id, total_amount, status FROM orders WHERE total_amount < 500;", keyword: "where" }),
    requirement({ goal: "查询金额不低于 1000 或状态为 pending、并排除 canceled 的订单。", sql: "SELECT id, total_amount, status FROM orders WHERE (total_amount >= 1000 OR status = 'pending') AND NOT status = 'cancelled';", keyword: "not" }),
  ],
  4: [
    requirement({ goal: "查询北京、上海或广州订单的编号和金额。", sql: "SELECT id, total_amount FROM orders WHERE city IN ('北京', '上海', '广州');", keyword: "in" }),
    requirement({ goal: "查询金额在 1000 到 3000 之间且不属于北京、上海的订单。", sql: "SELECT city, id, total_amount FROM orders WHERE total_amount BETWEEN 1000 AND 3000 AND city NOT IN ('北京', '上海');", keyword: "between" }),
  ],
  5: [
    requirement({ goal: "查询名称以“云”开头的客户名称和城市。", sql: "SELECT name, city FROM customers WHERE name LIKE '云%';", keyword: "like" }),
    requirement({ goal: "查询名称包含“科技”或“网络”的客户编号、名称、城市和电话。", sql: "SELECT id, name, city, phone FROM customers WHERE name LIKE '%科技%' OR name LIKE '%网络%';", keyword: "like" }),
  ],
  6: [
    requirement({ goal: "查询手机号不为空的客户姓名、城市和手机号。", sql: "SELECT name, city, phone FROM customers WHERE phone IS NOT NULL;", keyword: "is not null" }),
    requirement({ goal: "查询手机号或城市缺失的客户编号、姓名、城市和手机号。", sql: "SELECT id, name, city, phone FROM customers WHERE phone IS NULL OR city IS NULL;", keyword: "is null" }),
  ],
  7: [
    requirement({ goal: "查询订单编号、状态和金额，并按订单日期从新到旧排列。", sql: "SELECT id, status, total_amount FROM orders ORDER BY order_date DESC;", keyword: "order by" }),
    requirement({ goal: "查询 completed 订单，按金额降序返回编号、客户编号和金额。", sql: "SELECT id, customer_id, total_amount FROM orders WHERE status = 'completed' ORDER BY total_amount DESC;", keyword: "order by" }),
  ],
  8: [
    requirement({ goal: "查询金额最低的 5 笔订单。", sql: "SELECT id, customer_id, total_amount FROM orders ORDER BY total_amount ASC LIMIT 5;", keyword: "limit" }),
    requirement({ goal: "查询上海订单中金额最高的前 10 笔。", sql: "SELECT id, city, total_amount FROM orders WHERE city = '上海' ORDER BY total_amount DESC LIMIT 10;", keyword: "limit" }),
  ],
  9: [
    requirement({ goal: "统计 orders 表中的订单总数。", sql: "SELECT COUNT(*) AS order_count FROM orders;", keyword: "count" }),
    requirement({ goal: "统计金额超过 1000 的订单数量。", sql: "SELECT COUNT(*) AS high_value_orders FROM orders WHERE total_amount > 1000;", keyword: "count" }),
  ],
  10: [
    requirement({ goal: "连接订单和客户，返回订单编号、客户名称和城市。", sql: "SELECT orders.id, customers.name, customers.city FROM orders INNER JOIN customers ON orders.customer_id = customers.id;", keyword: "join" }),
    requirement({ goal: "连接订单和客户，返回订单编号、客户名称、状态和金额。", sql: "SELECT orders.id, customers.name, orders.status, orders.total_amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id;", keyword: "join" }),
  ],
  11: [
    requirement({ goal: "查询员工姓名、岗位和直属上级姓名。", sql: "SELECT employee.name, employee.job_title, manager.name AS manager_name FROM employees employee INNER JOIN employees manager ON employee.manager_id = manager.id;", keyword: "join" }),
    requirement({ goal: "查询直属上级为林予的员工姓名、部门和岗位。", sql: "SELECT employee.name, employee.department, employee.job_title FROM employees employee INNER JOIN employees manager ON employee.manager_id = manager.id WHERE manager.name = '林予';", keyword: "join" }),
  ],
  12: [
    requirement({ goal: "查询 customers 表中不重复的城市。", sql: "SELECT DISTINCT city FROM customers;", keyword: "distinct" }),
    requirement({ goal: "查询下过 completed 订单且不重复的城市。", sql: "SELECT DISTINCT city FROM orders WHERE status = 'completed';", keyword: "distinct" }),
  ],
  13: [
    requirement({ goal: "查询订单编号、商品编号和购买数量。", sql: "SELECT order_id, product_id, quantity FROM order_items;", keyword: "select" }),
    requirement({ goal: "连接订单、客户、明细和商品，返回客户名称、商品名称、类别和购买数量。", sql: "SELECT customers.name AS customer_name, products.name AS product_name, products.category, order_items.quantity FROM orders INNER JOIN customers ON orders.customer_id = customers.id INNER JOIN order_items ON orders.id = order_items.order_id INNER JOIN products ON order_items.product_id = products.id;", keyword: "join" }),
  ],
  14: [
    requirement({ goal: "查询所有商品及对应订单明细，包含没有销量的商品。", sql: "SELECT products.id, products.name, order_items.order_id, order_items.quantity FROM products LEFT JOIN order_items ON products.id = order_items.product_id;", keyword: "left join" }),
    requirement({ goal: "查询没有销量且价格低于 500 的商品编号、名称和类别。", sql: "SELECT products.id, products.name, products.category FROM products LEFT JOIN order_items ON products.id = order_items.product_id WHERE order_items.id IS NULL AND products.price < 500;", keyword: "left join" }),
  ],
  15: [
    requirement({ goal: "查询所有员工和直属上级姓名，保留没有上级的员工。", sql: "SELECT employee.name, manager.name AS manager_name FROM employees employee LEFT JOIN employees manager ON employee.manager_id = manager.id;", keyword: "left join" }),
    requirement({ goal: "查询数据部中没有直属上级的员工姓名和岗位。", sql: "SELECT employee.name, employee.job_title FROM employees employee LEFT JOIN employees manager ON employee.manager_id = manager.id WHERE employee.department = '数据部' AND manager.id IS NULL;", keyword: "left join" }),
  ],
  16: [
    requirement({ goal: "合并北京和上海客户姓名并去重。", sql: "SELECT name FROM customers WHERE city = '北京' UNION SELECT name FROM customers WHERE city = '上海';", keyword: "union" }),
    requirement({ goal: "合并 VIP 客户和手机号不为空客户的编号、姓名、城市并去重。", sql: "SELECT id, name, city FROM customers WHERE level = 'VIP' UNION SELECT id, name, city FROM customers WHERE phone IS NOT NULL;", keyword: "union" }),
  ],
  17: [
    requirement({ goal: "统计订单总数、总销售额和平均订单金额。", sql: "SELECT COUNT(*) AS order_count, SUM(total_amount) AS total_sales, AVG(total_amount) AS average_order FROM orders;", keyword: "sum" }),
    requirement({ goal: "统计金额超过 1000 的订单总额、平均金额和最高金额。", sql: "SELECT SUM(total_amount) AS total_sales, AVG(total_amount) AS average_order, MAX(total_amount) AS max_order FROM orders WHERE total_amount > 1000;", keyword: "sum" }),
  ],
  18: [
    requirement({ goal: "按订单状态统计订单数量。", sql: "SELECT status, COUNT(*) AS order_count FROM orders GROUP BY status;", keyword: "group by" }),
    requirement({ goal: "按城市统计订单数量、总销售额和平均金额。", sql: "SELECT city, COUNT(*) AS order_count, SUM(total_amount) AS total_sales, AVG(total_amount) AS average_order FROM orders GROUP BY city;", keyword: "group by" }),
  ],
  19: [
    requirement({ goal: "按城市统计订单数，只保留至少 2 笔订单的城市。", sql: "SELECT city, COUNT(*) AS order_count FROM orders GROUP BY city HAVING COUNT(*) >= 2;", keyword: "having" }),
    requirement({ goal: "按状态汇总，只保留订单数超过 3 的状态并返回总金额。", sql: "SELECT status, COUNT(*) AS order_count, SUM(total_amount) AS total_sales FROM orders GROUP BY status HAVING COUNT(*) > 3;", keyword: "having" }),
  ],
  20: [
    requirement({ goal: "查询金额低于全体订单平均金额的订单编号和金额。", sql: "SELECT id, total_amount FROM orders WHERE total_amount < (SELECT AVG(total_amount) FROM orders);", keyword: "select" }),
    requirement({ goal: "查询金额高于 completed 订单平均金额的 pending 订单。", sql: "SELECT id, city, total_amount FROM orders WHERE status = 'pending' AND total_amount > (SELECT AVG(total_amount) FROM orders WHERE status = 'completed');", keyword: "select" }),
  ],
  21: [
    requirement({ goal: "在测试副本新增工号 9 的客服员工陈默。", sql: "INSERT INTO employees (id, name, department, job_title, hire_date, manager_id) VALUES (9, '陈默', '客服部', '客服专员', '2026-07-02', NULL);", keyword: "insert" }),
    requirement({ goal: "在测试副本新增工号 10 的财务员工。", sql: "INSERT INTO employees (id, name, department, job_title, hire_date, manager_id) VALUES (10, '方晴', '财务部', '财务专员', '2026-07-03', 6);", keyword: "insert" }),
  ],
  22: [
    requirement({ goal: "查询包含商品 2 的订单编号。", sql: "SELECT order_id FROM order_items WHERE product_id = 2;", keyword: "select" }),
    requirement({ goal: "查询购买过商品 2 或商品 4 的不同客户编号、姓名和城市。", sql: "SELECT DISTINCT customers.id, customers.name, customers.city FROM customers WHERE customers.id IN (SELECT orders.customer_id FROM orders INNER JOIN order_items ON orders.id = order_items.order_id WHERE order_items.product_id IN (2, 4));", keyword: "in" }),
  ],
  23: [
    requirement({ goal: "查询重复的城市和金额组合及出现次数。", sql: "SELECT city, total_amount, COUNT(*) AS duplicate_count FROM orders GROUP BY city, total_amount HAVING COUNT(*) > 1;", keyword: "group by" }),
    requirement({ goal: "查询城市、金额和状态组合重复的订单明细。", sql: "SELECT id, city, total_amount, status FROM orders WHERE (city, total_amount, status) IN (SELECT city, total_amount, status FROM orders GROUP BY city, total_amount, status HAVING COUNT(*) > 1);", keyword: "group by" }),
  ],
  24: [
    requirement({ goal: "查询每个城市金额最低的订单。", sql: "SELECT id, city, total_amount FROM orders order_a WHERE total_amount = (SELECT MIN(total_amount) FROM orders order_b WHERE order_b.city = order_a.city);", keyword: "select" }),
    requirement({ goal: "查询每个客户金额最高的订单。", sql: "SELECT customer_id, id, total_amount FROM orders order_a WHERE total_amount = (SELECT MAX(total_amount) FROM orders order_b WHERE order_b.customer_id = order_a.customer_id);", keyword: "select" }),
  ],
  25: [
    requirement({ goal: "查询提交过客服工单的不同客户编号和姓名。", sql: "SELECT id, name FROM customers customer WHERE EXISTS (SELECT 1 FROM support_tickets ticket WHERE ticket.customer_id = customer.id);", keyword: "exists" }),
    requirement({ goal: "查询从未提交过客服工单的客户编号、姓名和城市。", sql: "SELECT id, name, city FROM customers customer WHERE NOT EXISTS (SELECT 1 FROM support_tickets ticket WHERE ticket.customer_id = customer.id);", keyword: "not exists" }),
  ],
  26: [
    requirement({ goal: "查询每位客户的姓名和订单总数，保留没有订单的客户。", sql: "SELECT customer.name, (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customer.id) AS order_count FROM customers customer;", keyword: "select" }),
    requirement({ goal: "查询有订单客户的姓名、城市和订单总数。", sql: "SELECT customer.name, customer.city, (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customer.id) AS order_count FROM customers customer WHERE (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customer.id) >= 1;", keyword: "select" }),
  ],
  27: [
    requirement({ goal: "以数据截止日为基准查询最近 7 天的订单。", sql: "SELECT id, order_date, total_amount FROM orders WHERE order_date >= date('2026-06-30', '-7 day');", keyword: "date" }),
    requirement({ goal: "按日期统计数据截止日前 30 天的订单数和销售额。", sql: "SELECT order_date, COUNT(*) AS order_count, SUM(total_amount) AS total_sales FROM orders WHERE order_date >= date('2026-06-30', '-30 day') GROUP BY order_date ORDER BY order_date;", keyword: "date" }),
  ],
  28: [
    requirement({ goal: "创建 recent_customers 表，保存数据截止日前 30 天内有订单的客户。", sql: "CREATE TABLE recent_customers AS SELECT DISTINCT customers.* FROM customers INNER JOIN orders ON customers.id = orders.customer_id WHERE orders.order_date >= date('2026-06-30', '-30 day');", keyword: "create table" }),
    requirement({ goal: "创建北京 VIP 客户快照表。", sql: "CREATE TABLE beijing_vip_customers AS SELECT * FROM customers WHERE level = 'VIP' AND city = '北京';", keyword: "create table" }),
  ],
  29: [
    requirement({ goal: "在测试副本插入编号 9 的无线鼠标商品。", sql: "INSERT INTO products (id, name, category, price) VALUES (9, '无线鼠标', '数码配件', 199);", keyword: "insert" }),
    requirement({ goal: "在测试副本批量插入三件办公用品。", sql: "INSERT INTO products (id, name, category, price) VALUES (10, '文件夹', '办公用品', 29), (11, '白板笔', '办公用品', 15), (12, '桌面收纳盒', '办公用品', 49);", keyword: "insert" }),
  ],
  30: [
    requirement({ goal: "把 product_id 为 3 的库存更新为 15。", sql: "UPDATE inventory SET stock_quantity = 15 WHERE product_id = 3;", keyword: "update" }),
    requirement({ goal: "把低于补货线的商品库存统一增加 10。", sql: "UPDATE inventory SET stock_quantity = stock_quantity + 10 WHERE stock_quantity < reorder_level;", keyword: "update" }),
  ],
  31: [
    requirement({ goal: "在测试副本删除 products 表中 id 为 5 的商品。", sql: "DELETE FROM products WHERE id = 5;", keyword: "delete" }),
    requirement({ goal: "删除价格高于 2000 且没有订单明细的商品。", sql: "DELETE FROM products WHERE price > 2000 AND NOT EXISTS (SELECT 1 FROM order_items WHERE order_items.product_id = products.id);", keyword: "delete" }),
  ],
  32: [
    requirement({ goal: "查询不重复的客户城市列表。", sql: "SELECT DISTINCT city FROM customers;", keyword: "distinct" }),
    requirement({ goal: "查询不重复的客户姓名、城市和等级组合，并按等级、城市排列。", sql: "SELECT DISTINCT name, city, level FROM customers ORDER BY level, city;", keyword: "distinct" }),
  ],
  33: [
    requirement({ goal: "查询客户姓名，并将空城市显示为“未填写”。", sql: "SELECT name, IFNULL(city, '未填写') AS city_display FROM customers;", keyword: "ifnull" }),
    requirement({ goal: "查询客户姓名、城市和电话，将缺失值显示为“未填写”。", sql: "SELECT name, IFNULL(city, '未填写') AS city_display, IFNULL(phone, '未填写') AS phone_display FROM customers;", keyword: "ifnull" }),
  ],
  34: [
    requirement({ goal: "将 VIP 客户标记为“重点客户”，其他客户标记为“普通客户”。", sql: "SELECT name, CASE WHEN level = 'VIP' THEN '重点客户' ELSE '普通客户' END AS customer_group FROM customers;", keyword: "case" }),
    requirement({ goal: "根据订单数量生成客户活跃标签，返回姓名、城市和标签。", sql: "SELECT customer.name, customer.city, CASE WHEN (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customer.id) >= 2 THEN '高活跃' WHEN (SELECT COUNT(*) FROM orders WHERE orders.customer_id = customer.id) = 1 THEN '一般活跃' ELSE '待激活' END AS activity_label FROM customers customer;", keyword: "case" }),
  ],
};
