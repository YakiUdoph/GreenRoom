import test from 'node:test';
import assert from 'node:assert/strict';
import { bindV2Decision, shouldPollV2Run, validCurrentV2RunId } from './v2Run.js';

test('frontend restores only a valid server-shaped V2 run ID', () => { assert.equal(validCurrentV2RunId('run_v2_123456abcdef'), true); assert.equal(validCurrentV2RunId('client-made'), false); });
test('accepted decision must bind to the exact current run', () => { const run = { run_id: 'run_v2_123456abcdef', decision_available: true }; assert.equal(bindV2Decision(run, { run_id: 'run_v2_other999' }), null); assert.equal(bindV2Decision(run, { run_id: run.run_id }).run_id, run.run_id); });
test('reload polling stops only at truthful terminal V2 states', () => {
  assert.equal(shouldPollV2Run({ run_id: 'run_v2_123456abcdef', status: 'WAITING_FOR_MINDS' }), true);
  for (const status of ['COMPLETED', 'FAILED', 'REJECTED', 'TIMED_OUT', 'NO_RELEVANT_UPDATE', 'UNSUPPORTED_DOMAIN']) assert.equal(shouldPollV2Run({ run_id: 'run_v2_123456abcdef', status }), false);
});
