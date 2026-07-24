export function KpiSparkline({ values, color = "#2f5bea" }: { values: number[]; color?: string }) {
  const points = values
    .map((value, index) => `${(index / (values.length - 1)) * 100},${36 - value * 30}`)
    .join(" ");
  return (
    <svg className="sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points={`0,40 ${points} 100,40`} fill={color} opacity=".08" />
    </svg>
  );
}
