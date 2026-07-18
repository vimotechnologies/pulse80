import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import { Inbox } from "@/components/icons/IconsaxIcons";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: IconsaxIcon;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-card-border bg-soft-bg px-6 py-10 text-center">
      <Icon className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
      <h3 className="mt-4 text-sm font-semibold text-navy">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
        {description}
      </p>
    </div>
  );
}
