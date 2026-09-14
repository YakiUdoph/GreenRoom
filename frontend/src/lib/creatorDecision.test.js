import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCreatorDecision } from './creatorDecision.js';

test('normalizes a bound V1 briefing without inventing V2 fields', () => {
  const value = normalizeCreatorDecision({ run_id: 'run_1', items: [{ what_changed: 'Views steadied.', why_it_matters: 'Your plan is working.', recommended_action: 'No workflow change for now.' }] });
  assert.equal(value.action, 'No workflow change for now.');
  assert.equal(value.uncertainty, null);
  assert.equal(value.attention, null);
});

test('normalizes an accepted V2 decision', () => {
  const value = normalizeCreatorDecision({ run_id: 'run_2', decision: { attention_verdict: 'KEEP_WATCHING', what_i_noticed: 'A small shift.', why_this_matters_to_you: 'It may matter.', what_id_do_next: 'Keep watching.', connection: 'POSSIBLE', uncertainty: 'Only seven days are available.' } });
  assert.equal(value.attention, 'KEEP_WATCHING');
  assert.equal(value.connection, 'POSSIBLE');
  assert.match(value.uncertainty, /seven days/);
});
