// Vite 进度持久化插件（零依赖）。
// 在 dev / preview 的同来源下提供 /api/progress 接口，把学习进度写入本地 JSON 文件。
// 这样进度不再只存在浏览器 localStorage（与来源/origin 绑定，换端口或换预览地址会“丢失”），
// 而是落盘到文件，任何重启、换端口、换预览地址都能恢复。
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import console from "node:console";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, ".progress-data");
const MODE_FILE = join(DATA_DIR, "selected-mode.json");
const ALLOWED_MODES = new Set(["official", "demo"]);

function filePathFor(mode) {
  return join(DATA_DIR, `progress-${mode}.json`);
}

async function readProgress(mode) {
  const file = filePathFor(mode);
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeProgress(mode, payload) {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  await writeFile(filePathFor(mode), JSON.stringify(payload, null, 2), "utf8");
}

async function readMode() {
  if (!existsSync(MODE_FILE)) return null;
  return JSON.parse(await readFile(MODE_FILE, "utf8"));
}

async function writeMode(mode) {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  await writeFile(MODE_FILE, JSON.stringify(mode), "utf8");
}

function makeMiddleware() {
  return async (req, res, next) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/api/mode") {
      if (req.method === "GET") {
        try {
          const data = await readMode();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (err) {
          console.error("[progress-plugin] mode read failed:", err);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end("null");
        }
        return;
      }

      if (req.method === "POST") {
        let raw = "";
        req.on("data", (chunk) => {
          raw += chunk;
          if (raw.length > 1024 * 1024) req.destroy();
        });
        req.on("end", async () => {
          try {
            const payload = JSON.parse(raw);
            if (!ALLOWED_MODES.has(payload?.mode)) {
              throw new Error("invalid mode");
            }
            await writeMode(payload.mode);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            console.error("[progress-plugin] mode write failed:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "write failed" }));
          }
        });
        return;
      }
    }

    if (!url.pathname.startsWith("/api/progress")) return next();

    const mode = url.searchParams.get("mode");
    if (!ALLOWED_MODES.has(mode)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "invalid mode" }));
      return;
    }

    if (req.method === "GET") {
      try {
        const data = await readProgress(mode);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data ?? null));
      } catch (err) {
        console.error("[progress-plugin] read failed:", err);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end("null");
      }
      return;
    }

    if (req.method === "POST") {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk;
        if (raw.length > 5 * 1024 * 1024) req.destroy();
      });
      req.on("end", async () => {
        try {
          const payload = JSON.parse(raw);
          await writeProgress(mode, payload);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch (err) {
          console.error("[progress-plugin] write failed:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "write failed" }));
        }
      });
      return;
    }

    next();
  };
}

export function progressPersistence() {
  return {
    name: "progress-persistence",
    configureServer(server) {
      server.middlewares.use(makeMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(makeMiddleware());
    },
  };
}


