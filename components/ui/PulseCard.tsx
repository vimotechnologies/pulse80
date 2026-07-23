import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PulseCardProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
};

export function PulseCard<T extends ElementType = "section">({
  as,
  children,
  className,
  interactive = false,
}: PulseCardProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      data-pulse-card
      className={cn(
        "rounded-lg bg-white shadow-[0_12px_32px_rgba(15,23,42,0.045)]",
        interactive && "transition hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.07)]",
        className,
      )}
    >
      {children}
    </Component>
  );
}
