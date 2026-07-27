import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardWidgetProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
};

export function DashboardWidget({
  children,
  className,
  interactive = false,
}: DashboardWidgetProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[#d0d5dd]/90 bg-white/88 shadow-[0_18px_44px_rgba(20,43,83,0.055)] backdrop-blur-xl",
        interactive &&
          "transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_22px_54px_rgba(20,43,83,0.085)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
