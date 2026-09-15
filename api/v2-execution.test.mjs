import test from 'node:test';
import assert from 'node:assert/strict';
import { collectV2Run, creatorContextFromProduct, initializeV2Run, persistPublicV2Status, submitV2Run } from './v2-execution.mjs';

function store(seed = {}) {
  const values = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]));
  return { values, async get(key) { return values.get(key) ?? null; }, async set(key, value, options) { if (options?.nx && values.has(key)) return null; values.set(key, value); return 'OK'; }, async del(key) { return values.delete(key) ? 1 : 0; } };
}
const objective = { objective_id: 'obj_real', title: 'Watch for YouTube platform changes that affect my channel growth', constraints: 'Do not recommend increasing upload frequency.', fingerprint: 'abc123fingerprint' };
const signal = { signal_id: 'signal_import_view_momentum', type: 'VIEW_MOMENTUM', direction: 'STABLE', classification: 'STABLE', current_value: 100, comparison_value: 100, percentage_delta: 0, unit: 'COUNT', threshold_version: 'creator_signal_thresholds_v1', data_sufficiency: 'SUFFICIENT', uncertainty: null };
const evidence = { evidence_id: 'yt-1', provider_id: 'YOUTUBE_OFFICIAL_BLOG', source: 'YouTube Official Blog', title: 'YouTube Studio update for creators', summary: 'A supported creator analytics feature changed.', source_url: 'https://blog.youtube/news-and-events/example/', published_at: '2026-09-01T00:00:00.000Z', fingerprint: 'evidence-hash', category: 'PLATFORM_CHANGES' };
const validMind = () => ({ async getMind() { return { mindId: '8208493e-f36b-1410-8466-00039ce7df11', email: 'udophia@hellominds.ai', walletAddress: '0xB675Ec9857776678aE540cF3248d898f015987Cb', isEnabled: true }; }, async ensureConversation() {}, async getLatestHistoryFingerprint() { return 'before'; }, async sendMessage() { return { id: 'message' }; }, async waitForReply() { return { reply: validReply }; }, async getHistory() { return []; } });
const validReply = { alias: 'placeholder', fingerprint: 'reply-fingerprint', senderType: 0, senderId: '8208493e-f36b-1410-8466-00039ce7df11', senderEmail: 'udophia@hellominds.ai', messageText: "ATTENTION: KEEP_WATCHING\nWHAT I NOTICED:\nYouTube published a creator platform update.\nWHY THIS MATTERS TO YOU:\nIt may affect your growth workflow. [REF:creator_goal]\nWHAT I'D DO NEXT:\nNo workflow change for now.\nCONNECTION: POSSIBLE\nUNCERTAINTY:\nThe effect on this channel is not established." };
async function initialized(redis = store({ 'greenroom:v2_analytics:latest': { content_hash: 'analytics-hash', signals: [signal] }, 'greenroom:creator_profile': {} })) {
  const run = await initializeV2Run({ redis, objective, targetUrl: 'https://example.test/api/briefing-worker', enqueue: async () => ({ queue: { route: 'PRIMARY', primary_result: 'ACCEPTED', fallback_result: 'NOT_NEEDED', publication_accepted: true } }) });
  return { redis, run };
}
async function waiting() {
  const state = await initialized(); const mindsClient = validMind();
  await submitV2Run({ ...state, runId: state.run.run_id, objective, mindsClient, targetUrl: 'https://example.test/api/briefing-worker', enqueueCollection: async () => {}, fetchEvidence: async () => ({ evidence: [evidence] }) });
  validReply.alias = `greenroom-${state.run.run_id}`;
  return { ...state, mindsClient };
}

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

test('missing and invalid analytics become bounded persisted terminal failures', async () => {
  const missing = await initializeV2Run({ redis: store({ 'greenroom:creator_profile': {} }), objective, targetUrl: 'https://example.test', enqueue: async () => {} });
  assert.equal(missing.failure_category, 'ANALYTICS_NOT_FOUND'); assert.equal(missing.execution_stage, 'LOADING_ANALYTICS');
  const invalid = await initializeV2Run({ redis: store({ 'greenroom:v2_analytics:latest': { content_hash: null, signals: 'bad' }, 'greenroom:creator_profile': {} }), objective, targetUrl: 'https://example.test', enqueue: async () => {} });
  assert.equal(invalid.failure_category, 'ANALYTICS_INVALID'); assert.equal(invalid.execution_stage, 'LOADING_ANALYTICS');
});

test('invalid creator context becomes a bounded persisted failure', async () => {
  const result = await initializeV2Run({ redis: store({ 'greenroom:v2_analytics:latest': { content_hash: 'hash', signals: [] }, 'greenroom:creator_profile': {} }), objective: { ...objective, fingerprint: null }, targetUrl: 'https://example.test', enqueue: async () => {} });
  assert.equal(result.failure_category, 'CREATOR_CONTEXT_INVALID'); assert.equal(result.execution_stage, 'PREPARING');
});

test('missing run is classified before any downstream execution', async () => {
  await assert.rejects(() => submitV2Run({ redis: store(), runId: 'run_v2_missing', objective, mindsClient: null }), error => error.v2_category === 'RUN_NOT_FOUND' && error.v2_stage === 'WORKER_STARTED');
});

test('signal computation and evidence failures persist their exact bounded stages', async () => {
  const first = await initialized();
  const signalFailure = await submitV2Run({ ...first, runId: first.run.run_id, objective, mindsClient: validMind(), fetchEvidence: async () => ({ evidence: [evidence] }), selectSignals: () => { throw new Error('private signal data'); } });
  assert.equal(signalFailure.body.failure_category, 'SIGNAL_COMPUTATION_FAILED'); assert.equal(signalFailure.body.execution_stage, 'SELECTING_SIGNALS');
  const second = await initialized();
  const evidenceFailure = await submitV2Run({ ...second, runId: second.run.run_id, objective, mindsClient: validMind(), fetchEvidence: async () => { throw new Error('private provider URL'); } });
  assert.equal(evidenceFailure.body.failure_category, 'EVIDENCE_UNAVAILABLE'); assert.equal(evidenceFailure.body.execution_stage, 'RETRIEVING_EVIDENCE');
});

test('Mind configuration, identity, and submission failures are distinct and never retry', async () => {
  const config = await initialized();
  const configResult = await submitV2Run({ ...config, runId: config.run.run_id, objective, mindsClient: null, fetchEvidence: async () => ({ evidence: [evidence] }) });
  assert.equal(configResult.body.failure_category, 'MIND_CONFIGURATION_FAILED');
  const identity = await initialized(); const wrongMind = validMind(); wrongMind.getMind = async () => ({ mindId: 'wrong' });
  const identityResult = await submitV2Run({ ...identity, runId: identity.run.run_id, objective, mindsClient: wrongMind, fetchEvidence: async () => ({ evidence: [evidence] }) });
  assert.equal(identityResult.body.failure_category, 'MIND_IDENTITY_FAILED');
  const submission = await initialized(); const brokenMind = validMind(); let sends = 0; brokenMind.sendMessage = async () => { sends += 1; throw new Error('transport secret'); };
  const submissionResult = await submitV2Run({ ...submission, runId: submission.run.run_id, objective, mindsClient: brokenMind, fetchEvidence: async () => ({ evidence: [evidence] }) });
  assert.equal(submissionResult.body.failure_category, 'MIND_SUBMISSION_FAILED'); assert.equal(sends, 1);
});

test('Mind timeout retains TIMED_OUT semantics with a non-null bounded category', async () => {
  const state = await waiting(); const statusKey = `greenroom:run_status:${state.run.run_id}`;
  const status = JSON.parse(state.redis.values.get(statusKey)); status.reply_deadline_at = '2020-01-01T00:00:00.000Z'; state.redis.values.set(statusKey, JSON.stringify(status));
  const result = await collectV2Run({ ...state, runId: state.run.run_id, objective, now: new Date('2026-01-01T00:00:00.000Z'), enqueueCollection: async () => {} });
  assert.equal(result.body.status, 'TIMED_OUT'); assert.equal(result.body.failure_category, 'MIND_TIMEOUT'); assert.equal(result.body.execution_stage, 'WAITING_FOR_REPLY');
});

test('invalid reconstructed replies, parser rejection, and action rejection are distinct', async () => {
  const invalid = await waiting();
  const invalidResult = await collectV2Run({ ...invalid, runId: invalid.run.run_id, objective, enqueueCollection: async () => {}, normalizeReply: () => { throw new Error('raw reply'); } });
  assert.equal(invalidResult.body.failure_category, 'MIND_REPLY_INVALID');
  const parser = await waiting();
  const parserResult = await collectV2Run({ ...parser, runId: parser.run.run_id, objective, enqueueCollection: async () => {}, finalizeDecision: async () => { throw new Error('V2 Mind response must contain exactly the six required sections in order'); } });
  assert.equal(parserResult.body.status, 'REJECTED'); assert.equal(parserResult.body.failure_category, 'DECISION_PARSE_REJECTED');
  const action = await waiting();
  const actionResult = await collectV2Run({ ...action, runId: action.run.run_id, objective, enqueueCollection: async () => {}, finalizeDecision: async () => { throw new Error('V2 action violates a supplied upload-frequency constraint'); } });
  assert.equal(actionResult.body.status, 'REJECTED'); assert.equal(actionResult.body.failure_category, 'ACTION_QUALITY_REJECTED');
});

test('decision persistence failure is bounded and public status contains no private payloads', async () => {
  const state = await waiting();
  const result = await collectV2Run({ ...state, runId: state.run.run_id, objective, enqueueCollection: async () => {}, finalizeDecision: async () => { throw new Error('redis://secret raw prompt raw reply'); } });
  assert.equal(result.body.failure_category, 'DECISION_PERSISTENCE_FAILED'); assert.equal(result.body.execution_stage, 'PERSISTING_DECISION');
  const serialized = JSON.stringify(result.body);
  assert.doesNotMatch(serialized, /redis|secret|prompt|reply|analytics-hash/i);
  for (const field of ['run_id', 'status', 'execution_stage', 'failure_category', 'created_at', 'updated_at']) assert.ok(result.body[field]);
});

test('terminal V2 failure persistence rejects a null category or stage', async () => {
  const redis = store({ 'greenroom:v2_recent_runs': [] });
  await assert.rejects(() => persistPublicV2Status(redis, { pipeline: 'V2', run_id: 'run_v2_invariant', status: 'FAILED', created_at: 'now', updated_at: 'now', failure_category: null, execution_stage: 'WORKER_STARTED' }), /requires a category and execution stage/);
  await assert.rejects(() => persistPublicV2Status(redis, { pipeline: 'V2', run_id: 'run_v2_invariant', status: 'REJECTED', created_at: 'now', updated_at: 'now', failure_category: 'DECISION_PARSE_REJECTED', execution_stage: null }), /requires a category and execution stage/);
});
