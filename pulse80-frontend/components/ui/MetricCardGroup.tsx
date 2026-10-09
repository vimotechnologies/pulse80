import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Native touch scrolling on phones, with the existing grid at wider sizes. */
export function MetricCardGroup({
  children,
  className,
  label = "Key metrics",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section
      aria-label={label}
      tabIndex={0}
      className={cn(
        "pulse-metric-carousel grid min-w-0 gap-4 rounded-2xl md:grid-cols-2 xl:grid-cols-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
        className,
      )}
    >
      {children}
    </section>
  );
}
