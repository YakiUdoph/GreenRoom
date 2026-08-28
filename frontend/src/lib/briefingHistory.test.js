import test from 'node:test';
import assert from 'node:assert/strict';
import { completedHistoryRuns, creatorResultHeadline, currentIntelligence, isLiveBriefing, isSimulatedBriefing, recentHistoryRuns, verifyHistoricalBriefing, verifyHistoricalRunRecord } from './briefingHistory.js';

const historical = { run_id: 'run_history', objective_id: 'obj_history', items: [{ what_changed: 'A', why_it_matters: 'B', recommended_action: 'C' }] };
const current = { run_id: 'run_current', objective_id: 'obj_current', items: [] };
const record = { run_id: 'run_history', objective_id: 'obj_history', objective_fingerprint: 'fp_history', status: 'COMPLETED' };
const status = { status: 'COMPLETED', objective_snapshot: { objective_id: 'obj_history', title: 'Creator workflow', fingerprint: 'fp_history' } };
const response = { briefing: { ...historical, objective_snapshot: { fingerprint: 'fp_history' } }, objective_snapshot: status.objective_snapshot };

test('current pending run cannot display historical briefing as current', () => {
  assert.equal(currentIntelligence({ latest_offline_run: { run_id: 'run_current', objective_id: 'obj_current', status: 'WAITING_FOR_MINDS' }, latest_briefing: historical }).currentBriefing, null);
});

test('live WORKING state remains pending and cannot display stale intelligence', () => {
  const result = currentIntelligence({ latest_offline_run: { run_id: 'run_live', status: 'WORKING', objective_id: 'obj_current' }, latest_briefing: historical });
  assert.equal(result.status, 'WORKING');
  assert.equal(result.currentBriefing, null);
});

test('current failed run cannot display historical briefing as current', () => {
  assert.equal(currentIntelligence({ latest_offline_run: { run_id: 'run_current', objective_id: 'obj_current', status: 'FAILED' }, latest_briefing: historical }).currentBriefing, null);
});

test('current completed run displays only its matching briefing', () => {
  assert.equal(currentIntelligence({ latest_offline_run: { run_id: 'run_current', objective_id: 'obj_current', status: 'COMPLETED' }, latest_briefing: current }).currentBriefing, current);
});

test('current completed run rejects a mismatched objective fingerprint', () => {
  const run = { run_id: 'run_current', objective_id: 'obj_current', objective_fingerprint: 'expected', status: 'COMPLETED' };
  const briefing = { ...current, objective_snapshot: { fingerprint: 'different' } };
  assert.equal(currentIntelligence({ latest_offline_run: run, latest_briefing: briefing }).currentBriefing, null);
});

test('historical selection verifies an explicit historical run ID', () => {
  assert.equal(verifyHistoricalBriefing(record, status, response).briefing.run_id, 'run_history');
});

test('historical briefing remains a separate returned value', () => {
  const selected = verifyHistoricalBriefing(record, status, response);
  assert.notEqual(selected.briefing, current);
});

test('historical verification does not mutate current run', () => {
  const run = Object.freeze({ run_id: 'run_current', status: 'WORKING' });
  verifyHistoricalBriefing(record, status, response);
  assert.deepEqual(run, { run_id: 'run_current', status: 'WORKING' });
});

test('historical verification does not mutate objective', () => {
  const objective = Object.freeze({ id: 'obj_current', title: 'Current objective' });
  verifyHistoricalBriefing(record, status, response);
  assert.equal(objective.title, 'Current objective');
});

test('historical verification does not mutate latest briefing', () => {
  const latest = structuredClone(current);
  verifyHistoricalBriefing(record, status, response);
  assert.deepEqual(latest, current);
});

test('historical run mismatch is rejected', () => {
  assert.throws(() => verifyHistoricalBriefing({ ...record, run_id: 'run_other' }, status, response), /binding mismatch/);
});

test('historical objective mismatch is rejected', () => {
  assert.throws(() => verifyHistoricalBriefing({ ...record, objective_id: 'obj_other' }, status, response), /binding mismatch/);
});

test('history list shows only completed runs', () => {
  const result = completedHistoryRuns({ runs: [record, { run_id: 'run_waiting', status: 'WAITING_FOR_MINDS' }, { run_id: 'run_failed', status: 'FAILED' }] });
  assert.deepEqual(result.map(run => run.run_id), ['run_history']);
});

test('multiple sequential runs appear newest-first regardless of input order', () => {
  const runs = recentHistoryRuns({ runs: [
    { run_id: 'run_first', status: 'COMPLETED', queued_at: '2026-01-01T00:00:00Z' },
    { run_id: 'run_third', status: 'FAILED', queued_at: '2026-01-03T00:00:00Z' },
    { run_id: 'run_second', status: 'COMPLETED', queued_at: '2026-01-02T00:00:00Z' },
  ] });
  assert.deepEqual(runs.map(run => run.run_id), ['run_third', 'run_second', 'run_first']);
});

test('the current run is excluded from history without hiding another completed run', () => {
  const runs = recentHistoryRuns({ runs: [
    { run_id: 'run_new', status: 'COMPLETED', queued_at: '2026-01-02T00:00:00Z' },
    { run_id: 'run_old', status: 'COMPLETED', queued_at: '2026-01-01T00:00:00Z' },
  ] }, 'run_new');
  assert.deepEqual(runs.map(run => run.run_id), ['run_old']);
});

test('non-completed history records retain exact run and objective boundaries', () => {
  const pending = { run_id: 'run_pending', objective_id: 'obj_pending', objective_fingerprint: 'fp_pending', status: 'WAITING_FOR_MINDS' };
  const pendingStatus = { ...pending, objective_snapshot: { objective_id: 'obj_pending', fingerprint: 'fp_pending', title: 'Pending objective' } };
  assert.equal(verifyHistoricalRunRecord(pending, pendingStatus).status, 'WAITING_FOR_MINDS');
  assert.throws(() => verifyHistoricalRunRecord(pending, { ...pendingStatus, run_id: 'run_other' }), /run ID mismatch/);
});

test('creator-first Adobe headline is grounded without changing provenance', () => {
  const briefing = {
    sources: [{ source: 'Adobe Blog', title: 'Original Adobe article', source_url: 'https://blog.adobe.com/example' }],
    items: [{
      what_changed: 'Adobe announced new AI video tools.',
      why_it_matters: 'The supplied update does not establish cost or availability.',
      recommended_action: 'Check pricing before changing your workflow.',
    }],
  };
  const before = structuredClone(briefing.sources);
  assert.equal(creatorResultHeadline(briefing), 'Adobe unveiled new video tools — but pricing still needs checking.');
  assert.deepEqual(briefing.sources, before);
});

test('current completed run is not duplicated in previous history', () => {
  assert.deepEqual(completedHistoryRuns({ runs: [record] }, historical), []);
});

test('run_13f9724a is loadable generically when returned by recent runs', () => {
  const genericRecord = { ...record, run_id: 'run_13f9724a' };
  const genericResponse = { ...response, briefing: { ...response.briefing, run_id: 'run_13f9724a' } };
  assert.equal(verifyHistoricalBriefing(genericRecord, status, genericResponse).briefing.run_id, 'run_13f9724a');
});

test('simulated historical evidence remains detectable for disclosure', () => {
  assert.equal(isSimulatedBriefing({ provenance: { signal_source: 'Demo Dataset (Simulated)' } }), true);
});

test('live evidence is detected independently from historical simulated provenance', () => {
  assert.equal(isLiveBriefing({ evidence_mode: 'LIVE', sources: [{ source_url: 'https://blog.adobe.com/example' }] }), true);
  assert.equal(isSimulatedBriefing({ evidence_mode: 'LIVE' }), false);
});

test('no relevant update is truthful and cannot expose an older briefing as current', () => {
  const result = currentIntelligence({
    latest_offline_run: { run_id: 'run_new', status: 'NO_RELEVANT_UPDATE', objective_id: 'obj_1' },
    latest_briefing: { run_id: 'run_old', objective_id: 'obj_1', objective_snapshot: {} },
  });
  assert.equal(result.status, 'NO RELEVANT UPDATE');
  assert.equal(result.currentBriefing, null);
});

test('unsupported domain is truthful and cannot expose an older briefing as current', () => {
  const result = currentIntelligence({
    latest_offline_run: { run_id: 'run_new', status: 'UNSUPPORTED_DOMAIN', objective_id: 'obj_writing' },
    latest_briefing: { run_id: 'run_old', objective_id: 'obj_writing', objective_snapshot: {} },
  });
  assert.equal(result.status, 'NO LIVE PROVIDER');
  assert.equal(result.currentBriefing, null);
});

test('historical briefing is not assigned current RESULT READY status', () => {
  const result = currentIntelligence({ latest_offline_run: { run_id: 'run_current', objective_id: 'obj_current', status: 'WAITING_FOR_MINDS' }, latest_briefing: historical });
  assert.equal(result.status, 'WORKING');
  assert.notEqual(result.status, 'RESULT READY');
});
