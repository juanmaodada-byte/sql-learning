export const createSchemaSql = `
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  job_title TEXT NOT NULL,
  hire_date TEXT NOT NULL,
  manager_id INTEGER,
  FOREIGN KEY (manager_id) REFERENCES employees(id)
);

CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT,
  level TEXT NOT NULL
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  city TEXT NOT NULL,
  order_date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE inventory (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL,
  stock_quantity INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  warehouse TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE suppliers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  content TEXT,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE support_tickets (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  paid_at TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE refunds (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL,
  refunded_at TEXT NOT NULL,
  amount REAL NOT NULL,
  reason TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
`;

export const tableSchemas = [
  { name: "employees", description: "员工表", columns: ["id", "name", "department", "job_title", "hire_date", "manager_id"] },
  { name: "departments", description: "部门表", columns: ["id", "name", "location"] },
  { name: "customers", description: "客户表", columns: ["id", "name", "city", "phone", "level"] },
  { name: "orders", description: "订单表", columns: ["id", "customer_id", "city", "order_date", "total_amount", "status"] },
  { name: "products", description: "商品表", columns: ["id", "name", "category", "price"] },
  { name: "order_items", description: "订单明细表", columns: ["id", "order_id", "product_id", "quantity", "unit_price"] },
  { name: "inventory", description: "库存表", columns: ["id", "product_id", "stock_quantity", "reorder_level", "warehouse"] },
  { name: "suppliers", description: "供应商表", columns: ["id", "name", "city"] },
  { name: "reviews", description: "评价表", columns: ["id", "customer_id", "product_id", "rating", "content"] },
  { name: "support_tickets", description: "客服工单表", columns: ["id", "customer_id", "status", "subject", "created_at"] },
  { name: "payments", description: "支付表", columns: ["id", "order_id", "paid_at", "amount", "method"] },
  { name: "refunds", description: "退款表", columns: ["id", "order_id", "refunded_at", "amount", "reason"] },
];
