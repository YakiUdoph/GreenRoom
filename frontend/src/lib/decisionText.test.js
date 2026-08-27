import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanDecisionText } from './decisionText.js';

test('decision text removes supported and malformed formatting fragments', () => {
  const cases = [
    ['<b>Useful</b>', 'Useful'],
    ['Useful </b>change', 'Useful change'],
    ['First<br>Second', 'First\nSecond'],
    ['First<br/>Second', 'First\nSecond'],
    ['First<br />Second', 'First\nSecond'],
    ['First\n\n\nSecond', 'First\n\nSecond'],
    ['Harmless plain text.', 'Harmless plain text.'],
    ['Useful</b><br><br', 'Useful'],
  ];
  for (const [input, expected] of cases) assert.equal(cleanDecisionText(input), expected);
});
