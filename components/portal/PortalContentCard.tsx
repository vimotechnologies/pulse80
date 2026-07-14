import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PortalContentCardProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function PortalContentCard({
  children,
  title,
  description,
  action,
  className,
  bodyClassName,
}: PortalContentCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-card-border bg-surface shadow-[0_16px_40px_var(--card-shadow)]",
        className,
      )}
    >
      {title || description || action ? (
        <div className="flex items-start justify-between gap-4 border-b border-card-border px-5 py-4">
          <div>
            {title ? (
              <h2 className="text-[14px] font-semibold leading-5 text-black">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-[12px] leading-4 text-black/60">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
