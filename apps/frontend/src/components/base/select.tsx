import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectOption<T extends string = string> = { value: T; label: string };

export function Select<T extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  disabled = false,
  required = false,
  ariaLabel,
  placeholder,
  className,
}: {
  options: SelectOption<T>[];
  value?: T | null;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <BaseSelect.Root<T>
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => {
        if (next !== null) onValueChange?.(next);
      }}
      name={name}
      disabled={disabled}
      required={required}
    >
      <BaseSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-control border border-line-strong bg-surface px-3.5 text-left text-sm text-ink",
          "focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-brand/30",
          "data-disabled:cursor-not-allowed data-disabled:opacity-60",
          className,
        )}
      >
        <BaseSelect.Value placeholder={placeholder ?? ""} className="truncate" />
        <BaseSelect.Icon className="text-ink-muted">
          <ChevronDown size={16} aria-hidden="true" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-50">
          <BaseSelect.Popup className="max-h-80 min-w-(--anchor-width) overflow-y-auto rounded-control border border-line bg-surface p-1 shadow-lg">
            {options.map((option) => (
              <BaseSelect.Item
                key={option.value}
                value={option.value}
                className="flex h-10 cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 text-sm text-ink outline-none data-highlighted:bg-surface-muted data-selected:font-semibold"
              >
                <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator className="text-brand-ink">
                  <Check size={15} aria-hidden="true" />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
