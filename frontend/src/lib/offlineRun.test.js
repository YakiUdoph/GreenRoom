import test from 'node:test';
import assert from 'node:assert/strict';

import { verifyRunBriefing, verifySavedObjective } from './offlineRun.js';

test('verifies the exact durable objective before enqueue', () => {
  const objective = { id: 'obj_b', title: 'Objective B', details: 'Constraint B' };
  assert.equal(verifySavedObjective({ creator_objectives: [objective] }, objective), objective);
  assert.throws(
    () => verifySavedObjective({ creator_objectives: [{ ...objective, details: 'Changed' }] }, objective),
    /does not match/
  );
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
