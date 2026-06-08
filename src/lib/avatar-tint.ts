/**
 * Deterministic avatar tints — ported from the Meridian admin console kit.
 * Each entry is [background, foreground]: a faint tinted fill paired with the
 * saturated monogram color. The same name always resolves to the same tint.
 */
const AVATAR_TINTS: ReadonlyArray<readonly [string, string]> = [
  ['oklch(0.55 0.16 256 / 0.22)', 'oklch(0.8 0.1 256)'],
  ['oklch(0.68 0.15 158 / 0.2)', 'var(--green-400)'],
  ['oklch(0.64 0.165 295 / 0.22)', 'var(--violet-500)'],
  ['oklch(0.78 0.14 78 / 0.2)', 'var(--amber-400)'],
  ['oklch(0.7 0.11 200 / 0.22)', 'var(--teal-500)'],
  ['oklch(0.7 0.18 22 / 0.18)', 'var(--red-400)'],
];

/** Pick a stable [background, foreground] tint pair for a name. */
export function tintFor(name: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

/** Up to two uppercase initials from a name (first + second word). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}
