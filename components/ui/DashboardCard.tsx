import type { ReactNode } from "react";
import { PulseCard } from "@/components/ui/PulseCard";
import { cn } from "@/lib/utils/cn";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardCard({ children, className }: DashboardCardProps) {
  return (
    <PulseCard className={cn("bg-surface", className)}>
      {children}
    </PulseCard>
  );
}
