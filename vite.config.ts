import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error The local Vite plugin is JavaScript and has no emitted declaration.
import { progressPersistence } from "./vite-progress-plugin.mjs";

export default defineConfig({
  plugins: [react(), progressPersistence()],
  server: {
    // 固定端口，避免重启后端口变化导致 localStorage 来源变化而“丢失”进度。
    port: 5173,
    host: true,
  },
});
