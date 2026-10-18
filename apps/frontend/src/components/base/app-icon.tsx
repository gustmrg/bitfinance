export function AppIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" className={className}>
      <rect width="100" height="100" rx="22" fill="#1747D1" />
      <path
        d="M19 47L50 22l31 25"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="31" y="60" width="10" height="19" rx="5" fill="#9DB7FF" />
      <rect x="45" y="51" width="10" height="28" rx="5" fill="#C9D7FF" />
      <rect x="59" y="42" width="10" height="37" rx="5" fill="#FFFFFF" />
    </svg>
  );
}
