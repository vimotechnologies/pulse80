import {
  Activity,
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  FileBarChart,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Lightbulb,
  Microscope,
  Settings,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "@/components/icons/IconsaxIcons";
import type { PortalNavItem } from "@/components/portal/PortalSidebarItem";
import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";

export type PortalKey = "admin" | "client" | "practitioner";
export type Tone = "primary" | "success" | "warning" | "danger" | "neutral";

export type PortalConfig = {
  key: PortalKey;
  name: string;
  description: string;
  eyebrow: string;
  dashboardTitle: string;
  dashboardDescription: string;
  userLabel: string;
  userRole: string;
  items: PortalNavItem[];
};

export type PortalMetric = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: IconsaxIcon;
  progress?: number;
  actionLabel?: string;
};

export type PortalListItem = {
  title: string;
  meta: string;
  status: string;
  tone: "success" | "warning" | "danger" | "info" | "neutral";
};

export type PortalInsight = {
  title: string;
  detail: string;
  tone: Tone;
};

export type PortalDashboardSection = {
  title: string;
  description: string;
  items: PortalListItem[];
};

export type PortalDashboardData = {
  metrics: PortalMetric[];
  sections: PortalDashboardSection[];
  insightsTitle: string;
  insightsDescription: string;
  insights: PortalInsight[];
};

export const portalConfigs: Record<PortalKey, PortalConfig> = {
  admin: {
    key: "admin",
    name: "Admin / Operations Portal",
    description: "Internal Pulse80 operations, delivery, and governance.",
    eyebrow: "Admin Operations",
    dashboardTitle: "Operations command centre",
    dashboardDescription:
      "Monitor organizations, activations, practitioner readiness, reports, and wellness intelligence from one clinical operations view.",
    userLabel: "Refiloe M.",
    userRole: "Operations Lead",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Organizations", href: "/admin/organizations", icon: Building2 },
      { label: "Activations", href: "/admin/activations", icon: CalendarCheck },
      { label: "Screenings", href: "/admin/screenings", icon: Microscope },
      { label: "Practitioners", href: "/admin/practitioners", icon: Stethoscope },
      { label: "Results", href: "/admin/results", icon: HeartPulse },
      { label: "Reports", href: "/admin/reports", icon: FileBarChart },
      { label: "Insights", href: "/admin/insights", icon: BarChart3 },
      { label: "Recommendations", href: "/admin/recommendations", icon: Lightbulb },
      { label: "Billing", href: "/admin/billing", icon: CreditCard },
      { label: "Users", href: "/admin/users", icon: UsersRound },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  client: {
    key: "client",
    name: "Client Organization Portal",
    description: "Organization wellness intelligence for HR and leadership.",
    eyebrow: "Client Organization",
    dashboardTitle: "Organization wellness dashboard",
    dashboardDescription:
      "Review workforce wellness indicators, reports, activations, and recommended interventions for your organization.",
    userLabel: "Mpho D.",
    userRole: "HR Wellness Lead",
    items: [
      { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
      { label: "Reports", href: "/client/reports", icon: FileText },
      { label: "Insights", href: "/client/insights", icon: BarChart3 },
      { label: "Activations", href: "/client/activations", icon: CalendarCheck },
      { label: "Recommendations", href: "/client/recommendations", icon: Lightbulb },
      { label: "Settings", href: "/client/settings", icon: Settings },
    ],
  },
  practitioner: {
    key: "practitioner",
    name: "Health Practitioner Portal",
    description: "Assignments, screenings, documents, and submissions.",
    eyebrow: "Health Practitioner",
    dashboardTitle: "Practitioner workspace",
    dashboardDescription:
      "View assigned activations, screening progress, profile readiness, documents, and payment status.",
    userLabel: "Dr. K. Molefe",
    userRole: "Verified Practitioner",
    items: [
      { label: "Dashboard", href: "/practitioner/dashboard", icon: LayoutDashboard },
      { label: "Assignments", href: "/practitioner/assignments", icon: CalendarCheck },
      { label: "Screenings", href: "/practitioner/screenings", icon: ClipboardCheck },
      { label: "Profile", href: "/practitioner/profile", icon: Stethoscope },
      { label: "Documents", href: "/practitioner/documents", icon: FileText },
      { label: "Payments", href: "/practitioner/payments", icon: CreditCard },
      { label: "Settings", href: "/practitioner/settings", icon: Settings },
    ],
  },
};

export const portalDashboards: Record<PortalKey, PortalDashboardData> = {
  admin: {
    metrics: [
      {
        label: "Active Organizations",
        value: "42",
        detail: "36 retained accounts, 6 onboarding",
        tone: "primary",
        icon: Building2,
        progress: 86,
        actionLabel: "View organizations",
      },
      {
        label: "Upcoming Activations",
        value: "18",
        detail: "6 scheduled this week",
        tone: "warning",
        icon: CalendarCheck,
        progress: 68,
        actionLabel: "Open schedule",
      },
      {
        label: "Verified Practitioners",
        value: "126",
        detail: "38 available today",
        tone: "success",
        icon: Stethoscope,
        progress: 82,
        actionLabel: "Review capacity",
      },
      {
        label: "Reports Published",
        value: "87",
        detail: "12 published this month",
        tone: "primary",
        icon: FileBarChart,
        progress: 74,
        actionLabel: "View reports",
      },
      {
        label: "Employees Reached",
        value: "31.4k",
        detail: "+3.2k this quarter",
        tone: "success",
        icon: ClipboardCheck,
        progress: 79,
        actionLabel: "View reach",
      },
    ],
    sections: [
      {
        title: "Today's Activations",
        description: "Operational control for onsite delivery teams.",
        items: [
          {
            title: "Botswana Insurance Holdings",
            meta: "Cardiometabolic screening · 08:30 · Gaborone HQ · 6 practitioners",
            status: "in-progress",
            tone: "info",
          },
          {
            title: "Kalahari Mining Group",
            meta: "Annual wellness activation · 11:00 · Jwaneng site · equipment dispatched",
            status: "scheduled",
            tone: "neutral",
          },
          {
            title: "Mowana Logistics",
            meta: "Blood pressure follow-up · 14:30 · Francistown depot · nurse lead assigned",
            status: "risk review",
            tone: "danger",
          },
        ],
      },
      {
        title: "Practitioner Network",
        description: "Coverage, credentialing, and readiness snapshot.",
        items: [
          {
            title: "Available today",
            meta: "38 verified practitioners ready for same-day assignment",
            status: "verified",
            tone: "success",
          },
          {
            title: "Credential renewals",
            meta: "9 practitioner profiles need document review this week",
            status: "pending",
            tone: "warning",
          },
          {
            title: "Assigned this week",
            meta: "64 practitioner shifts allocated across 11 organizations",
            status: "scheduled",
            tone: "info",
          },
        ],
      },
      {
        title: "Alerts & Notifications",
        description: "Operational signals that may require action.",
        items: [
          {
            title: "High-risk cohort flagged",
            meta: "Mowana Logistics has elevated hypertension follow-up risk",
            status: "critical",
            tone: "danger",
          },
          {
            title: "Report QA approaching SLA",
            meta: "Three executive reports require clinical sign-off before 15:00",
            status: "awaiting review",
            tone: "warning",
          },
          {
            title: "Activation kit confirmed",
            meta: "Prime Bank onsite kit was reconciled and released",
            status: "complete",
            tone: "success",
          },
        ],
      },
      {
        title: "Recent Reports",
        description: "Latest client-facing report movement.",
        items: [
          {
            title: "Absenteeism Impact Overview",
            meta: "Delta Foods · executive summary · published Jul 4",
            status: "published",
            tone: "success",
          },
          {
            title: "Workforce Wellness ROI",
            meta: "Prime Bank · clinical review requested · Jul 5",
            status: "review",
            tone: "warning",
          },
          {
            title: "Screening Outcomes Summary",
            meta: "Gaborone Textiles · draft prepared by analytics",
            status: "draft",
            tone: "neutral",
          },
        ],
      },
    ],
    insightsTitle: "Platform Insights",
    insightsDescription: "Operational intelligence across the Pulse80 platform.",
    insights: [
      {
        title: "Activation throughput",
        detail: "Screening capacity is strongest between 08:00 and 11:00 across Gaborone sites.",
        tone: "primary",
      },
      {
        title: "Reports awaiting review",
        detail: "Seven reports are ready for QA, with three due before close of business.",
        tone: "warning",
      },
      {
        title: "Health risk signal",
        detail: "Hypertension follow-up risk increased in one logistics cohort.",
        tone: "danger",
      },
    ],
  },
  client: {
    metrics: [
      {
        label: "Workforce Wellness Score",
        value: "82",
        detail: "+4 points since last quarter",
        tone: "success",
        icon: HeartPulse,
        progress: 82,
        actionLabel: "Score detail",
      },
      {
        label: "Absenteeism Risk",
        value: "Medium",
        detail: "Two departments need attention",
        tone: "warning",
        icon: Activity,
        progress: 58,
        actionLabel: "Review risk",
      },
      {
        label: "Presenteeism Index",
        value: "68",
        detail: "Down 5 points from baseline",
        tone: "success",
        icon: BarChart3,
        progress: 68,
        actionLabel: "View trend",
      },
      {
        label: "Screening Participation",
        value: "74%",
        detail: "1,428 employees screened",
        tone: "primary",
        icon: ClipboardCheck,
        progress: 74,
        actionLabel: "Participation",
      },
      {
        label: "Employees Screened",
        value: "1,428",
        detail: "Across 4 locations",
        tone: "primary",
        icon: UsersRound,
        progress: 71,
        actionLabel: "View cohort",
      },
      {
        label: "Reports Available",
        value: "12",
        detail: "3 new executive summaries",
        tone: "primary",
        icon: FileText,
        progress: 92,
        actionLabel: "Open reports",
      },
    ],
    sections: [
      {
        title: "Latest Reports",
        description: "Executive-ready wellness reports and summaries.",
        items: [
          {
            title: "Workforce Wellness ROI",
            meta: "Published Jul 4 · executive summary and finance notes",
            status: "published",
            tone: "success",
          },
          {
            title: "Screening Outcomes Summary",
            meta: "Published Jul 2 · clinical appendix available",
            status: "published",
            tone: "success",
          },
          {
            title: "Absenteeism Impact Overview",
            meta: "Draft preview · awaiting leadership approval",
            status: "review",
            tone: "warning",
          },
        ],
      },
      {
        title: "Key Insights",
        description: "Decision-support signals for HR and executives.",
        items: [
          {
            title: "Participation gap",
            meta: "Operations participation trails head office by 18 percentage points",
            status: "monitor",
            tone: "warning",
          },
          {
            title: "Risk concentration",
            meta: "Elevated cardiometabolic flags are concentrated in two job families",
            status: "risk focus",
            tone: "danger",
          },
          {
            title: "Engagement improvement",
            meta: "Follow-up coaching cohorts show better repeat attendance",
            status: "improving",
            tone: "success",
          },
        ],
      },
      {
        title: "Recommended Interventions",
        description: "Prioritized actions for workforce wellness planning.",
        items: [
          {
            title: "Focused blood pressure follow-up",
            meta: "Prioritize teams with repeated elevated readings",
            status: "high priority",
            tone: "danger",
          },
          {
            title: "Manager wellbeing briefing",
            meta: "Equip managers with low-friction support prompts",
            status: "recommended",
            tone: "info",
          },
          {
            title: "Screening participation campaign",
            meta: "Send reminders to remaining eligible employees",
            status: "ready",
            tone: "success",
          },
        ],
      },
      {
        title: "Upcoming Activations",
        description: "Scheduled onsite wellness work for your organization.",
        items: [
          {
            title: "Annual health screening",
            meta: "Head office · Jul 12 · 340 employees invited",
            status: "scheduled",
            tone: "info",
          },
          {
            title: "Executive wellness review",
            meta: "Leadership cohort · Jul 18 · 24 participants",
            status: "confirmed",
            tone: "success",
          },
          {
            title: "Hypertension follow-up clinic",
            meta: "Operations division · Jul 25 · clinical follow-up",
            status: "risk focus",
            tone: "danger",
          },
        ],
      },
    ],
    insightsTitle: "Recommended Interventions",
    insightsDescription: "Executive summary of recommended next actions.",
    insights: [
      {
        title: "Reduce absenteeism risk",
        detail: "Target shift-based teams with early follow-up and supervisor briefing.",
        tone: "danger",
      },
      {
        title: "Improve screening reach",
        detail: "Use department-specific reminders before the July activation window.",
        tone: "primary",
      },
      {
        title: "Sustain participation",
        detail: "Keep follow-up coaching available to employees with repeat flags.",
        tone: "success",
      },
    ],
  },
  practitioner: {
    metrics: [
      {
        label: "Upcoming Assignments",
        value: "6",
        detail: "Next assignment starts tomorrow",
        tone: "primary",
        icon: CalendarCheck,
        progress: 66,
        actionLabel: "View assignments",
      },
      {
        label: "Completed Screenings",
        value: "184",
        detail: "+42 completed this month",
        tone: "success",
        icon: ClipboardCheck,
        progress: 88,
        actionLabel: "View screenings",
      },
      {
        label: "Verification Status",
        value: "Verified",
        detail: "Clinical credentials active",
        tone: "success",
        icon: ShieldCheck,
        progress: 96,
        actionLabel: "Profile status",
      },
      {
        label: "Pending Submissions",
        value: "3",
        detail: "Activation summaries due",
        tone: "warning",
        icon: FileText,
        progress: 42,
        actionLabel: "Submit summaries",
      },
    ],
    sections: [
      {
        title: "Assigned Activations",
        description: "Upcoming field work assigned to you.",
        items: [
          {
            title: "Prime Bank wellness activation",
            meta: "Jul 7 · Gaborone · 08:00 · BP, BMI, glucose capture",
            status: "confirmed",
            tone: "success",
          },
          {
            title: "Delta Foods screening day",
            meta: "Jul 10 · Lobatse · 09:30 · onsite team of 4",
            status: "scheduled",
            tone: "info",
          },
          {
            title: "Mowana Logistics follow-up clinic",
            meta: "Jul 14 · Francistown · 14:00 · hypertension follow-up",
            status: "risk focus",
            tone: "danger",
          },
        ],
      },
      {
        title: "Screening Tasks",
        description: "Simple workflow items for current assignments.",
        items: [
          {
            title: "Prime Bank pre-brief",
            meta: "Review screening protocol and arrival instructions",
            status: "due today",
            tone: "warning",
          },
          {
            title: "Delta Foods consent pack",
            meta: "Confirm paper backup forms and device readiness",
            status: "ready",
            tone: "success",
          },
          {
            title: "Mowana follow-up list",
            meta: "Review flagged participants before site arrival",
            status: "clinical review",
            tone: "danger",
          },
        ],
      },
      {
        title: "Profile Compliance",
        description: "Readiness items for continued assignment eligibility.",
        items: [
          {
            title: "Professional profile",
            meta: "Speciality, regions, and contact details complete",
            status: "complete",
            tone: "success",
          },
          {
            title: "Practice license",
            meta: "Renewal document requested before Aug 1",
            status: "pending",
            tone: "warning",
          },
          {
            title: "Banking details",
            meta: "Payment profile verified",
            status: "verified",
            tone: "success",
          },
        ],
      },
      {
        title: "Recent Activity",
        description: "Recent submissions and operational updates.",
        items: [
          {
            title: "Screening batch submitted",
            meta: "42 Delta Foods screening records submitted yesterday",
            status: "submitted",
            tone: "success",
          },
          {
            title: "Activation summary pending",
            meta: "Prime Bank draft summary due after tomorrow's activation",
            status: "pending",
            tone: "warning",
          },
          {
            title: "Credential note added",
            meta: "Operations requested updated license document",
            status: "action needed",
            tone: "warning",
          },
        ],
      },
    ],
    insightsTitle: "Field Workflow Notes",
    insightsDescription: "Simple reminders for practitioner delivery.",
    insights: [
      {
        title: "Arrive prepared",
        detail: "Confirm kit readiness and site contact before each activation.",
        tone: "success",
      },
      {
        title: "Submit promptly",
        detail: "Activation summaries should be submitted within 24 hours of completion.",
        tone: "warning",
      },
      {
        title: "Escalate risks",
        detail: "Flag critical readings immediately using the onsite escalation protocol.",
        tone: "danger",
      },
    ],
  },
};

export const placeholderPages: Record<
  string,
  { eyebrow: string; title: string; description: string; focus: string[] }
> = {
  "/admin/organizations": {
    eyebrow: "Admin Operations",
    title: "Organizations",
    description: "Manage client organization profiles, contacts, segments, and account health.",
    focus: ["Organization registry", "Contract status", "Client contacts"],
  },
  "/admin/activations": {
    eyebrow: "Admin Operations",
    title: "Activations",
    description: "Plan, schedule, and monitor onsite and virtual wellness activations.",
    focus: ["Activation calendar", "Readiness checklist", "Delivery status"],
  },
  "/admin/screenings": {
    eyebrow: "Admin Operations",
    title: "Screenings",
    description: "Coordinate screening types, clinical workflows, and onsite capture readiness.",
    focus: ["Screening protocols", "Capture workflows", "Clinical review"],
  },
  "/admin/practitioners": {
    eyebrow: "Admin Operations",
    title: "Practitioners",
    description: "Manage verified practitioner profiles, availability, documents, and assignments.",
    focus: ["Credentialing", "Availability", "Assignment history"],
  },
  "/admin/results": {
    eyebrow: "Admin Operations",
    title: "Screening Results",
    description: "Review aggregated dummy screening outcomes and risk flags.",
    focus: ["Result queues", "Risk flags", "Clinical QA"],
  },
  "/admin/reports": {
    eyebrow: "Admin Operations",
    title: "Reports",
    description: "Prepare, review, and publish client-facing wellness reports.",
    focus: ["Draft reports", "Review queue", "Published outputs"],
  },
  "/admin/insights": {
    eyebrow: "Admin Operations",
    title: "Insights",
    description: "Monitor platform-wide wellness intelligence and emerging patterns.",
    focus: ["Population trends", "Cohort comparisons", "Risk signals"],
  },
  "/admin/recommendations": {
    eyebrow: "Admin Operations",
    title: "Recommendations",
    description: "Create evidence-informed wellness recommendations for client organizations.",
    focus: ["Intervention library", "Clinical rationale", "Client actions"],
  },
  "/admin/billing": {
    eyebrow: "Admin Operations",
    title: "Billing",
    description: "Track activation billing, practitioner payments, invoices, and account status.",
    focus: ["Invoices", "Payment status", "Billing notes"],
  },
  "/admin/users": {
    eyebrow: "Admin Operations",
    title: "Users & Roles",
    description: "Prepare role-based access controls for Pulse80 teams and portal users.",
    focus: ["User directory", "Role matrix", "Access review"],
  },
  "/admin/settings": {
    eyebrow: "Admin Operations",
    title: "Settings",
    description: "Configure operational defaults, portal preferences, and account settings.",
    focus: ["Portal defaults", "Notification rules", "Brand settings"],
  },
  "/client/reports": {
    eyebrow: "Client Organization",
    title: "Reports",
    description: "View organization-ready reports, executive summaries, and wellness outputs.",
    focus: ["Published reports", "Executive summaries", "Downloads"],
  },
  "/client/insights": {
    eyebrow: "Client Organization",
    title: "Insights",
    description: "Understand workforce wellness patterns, risks, and participation trends.",
    focus: ["Wellness trends", "Risk indicators", "Department comparisons"],
  },
  "/client/activations": {
    eyebrow: "Client Organization",
    title: "Activations",
    description: "Track upcoming activations, participation readiness, and onsite logistics.",
    focus: ["Activation schedule", "Employee invitations", "Logistics"],
  },
  "/client/recommendations": {
    eyebrow: "Client Organization",
    title: "Recommendations",
    description: "Review recommended interventions and practical next steps for your workforce.",
    focus: ["Interventions", "Priority actions", "Expected impact"],
  },
  "/client/settings": {
    eyebrow: "Client Organization",
    title: "Settings",
    description: "Manage organization profile, notification preferences, and portal settings.",
    focus: ["Organization profile", "Notifications", "Portal access"],
  },
  "/practitioner/assignments": {
    eyebrow: "Health Practitioner",
    title: "Assignments",
    description: "View assigned activations, site details, times, and clinical requirements.",
    focus: ["Upcoming work", "Site details", "Assignment notes"],
  },
  "/practitioner/screenings": {
    eyebrow: "Health Practitioner",
    title: "Screenings",
    description: "Prepare screening capture workflows for assigned activations.",
    focus: ["Capture queue", "Clinical fields", "Submission status"],
  },
  "/practitioner/profile": {
    eyebrow: "Health Practitioner",
    title: "Profile",
    description: "Maintain professional details, speciality, regions, and availability.",
    focus: ["Personal details", "Clinical speciality", "Availability"],
  },
  "/practitioner/documents": {
    eyebrow: "Health Practitioner",
    title: "Documents",
    description: "Upload and review credentialing, identity, and compliance documents.",
    focus: ["License", "Identity document", "Compliance files"],
  },
  "/practitioner/payments": {
    eyebrow: "Health Practitioner",
    title: "Payments",
    description: "Track submitted activation summaries, payment status, and banking readiness.",
    focus: ["Payment history", "Pending summaries", "Banking profile"],
  },
  "/practitioner/settings": {
    eyebrow: "Health Practitioner",
    title: "Settings",
    description: "Manage practitioner preferences, notification settings, and portal defaults.",
    focus: ["Notifications", "Portal preferences", "Account defaults"],
  },
};
