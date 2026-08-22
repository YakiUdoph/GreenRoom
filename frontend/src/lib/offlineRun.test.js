import test from 'node:test';
import assert from 'node:assert/strict';

import { isOfflineRunPending, isOlderBriefingAfterFailedRun, offlineRunProgressLabel, verifyRunBriefing, verifySavedObjective } from './offlineRun.js';

test('verifies the exact durable objective before enqueue', () => {
  const objective = { id: 'obj_b', title: 'Objective B', details: 'Constraint B' };
  assert.equal(verifySavedObjective({ creator_objectives: [objective] }, objective), objective);
  assert.throws(
    () => verifySavedObjective({ creator_objectives: [{ ...objective, details: 'Changed' }] }, objective),
    /does not match/
  );
});

test('labels an older successful briefing after a different run fails', () => {
  assert.equal(isOlderBriefingAfterFailedRun(
    { run_id: 'run_a' }, { run_id: 'run_b', status: 'FAILED' }
  ), true);
  assert.equal(isOlderBriefingAfterFailedRun(
    { run_id: 'run_a' }, { run_id: 'run_a', status: 'COMPLETED' }
  ), false);
});

test('Run B Delivery rejects Run A even when it is presented as latest', () => {
  const runB = { run_id: 'run_b', objective_id: 'obj_b', items: [] };
  assert.equal(verifyRunBriefing(runB, 'run_b', 'obj_b'), runB);
  assert.throws(
    () => verifyRunBriefing({ run_id: 'run_a', objective_id: 'obj_a' }, 'run_b', 'obj_b'),
    /does not match the completed run/
  );
  assert.throws(
    () => verifyRunBriefing({ run_id: 'run_b', objective_id: 'obj_a' }, 'run_b', 'obj_b'),
    /does not match the queued objective/
  );
});

test('WAITING_FOR_MINDS remains an honest non-terminal UI state', () => {
  assert.equal(isOfflineRunPending('WAITING_FOR_MINDS'), true);
  assert.equal(isOfflineRunPending('SUBMITTING'), true);
  assert.equal(isOfflineRunPending('COMPLETED'), false);
  assert.equal(isOfflineRunPending('FAILED'), false);
});

test('offline progress labels reflect durable phases without fake percentages', () => {
  const checkedAt = '2026-01-01T00:00:10.000Z';
  assert.equal(offlineRunProgressLabel({ status: 'WAITING_FOR_MINDS', collection_attempt: 0 }), 'Submitted to Mind');
  assert.equal(offlineRunProgressLabel({ status: 'WAITING_FOR_MINDS', collection_attempt: 1, last_history_observation: { checked_at: checkedAt } }, Date.parse(checkedAt) + 500), 'Checking response');
  assert.equal(offlineRunProgressLabel({ status: 'WAITING_FOR_MINDS', collection_attempt: 1, last_history_observation: { checked_at: checkedAt } }, Date.parse(checkedAt) + 3_000), 'Waiting for verified reply');
  assert.equal(offlineRunProgressLabel({ status: 'COMPLETED' }), 'Ranking result');
});
