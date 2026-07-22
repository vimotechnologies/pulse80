import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
};

const variantStyles = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-light active:bg-primary disabled:bg-primary/45",
  secondary:
    "border border-[#d0d5dd] bg-surface text-navy shadow-sm hover:border-primary/35 hover:bg-soft-bg active:bg-primary/10 disabled:text-muted",
  ghost:
    "text-primary hover:bg-primary/10 active:bg-primary/15 disabled:text-muted",
};

export function ActionButton({
  children,
  className,
  disabled,
  loading,
  variant = "primary",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:opacity-70",
        variantStyles[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
