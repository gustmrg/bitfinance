export function Avatar({
  initials,
  src,
  size = "md",
}: {
  initials: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}) {
  return src ? (
    <img className={`avatar avatar--${size}`} src={src} alt="" />
  ) : (
    <span className={`avatar avatar--${size}`}>{initials}</span>
  );
}
