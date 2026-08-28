import test from 'node:test';
import assert from 'node:assert/strict';
import { createAndStartObjective } from './objectiveRun.js';

test('goal submission persists an objective and immediately creates its bound run', async () => {
  const calls = [];
  const api = {
    createObjective: async (title, details) => {
      calls.push(['create', title, details]);
      return { objective: { id: 'obj_new', title }, state: { creator_objectives: [] } };
    },
    triggerBriefing: async (objectiveId) => {
      calls.push(['trigger', objectiveId]);
      return {
        run_id: 'run_new',
        job_status: 'QUEUED',
        objective: { objective_id: 'obj_new', title: 'Watch tools', constraints: '', fingerprint: 'fp_new' },
      };
    },
  };

  const result = await createAndStartObjective(api, 'Watch tools');
  assert.deepEqual(calls, [['create', 'Watch tools', ''], ['trigger', 'obj_new']]);
  assert.deepEqual(result.run, {
    run_id: 'run_new',
    objective_id: 'obj_new',
    objective_fingerprint: 'fp_new',
    objective_snapshot: { objective_id: 'obj_new', title: 'Watch tools', constraints: '', fingerprint: 'fp_new' },
    status: 'QUEUED',
  });
});

test('a mismatched queued objective is rejected instead of crossing provenance boundaries', async () => {
  const api = {
    createObjective: async () => ({ objective: { id: 'obj_new' } }),
    triggerBriefing: async () => ({
      run_id: 'run_wrong',
      objective: { objective_id: 'obj_other', fingerprint: 'fp_other' },
    }),
  };
  await assert.rejects(() => createAndStartObjective(api, 'Watch tools'), /not bound/);
});
