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
  assert.match(source, /Decision by verified persistent Mind: Udophia/);
  assert.doesNotMatch(source, /illustrative result|example recommendation/i);
});

test('supported chips have concise labels, exact values, and never submit', async () => {
  const source = await readFile(new URL('../pages/HomePage.jsx', import.meta.url), 'utf8');
  assert.match(source, /\['YouTube changes', 'Tell me when YouTube changes something that could affect my channel\.'\]/);
  assert.match(source, /\['AI video tools', 'Watch for meaningful AI video-tool updates\.'\]/);
  assert.match(source, /\['Twitch opportunities', 'Watch for Twitch creator earning or sponsorship opportunities\.'\]/);
  assert.match(source, /<button type="button"[^\n]+populateSupportedExample\(setGoal, example\)/);
  assert.doesNotMatch(source, /populateSupportedExample\([^)]*submitGoal/);
});

test('mobile CSS contains viewport containment and usable controls', async () => {
  const css = await readFile(new URL('../manus-exact.css', import.meta.url), 'utf8');
  assert.match(css, /html,body,#root,.app-shell,.app-main\{width:100%;max-width:100%;overflow-x:clip\}/);
  assert.match(css, /\.goal-entry input,.goal-entry button\{max-width:100%;min-width:0\}/);
  assert.match(css, /\.mobile-nav nav\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
  assert.match(css, /\.fixed\.inset-0\{align-items:flex-start!important;overflow-y:auto/);
});

test('Udophia and readable Memory proof are gated by genuine briefing data', async () => {
  const source = await readFile(new URL('../pages/IntelligencePage.jsx', import.meta.url), 'utf8');
  assert.match(source, /briefing\.minds_verified && provenance\.minds_verified && <p className="verified-mind-line">/);
  assert.match(source, /selected_rule_count \|\| 0/);
  assert.match(source, /selected_memory_node_count \|\| 0/);
  assert.match(source, /rememberedContext\.join/);
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
