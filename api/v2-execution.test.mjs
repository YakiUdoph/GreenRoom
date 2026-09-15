import test from 'node:test';
import assert from 'node:assert/strict';
import { collectV2Run, creatorContextFromProduct, initializeV2Run, submitV2Run } from './v2-execution.mjs';

function store(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]));
  return { values, async get(key) { return values.get(key) ?? null; }, async set(key, value, options) { if (options?.nx && values.has(key)) return null; values.set(key, value); return 'OK'; }, async del(key) { return values.delete(key) ? 1 : 0; } };
}
const objective = { objective_id: 'obj_real', title: 'Watch for YouTube platform changes that affect my channel growth', constraints: 'Do not recommend increasing upload frequency.', fingerprint: 'abc123fingerprint' };
const signal = { signal_id: 'signal_import_view_momentum', type: 'VIEW_MOMENTUM', direction: 'STABLE', classification: 'STABLE', current_value: 100, comparison_value: 100, percentage_delta: 0, unit: 'COUNT', threshold_version: 'creator_signal_thresholds_v1', data_sufficiency: 'SUFFICIENT', uncertainty: null };
const evidence = { evidence_id: 'yt-1', provider_id: 'YOUTUBE_OFFICIAL_BLOG', source: 'YouTube Official Blog', title: 'YouTube Studio update for creators', summary: 'A supported creator analytics feature changed.', source_url: 'https://blog.youtube/news-and-events/example/', published_at: '2026-09-01T00:00:00.000Z', fingerprint: 'evidence-hash', category: 'PLATFORM_CHANGES' };

test('normal V2 start generates and persists its authoritative ID before queueing without raw CSV', async () => {
  const redis = store({ 'greenroom:v2_analytics:latest': { content_hash: 'analytics-hash', signals: [signal], raw_csv: 'private' }, 'greenroom:creator_profile': { creator_supplied_fields: { preferred_tone: { provenance: 'CREATOR_SUPPLIED' } }, preferred_tone: 'Practical' } });
  let queued;
  const run = await initializeV2Run({ redis, objective, targetUrl: 'https://example.test/api/briefing-worker', enqueue: async (_url, payload) => { queued = payload; } });
  assert.match(run.run_id, /^run_v2_[a-f0-9]{32}$/);
  assert.equal(queued.run_id, run.run_id);
  assert.equal(JSON.parse(redis.values.get(`greenroom:v2_input:${run.run_id}`)).raw_csv, undefined);
});

test('duplicate V2 worker delivery submits to verified Udophia exactly once', async () => {
  const redis = store({ 'greenroom:v2_analytics:latest': { content_hash: 'analytics-hash', signals: [signal] }, 'greenroom:creator_profile': {} });
  const run = await initializeV2Run({ redis, objective, targetUrl: 'https://example.test/api/briefing-worker', enqueue: async () => {} });
  let sends = 0;
  const mindsClient = { async getMind() { return { mindId: '8208493e-f36b-1410-8466-00039ce7df11', email: 'udophia@hellominds.ai', walletAddress: '0xB675Ec9857776678aE540cF3248d898f015987Cb', isEnabled: true }; }, async ensureConversation() { return {}; }, async getLatestHistoryFingerprint() { return 'before'; }, async sendMessage() { sends += 1; return { id: 'message' }; } };
  const args = { redis, mindsClient, runId: run.run_id, objective, targetUrl: 'https://example.test/api/briefing-worker', enqueueCollection: async () => {}, fetchEvidence: async () => ({ evidence: [evidence] }) };
  await submitV2Run(args); await submitV2Run(args);
  assert.equal(sends, 1);
  assert.equal(JSON.stringify(JSON.parse(redis.values.get(`greenroom:v2_input:${run.run_id}`))).includes('raw_csv'), false);
});

test('legacy seeded profile values never become creator-supplied V2 context', () => {
  const context = creatorContextFromProduct({ profile: { preferred_tone: 'Seeded tone', rejected_topics: ['Seeded constraint'], v2_creator_context_input: { preferred_tone: 'Actually supplied', content_not_wanted: ['Supplied constraint'] } }, objective });
  assert.deepEqual(context.creator_supplied_preferences.map(item => item.value), ['Actually supplied']);
  assert.equal(context.constraints.some(item => item.value === 'Seeded constraint'), false);
  assert.equal(context.constraints.some(item => item.value === 'Supplied constraint'), true);
});

test('queue failure retains and returns the authoritative failed run ID', async () => {
  const redis = store({ 'greenroom:v2_analytics:latest': { content_hash: 'analytics-hash', signals: [] }, 'greenroom:creator_profile': {} });
  const run = await initializeV2Run({ redis, objective, targetUrl: 'https://example.test/api/briefing-worker', enqueue: async () => { throw new Error('regional queue mismatch'); } });
  assert.match(run.run_id, /^run_v2_/); assert.equal(run.status, 'FAILED'); assert.equal(run.failure_category, 'QUEUE_UNAVAILABLE');
});

test('normal mocked path persists only a strictly accepted decision under the exact run ID', async () => {
  const redis = store({ 'greenroom:v2_analytics:latest': { content_hash: 'analytics-hash', signals: [signal] }, 'greenroom:creator_profile': {} });
  const run = await initializeV2Run({ redis, objective, targetUrl: 'https://example.test/api/briefing-worker', enqueue: async () => {} });
  const reply = { alias: `greenroom-${run.run_id}`, fingerprint: 'reply-fingerprint', senderType: 0, senderId: '8208493e-f36b-1410-8466-00039ce7df11', senderEmail: 'udophia@hellominds.ai', messageText: "ATTENTION: KEEP_WATCHING\nWHAT I NOTICED:\nYouTube published a creator platform update.\nWHY THIS MATTERS TO YOU:\nIt may affect your growth workflow. [REF:creator_goal]\nWHAT I'D DO NEXT:\nNo workflow change for now.\nCONNECTION: POSSIBLE\nUNCERTAINTY:\nThe effect on this channel is not established." };
  const mindsClient = { async getMind() { return { mindId: '8208493e-f36b-1410-8466-00039ce7df11', email: 'udophia@hellominds.ai', walletAddress: '0xB675Ec9857776678aE540cF3248d898f015987Cb', isEnabled: true }; }, async ensureConversation() { return {}; }, async getLatestHistoryFingerprint() { return 'before'; }, async sendMessage() { return { id: 'message' }; }, async waitForReply() { return { reply }; }, async getHistory() { return []; } };
  const shared = { redis, mindsClient, runId: run.run_id, objective, targetUrl: 'https://example.test/api/briefing-worker', enqueueCollection: async () => {} };
  await submitV2Run({ ...shared, fetchEvidence: async () => ({ evidence: [evidence] }) });
  const result = await collectV2Run(shared);
  assert.equal(result.body.run_id, run.run_id); assert.equal(result.body.decision_available, true);
  const decision = JSON.parse(redis.values.get(`greenroom:v2_decision:${run.run_id}`));
  assert.equal(decision.run_id, run.run_id); assert.equal(decision.decision.what_id_do_next, 'No workflow change for now.');
  assert.equal(redis.values.has(`greenroom:v2_diagnostic:${run.run_id}`), false);
});
