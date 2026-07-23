import type { ComponentType, ReactNode, SVGAttributes } from "react";
import { PulseCard } from "@/components/ui/PulseCard";
import { cn } from "@/lib/utils/cn";

type MetricIcon = ComponentType<SVGAttributes<SVGElement> & { size?: number | string; color?: string }>;

type MetricCardShellProps = {
  label: string;
  value: string;
  detail?: string;
  icon: MetricIcon;
  children?: ReactNode;
  className?: string;
  interactive?: boolean;
};

function sentenceCase(value: string) {
  const normalized = value.toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function MetricCardShell({
  label,
  value,
  detail,
  icon: Icon,
  children,
  className,
  interactive = true,
}: MetricCardShellProps) {
  return (
    <PulseCard
      as="article"
      interactive={interactive}
      className={cn("relative min-h-[104px] bg-white p-5 pr-16", className)}
    >
      <span className="absolute right-5 top-5 flex h-[18px] w-[18px] items-center justify-center text-black">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[13px] font-medium leading-5 text-black">{sentenceCase(label)}</p>
        <p className="mt-1 font-semibold text-black" style={{ fontSize: 24, lineHeight: "28px" }}>
          {value}
        </p>
        {detail ? <p className="mt-1 text-[12px] leading-5 text-black/70">{detail}</p> : null}
        {children}
      </div>
    </PulseCard>
  );
}
