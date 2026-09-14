import { Redis } from '@upstash/redis';

const RUN_ID = /^run[_-][A-Za-z0-9_-]{6,120}$/;
const string = value => typeof value === 'string' ? value : null;

export function publicV2Decision(record) {
  if (!record || record.schema_version !== 'greenroom_v2_decision_v1' || !record.run_id || !record.decision) return null;
  const decision = record.decision;
  if (!['ACT_NOW', 'KEEP_WATCHING', 'IGNORE_FOR_NOW'].includes(decision.attention_verdict)) return null;
  return {
    schema_version: record.schema_version,
    run_id: record.run_id,
    completed_at: string(record.completed_at),
    decision: {
      attention_verdict: decision.attention_verdict,
      what_i_noticed: string(decision.what_i_noticed),
      why_this_matters_to_you: string(decision.why_this_matters_to_you),
      what_id_do_next: string(decision.what_id_do_next),
      connection: ['CLEAR', 'POSSIBLE', 'NONE'].includes(decision.connection) ? decision.connection : null,
      uncertainty: string(decision.uncertainty),
    },
  };
}

export function validV2RunId(value) { return typeof value === 'string' && RUN_ID.test(value); }

export async function handleV2DecisionRead(req, res, redis) {
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Method not allowed' });
  const runId = Array.isArray(req.query?.run_id) ? req.query.run_id[0] : req.query?.run_id;
  if (!validV2RunId(runId)) return res.status(400).json({ detail: 'Invalid run ID' });
  const stored = await redis.get(`greenroom:v2_decision:${runId}`);
  const record = typeof stored === 'string' ? JSON.parse(stored) : stored;
  const safe = publicV2Decision(record);
  if (!safe) return res.status(404).json({ detail: 'Decision not found' });
  return res.status(200).json(safe);
}

export default async function handler(req, res) {
  try {
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN });
    return await handleV2DecisionRead(req, res, redis);
  } catch { return res.status(503).json({ detail: 'Decision lookup unavailable' }); }
}
