import type { ReactNode } from "react";
import { PulseCard } from "@/components/ui/PulseCard";
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
    <PulseCard
      interactive={interactive}
      className={cn("bg-white/88 backdrop-blur-xl", className)}
    >
      {children}
    </PulseCard>
  );
}
