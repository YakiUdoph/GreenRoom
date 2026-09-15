import test from 'node:test'; import assert from 'node:assert/strict';
import { publicV2Decision, validV2RunId } from './v2-decision-read.mjs';

test('V2 decision read validates IDs', () => { assert.equal(validV2RunId('run_v2_abc123'), true); assert.equal(validV2RunId('../secret'), false); });
test('public response exposes only accepted creator decision fields', () => {
  const safe = publicV2Decision({ schema_version: 'greenroom_v2_decision_v1', run_id: 'run_v2_abc123', completed_at: '2026-01-01', creator_context: { private: true }, external_evidence: { raw: true }, diagnostic: 'secret', decision: { attention_verdict: 'KEEP_WATCHING', what_i_noticed: 'Stable.', why_this_matters_to_you: 'Relevant.', what_id_do_next: 'No workflow change for now.', connection: 'POSSIBLE', uncertainty: 'Short window.', raw_prompt: 'secret' } });
  assert.deepEqual(Object.keys(safe), ['schema_version', 'run_id', 'completed_at', 'evidence', 'mind', 'decision']);
  assert.equal(JSON.stringify(safe).includes('secret'), false); assert.equal(JSON.stringify(safe).includes('private'), false);
});
test('non-accepted records are not returned', () => { assert.equal(publicV2Decision({ schema_version: 'greenroom_v2_decision_v1', run_id: 'run_x', decision: {} }), null); });
