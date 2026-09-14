import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { currentHomeResult, homeResultState } from './homeResult.js';

const run = { run_id: 'run_live', status: 'COMPLETED', objective_id: 'obj_live', objective_fingerprint: 'fp_live' };
const briefing = { run_id: 'run_live', objective_id: 'obj_live', objective_snapshot: { fingerprint: 'fp_live' }, items: [{ what_changed: 'Fetched evidence' }] };

test('homepage has an honest empty state without a completed current briefing', () => {
  assert.equal(homeResultState(null, null), 'empty');
  assert.equal(currentHomeResult(null, null), null);
});

test('homepage component contains no fabricated intelligence fallback', async () => {
  const source = await readFile(new URL('../pages/HomePage.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /exampleResult|GreenRoom found something|currentItem\s*\|\|/);
  assert.match(source, /Nothing to review yet\./);
});

test('homepage renders only the exact completed run and objective fingerprint', () => {
  assert.equal(currentHomeResult(run, briefing), briefing.items[0]);
  assert.equal(currentHomeResult({ ...run, status: 'FAILED' }, briefing), null);
  assert.equal(currentHomeResult(run, { ...briefing, run_id: 'run_old' }), null);
  assert.equal(currentHomeResult(run, { ...briefing, objective_id: 'obj_old' }), null);
  assert.equal(currentHomeResult(run, { ...briefing, objective_snapshot: { fingerprint: 'fp_old' } }), null);
});

test('terminal and working states never fall back to an old briefing', () => {
  for (const [status, expected] of [['UNSUPPORTED_DOMAIN', 'unsupported'], ['NO_RELEVANT_UPDATE', 'no-update'], ['FAILED', 'failed'], ['WAITING_FOR_MINDS', 'working']]) {
    assert.equal(homeResultState({ ...run, status }, briefing), expected);
  }
});
