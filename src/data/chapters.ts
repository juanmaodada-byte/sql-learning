import type { Chapter } from "./types";

export const chapters: Chapter[] = [
  {
    id: 1,
    section: "basic",
    title: "查看员工基础信息",
    knowledgePoint: "SELECT 子句",
    knowledgeUsage: "SELECT 决定结果要展示哪些列，FROM 决定从哪张表读取数据。SELECT 后面可以写 * 表示所有字段，也可以写一个或多个字段名；多个字段名之间用英文逗号分隔。",
    knowledgeSyntax: "SELECT 字段 FROM 表;",
    knowledgeExamples: [
      {
        sql: "SELECT * FROM products;",
        explanation: "使用 * 选择 products 表中的所有字段。* 是字段位置，products 是表名。",
        fieldPart: "*（所有字段）",
        tablePart: "products（表）",
      },
      {
        sql: "SELECT name, price FROM products;",
        explanation: "只选择 products 表中的 name 和 price 两个字段。",
        fieldPart: "name, price（字段）",
        tablePart: "products（表）",
      },
    ],
    taskBreakdown: [
      "先确定数据来源：本题需要查询 employees 表。",
      "再确定输出字段：任务要求姓名、岗位和入职日期，对应 name、job_title、hire_date。",
      "使用 SELECT 列出这三个字段，字段之间用逗号分隔。",
      "使用 FROM employees 指定数据表。本题没有筛选条件，所以暂时不需要 WHERE。",
    ],
    characterId: "mentor",
    story: "入职第一天，你抱着新发的陶瓷水杯走进数据团队，桌面上还摊着没拆封的键盘和新工牌。导师林予端来一杯咖啡，在你旁边坐下，指了指屏幕：“先别急着跑数。公司刚换了新人事系统，我想确认姓名、岗位、入职日期这三个核心字段正不正常。”他顿了顿，语气放软，“你试试用 SELECT 把这三样取出来。这是你的第一段 SQL，手别抖。”你第一次点开 SQL 编辑器，手心有点出汗——工位上的水杯，此刻是唯一的安慰。",
    knowledge: "SELECT 用来指定查询结果中需要返回的字段。",
    requirement: {
      goal: "查询员工姓名、岗位和入职日期。",
      initialSql: "SELECT name, job_title, hire_date\nFROM employees;",
      expectedSql: "SELECT name, job_title, hire_date FROM employees;",
      hints: ["SELECT 后面写需要展示的字段名。", "多个字段之间使用英文逗号分隔。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "select" },
        { type: "requiredColumns", columns: ["name", "job_title", "hire_date"] },
      ],
    },
  },
  {
    id: 2,
    section: "basic",
    title: "筛选数据部门员工",
    knowledgePoint: "WHERE 子句",
    characterId: "hr",
    story: "你正对着员工表一行行看，HR 许宁小跑着过来，把一沓表格拍在桌上：“本周要给数据部的同事做新人面谈，你帮我拉一份只要数据部的名单——姓名、岗位、部门三列，别的部门一个都别混进来。”她压低声音补了一句，“全公司几十号人，怎么只挑出数据部，就看你的了。”你低头看了看 employees 表里那列 department：答案，就藏在“只取某个部门”里。",
    knowledge: "WHERE 用来限定查询条件，只返回满足条件的数据行。",
    requirement: {
      goal: "查询数据部门员工的姓名、岗位和部门。",
      initialSql: "SELECT name, job_title, department\nFROM employees\nWHERE department = '数据部';",
      expectedSql: "SELECT name, job_title, department FROM employees WHERE department = '数据部';",
      hints: ["WHERE 写在 FROM 之后。", "文本条件需要使用引号包裹。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "where" },
        { type: "requiredColumns", columns: ["name", "job_title", "department"] },
      ],
    },
  },
  {
    id: 3,
    section: "basic",
    title: "定位高价值完成订单",
    knowledgePoint: "AND / OR / NOT",
    characterId: "sales",
    story: "下午，销售运营周可抱着笔记本电脑凑过来，屏幕上摊开一屏订单：“月底复盘会要用样本。把金额 ≥ 1000 的并且已经完成的订单挑出来——订单编号、客户编号、订单金额、订单状态，四列都要，我复盘要对着看。”她手指敲了两下桌面强调，“两个条件都得满足，别放水。”你在便签上写下“≥1000”“completed”和“四列输出”，心里默念：两个条件，一个都不能少。",
    knowledge: "AND、OR、NOT 可以组合多个筛选条件。",
    requirement: {
      goal: "查询金额 ≥ 1000 且状态为 completed 的订单，返回订单编号、客户编号、订单金额和订单状态。",
      initialSql: "SELECT id, customer_id, total_amount, status\nFROM orders\nWHERE total_amount >= 1000 AND status = 'completed';",
      expectedSql: "SELECT id, customer_id, total_amount, status FROM orders WHERE total_amount >= 1000 AND status = 'completed';",
      hints: ["AND 表示两个条件必须同时满足。", "比较金额时可以使用 >=。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "and" },
        { type: "requiredColumns", columns: ["id", "customer_id", "total_amount", "status"] },
      ],
    },
  },
  {
    id: 4,
    section: "basic",
    title: "查看重点城市订单",
    knowledgePoint: "IN / BETWEEN",
    characterId: "boss",
    story: "快下班时，你伸了个懒腰。沈总路过你的工位停下脚步，随手点了点屏幕：“小数据，北京、上海这两个重点城市，500 到 2000 块的订单有多少？订单编号列出来，我让销售对着跟进——我想看看这个价位段的单子成色。”他顿了顿，“城市就这俩，金额就在这个区间，别超也别漏。”你看着他的背影走远，把“北京 / 上海”“500–2000”两个关键词框了起来——这一单的重点，是“只在这两个范围内”。",
    knowledge: "IN 用于匹配多个候选值，BETWEEN 用于匹配连续范围。",
    requirement: {
      goal: "查询北京或上海客户中，金额在 500 到 2000 之间的订单。",
      initialSql: "SELECT id, city, total_amount\nFROM orders\nWHERE city IN ('北京', '上海') AND total_amount BETWEEN 500 AND 2000;",
      expectedSql: "SELECT id, city, total_amount FROM orders WHERE city IN ('北京', '上海') AND total_amount BETWEEN 500 AND 2000;",
      hints: ["IN 的候选值写在括号里。", "BETWEEN 包含范围两端的值。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "in" },
        { type: "requiredKeyword", keyword: "between" },
      ],
    },
  },
  {
    id: 5,
    section: "basic",
    title: "搜索客户关键词",
    knowledgePoint: "LIKE",
    characterId: "support",
    story: "微信弹出一条语音，客服唐溪的声音有点急：“帮帮忙！有客户说昨天下午打过我们电话，但我把对方名字记岔了，只记得公司名里带'科技'两个字。”消息后面又追来一条，“你帮我按关键词捞一下，姓名、城市都要——客户等着回电呢。”你看了眼 customers 表，心说：模糊查找，就是要在“科技”两个字前后，还能容得下别的字。",
    knowledge: "LIKE 用于模糊匹配文本，% 表示任意长度字符。",
    requirement: {
      goal: "查询名称中包含“科技”的客户。",
      initialSql: "SELECT id, name, city\nFROM customers\nWHERE name LIKE '%科技%';",
      expectedSql: "SELECT id, name, city FROM customers WHERE name LIKE '%科技%';",
      hints: ["LIKE 常与 % 通配符配合使用。", "'%科技%' 表示前后都可以有其他字符。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "like" },
        { type: "requiredColumns", columns: ["id", "name", "city"] },
      ],
    },
  },
  {
    id: 6,
    section: "basic",
    title: "找出手机号缺失客户",
    knowledgePoint: "IS NULL",
    characterId: "hr",
    story: "第二天一早，许宁踩着点又来了，这回眉头拧着：“客服今天要做客户回访，结果倒好，一堆客户手机号没填，根本联系不上。先帮我列一下哪些客户手机号是空的——姓名、城市、手机号都给我。”你正要上手，脑子里猛地闪过一个警告：空值在 SQL 里，可不能拿等号去比。",
    knowledge: "IS NULL 用于判断字段是否为空值。",
    requirement: {
      goal: "查询手机号为空的客户姓名、城市和手机号。",
      initialSql: "SELECT name, city, phone\nFROM customers\nWHERE phone IS NULL;",
      expectedSql: "SELECT name, city, phone FROM customers WHERE phone IS NULL;",
      hints: ["NULL 不能用 = 判断。", "判断空值应写成 IS NULL。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "is null" },
        { type: "requiredColumns", columns: ["name", "city", "phone"] },
      ],
    },
  },
  {
    id: 7,
    section: "basic",
    title: "按订单金额排序",
    knowledgePoint: "ORDER BY",
    characterId: "sales",
    story: "午休刚回来，周可的头像就闪了起来，这次是一行文字：“订单列表给我按金额排个序，最贵的排最上面，从高到低。订单编号、客户编号、金额都列上，我扫一眼就知道大客户都在哪。”你心想：这不只是要“取出来”，还要“排好序”——你第一次意识到，数据的“结果”和“顺序”，是两件事。",
    knowledge: "ORDER BY 用于指定结果集排序方式。",
    requirement: {
      goal: "查询订单编号、客户编号和金额，并按金额降序排列。",
      initialSql: "SELECT id, customer_id, total_amount\nFROM orders\nORDER BY total_amount DESC;",
      expectedSql: "SELECT id, customer_id, total_amount FROM orders ORDER BY total_amount DESC;",
      hints: ["DESC 表示降序。", "ORDER BY 通常写在查询语句最后。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "order by" },
        { type: "ordered", by: "total_amount", direction: "desc" },
      ],
    },
  },
  {
    id: 8,
    section: "basic",
    title: "找出金额最高订单",
    knowledgePoint: "LIMIT",
    characterId: "boss",
    story: "沈总在企业群里直接艾特你，后面跟着一句很“沈总”的话：“别给我整一大张表。我就想看金额最高的前 10 笔订单，订单编号、客户编号、金额都给我，多了没耐心看。”末了还配了个“就这 10 个”的表情包。你在工位上苦笑：老板永远只想知道“最好的一批”，而不是全部。",
    knowledge: "LIMIT 用于限制查询返回的数据行数。",
    requirement: {
      goal: "查询金额最高的前 10 笔订单。",
      initialSql: "SELECT id, customer_id, total_amount\nFROM orders\nORDER BY total_amount DESC\nLIMIT 10;",
      expectedSql: "SELECT id, customer_id, total_amount FROM orders ORDER BY total_amount DESC LIMIT 10;",
      hints: ["先排序，再限制数量。", "LIMIT 10 表示只返回前 10 行。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "limit" },
        { type: "expectedRowCount", count: 10 },
      ],
    },
  },
  {
    id: 9,
    section: "basic",
    title: "统计客户总数",
    knowledgePoint: "COUNT(*)",
    characterId: "mentor",
    story: "午休回来，林予敲了敲你的显示器边框：“取数据只是基本功。做分析的第一步，是知道'一共有多少'。今天教你第一个聚合——客户表里总共有多少客户？”他拿过便签写下一个词，“数出来，起个好读的列名。”你第一次知道，SQL 不只“挑”，还能“数”。",
    knowledge: "COUNT(*) 用于统计结果集中有多少行。",
    requirement: {
      goal: "统计 customers 表中的客户总数。",
      initialSql: "SELECT COUNT(*) AS customer_count\nFROM customers;",
      expectedSql: "SELECT COUNT(*) AS customer_count FROM customers;",
      hints: ["COUNT(*) 会统计所有行。", "AS 可以给统计结果起一个易读别名。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "count" },
        { type: "requiredColumns", columns: ["customer_count"] },
      ],
    },
  },
  {
    id: 10,
    section: "basic",
    title: "查询订单对应客户",
    knowledgePoint: "INNER JOIN",
    characterId: "sales",
    story: "周可看了一眼你交上去的订单列表，眉头皱成一团：“订单表里全是 customer_id 这种数字，我哪记得住谁是谁！”她把杯子一放，“能不能把订单和客户串起来，直接把客户名字带出来？订单编号、客户名称、订单金额，一个都不能少。”你意识到：这次的数据，要横跨两张表。",
    knowledge: "INNER JOIN 用于把两张表中满足关联条件的数据组合起来。",
    requirement: {
      goal: "查询订单编号、客户名称和订单金额。",
      initialSql: "SELECT orders.id, customers.name, orders.total_amount\nFROM orders\nINNER JOIN customers ON orders.customer_id = customers.id;",
      expectedSql: "SELECT orders.id, customers.name, orders.total_amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id;",
      hints: ["JOIN 后面写要关联的表。", "ON 后面写两张表之间的关联条件。"],
      validationRules: [
        { type: "requiredKeyword", keyword: "inner join" },
        { type: "requiredColumns", columns: ["id", "name", "total_amount"] },
      ],
    },
  },
];







chapters.push(
  {
    id: 11, section: "basic", title: "查询员工直属上级", knowledgePoint: "自连接", characterId: "hr",
    story: "许宁举着一张打印好的组织架构图，一脸为难地晃过来：“公司要梳理汇报关系，可上下级全挤在 employees 一张表里——上级他也是员工啊。这……一张表能自己连自己吗？”她指着图上的虚线，“我就想看，每个员工的姓名，和他的直属上级姓名，一一对应起来。”你在心里打鼓：同一张表连自己，真能办到？",
    knowledge: "同一张表可以通过不同别名连接自己。",
    requirement: { goal: "查询员工姓名和直属上级姓名。", initialSql: "", expectedSql: "SELECT employee.name, manager.name AS manager_name FROM employees employee INNER JOIN employees manager ON employee.manager_id = manager.id;", hints: ["同一张 employees 表需要使用两个别名。", "员工的 manager_id 关联上级的 id。"], validationRules: [{ type: "requiredKeyword", keyword: "join" }], solutionExplanation: "employee 和 manager 是同一张 employees 表的两个角色，通过 manager_id 连接上级员工。" },
},
{
id: 12, section: "basic", title: "找出下过单的城市", knowledgePoint: "DISTINCT", characterId: "sales",
    story: "周可要规划区域活动，对着全国订单抓头皮：“全国这么多订单，我想知道客户都分布在哪些城市。一个城市出现一次就行，重复的列表我看着眼晕。”你低头看了眼 orders 表，每座城市都躺着好几单——她要的不是“每个订单”，而是“有哪些城市”。",
    knowledge: "DISTINCT 会去除结果中的重复值。",
    requirement: { goal: "查询所有下过订单的不同城市。", initialSql: "", expectedSql: "SELECT DISTINCT city FROM orders ORDER BY city;", hints: ["DISTINCT 放在 SELECT 后面。", "只选择 city 字段即可。"], validationRules: [{ type: "requiredKeyword", keyword: "distinct" }], solutionExplanation: "先从 orders 读取 city，再用 DISTINCT 去除重复城市。" },
},
{
id: 13, section: "basic", title: "查询完整销售明细", knowledgePoint: "多表连接", characterId: "boss",
    story: "周会散场，沈总把你叫住，语气像是在布置一件大事：“我要一张完整的销售明细——订单号、客户名、买了什么商品、买了多少。订单、客户、商品这些表，串成一张大表，能办吗？”你低头盘算：这次要横跨四张表，一条链子从订单一路扣到商品。",
    knowledge: "多表连接可以沿着外键关系组合业务信息。",
    requirement: { goal: "查询订单编号、客户名称、商品名称和购买数量。", initialSql: "", expectedSql: "SELECT orders.id, customers.name, products.name AS product_name, order_items.quantity FROM orders INNER JOIN customers ON orders.customer_id = customers.id INNER JOIN order_items ON orders.id = order_items.order_id INNER JOIN products ON order_items.product_id = products.id;", hints: ["先连接订单和客户。", "订单明细再连接商品。"], validationRules: [{ type: "requiredKeyword", keyword: "join" }], solutionExplanation: "沿着 orders.customer_id、order_items.order_id 和 order_items.product_id 逐层连接相关表。" },
},
{
id: 14, section: "basic", title: "找出没有销量的商品", knowledgePoint: "外连接", characterId: "warehouse",
    story: "库管秦川戴着劳保手套，叉着腰站在盘点单前直叹气：“有些商品挂了一年没动过，我怀疑压根没卖出过。把从没出现在订单明细里的商品给我找出来，商品编号和名称都列上，我看看要不要调陈列、下架。”他特别叮嘱，“商品别漏了，就算没销量的也得给我列出来。”你听到“没出现过的也要列出来”，隐约觉得这次和普通 JOIN 不太一样。",
    knowledge: "LEFT JOIN 会保留左表全部记录，右表匹配不到时字段为 NULL。",
    requirement: { goal: "查询没有出现在订单明细中的商品。", initialSql: "", expectedSql: "SELECT products.id, products.name FROM products LEFT JOIN order_items ON products.id = order_items.product_id WHERE order_items.id IS NULL;", hints: ["商品是需要完整保留的左表。", "用 IS NULL 找出没有匹配明细的商品。"], validationRules: [{ type: "requiredKeyword", keyword: "left join" }], solutionExplanation: "先保留所有 products，再筛选 order_items.id 为 NULL 的商品。" },
},
{
id: 15, section: "basic", title: "找出没有直属上级的员工", knowledgePoint: "自我外连接", characterId: "hr",
    story: "许宁拿着组织架构图又来了，这回她盯着一处：“谁是公司里'没有直属上级'的人？也就是组织树顶端的岗位。姓名、岗位列给我。”她认真地说，“我要核对汇报链条是不是完整。”你看了眼 employees 表，心下了然：没有上级的人，`manager_id` 是空的。",
    knowledge: "自连接也可以配合 NULL 判断查找没有上级的员工。",
    requirement: { goal: "查询没有直属上级的员工。", initialSql: "", expectedSql: "SELECT name, job_title FROM employees WHERE manager_id IS NULL;", hints: ["manager_id 为空代表没有直属上级。", "本题可以直接筛选 employees。"], validationRules: [{ type: "requiredKeyword", keyword: "is null" }], solutionExplanation: "manager_id 为 NULL 的员工位于组织关系顶层。" },
},
{
id: 16, section: "basic", title: "合并客户名单", knowledgePoint: "UNION", characterId: "support",
    story: "唐溪发来一份交接说明，字里行间透着赶时间：“下周要给所有客户做触达，普通客户和 VIP 客户的名单，要合并成一份姓名清单。”她又追了一条，“另外提醒你，同一个客户别出现两次。”你想了想：这两类客户都在 customers 表里，得按等级分成两组，再拼成一张名单。",
    knowledge: "UNION 会合并两个查询结果，并默认去除重复行。",
    requirement: { goal: "合并普通客户和 VIP 客户的姓名名单。", initialSql: "", expectedSql: "SELECT name FROM customers WHERE level = '普通' UNION SELECT name FROM customers WHERE level = 'VIP';", hints: ["UNION 两侧需要返回相同数量和兼容类型的字段。", "分别筛选两类客户。"], validationRules: [{ type: "requiredKeyword", keyword: "union" }], solutionExplanation: "两个 SELECT 都返回 name，再用 UNION 合并普通和 VIP 客户。" },
},
{
id: 17, section: "basic", title: "统计整体销售指标", knowledgePoint: "聚合函数", characterId: "boss",
    story: "临下班，沈总甩来一句话，言简意赅：“我就要三个数：这个月订单总共卖了多少钱、平均每单多少钱、最大的一单多少钱。三个数放一张结果里，别拆三张表。”你盯着订单表，第一次意识到：SUM、AVG、MAX 三个词，能一次把账算完。",
    knowledge: "SUM、AVG、MAX 等聚合函数可以把多行数据汇总成指标。",
    requirement: { goal: "统计订单总销售额、平均订单金额和最高订单金额。", initialSql: "", expectedSql: "SELECT SUM(total_amount) AS total_sales, AVG(total_amount) AS average_order, MAX(total_amount) AS max_order FROM orders;", hints: ["三个指标可以放在同一个 SELECT 中。", "使用 AS 为指标命名。"], validationRules: [{ type: "requiredKeyword", keyword: "sum" }], solutionExplanation: "SUM 计算总额，AVG 计算平均值，MAX 找到最大订单金额。" },
},
{
id: 18, section: "basic", title: "按城市统计订单", knowledgePoint: "GROUP BY", characterId: "sales",
    story: "周可铺开一张城市作战地图，标了几处红圈：“每个城市分别有多少订单？我不要所有订单的明细，只要按城市汇总出来的订单数量。”她顿了顿，“从'每一个订单'到'每一个城市'，这一步，你得帮我跨过去。”你在便签上写下一行字：分组，就是“按同一个城市把订单归堆”。",
    knowledge: "GROUP BY 会把相同分组字段的行聚合在一起。",
    requirement: { goal: "按城市统计订单数量。", initialSql: "", expectedSql: "SELECT city, COUNT(*) AS order_count FROM orders GROUP BY city ORDER BY city;", hints: ["SELECT 中的非聚合字段需要出现在 GROUP BY。", "COUNT(*) 统计每个城市的订单数。"], validationRules: [{ type: "requiredKeyword", keyword: "group by" }], solutionExplanation: "以 city 分组后，COUNT(*) 会分别统计每个城市的订单数量。" },
},
{
id: 19, section: "basic", title: "筛选订单较多城市", knowledgePoint: "GROUP BY + HAVING", characterId: "boss",
    story: "沈总看着你交上来的城市清单，摇了摇头：“城市太多，我没空一个个看。只保留订单数量超过 3 笔的重点城市，其他的不用报。”你想起 WHERE 筛的是“明细行”，而这个“超过 3 笔”是针对“统计结果”的——这次，得换一个词来写。",
    knowledge: "HAVING 用于筛选分组后的聚合结果，不能用 WHERE 替代。",
    requirement: { goal: "找出订单数量超过 3 笔的城市。", initialSql: "", expectedSql: "SELECT city, COUNT(*) AS order_count FROM orders GROUP BY city HAVING COUNT(*) > 3;", hints: ["先 GROUP BY city。", "聚合结果条件写在 HAVING。"], validationRules: [{ type: "requiredKeyword", keyword: "having" }], solutionExplanation: "WHERE 过滤明细行，HAVING 过滤分组后的 COUNT 结果。" },
},
{
id: 20, section: "basic", title: "找出高于平均金额订单", knowledgePoint: "单行子查询", characterId: "finance",
    story: "财务赵铭推了推眼镜，把报表往桌上一放：“老板想知道哪些订单'跑赢了平均水平'。先算出全体订单的平均金额，再找出金额比平均值高的订单，编号和金额列出来。”你盯着“先算平均、再比较”的顺序，隐约摸到一种新写法：一个查询的结果，可以塞进另一个查询当条件。",
    knowledge: "单行子查询可以先计算一个标量结果，再作为外层查询条件。",
    requirement: { goal: "查询金额高于平均订单金额的订单。", initialSql: "", expectedSql: "SELECT id, total_amount FROM orders WHERE total_amount > (SELECT AVG(total_amount) FROM orders);", hints: ["括号里的子查询返回一个平均金额。", "外层查询将订单金额与平均值比较。"], validationRules: [{ type: "requiredKeyword", keyword: "select" }], solutionExplanation: "子查询先得到平均金额，外层 WHERE 再筛选高于该平均值的订单。" },
},
{
id: 21, section: "basic", title: "新增员工记录", knowledgePoint: "插入单行", characterId: "hr",
    story: "许宁兴冲冲走进来，像是带来了什么好消息：“新人林晓今天入职数据部！工号 7，岗位数据实习生，7 月 1 号入职，直属上级是林予。”她眨眨眼，“快把她录进员工表——对了，这操作会在测试副本里跑，放心试。”你握着鼠标的手顿了顿：这还是你第一次，要往表里“写”数据，而不是“读”。",
    knowledge: "INSERT INTO 指定表和字段，VALUES 提供要插入的数据。",
    requirement: { goal: "新增一名数据部门员工。", initialSql: "", expectedSql: "INSERT INTO employees (id, name, department, job_title, hire_date, manager_id) VALUES (7, '林晓', '数据部', '数据实习生', '2026-07-01', 1);", hints: ["字段顺序必须和 VALUES 中的数据顺序一致。", "当前写操作只在任务副本中执行。"], validationRules: [{ type: "requiredKeyword", keyword: "insert" }], solutionExplanation: "INSERT INTO 列出目标字段，VALUES 按同样顺序提供新员工数据。" },
},
{
id: 22, section: "basic", title: "找出购买指定商品的客户", knowledgePoint: "多行子查询", characterId: "sales",
    story: "周可举着一副降噪耳机晃到你面前，一脸得意：“这个型号最近卖得不错，我要给买过的客户做一次回访。帮我查出所有买过降噪耳机（商品 4）的客户，编号和名称都要。”你看着耳机，意识到答案藏在“先找订单明细 → 再顺着订单找客户”的两步走里——而这一步，返回的可不止一个客户。",
    knowledge: "IN 配合子查询可以匹配子查询返回的多行结果。",
    requirement: { goal: "查询购买过 product_id 为 4 的商品的客户。", initialSql: "", expectedSql: "SELECT id, name FROM customers WHERE id IN (SELECT orders.customer_id FROM orders INNER JOIN order_items ON orders.id = order_items.order_id WHERE order_items.product_id = 4);", hints: ["子查询先找出符合条件的 customer_id。", "外层 customers 使用 IN 匹配多个客户编号。"], validationRules: [{ type: "requiredKeyword", keyword: "in" }], solutionExplanation: "子查询返回购买过指定商品的客户编号，外层再取出客户信息。" },
},
{
id: 23, section: "basic", title: "匹配相同城市和金额订单", knowledgePoint: "多列子查询", characterId: "mentor",
    story: "林予皱眉看着一份导出的 Excel，手指敲着桌面：“我怀疑有重复下单——同城市、同金额的订单，很可能是同一个客户拆成了两单。找出这些'城市 + 金额'组合重复出现的订单，订单编号给我，我核对一下。”你第一次意识到：判断重复的不是单个字段，而是“两个字段组成的组合”。",
    knowledge: "多列子查询可以用多个字段组成的组合进行匹配。",
    requirement: { goal: "查询城市和金额组合重复的订单。", initialSql: "", expectedSql: "SELECT id, city, total_amount FROM orders WHERE (city, total_amount) IN (SELECT city, total_amount FROM orders GROUP BY city, total_amount HAVING COUNT(*) > 1);", hints: ["括号中的字段顺序要和子查询保持一致。", "先按城市和金额分组，再筛选重复组合。"], validationRules: [{ type: "requiredKeyword", keyword: "group by" }], solutionExplanation: "子查询得到重复的城市/金额组合，外层用多列 IN 找回完整订单。" },
},
{
id: 24, section: "basic", title: "找出各城市最高金额订单", knowledgePoint: "相关子查询", characterId: "boss",
    story: "沈总想给经营周报配一组标杆数据：“每个城市挑一笔金额最高的订单给我。我想看看各个城市的'天花板'是哪一单，客户是谁、金额多少。”你意识到：这次每个城市的“标准”都不一样——筛选条件，得跟着“当前所在的城市”走。",
    knowledge: "相关子查询会引用外层查询当前行的字段。",
    requirement: { goal: "查询每个城市金额最高的订单。", initialSql: "", expectedSql: "SELECT id, city, total_amount FROM orders order_a WHERE total_amount = (SELECT MAX(total_amount) FROM orders order_b WHERE order_b.city = order_a.city);", hints: ["外层订单需要起别名。", "子查询用外层当前城市作为条件。"], validationRules: [{ type: "requiredKeyword", keyword: "select" }], solutionExplanation: "子查询针对外层当前城市计算最大金额，再保留金额等于该最大值的订单。" },
},
{
id: 25, section: "basic", title: "找出提交过工单的客户", knowledgePoint: "EXISTS", characterId: "support",
    story: "唐溪在整理重点跟进名单，语气难得严肃：“凡是在客服系统里提交过工单的客户，都要标记成重点跟进对象。帮我筛出这些客户，编号和名称给我。”你听出了关键词——“提交过”：只要存在过一条记录，就算数。",
    knowledge: "EXISTS 只关心子查询是否至少存在一行匹配记录。",
    requirement: { goal: "查询至少提交过一个客服工单的客户。", initialSql: "", expectedSql: "SELECT id, name FROM customers c WHERE EXISTS (SELECT 1 FROM support_tickets t WHERE t.customer_id = c.id);", hints: ["子查询只需要返回 1。", "用外层客户 id 与工单 customer_id 关联。"], validationRules: [{ type: "requiredKeyword", keyword: "exists" }], solutionExplanation: "对每个客户检查 support_tickets 中是否存在匹配记录。" },
},
{
id: 26, section: "basic", title: "展示客户订单数", knowledgePoint: "SELECT 中的子查询", characterId: "mentor",
    story: "林予提了个进阶需求，眼睛亮亮的：“我想在客户列表里，直接看到每位客户下了多少单——每行客户，后面跟着他的订单数量。能不能用一行 SQL 做到？”你想了想：这像是把“统计订单”这个动作，塞进“查询客户”的每一行里。",
    knowledge: "子查询可以作为 SELECT 列表中的一个计算字段。",
    requirement: { goal: "查询客户姓名和订单数量。", initialSql: "", expectedSql: "SELECT c.name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS order_count FROM customers c;", hints: ["子查询放在 SELECT 的字段位置。", "用客户 id 关联订单。"], validationRules: [{ type: "requiredKeyword", keyword: "count" }], solutionExplanation: "外层遍历客户，SELECT 中的相关子查询为每个客户单独统计订单数。" },
},
{
id: 27, section: "basic", title: "统计最近 30 天订单", knowledgePoint: "日期函数", characterId: "finance",
    story: "赵铭在核对本月经营数据，指着一行字说：“把最近 30 天产生的订单都拉出来——订单号、日期、金额，我看看这段时间的订单量走势。”他特意叮嘱，“日期条件记得用函数算，别手写死数，不然下个月你又要改。”你点头：把“30 天”写进公式，而不是写死某个日期。",
    knowledge: "SQLite 的 date 函数可以对日期文本进行加减和比较。",
    requirement: { goal: "查询最近 30 天内产生的订单。", initialSql: "", expectedSql: "SELECT id, order_date, total_amount FROM orders WHERE order_date >= date('2026-06-30', '-30 day');", hints: ["date 可以计算日期边界。", "日期条件放在 WHERE 中。"], validationRules: [{ type: "requiredKeyword", keyword: "date" }], solutionExplanation: "先用 date 计算 30 天前的日期，再筛选不早于该日期的订单。" },
},
{
id: 28, section: "basic", title: "创建高价值客户备份表", knowledgePoint: "创建表复制", characterId: "mentor",
    story: "月底，林予把你叫到白板前：“要做 VIP 客户专项活动，先把 VIP 客户快照复制成一张备份表 high_value_customers，别动原始数据。”他看着你，“创建完这张表就归你管了。”你第一次知道：SQL 不仅能查、能写，还能“从查询结果里，生出一张新表”。",
    knowledge: "CREATE TABLE AS SELECT 可以用查询结果创建新表。",
    requirement: { goal: "创建 high_value_customers 表，保存 VIP 客户。", initialSql: "", expectedSql: "CREATE TABLE high_value_customers AS SELECT * FROM customers WHERE level = 'VIP';", hints: ["CREATE TABLE 表名 AS 后面接 SELECT。", "写操作会在任务副本中执行。"], validationRules: [{ type: "requiredKeyword", keyword: "create table" }], solutionExplanation: "CREATE TABLE AS SELECT 会根据查询结果创建 high_value_customers 表。" },
},
{
id: 29, section: "basic", title: "批量录入新商品", knowledgePoint: "插入多行", characterId: "warehouse",
    story: "秦川搬着两个空纸箱进来，往地上一放：“刚到货两件新品——移动电源，数码配件，129 元；桌面灯，办公设备，89 元。商品编号是 7 和 8，一次把两件都录进商品表。”你在心里记下：这次是“一批”，不是“一条”。",
    knowledge: "INSERT 可以在 VALUES 中提供多组数据，一次插入多行。",
    requirement: { goal: "批量插入两件新商品。", initialSql: "", expectedSql: "INSERT INTO products (id, name, category, price) VALUES (7, '移动电源', '数码配件', 129), (8, '桌面灯', '办公设备', 89);", hints: ["每组 VALUES 代表一行。", "多组数据之间用逗号分隔。"], validationRules: [{ type: "requiredKeyword", keyword: "insert" }], solutionExplanation: "一条 INSERT 语句可以通过多组 VALUES 同时插入多件商品。" },
},
{
id: 30, section: "basic", title: "更新商品库存", knowledgePoint: "UPDATE", characterId: "warehouse",
    story: "秦川拿着盘点单冲进来，一脸着急：“人体工学椅——商品 2，这周大促清点完了，实际库存 20 件，系统里还写着 6 件。再不改就要超卖事故了！”他把盘点单拍在桌上，“帮我把它的库存改成 20，别的商品一个都别碰。”你盯着那个“只改一行”的强调，心里一紧：这是写操作里，最容易翻车的一步。",
    knowledge: "UPDATE 配合 SET 修改字段值，WHERE 决定修改哪些行。",
    requirement: { goal: "把 product_id 为 2 的库存更新为 20。", initialSql: "", expectedSql: "UPDATE inventory SET stock_quantity = 20 WHERE product_id = 2;", hints: ["SET 后写新值。", "UPDATE 一定要谨慎使用 WHERE。"], validationRules: [{ type: "requiredKeyword", keyword: "update" }], solutionExplanation: "UPDATE inventory 定位库存表，SET 修改库存值，WHERE 限定商品。" },
},
{
id: 31, section: "basic", title: "删除无效商品", knowledgePoint: "DELETE", characterId: "warehouse",
    story: "秦川指着墙角落灰的投影仪，语气里带着点痛快：“这台便携投影仪——商品 6，上架一年零销量，就是上次你帮我查出来的那个。今天办了永久下架，把它从商品表里删掉，留着看着心烦。”你想起上次用外连接查出它时，秦川那副“果然如此”的表情。这一次，轮到你和它告别了。",
    knowledge: "DELETE FROM 删除满足 WHERE 条件的数据行。",
    requirement: { goal: "删除 products 表中 id 为 6 的商品记录。", initialSql: "", expectedSql: "DELETE FROM products WHERE id = 6;", hints: ["DELETE FROM 后写目标表。", "先确认 WHERE 条件只命中目标行。"], validationRules: [{ type: "requiredKeyword", keyword: "delete" }], solutionExplanation: "DELETE FROM products 配合 id 条件，只删除指定商品。" },
},
{
id: 32, section: "basic", title: "清理重复客户", knowledgePoint: "去除重复", characterId: "mentor",
    story: "林予盯着屏幕皱眉，指着一处说：“系统导出的时候，把客户名单搞出了重复行。先查一遍不重复的'姓名 + 城市'组合，我看看脏数据有多严重。”你低头看了眼 customers 表，心说：看来去重，不仅要防订单，还得防客户。",
    knowledge: "DISTINCT 可以从查询结果中去除重复组合。",
    requirement: { goal: "查询不重复的客户姓名和城市组合。", initialSql: "", expectedSql: "SELECT DISTINCT name, city FROM customers;", hints: ["DISTINCT 放在 SELECT 后。", "多个字段会按组合去重。"], validationRules: [{ type: "requiredKeyword", keyword: "distinct" }], solutionExplanation: "DISTINCT 会按照 name 和 city 的组合去除重复结果。" },
},
{
id: 33, section: "basic", title: "补充缺失昵称", knowledgePoint: "IFNULL 函数", characterId: "support",
    story: "唐溪要导客服名单，特意叮嘱：“客户电话有的没填，导出来是空白的不好看，外呼系统还会报错。把空电话统一显示成'未填写'，其他照常，姓名和电话都给我。”你想起第 6 节那位手机号为空的客户——上次是你把她“找”出来，这次得把她“填”上。",
    knowledge: "IFNULL 可以把 NULL 替换成指定的默认值。",
    requirement: { goal: "查询客户姓名，并将缺失电话显示为“未填写”。", initialSql: "", expectedSql: "SELECT name, IFNULL(phone, '未填写') AS phone_display FROM customers;", hints: ["IFNULL 的第一个参数是要检查的字段。", "第二个参数是 NULL 时的替代值。"], validationRules: [{ type: "requiredKeyword", keyword: "ifnull" }], solutionExplanation: "IFNULL(phone, '未填写') 在 phone 为空时返回默认文本。" },
},
{
id: 34, section: "basic", title: "划分客户等级", knowledgePoint: "CASE 运算符", characterId: "boss",
    story: "沈总要给经营看板做分层，语气里带着挑剔：“客户等级这几个字，太冷冰冰了。把客户姓名带上，VIP 客户显示'重点客户'，其他显示'普通客户'——做成能直接贴到看板上的标签。”你懂了：这次的输出不是“查出来”，而是“翻译成人话”。",
    knowledge: "CASE 可以根据条件返回不同结果，类似 SQL 中的 if/else。",
    requirement: { goal: "将 VIP 客户显示为“重点客户”，其他客户显示为“普通客户”。", initialSql: "", expectedSql: "SELECT name, CASE WHEN level = 'VIP' THEN '重点客户' ELSE '普通客户' END AS customer_group FROM customers;", hints: ["CASE WHEN 写条件，THEN 写满足条件的结果。", "ELSE 覆盖其他情况，END 结束表达式。"], validationRules: [{ type: "requiredKeyword", keyword: "case" }], solutionExplanation: "CASE 根据 level 判断客户类型，并通过别名输出 customer_group。" },
},
);
const solutionExplanations: Record<number, string> = {
1: "SELECT 后列出任务需要展示的三个字段，FROM employees 指定数据来源。本题没有筛选条件，因此返回员工表中的所有员工。",
  2: "先从 employees 读取员工字段，再用 WHERE department = '数据部' 保留数据部门员工。",
  3: "WHERE 中用 total_amount >= 1000 筛选高金额订单，再用 AND status = 'completed' 限定订单状态。",
  4: "IN 用来匹配北京和上海两个城市，BETWEEN 用来限制订单金额范围，两个条件通过 AND 同时生效。",
  5: "LIKE '%科技%' 会匹配名称中任意位置包含“科技”的客户，前后的百分号代表可以存在其他字符。",
  6: "手机号为空不能使用 = NULL 判断，需要使用 phone IS NULL 检查缺失值。",
  7: "ORDER BY total_amount DESC 会按照订单金额从高到低排列结果，DESC 表示降序。",
  8: "先使用 ORDER BY total_amount DESC 找到金额最高的订单，再用 LIMIT 10 只保留前 10 行。",
  9: "COUNT(*) 统计 customers 表中的行数，AS customer_count 为统计结果设置易读的列名。",
  10: "INNER JOIN customers ON orders.customer_id = customers.id 按客户编号连接订单和客户，再选择订单编号、客户名称和金额。",
};

for (const chapter of chapters) {
  const explanation = solutionExplanations[chapter.id];
  if (explanation) {
    chapter.requirement.solutionExplanation = explanation;
  }
}




