import { cn } from "@/lib/cn";

const sizes = { sm: "size-9 text-[13px]", md: "size-11 text-sm" } as const;

export function Avatar({
  name,
  src,
  size = "sm",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const classes = cn(
    "inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft font-bold text-brand-ink",
    sizes[size],
    className,
  );
  return src ? (
    <img className={cn(classes, "object-cover")} src={src} alt="" />
  ) : (
    <span className={classes} aria-hidden="true">
      {initials}
    </span>
  );
}
