import test from 'node:test';
import assert from 'node:assert/strict';
import { handleV2Run, publishV2Worker } from './v2-run.mjs';

const response = () => ({ code: null, body: null, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
function store(seed = {}) { const values = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)])); return { values, async get(key) { return values.get(key) ?? null; }, async set(key, value, options) { if (options?.nx && values.has(key)) return null; values.set(key, value); return 'OK'; } }; }

test('POST resolves a real saved objective and returns the persisted server run ID', async () => {
  const redis = store({ 'greenroom:creator_profile': { creator_objectives: [{ id: 'obj_123', title: 'Watch YouTube platform changes', details: '' }] }, 'greenroom:v2_analytics:latest': { content_hash: 'analytics-hash', signals: [] } });
  const res = response(); let queued;
  await handleV2Run({ method: 'POST', body: { objective_id: 'obj_123' }, headers: { host: 'example.test' } }, res, redis, { enqueue: async (_url, payload) => { queued = payload; }, env: {} });
  assert.equal(res.code, 202); assert.equal(res.body.run_id, queued.run_id); assert.match(res.body.run_id, /^run_v2_[a-f0-9]{32}$/);
  assert.equal(JSON.parse(redis.values.get(`greenroom:run_status:${res.body.run_id}`)).status, 'PREPARED');
});

test('GET exposes only safe lifecycle state and never guesses another run', async () => {
  const runId = 'run_v2_123456abcdef'; const redis = store({ [`greenroom:run_status:${runId}`]: { pipeline: 'V2', run_id: runId, status: 'WAITING_FOR_MINDS', created_at: 'now', updated_at: 'now', prompt_hash: 'private', analytics_import_hash: 'private' } });
  const res = response(); await handleV2Run({ method: 'GET', query: { run_id: runId } }, res, redis);
  assert.equal(res.code, 200); assert.deepEqual(Object.keys(res.body), ['run_id', 'status', 'decision_available', 'created_at', 'updated_at', 'completed_at', 'failure_category', 'execution_stage', 'queue']); assert.equal(JSON.stringify(res.body).includes('private'), false);
  const missing = response(); await handleV2Run({ method: 'GET', query: { run_id: 'run_v2_missing999' } }, missing, redis); assert.equal(missing.code, 404);
});

test('history returns accepted decisions only', async () => {
  const redis = store({ 'greenroom:v2_recent_runs': [{ run_id: 'run_v2_yes123', decision_available: true }, { run_id: 'run_v2_no1234', decision_available: false }] });
  const res = response(); await handleV2Run({ method: 'GET', query: { history: '1' } }, res, redis); assert.deepEqual(res.body.runs.map(item => item.run_id), ['run_v2_yes123']);
});

test('primary QStash success suppresses fallback and records one accepted publication', async () => {
  const calls = []; const result = await publishV2Worker('https://example.test/api/briefing-worker', { run_id: 'run_v2_123' }, { QSTASH_TOKEN: 'configured', QSTASH_URL: 'https://primary.example' }, async url => { calls.push(url); return { ok: true, async json() { return { messageId: 'one' }; } }; });
  assert.equal(calls.length, 1); assert.equal(result.queue.route, 'PRIMARY'); assert.equal(result.queue.accepted_publication_count, 1); assert.equal(result.queue.fallback_result, 'NOT_NEEDED');
});

test('primary regional failure uses one fallback without duplicating a successful publish', async () => {
  const calls = []; const fetchImpl = async url => { calls.push(url); return calls.length === 1 ? { ok: false, status: 404, async text() { return 'not found in this region'; } } : { ok: true, async json() { return { messageId: 'one' }; } }; };
  const result = await publishV2Worker('https://example.test/api/briefing-worker', { run_id: 'run_v2_123' }, { QSTASH_TOKEN: 'configured', QSTASH_URL: 'https://qstash.upstash.io' }, fetchImpl);
  assert.equal(result.messageId, 'one'); assert.equal(calls.length, 2); assert.equal(result.queue.route, 'REGIONAL_FALLBACK'); assert.equal(result.queue.accepted_publication_count, 1);
});

test('primary and every bounded regional route failing records no accepted publication', async () => {
  let calls = 0;
  await assert.rejects(() => publishV2Worker('https://example.test/api/briefing-worker', { run_id: 'run_v2_123' }, { QSTASH_TOKEN: 'configured', QSTASH_URL: 'https://primary.example' }, async () => { calls += 1; return { ok: false, status: 404, async text() { return 'not found in this region'; } }; }), error => {
    assert.equal(error.v2_category, 'QUEUE_UNAVAILABLE'); assert.equal(error.queue.publication_accepted, false); return true;
  });
  assert.equal(calls, 5);
});
