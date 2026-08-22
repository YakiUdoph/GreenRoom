import test from 'node:test';
import assert from 'node:assert/strict';

import { getDisplayMemories } from './memoryPresentation.js';

test('presents rules and their internal nodes once in human-readable form', () => {
  const first = 'I prefer concise, direct answers with no clickbait';
  const second = 'Prioritize creator opportunities with clear monetary value.';
  const memories = getDisplayMemories({
    learned_voice_rules: [first, second],
    memory_nodes: [
      { type: 'learned_preference', content: `User Feedback Rule: ${first}` },
      { type: 'learned_preference', content: second },
      { type: 'video_script_analytics', content: 'Distinct performance insight.' },
    ],
  });

  assert.deepEqual(memories, [first, second, 'Distinct performance insight.']);
});

test('retains a legacy preference node even if its corresponding rule is absent', () => {
  assert.deepEqual(getDisplayMemories({
    learned_voice_rules: [],
    memory_nodes: [
      { type: 'learned_preference', content: 'User Feedback Rule: Preserve this legacy preference.' },
    ],
  }), ['Preserve this legacy preference.']);
});
