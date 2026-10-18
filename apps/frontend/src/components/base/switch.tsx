import { Switch as BaseSwitch } from "@base-ui/react/switch";

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  id,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <BaseSwitch.Root
      id={id}
      aria-label={ariaLabel}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(next) => onCheckedChange(next)}
      className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-line-strong p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-checked:bg-brand data-disabled:cursor-not-allowed data-disabled:opacity-50"
    >
      <BaseSwitch.Thumb className="size-6 rounded-full bg-white shadow transition-transform data-checked:translate-x-5" />
    </BaseSwitch.Root>
  );
}
