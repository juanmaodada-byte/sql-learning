export const seedDataSql = `
INSERT INTO employees (id, name, department, job_title, hire_date, manager_id) VALUES
  (1, '林予', '数据部', '数据分析负责人', '2020-03-12', NULL),
  (2, '陈安', '数据部', '数据分析师', '2022-07-18', 1),
  (3, '许宁', '人力资源部', 'HR 专员', '2021-11-02', NULL),
  (4, '周可', '销售部', '销售运营', '2023-01-09', 1),
  (5, '秦川', '库管部', '库存管理员', '2019-05-27', NULL),
  (6, '赵铭', '财务部', '财务分析师', '2021-04-16', 1);

INSERT INTO departments (id, name, location) VALUES
  (1, '数据部', '北京'),
  (2, '销售部', '上海'),
  (3, '库管部', '深圳'),
  (4, '财务部', '北京'),
  (5, '人力资源部', '北京');

INSERT INTO customers (id, name, city, phone, level) VALUES
  (1, '星河科技有限公司', '北京', '13800010001', 'VIP'),
  (2, '青木贸易', '上海', NULL, '普通'),
  (3, '北辰数码', '北京', '13800010003', '普通'),
  (4, '远山科技', '深圳', NULL, 'VIP'),
  (5, '云起零售', '杭州', '13800010005', '普通'),
  (6, '澜海科技服务', '上海', '13800010006', 'VIP');

INSERT INTO products (id, name, category, price) VALUES
  (1, '无线键盘', '办公设备', 199),
  (2, '人体工学椅', '办公家具', 1299),
  (3, 'USB-C 扩展坞', '数码配件', 329),
  (4, '降噪耳机', '数码配件', 899),
  (5, '显示器支架', '办公设备', 159),\n  (6, '便携投影仪', '办公设备', 2399);

INSERT INTO orders (id, customer_id, city, order_date, total_amount, status) VALUES
  (1001, 1, '北京', '2026-06-01', 1598, 'completed'),
  (1002, 2, '上海', '2026-06-03', 329, 'pending'),
  (1003, 3, '北京', '2026-06-08', 2097, 'completed'),
  (1004, 4, '深圳', '2026-06-10', 899, 'completed'),
  (1005, 5, '杭州', '2026-06-12', 159, 'cancelled'),
  (1006, 6, '上海', '2026-06-15', 2598, 'completed'),
  (1007, 1, '北京', '2026-06-18', 528, 'completed'),
  (1008, 2, '上海', '2026-06-20', 1458, 'completed'),
  (1009, 3, '北京', '2026-06-24', 199, 'pending'),
  (1010, 4, '深圳', '2026-06-26', 1789, 'completed'),
  (1011, 6, '上海', '2026-06-28', 658, 'completed'),
  (1012, 5, '杭州', '2026-06-30', 1299, 'completed');

INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
  (1, 1001, 2, 1, 1299), (2, 1001, 5, 1, 159),
  (3, 1002, 3, 1, 329), (4, 1003, 2, 1, 1299),
  (5, 1003, 4, 1, 899), (6, 1004, 4, 1, 899),
  (7, 1005, 5, 1, 159), (8, 1006, 2, 2, 1299),
  (9, 1007, 1, 1, 199), (10, 1007, 3, 1, 329),
  (11, 1008, 4, 1, 899), (12, 1008, 5, 1, 159),
  (13, 1009, 1, 1, 199), (14, 1010, 4, 1, 899),
  (15, 1010, 3, 2, 329), (16, 1011, 3, 2, 329),
  (17, 1012, 2, 1, 1299);

INSERT INTO inventory (id, product_id, stock_quantity, reorder_level, warehouse) VALUES
  (1, 1, 45, 10, '北京仓'),
  (2, 2, 6, 8, '上海仓'),
  (3, 3, 28, 10, '深圳仓'),
  (4, 4, 12, 6, '上海仓'),
  (5, 5, 3, 8, '北京仓');

INSERT INTO suppliers (id, name, city) VALUES
  (1, '华东办公供应链', '上海'),
  (2, '北方数码供应链', '北京'),
  (3, '南方仓储供应链', '深圳');

INSERT INTO reviews (id, customer_id, product_id, rating, content) VALUES
  (1, 1, 2, 5, '椅子很舒适'),
  (2, 2, 3, 4, '连接稳定'),
  (3, 3, 4, 5, '降噪效果好'),
  (4, 4, 1, 3, NULL),
  (5, 6, 4, 4, '佩戴舒服');

INSERT INTO support_tickets (id, customer_id, status, subject, created_at) VALUES
  (1, 1, 'closed', '订单咨询', '2026-06-04'),
  (2, 2, 'open', '物流查询', '2026-06-10'),
  (3, 4, 'pending', '退款咨询', '2026-06-18'),
  (4, 6, 'closed', '商品咨询', '2026-06-22');

INSERT INTO payments (id, order_id, paid_at, amount, method) VALUES
  (1, 1001, '2026-06-01', 1598, 'card'),
  (2, 1003, '2026-06-08', 2097, 'transfer'),
  (3, 1004, '2026-06-10', 899, 'card'),
  (4, 1006, '2026-06-15', 2598, 'wallet'),
  (5, 1008, '2026-06-20', 1458, 'card'),
  (6, 1010, '2026-06-26', 1789, 'wallet'),
  (7, 1012, '2026-06-30', 1299, 'transfer');

INSERT INTO refunds (id, order_id, refunded_at, amount, reason) VALUES
  (1, 1005, '2026-06-13', 159, '客户取消'),
  (2, 1002, '2026-06-08', 329, '重复下单');
`;

