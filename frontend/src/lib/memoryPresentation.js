const LEGACY_RULE_PREFIX = /^User Feedback Rule:\s*/i;

export function getDisplayMemories(memoryState) {
  const rules = Array.isArray(memoryState?.learned_voice_rules)
    ? memoryState.learned_voice_rules.filter(value => typeof value === 'string' && value.length > 0)
    : [];
  const nodes = Array.isArray(memoryState?.memory_nodes) ? memoryState.memory_nodes : [];
  const displayed = [];
  const seen = new Set();

  const add = value => {
    if (typeof value !== 'string' || !value || seen.has(value)) return;
    seen.add(value);
    displayed.push(value);
  };

  rules.forEach(add);
  nodes.forEach(node => {
    const raw = node?.content || node?.memory || node?.text || node?.summary;
    if (typeof raw !== 'string') return;
    const humanReadable = node?.type === 'learned_preference'
      ? raw.replace(LEGACY_RULE_PREFIX, '')
      : raw;
    add(humanReadable);
  });

  return displayed;
}
