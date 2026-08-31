declare module "./vite-progress-plugin.mjs" {
  import type { Plugin } from "vite";

  export function progressPersistence(): Plugin;
}
