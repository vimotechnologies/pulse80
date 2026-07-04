import {
  Activity,
  Building2,
  ClipboardCheck,
  FileBarChart,
  Stethoscope,
} from "lucide-react";
import type {
  Activation,
  Alert,
  MetricCardData,
  Report,
  WellnessChartPoint,
} from "@/types/dashboard";

export const adminMetrics: MetricCardData[] = [
  {
    label: "Active Organizations",
    value: "42",
    change: "+8% this quarter",
    trend: "up",
    icon: Building2,
  },
  {
    label: "Upcoming Activations",
    value: "18",
    change: "6 this week",
    trend: "neutral",
    icon: Activity,
  },
  {
    label: "Verified Practitioners",
    value: "126",
    change: "+14 verified",
    trend: "up",
    icon: Stethoscope,
  },
  {
    label: "Reports Published",
    value: "87",
    change: "+21% this month",
    trend: "up",
    icon: FileBarChart,
  },
  {
    label: "Employees Reached",
    value: "31.4k",
    change: "+3.2k reached",
    trend: "up",
    icon: ClipboardCheck,
  },
];

export const wellnessOverview: WellnessChartPoint[] = [
  { month: "Jan", screenings: 420, engagement: 68, risks: 38 },
  { month: "Feb", screenings: 560, engagement: 72, risks: 44 },
  { month: "Mar", screenings: 610, engagement: 76, risks: 39 },
  { month: "Apr", screenings: 740, engagement: 79, risks: 47 },
  { month: "May", screenings: 860, engagement: 81, risks: 51 },
  { month: "Jun", screenings: 940, engagement: 84, risks: 43 },
];

export const todaysActivations: Activation[] = [
  {
    organization: "Botswana Insurance Holdings",
    type: "Cardiometabolic screening",
    time: "08:30",
    location: "Gaborone HQ",
    status: "in-progress",
  },
  {
    organization: "Kalahari Mining Group",
    type: "Annual wellness activation",
    time: "11:00",
    location: "Jwaneng Site",
    status: "scheduled",
  },
  {
    organization: "Mowana Logistics",
    type: "Blood pressure follow-up",
    time: "14:30",
    location: "Francistown Depot",
    status: "at-risk",
  },
];

export const practitionerNetwork = [
  { label: "Available today", value: "38", tone: "success" },
  { label: "Awaiting verification", value: "9", tone: "warning" },
  { label: "Assigned this week", value: "64", tone: "info" },
];

export const adminAlerts: Alert[] = [
  {
    title: "High-risk cohort flagged",
    detail: "Mowana Logistics has elevated hypertension follow-up risk.",
    severity: "critical",
  },
  {
    title: "Practitioner documents pending",
    detail: "9 verification profiles need operations review.",
    severity: "warning",
  },
  {
    title: "Report delivery complete",
    detail: "June executive summaries were published to 12 clients.",
    severity: "success",
  },
];

export const recentReports: Report[] = [
  {
    title: "Absenteeism Impact Overview",
    organization: "Delta Foods",
    date: "Jul 3",
    status: "published",
  },
  {
    title: "Workforce Wellness ROI",
    organization: "Prime Bank",
    date: "Jul 2",
    status: "review",
  },
  {
    title: "Screening Outcomes Summary",
    organization: "Gaborone Textiles",
    date: "Jul 1",
    status: "draft",
  },
];

export const platformInsights = [
  "Preventive screenings increased 18% across active organizations.",
  "Presenteeism risk is trending down in teams with follow-up coaching.",
  "Onsite activation attendance is highest between 08:00 and 11:00.",
];
