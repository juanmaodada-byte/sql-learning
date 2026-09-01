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
  {
    name: "employees",
    description: "员工表",
    columns: ["id", "name", "department", "job_title", "hire_date", "manager_id"],
    columnLabels: {
      id: "员工编号",
      name: "员工姓名",
      department: "部门",
      job_title: "职位",
      hire_date: "入职日期",
      manager_id: "直属上级编号",
    },
  },
  {
    name: "departments",
    description: "部门表",
    columns: ["id", "name", "location"],
    columnLabels: { id: "部门编号", name: "部门名称", location: "办公地点" },
  },
  {
    name: "customers",
    description: "客户表",
    columns: ["id", "name", "city", "phone", "level"],
    columnLabels: { id: "客户编号", name: "客户姓名", city: "所在城市", phone: "联系电话", level: "会员等级" },
  },
  {
    name: "orders",
    description: "订单表",
    columns: ["id", "customer_id", "city", "order_date", "total_amount", "status"],
    columnLabels: {
      id: "订单编号",
      customer_id: "客户编号",
      city: "下单城市",
      order_date: "下单日期",
      total_amount: "订单总额",
      status: "订单状态",
    },
  },
  {
    name: "products",
    description: "商品表",
    columns: ["id", "name", "category", "price"],
    columnLabels: { id: "商品编号", name: "商品名称", category: "商品类别", price: "单价" },
  },
  {
    name: "order_items",
    description: "订单明细表",
    columns: ["id", "order_id", "product_id", "quantity", "unit_price"],
    columnLabels: {
      id: "明细编号",
      order_id: "订单编号",
      product_id: "商品编号",
      quantity: "购买数量",
      unit_price: "成交单价",
    },
  },
  {
    name: "inventory",
    description: "库存表",
    columns: ["id", "product_id", "stock_quantity", "reorder_level", "warehouse"],
    columnLabels: {
      id: "库存编号",
      product_id: "商品编号",
      stock_quantity: "库存数量",
      reorder_level: "补货警戒线",
      warehouse: "所在仓库",
    },
  },
  {
    name: "suppliers",
    description: "供应商表",
    columns: ["id", "name", "city"],
    columnLabels: { id: "供应商编号", name: "供应商名称", city: "所在城市" },
  },
  {
    name: "reviews",
    description: "评价表",
    columns: ["id", "customer_id", "product_id", "rating", "content"],
    columnLabels: {
      id: "评价编号",
      customer_id: "客户编号",
      product_id: "商品编号",
      rating: "评分",
      content: "评价内容",
    },
  },
  {
    name: "support_tickets",
    description: "客服工单表",
    columns: ["id", "customer_id", "status", "subject", "created_at"],
    columnLabels: {
      id: "工单编号",
      customer_id: "客户编号",
      status: "工单状态",
      subject: "问题主题",
      created_at: "创建时间",
    },
  },
  {
    name: "payments",
    description: "支付表",
    columns: ["id", "order_id", "paid_at", "amount", "method"],
    columnLabels: {
      id: "支付编号",
      order_id: "订单编号",
      paid_at: "支付时间",
      amount: "支付金额",
      method: "支付方式",
    },
  },
  {
    name: "refunds",
    description: "退款表",
    columns: ["id", "order_id", "refunded_at", "amount", "reason"],
    columnLabels: {
      id: "退款编号",
      order_id: "订单编号",
      refunded_at: "退款时间",
      amount: "退款金额",
      reason: "退款原因",
    },
  },
];
