export function destinationCandidates(destination) {
  const text = String(destination || '').trim();
  if (!text) return [];
  const parts = text
    .split(/[、，,·/／\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return [...new Set([text, ...parts])];
}
