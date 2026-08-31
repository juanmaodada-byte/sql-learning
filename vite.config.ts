import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error The local Vite plugin is JavaScript and has no emitted declaration.
import { progressPersistence } from "./vite-progress-plugin.mjs";

export default defineConfig({
  // GitHub Pages 部署在 /sql-learning/ 子路径下；Vercel / 本地预览部署在根路径。
  // 通过构建环境变量 VITE_BASE 指定（GitHub Pages workflow 传入 /sql-learning/），默认 "/"。
  base: process.env.VITE_BASE || "/",
  plugins: [react(), progressPersistence()],
  server: {
    // 固定端口，避免重启后端口变化导致 localStorage 来源变化而“丢失”进度。
    port: 5173,
    host: true,
  },
});
