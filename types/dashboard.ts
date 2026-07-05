import type { LucideIcon } from "@/components/icons/LucideIcons";

export type TrendDirection = "up" | "down" | "neutral";

export type MetricCardData = {
  label: string;
  value: string;
  change: string;
  trend: TrendDirection;
  icon: LucideIcon;
};

export type Activation = {
  organization: string;
  type: string;
  time: string;
  location: string;
  status: "scheduled" | "in-progress" | "at-risk";
};

export type Alert = {
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info" | "success";
};

export type Report = {
  title: string;
  organization: string;
  date: string;
  status: "published" | "draft" | "review";
};

export type WellnessChartPoint = {
  month: string;
  screenings: number;
  engagement: number;
  risks: number;
};
