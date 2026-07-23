import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption<T extends string = string> = { value: T; label: string };

type SelectProps<T extends string> = {
  options: SelectOption<T>[];
  value?: T | null;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
};

export function Select<T extends string>({ options, value, defaultValue, onValueChange, name, disabled = false, required = false, ariaLabel, placeholder, className = "" }: SelectProps<T>) {
  return (
    <BaseSelect.Root<T> items={options} value={value} defaultValue={defaultValue} onValueChange={(next) => { if (next !== null) onValueChange?.(next); }} name={name} disabled={disabled} required={required}>
      <BaseSelect.Trigger className={`select-trigger ${className}`} aria-label={ariaLabel}>
        <BaseSelect.Value placeholder={placeholder ?? ""} />
        <BaseSelect.Icon className="select-trigger__icon"><ChevronDown size={14} /></BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="select-positioner" sideOffset={6} alignItemWithTrigger={false}>
          <BaseSelect.Popup className="select-popup">
            {options.map((option) => (
              <BaseSelect.Item key={option.value} value={option.value} className="select-option">
                <BaseSelect.ItemText className="select-option__text">{option.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator className="select-option__indicator"><Check size={13} /></BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
