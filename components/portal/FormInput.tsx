import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { FormFieldMessage } from "@/components/portal/FormFieldMessage";

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  message?: string;
  state?: "default" | "error" | "warning";
};

const stateStyles = {
  default:
    "border-[#d0d5dd] bg-surface focus:ring-primary/10",
  error:
    "border-pulse-red/50 bg-pulse-red/5 focus:border-pulse-red focus:ring-pulse-red/10",
  warning:
    "border-warning/60 bg-warning/5 focus:border-warning focus:ring-warning/10",
};

export function FormInput({
  className,
  label,
  message,
  state = "default",
  ...props
}: FormInputProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-navy">{label}</span>
      <input
        className={cn(
          "mt-2 h-11 w-full rounded-lg border px-3 text-sm text-navy outline-none transition placeholder:text-muted focus:ring-4",
          stateStyles[state],
          className,
        )}
        {...props}
      />
      {message ? (
        <FormFieldMessage tone={state === "default" ? "neutral" : state}>
          {message}
        </FormFieldMessage>
      ) : null}
    </label>
  );
}
