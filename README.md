# SQL Learning

一个面向 SQL 初学者的交互式学习项目。通过章节地图、故事任务、SQL 编辑器和即时反馈，帮助学习者逐步掌握常用 SQL 查询。

## 功能

- 按章节组织学习内容
- 在任务场景中编写并执行 SQL
- 查看表结构和查询结果
- 获得即时的任务校验与反馈
- 记录和查看学习进度

## 本地运行

环境要求：Node.js 18 或更高版本，以及 npm。

```bash
git clone https://github.com/juanmaodada-byte/sql-learning.git
cd sql-learning
npm install
npm run dev
```

启动后，在浏览器打开终端显示的地址，通常是 `http://localhost:5173`。

## 常用命令

```bash
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run lint      # 检查代码
npm run preview   # 预览生产构建
```

## 在线部署

GitHub 用于托管源码，不能直接运行 Vite 项目。可以使用 Vercel 或 Netlify 部署：

1. 导入仓库 `juanmaodada-byte/sql-learning`。
2. 构建命令填写 `npm run build`。
3. 输出目录填写 `dist`。
4. 完成部署后，使用平台生成的 URL 访问项目。

## 项目结构

```text
src/
├── app/           应用入口与路由
├── components/    通用界面组件
├── data/          章节、任务、角色和数据库数据
├── engine/        SQL 执行与答案校验逻辑
├── pages/         页面组件
├── state/         学习进度状态
└── styles/        全局样式
```

## 技术栈

- React
- TypeScript
- Vite
- CSS

## 本地开发文档

以下文档仅保留在本地，不上传到 GitHub：

- `chapter-stories.md`
- `development-plan.md`
- `product-plan.md`

## License

暂未指定许可证。
