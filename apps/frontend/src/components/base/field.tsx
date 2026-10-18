import {
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useId,
} from "react";
import { cn } from "@/lib/cn";

const controlClasses = cn(
  "w-full rounded-control border border-line-strong bg-surface px-3.5 text-sm text-ink",
  "placeholder:text-ink-muted focus:border-brand focus:outline-2 focus:outline-offset-0 focus:outline-brand/30",
  "disabled:opacity-60 aria-invalid:border-danger",
);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClasses, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlClasses, "min-h-24 py-2.5", className)} {...props} />;
}

type ControlProps = { id: string; "aria-describedby"?: string; "aria-invalid"?: true };

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children({
        id,
        "aria-describedby": message ? messageId : undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {message && (
        <p
          id={messageId}
          className={cn("m-0 text-xs", error ? "font-semibold text-danger" : "text-ink-muted")}
        >
          {message}
        </p>
      )}
    </div>
  );
}
