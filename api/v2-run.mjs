import crypto from "node:crypto";
import { Redis } from "@upstash/redis";
import { initializeV2Run, publicV2Run } from "./v2-execution.mjs";
import { validV2RunId } from "./v2-decision-read.mjs";

const parse = (value, fallback = null) => {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};
const snapshot = objective => {
  const basis = { objective_id: objective.id, title: objective.title, constraints: objective.details || "" };
  return { ...basis, fingerprint: crypto.createHash("sha256").update(JSON.stringify(basis, Object.keys(basis).sort())).digest("hex") };
};

export async function publishV2Worker(targetUrl, payload, env = process.env, fetchImpl = fetch) {
  if (!env.QSTASH_TOKEN) throw new Error("Background execution is unavailable");
  const response = await fetchImpl(`https://qstash.upstash.io/v2/publish/${targetUrl}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.QSTASH_TOKEN}`, "Content-Type": "application/json", "Upstash-Retries": "2" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Background execution could not be scheduled");
  return response.json().catch(() => ({}));
}

export async function handleV2Run(req, res, redis, { enqueue = publishV2Worker, env = process.env } = {}) {
  if (req.method === "GET") {
    if (req.query?.history === "1") {
      const rows = parse(await redis.get("greenroom:v2_recent_runs"), []);
      return res.status(200).json({ status: "success", runs: rows.filter(row => row?.decision_available === true) });
    }
    const runId = Array.isArray(req.query?.run_id) ? req.query.run_id[0] : req.query?.run_id;
    if (!validV2RunId(runId)) return res.status(400).json({ detail: "Invalid run ID" });
    const safe = publicV2Run(parse(await redis.get(`greenroom:run_status:${runId}`)));
    return safe ? res.status(200).json(safe) : res.status(404).json({ detail: "V2 run not found" });
  }
  if (req.method !== "POST") return res.status(405).json({ detail: "Method not allowed" });
  const objectiveId = req.body?.objective_id;
  if (typeof objectiveId !== "string" || !/^obj_[A-Za-z0-9_-]{3,120}$/.test(objectiveId)) return res.status(422).json({ detail: "A valid saved objective ID is required" });
  const profile = parse(await redis.get("greenroom:creator_profile"), {});
  const objective = Array.isArray(profile.creator_objectives) ? profile.creator_objectives.find(item => item?.id === objectiveId) : null;
  if (!objective) return res.status(404).json({ detail: "Saved objective was not found" });
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const targetUrl = `${proto}://${host}/api/briefing-worker`;
  try {
    const run = await initializeV2Run({ redis, objective: snapshot(objective), targetUrl, enqueue: (url, payload) => enqueue(url, payload, env) });
    return res.status(202).json(run);
  } catch (error) {
    return res.status(error.statusCode || 503).json({ detail: error.message === "Import YouTube Studio analytics before starting a V2 check" ? error.message : "V2 run could not be started" });
  }
}

export default async function handler(req, res) {
  try {
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN });
    return await handleV2Run(req, res, redis);
  } catch { return res.status(503).json({ detail: "V2 run service unavailable" }); }
}
