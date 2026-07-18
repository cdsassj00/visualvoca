import { Hono } from "hono";
import { cors } from "hono/cors";

import type { Env } from "./env";
import vocab from "./vocab";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/api/healthz", (c) => c.json({ status: "ok" }));

// 인증: 앱이 보내는 Bearer 토큰(APP_TOKEN 시크릿)과 대조.
// 공개 배포 시 엔드포인트가 열려 있으면 OpenAI 비용이 무한정 발생할 수 있다.
app.use("/api/vocab/*", async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!c.env.APP_TOKEN || token !== c.env.APP_TOKEN) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});

// 일일 스캔 한도: 비전 분석(/analyze)만 과금이 크므로 스캔 횟수만 센다.
// KV는 원자적이지 않아 경계에서 1-2회 초과될 수 있지만 소프트 한도로 충분하다.
app.use("/api/vocab/analyze", async (c, next) => {
  const limit = Number.parseInt(c.env.FREE_DAILY_SCANS, 10);
  if (!Number.isFinite(limit) || limit <= 0) {
    return next();
  }

  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const key = `scan:${ip}:${day}`;

  const current = Number.parseInt((await c.env.USAGE_KV.get(key)) ?? "0", 10);
  if (current >= limit) {
    return c.json(
      { error: "DAILY_LIMIT_REACHED", message: "오늘의 무료 스캔 횟수를 모두 사용했어요." },
      429,
    );
  }

  await c.env.USAGE_KV.put(key, String(current + 1), { expirationTtl: 60 * 60 * 48 });
  return next();
});

app.route("/api", vocab);

export default app;
