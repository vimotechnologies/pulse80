import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardCard({ children, className }: DashboardCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[#d0d5dd] bg-surface shadow-[0_16px_40px_var(--card-shadow)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
