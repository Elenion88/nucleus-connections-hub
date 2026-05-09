// Deterministic colored-initials avatar — no external image deps, predictable rendering.

const PALETTE = [
  ['#0c1525', '#f7f3ec'],
  ['#c4794a', '#fff'],
  ['#5a8c84', '#fff'],
  ['#16213d', '#f7f3ec'],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ name, seed, size = 40 }: { name: string; seed?: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const [bg, fg] = PALETTE[hash(seed || name) % PALETTE.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold tracking-tight shrink-0"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function StartupLogo({ name, seed, size = 40 }: { name: string; seed?: string; size?: number }) {
  const letter = name.replace(/^The\s+/i, '').trim()[0]?.toUpperCase() || '?';
  const [bg, fg] = PALETTE[hash(seed || name) % PALETTE.length];
  return (
    <div
      className="rounded-lg flex items-center justify-center font-bold display shrink-0"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.5 }}
      aria-hidden
    >
      {letter}
    </div>
  );
}
