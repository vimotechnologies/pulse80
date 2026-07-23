import type { ComponentType, ReactNode, SVGAttributes } from "react";
import { MetricCardShell } from "@/components/ui/MetricCardShell";
import { cn } from "@/lib/utils/cn";

type AdminIcon = ComponentType<SVGAttributes<SVGElement> & { size?: number | string; color?: string }>;

export const pulseAdmin = {
  text: {
    title: "pulse-title",
    body: "pulse-body",
    muted: "pulse-muted",
    label: "pulse-label",
  },
  surface: {
    card: "pulse-surface",
    attachedCard: "pulse-surface-attached",
  },
  control: {
    focus: "pulse-focus",
    hoverGrey: "pulse-row",
  },
};

const buttonStyles = {
  primary: "pulse-button-primary",
  secondary: "pulse-button-secondary",
  subtle: "pulse-button-subtle",
  ghost: "pulse-button-ghost",
  outlinePrimary: "pulse-button-outline-primary",
};

export function AdminButton({
  children,
  className,
  icon: Icon,
  size = "sm",
  variant = "secondary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: AdminIcon;
  size?: "xs" | "sm" | "md";
  variant?: keyof typeof buttonStyles;
}) {
  const sizeStyles = {
    xs: "pulse-button-xs",
    sm: "pulse-button-sm",
    md: "pulse-button-md",
  }[size];

  return (
    <button
      type="button"
      className={cn(
        "pulse-button",
        pulseAdmin.control.focus,
        sizeStyles,
        buttonStyles[variant],
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className={cn(size === "xs" ? "h-[18px] w-[18px]" : "h-[18px] w-[18px]")} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function AdminIconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        "pulse-icon-button",
        pulseAdmin.control.focus,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminTabButton({
  active,
  children,
  className,
  icon: Icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: AdminIcon;
}) {
  return (
    <button
      type="button"
      className={cn(
        "pulse-tab",
        pulseAdmin.control.focus,
        active && "pulse-tab-active",
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="h-[18px] w-[18px]" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

const badgeStyles = {
  success: "pulse-badge-success",
  warning: "pulse-badge-warning",
  danger: "pulse-badge-danger",
  info: "pulse-badge-info",
  neutral: "pulse-badge-neutral",
};

export function AdminBadge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof badgeStyles;
}) {
  return (
    <span
      className={cn(
        "pulse-badge",
        badgeStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AdminMetricCard({
  icon: Icon,
  value,
  label,
  subtext,
}: {
  icon: AdminIcon;
  value: string;
  label: string;
  subtext: string;
  tone?: keyof typeof badgeStyles;
}) {
  return <MetricCardShell label={label} value={value} detail={subtext} icon={Icon} />;
}
