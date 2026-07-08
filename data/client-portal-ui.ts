import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import {
  Activity,
  BarChart3,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart,
  FileText,
  HeartPulse,
  Lightbulb,
  Settings,
  ShieldCheck,
  UsersRound,
} from "@/components/icons/IconsaxIcons";

export type ClientTone = "primary" | "success" | "warning" | "danger" | "neutral";

export type ClientMetric = {
  label: string;
  value: string;
  detail: string;
  tone: ClientTone;
  icon: IconsaxIcon;
};

export type ClientFilter = {
  key: string;
  label: string;
  options: string[];
};

export type ClientRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  statusTone: "success" | "warning" | "danger" | "info" | "neutral";
  search: string;
  filters: Record<string, string>;
  fields: { label: string; value: string }[];
  details: { label: string; value: string; tone?: ClientTone }[];
  progress?: number;
  highlight?: string;
};

export type ClientPageConfig = {
  id: "dashboard" | "reports" | "insights" | "activations" | "recommendations" | "settings";
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  searchPlaceholder: string;
  filters: ClientFilter[];
  tabs?: string[];
  metrics: ClientMetric[];
  records: ClientRecord[];
  featured?: ClientRecord;
  formFields: string[];
  emptyTitle: string;
  emptyDescription: string;
};

const eyebrow = "Client Organization";

const reportRoi: ClientRecord = {
  id: "report-roi",
  title: "ROI and Impact Report",
  subtitle: "Q3 2026 · Published · Finance and leadership",
  meta: "Estimated 1.8x productivity impact from participation and follow-up programs.",
  status: "Published",
  statusTone: "success",
  search: "roi impact report q3 2026 finance leadership published",
  filters: { area: "Reports", type: "ROI and Impact Report", period: "Q3 2026", status: "Published" },
  fields: [
    { label: "Impact indicator", value: "1.8x" },
    { label: "Audience", value: "Finance" },
    { label: "Period", value: "Q3 2026" },
  ],
  details: [
    { label: "Executive summary", value: "Participation, follow-up attendance, and reduced risk concentration indicate positive business impact." },
    { label: "Download", value: "Available as a placeholder action." },
  ],
  progress: 92,
  highlight: "Featured latest report",
};

const reportScreening: ClientRecord = {
  id: "report-screening",
  title: "Onsite Screening Summary",
  subtitle: "July 2026 · New · Wellness coordinators",
  meta: "Participation, service uptake, and site-level completion summary.",
  status: "New",
  statusTone: "info",
  search: "onsite screening summary july 2026 new",
  filters: { type: "Onsite Screening Summary", period: "July 2026", status: "New" },
  fields: [
    { label: "Employees screened", value: "428" },
    { label: "Sites", value: "2" },
    { label: "Completion", value: "78%" },
  ],
  details: [
    { label: "Report focus", value: "Screening reach, services used, participation gaps, and follow-up next steps." },
    { label: "Sensitive data", value: "Aggregated only. No personal health records shown.", tone: "success" },
  ],
  progress: 78,
};

const reportRisk: ClientRecord = {
  id: "report-risk",
  title: "Department Risk Report",
  subtitle: "Q3 2026 · Review · HR leadership",
  meta: "Department comparison with risk and participation trends.",
  status: "Review",
  statusTone: "warning",
  search: "department risk report q3 review hr leadership",
  filters: { area: "Reports", type: "Department Risk Report", period: "Q3 2026", status: "Review" },
  fields: [
    { label: "Watch areas", value: "2" },
    { label: "Highest risk", value: "Operations" },
    { label: "Trend", value: "+4%" },
  ],
  details: [
    { label: "Report focus", value: "Aggregated department risk, participation gaps, and recommended interventions." },
    { label: "Review note", value: "Awaiting final executive note.", tone: "warning" },
  ],
  progress: 68,
};

const reportAbsenteeism: ClientRecord = {
  id: "report-absence",
  title: "Absenteeism and Presenteeism Report",
  subtitle: "Q2 2026 · Published · HR and finance",
  meta: "Risk indicators connected to absence patterns and productivity impact.",
  status: "Published",
  statusTone: "success",
  search: "absenteeism presenteeism report q2 published",
  filters: { type: "Absenteeism and Presenteeism Report", period: "Q2 2026", status: "Published" },
  fields: [
    { label: "Absenteeism risk", value: "Medium" },
    { label: "Presenteeism", value: "68" },
    { label: "Actions", value: "3" },
  ],
  details: [{ label: "Report focus", value: "Business impact and trend movement by department." }],
  progress: 84,
};

const reportExecutive: ClientRecord = {
  id: "report-executive",
  title: "Executive Wellness Report",
  subtitle: "Q3 2026 · Published · Executive committee",
  meta: "High-level scorecard, risk narrative, ROI, and next action summary.",
  status: "Published",
  statusTone: "success",
  search: "executive wellness report q3 published executive committee",
  filters: { type: "Executive Wellness Report", period: "Q3 2026", status: "Published" },
  fields: [
    { label: "Wellness score", value: "82" },
    { label: "Risk", value: "Medium" },
    { label: "Next action", value: "Follow-up" },
  ],
  details: [{ label: "Report focus", value: "Board-ready narrative with concise wellness and business impact context." }],
  progress: 90,
};

const insightParticipation: ClientRecord = {
  id: "insight-participation",
  title: "Participation gap in Operations",
  subtitle: "Operations · Medium risk trend",
  meta: "Operations participation trails head office by 18 percentage points.",
  status: "Medium",
  statusTone: "warning",
  search: "participation gap operations medium risk",
  filters: { area: "Insights", risk: "Medium", department: "Operations" },
  fields: [
    { label: "Gap", value: "18 pts" },
    { label: "Trend", value: "Stable" },
    { label: "Impact", value: "Attendance" },
  ],
  details: [
    { label: "Executive interpretation", value: "Shift-aligned reminders and manager support are likely to improve screening reach." },
    { label: "Privacy", value: "Aggregated department-level insight only.", tone: "success" },
  ],
  progress: 58,
};

const insightOperationsRisk: ClientRecord = {
  id: "insight-ops-risk",
  title: "Operations follow-up risk",
  subtitle: "Operations · High priority",
  meta: "Repeat follow-up attendance is lower in shift-based teams.",
  status: "High",
  statusTone: "danger",
  search: "operations follow up risk high priority",
  filters: { risk: "High", department: "Operations" },
  fields: [
    { label: "Priority", value: "High" },
    { label: "Cohort", value: "Operations" },
    { label: "Action", value: "BP follow-up" },
  ],
  details: [{ label: "Executive interpretation", value: "A focused onsite follow-up can reduce avoidable escalation and improve participation continuity." }],
  progress: 42,
};

const insightFinanceStress: ClientRecord = {
  id: "insight-finance",
  title: "Finance team wellbeing movement",
  subtitle: "Finance · Low risk trend",
  meta: "Participation and coaching uptake improved quarter over quarter.",
  status: "Low",
  statusTone: "success",
  search: "finance wellbeing movement low risk",
  filters: { risk: "Low", department: "Finance" },
  fields: [
    { label: "Risk", value: "Low" },
    { label: "Trend", value: "Improving" },
    { label: "Action", value: "Maintain" },
  ],
  details: [{ label: "Executive interpretation", value: "Maintain quarterly check-ins and leadership communication." }],
  progress: 86,
};

const departmentOperations: ClientRecord = {
  id: "dept-operations",
  title: "Department risk summary",
  subtitle: "Operations, Finance, Executive, Customer Support",
  meta: "Operations is the only high-priority department in the current view.",
  status: "Watch",
  statusTone: "warning",
  search: "department risk summary operations finance executive customer support",
  filters: { area: "Insights", risk: "Medium", department: "Operations" },
  fields: [
    { label: "Operations", value: "High" },
    { label: "Finance", value: "Low" },
    { label: "Executive", value: "Low" },
  ],
  details: [{ label: "Summary", value: "Risk is aggregated and intended for planning, not individual diagnosis." }],
  progress: 66,
};

const activationAnnual: ClientRecord = {
  id: "activation-annual",
  title: "Annual health screening",
  subtitle: "Upcoming · Jul 18, 2026 · Head office",
  meta: "Services: BP, BMI, glucose, wellness questionnaire · 340 invited",
  status: "Scheduled",
  statusTone: "info",
  search: "annual health screening upcoming head office bp bmi glucose",
  filters: { area: "Activations", timing: "Upcoming", status: "Scheduled" },
  fields: [
    { label: "Invited", value: "340" },
    { label: "Expected", value: "260" },
    { label: "Services", value: "4" },
  ],
  details: [
    { label: "Services included", value: "Blood pressure, BMI, glucose, wellness questionnaire" },
    { label: "Practitioner team", value: "Pulse80 clinical team: 1 clinical lead, 4 screening practitioners" },
  ],
  progress: 76,
};

const activationExecutive: ClientRecord = {
  id: "activation-exec",
  title: "Executive wellness review",
  subtitle: "Upcoming · Jul 25, 2026 · Leadership cohort",
  meta: "Focused review for 24 invited leaders.",
  status: "Planning",
  statusTone: "warning",
  search: "executive wellness review upcoming leadership cohort",
  filters: { timing: "Upcoming", status: "Planning" },
  fields: [
    { label: "Invited", value: "24" },
    { label: "Expected", value: "20" },
    { label: "Services", value: "3" },
  ],
  details: [{ label: "Participation summary", value: "Executive invitations pending final confirmation." }],
  progress: 52,
};

const activationFollowup: ClientRecord = {
  id: "activation-followup",
  title: "Blood pressure follow-up clinic",
  subtitle: "Upcoming · Aug 02, 2026 · Operations site",
  meta: "Targeted follow-up for aggregated high-risk operations cohort.",
  status: "Scheduled",
  statusTone: "info",
  search: "blood pressure follow up clinic operations scheduled",
  filters: { timing: "Upcoming", status: "Scheduled" },
  fields: [
    { label: "Invited", value: "110" },
    { label: "Expected", value: "80" },
    { label: "Services", value: "2" },
  ],
  details: [{ label: "Services included", value: "BP review and referral routing guidance." }],
  progress: 64,
};

const activationPast: ClientRecord = {
  id: "activation-past",
  title: "Screening outcomes day",
  subtitle: "Past · Jun 14, 2026 · Head office",
  meta: "428 screened · 78% participation · report published",
  status: "Completed",
  statusTone: "success",
  search: "past screening outcomes day completed report published",
  filters: { timing: "Past", status: "Completed" },
  fields: [
    { label: "Screened", value: "428" },
    { label: "Participation", value: "78%" },
    { label: "Report", value: "Published" },
  ],
  details: [{ label: "Participation summary", value: "Strong head office turnout with production shift gap noted." }],
  progress: 100,
};

const recommendationBpFollowup: ClientRecord = {
  id: "rec-bp",
  title: "Focused blood pressure follow-up",
  subtitle: "High priority · Recommended",
  meta: "Business impact: reduce avoidable absenteeism and clinical escalation risk.",
  status: "Recommended",
  statusTone: "danger",
  search: "focused blood pressure follow up high priority recommended",
  filters: { area: "Recommendations", priority: "High", status: "Recommended" },
  fields: [
    { label: "Priority", value: "High" },
    { label: "Impact", value: "Absenteeism" },
    { label: "Timing", value: "30 days" },
  ],
  details: [{ label: "Business impact", value: "Targeted follow-up can improve workforce continuity and reduce unmanaged risk." }],
  progress: 32,
};

const recommendationManagerBriefing: ClientRecord = {
  id: "rec-manager",
  title: "Manager wellbeing briefing",
  subtitle: "Medium priority · Planned",
  meta: "Help managers support participation and referral conversations.",
  status: "Planned",
  statusTone: "info",
  search: "manager wellbeing briefing medium planned",
  filters: { priority: "Medium", status: "Planned" },
  fields: [
    { label: "Priority", value: "Medium" },
    { label: "Impact", value: "Engagement" },
    { label: "Timing", value: "July" },
  ],
  details: [{ label: "Business impact", value: "Manager communication is expected to improve follow-up attendance." }],
  progress: 62,
};

const recommendationParticipation: ClientRecord = {
  id: "rec-participation",
  title: "Shift-aligned participation campaign",
  subtitle: "Medium priority · Recommended",
  meta: "Improve screening reach for teams with lower attendance.",
  status: "Recommended",
  statusTone: "warning",
  search: "shift aligned participation campaign medium recommended",
  filters: { priority: "Medium", status: "Recommended" },
  fields: [
    { label: "Priority", value: "Medium" },
    { label: "Impact", value: "Participation" },
    { label: "Timing", value: "Before next activation" },
  ],
  details: [{ label: "Business impact", value: "Improves data confidence and helps identify support needs earlier." }],
  progress: 44,
};

const recommendationCompleted: ClientRecord = {
  id: "rec-complete",
  title: "Executive wellness review cadence",
  subtitle: "Low priority · Completed",
  meta: "Quarterly executive review cadence is now in place.",
  status: "Completed",
  statusTone: "success",
  search: "executive wellness review cadence low completed",
  filters: { priority: "Low", status: "Completed" },
  fields: [
    { label: "Priority", value: "Low" },
    { label: "Impact", value: "Leadership" },
    { label: "Timing", value: "Complete" },
  ],
  details: [{ label: "Business impact", value: "Keeps leadership aligned on wellness investment and risk trend movement." }],
  progress: 100,
};

const settingProfile: ClientRecord = {
  id: "set-profile",
  title: "Organization profile",
  subtitle: "Company profile, locations, and primary contacts",
  meta: "Prime Bank Botswana · 2,850 employees · 4 locations",
  status: "Complete",
  statusTone: "success",
  search: "organization profile company locations contacts",
  filters: { area: "Organization" },
  fields: [
    { label: "Employees", value: "2,850" },
    { label: "Locations", value: "4" },
    { label: "Primary contact", value: "HR Lead" },
  ],
  details: [{ label: "Summary", value: "Profile information is shown as mock organization data." }],
};

const settingUsers: ClientRecord = {
  id: "set-users",
  title: "Portal users",
  subtitle: "Executive, HR, finance, and wellness coordinator access",
  meta: "8 users · access review placeholder",
  status: "Active",
  statusTone: "info",
  search: "portal users executive hr finance wellness coordinator",
  filters: { area: "Users" },
  fields: [
    { label: "Users", value: "8" },
    { label: "Executives", value: "3" },
    { label: "HR", value: "2" },
  ],
  details: [{ label: "Access note", value: "User management is a placeholder until authentication work resumes." }],
};

const settingNotifications: ClientRecord = {
  id: "set-notifications",
  title: "Notification preferences",
  subtitle: "Report availability, risk digest, activation reminders",
  meta: "Daily digest enabled · activation reminders enabled",
  status: "Active",
  statusTone: "success",
  search: "notification preferences report risk digest activation reminders",
  filters: { area: "Notifications" },
  fields: [
    { label: "Digest", value: "Daily" },
    { label: "Reports", value: "On" },
    { label: "Activations", value: "On" },
  ],
  details: [{ label: "Save behavior", value: "Preferences save locally with a success state." }],
};

const settingReports: ClientRecord = {
  id: "set-reports",
  title: "Report access settings",
  subtitle: "Executive reports, finance reports, department summaries",
  meta: "Restricted access for sensitive executive summaries",
  status: "Restricted",
  statusTone: "success",
  search: "report access settings executive finance department summaries",
  filters: { area: "Reports" },
  fields: [
    { label: "Executive", value: "Restricted" },
    { label: "Finance", value: "Restricted" },
    { label: "HR summaries", value: "Enabled" },
  ],
  details: [{ label: "Access note", value: "Settings are UI-only and do not connect to authentication." }],
};

export const clientPageConfigs: Record<ClientPageConfig["id"], ClientPageConfig> = {
  dashboard: {
    id: "dashboard",
    eyebrow,
    title: "Organization wellness dashboard",
    description: "Executive wellness intelligence for HR, finance, leadership, and wellness coordination.",
    primaryAction: "Download summary",
    searchPlaceholder: "Search reports, insights, activations",
    filters: [{ key: "area", label: "Area", options: ["All", "Reports", "Insights", "Activations", "Recommendations"] }],
    metrics: [
      { label: "Workforce Wellness Score", value: "82", detail: "+4 points since last quarter", tone: "success", icon: HeartPulse },
      { label: "Absenteeism Risk", value: "Medium", detail: "Two departments need attention", tone: "warning", icon: Activity },
      { label: "Presenteeism Index", value: "68", detail: "Improving against baseline", tone: "primary", icon: BarChart3 },
      { label: "Screening Participation", value: "74%", detail: "1,428 employees screened", tone: "primary", icon: ClipboardCheck },
      { label: "Employees Screened", value: "1,428", detail: "Across 4 locations", tone: "primary", icon: UsersRound },
      { label: "Reports Available", value: "12", detail: "3 new executive summaries", tone: "primary", icon: FileText },
      { label: "ROI / Impact", value: "1.8x", detail: "Estimated productivity value", tone: "success", icon: FileBarChart },
      { label: "Next Action", value: "BP follow-up", detail: "Operations cohort", tone: "danger", icon: Lightbulb },
    ],
    records: [reportRoi, activationAnnual, insightParticipation, recommendationBpFollowup, departmentOperations, reportRisk],
    featured: reportRoi,
    formFields: ["Summary title", "Recipient", "Reporting period"],
    emptyTitle: "No dashboard items found",
    emptyDescription: "Clear filters to return to the executive overview.",
  },
  reports: {
    id: "reports",
    eyebrow,
    title: "Reports",
    description: "Access executive-ready wellness reports, participation summaries, risk reports, and ROI analysis.",
    primaryAction: "Request report",
    searchPlaceholder: "Search report title, type, period",
    filters: [
      { key: "type", label: "Report type", options: ["All", "Executive Wellness Report", "Onsite Screening Summary", "Department Risk Report", "Absenteeism and Presenteeism Report", "ROI and Impact Report"] },
      { key: "period", label: "Period", options: ["All", "Q3 2026", "Q2 2026", "July 2026"] },
      { key: "status", label: "Status", options: ["All", "Published", "New", "Review"] },
    ],
    metrics: [
      { label: "Published reports", value: "12", detail: "3 new this quarter", tone: "success", icon: FileText },
      { label: "Executive summaries", value: "5", detail: "Leadership ready", tone: "primary", icon: FileBarChart },
      { label: "Risk reports", value: "4", detail: "Department level", tone: "warning", icon: BarChart3 },
      { label: "Downloads", value: "38", detail: "This month", tone: "neutral", icon: Activity },
    ],
    records: [reportRoi, reportScreening, reportRisk, reportAbsenteeism, reportExecutive],
    featured: reportRoi,
    formFields: ["Report type", "Reporting period", "Business question"],
    emptyTitle: "No reports match these filters",
    emptyDescription: "Try another report type, reporting period, or status.",
  },
  insights: {
    id: "insights",
    eyebrow,
    title: "Insights",
    description: "Understand workforce risk, participation movement, and business impact without exposing sensitive health records.",
    primaryAction: "Save insight",
    searchPlaceholder: "Search insights, departments, trends",
    tabs: ["Overview", "Risks", "Trends", "Departments"],
    filters: [
      { key: "risk", label: "Risk level", options: ["All", "Low", "Medium", "High"] },
      { key: "department", label: "Department", options: ["All", "Operations", "Finance", "Executive", "Customer Support"] },
    ],
    metrics: [
      { label: "Risk trend", value: "-3%", detail: "Quarter movement", tone: "success", icon: BarChart3 },
      { label: "Departments improving", value: "3", detail: "Participation and follow-up", tone: "success", icon: Activity },
      { label: "Watch areas", value: "2", detail: "Medium to high risk", tone: "warning", icon: HeartPulse },
      { label: "Actionable insights", value: "9", detail: "Executive ready", tone: "primary", icon: Lightbulb },
    ],
    records: [insightParticipation, insightOperationsRisk, insightFinanceStress, departmentOperations],
    formFields: ["Insight title", "Department", "Audience"],
    emptyTitle: "No insights in this view",
    emptyDescription: "Change tabs or filters to review another executive insight segment.",
  },
  activations: {
    id: "activations",
    eyebrow,
    title: "Activations",
    description: "Review upcoming and past wellness activations, services included, participation, and delivery summaries.",
    primaryAction: "Request activation",
    searchPlaceholder: "Search activation, service, location",
    filters: [
      { key: "timing", label: "Timing", options: ["All", "Upcoming", "Past"] },
      { key: "status", label: "Status", options: ["All", "Scheduled", "Completed", "Planning"] },
    ],
    metrics: [
      { label: "Upcoming", value: "3", detail: "Next one Jul 18", tone: "primary", icon: CalendarCheck },
      { label: "Completed", value: "8", detail: "This year", tone: "success", icon: ClipboardCheck },
      { label: "Participation avg", value: "74%", detail: "Across activations", tone: "primary", icon: UsersRound },
      { label: "Services used", value: "6", detail: "Screening and coaching", tone: "neutral", icon: ShieldCheck },
    ],
    records: [activationAnnual, activationExecutive, activationFollowup, activationPast],
    formFields: ["Activation type", "Preferred period", "Location"],
    emptyTitle: "No activations match this view",
    emptyDescription: "Switch between upcoming and past activations or clear status filters.",
  },
  recommendations: {
    id: "recommendations",
    eyebrow,
    title: "Recommendations",
    description: "Prioritized interventions with business impact context and clear next actions.",
    primaryAction: "Request activation",
    searchPlaceholder: "Search recommendations, business impact, status",
    filters: [
      { key: "priority", label: "Priority", options: ["All", "High", "Medium", "Low"] },
      { key: "status", label: "Status", options: ["All", "Recommended", "Planned", "Completed"] },
    ],
    metrics: [
      { label: "Recommended", value: "5", detail: "Ready to plan", tone: "warning", icon: Lightbulb },
      { label: "Planned", value: "3", detail: "In coordination", tone: "primary", icon: CalendarCheck },
      { label: "Completed", value: "4", detail: "This quarter", tone: "success", icon: ClipboardCheck },
      { label: "High impact", value: "2", detail: "Risk and ROI focused", tone: "danger", icon: HeartPulse },
    ],
    records: [recommendationBpFollowup, recommendationManagerBriefing, recommendationParticipation, recommendationCompleted],
    formFields: ["Intervention", "Preferred timing", "Business owner"],
    emptyTitle: "No recommendations match these filters",
    emptyDescription: "Adjust priority or status to review other recommended interventions.",
  },
  settings: {
    id: "settings",
    eyebrow,
    title: "Settings",
    description: "Manage organization profile details, report access, portal users, and notification preferences.",
    primaryAction: "Save settings",
    searchPlaceholder: "Search settings",
    filters: [{ key: "area", label: "Area", options: ["All", "Organization", "Users", "Notifications", "Reports"] }],
    metrics: [
      { label: "Portal users", value: "8", detail: "Executive and HR access", tone: "primary", icon: UsersRound },
      { label: "Report access", value: "Restricted", detail: "Leadership and HR", tone: "success", icon: ShieldCheck },
      { label: "Notifications", value: "Daily", detail: "Risk and report digest", tone: "primary", icon: Settings },
      { label: "Profile status", value: "Complete", detail: "Organization summary", tone: "success", icon: ClipboardCheck },
    ],
    records: [settingProfile, settingUsers, settingNotifications, settingReports],
    formFields: ["Setting", "Owner", "Preference"],
    emptyTitle: "No settings match this area",
    emptyDescription: "Clear filters to review organization, portal, report, and notification settings.",
  },
};
