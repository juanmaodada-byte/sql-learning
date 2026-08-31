declare module "*.mjs" {
  import type { Plugin } from "vite";

  export function progressPersistence(): Plugin;
}
