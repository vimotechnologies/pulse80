import { AlertCircle } from "@/components/icons/IconsaxIcons";
import { cn } from "@/lib/utils/cn";

type FormFieldMessageProps = {
  children: string;
  tone?: "error" | "warning" | "neutral";
};

const toneStyles = {
  error: "text-pulse-red",
  warning: "text-warning",
  neutral: "text-muted",
};

export function FormFieldMessage({
  children,
  tone = "neutral",
}: FormFieldMessageProps) {
  return (
    <p className={cn("mt-2 flex items-center gap-2 text-xs", toneStyles[tone])}>
      {tone !== "neutral" ? <AlertCircle className="h-[18px] w-[18px]" /> : null}
      {children}
    </p>
  );
}
