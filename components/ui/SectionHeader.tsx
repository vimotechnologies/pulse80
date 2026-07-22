import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#d0d5dd] px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-navy">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
