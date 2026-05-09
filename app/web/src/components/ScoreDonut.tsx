export function ScoreDonut({ score, size = 56 }: { score: number; size?: number }) {
  const color = score >= 90 ? '#c4794a' : score >= 75 ? '#5a8c84' : score >= 60 ? '#a4886e' : '#9aa0ad';
  return (
    <div
      className="score-donut rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        // @ts-expect-error CSS custom properties
        '--score-pct': score,
        '--score-color': color,
      }}
    >
      <div className="bg-white rounded-full flex items-center justify-center" style={{ width: size - 12, height: size - 12 }}>
        <span className="font-display font-semibold text-nucleus-ink" style={{ fontSize: size * 0.32 }}>
          {score}
        </span>
      </div>
    </div>
  );
}
