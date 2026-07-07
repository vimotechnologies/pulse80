import type { ReactNode } from "react";
import { PortalContentCard } from "@/components/portal/PortalContentCard";

type DashboardSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function DashboardSection({
  title,
  description,
  children,
}: DashboardSectionProps) {
  return (
    <PortalContentCard
      title={title}
      description={description}
      bodyClassName="p-0"
    >
      {children}
    </PortalContentCard>
  );
}
