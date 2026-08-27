export function cleanDecisionText(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/?\s*b\s*>/gi, '')
    .replace(/<\s*\/?\s*(?:strong|em|i|p|div|span)\b[^>]*>/gi, '')
    .replace(/<\s*\/?\s*(?:b|br|strong|em|i|p|div|span)\b[^>]*$/gi, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
