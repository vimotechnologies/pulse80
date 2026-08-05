import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
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
  Lightbulb,
  Microscope,
  Settings,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "@/components/icons/IconsaxIcons";

export type AdminTone = "primary" | "success" | "warning" | "danger" | "neutral";

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
  tone: AdminTone;
  icon: IconsaxIcon;
};

export type AdminFilter = {
  key: string;
  label: string;
  options: string[];
};

export type AdminRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  statusTone: "success" | "warning" | "danger" | "info" | "neutral";
  search: string;
  filters: Record<string, string>;
  fields: { label: string; value: string }[];
  details: { label: string; value: string; tone?: AdminTone }[];
  progress?: number;
  warning?: string;
  checklist?: { label: string; done: boolean }[];
};

export type AdminPageConfig = {
  id:
    | "organizations"
    | "activations"
    | "practitioners"
    | "screenings"
    | "results"
    | "reports"
    | "insights"
    | "recommendations"
    | "billing"
    | "users"
    | "settings";
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
  searchPlaceholder: string;
  filters: AdminFilter[];
  metrics: AdminMetric[];
  records: AdminRecord[];
  tabs?: string[];
  formTitle: string;
  formFields: string[];
  emptyTitle: string;
  emptyDescription: string;
};

const commonEyebrow = "Admin Operations";
const AlertIcon = Activity;
const LockIcon = ShieldCheck;
const BellIcon = Activity;

export const adminPageConfigs: Record<AdminPageConfig["id"], AdminPageConfig> = {
  organizations: {
    id: "organizations",
    eyebrow: commonEyebrow,
    title: "Organizations",
    description: "Manage client accounts, package health, activation cadence, and executive reporting readiness.",
    primaryAction: "Create organization",
    secondaryAction: "Review accounts",
    searchPlaceholder: "Search organizations, industries, locations",
    filters: [
      { key: "status", label: "Status", options: ["All", "Active", "Onboarding", "At Risk", "Archived"] },
      { key: "industry", label: "Industry", options: ["All", "Financial Services", "Mining", "Logistics", "Manufacturing", "Public Sector"] },
      { key: "risk", label: "Risk", options: ["All", "Low", "Medium", "High"] },
    ],
    metrics: [
      { label: "Active accounts", value: "42", detail: "6 onboarding", tone: "primary", icon: Building2 },
      { label: "High-risk accounts", value: "5", detail: "2 need review today", tone: "danger", icon: HeartPulse },
      { label: "Avg wellness score", value: "78", detail: "+3 this quarter", tone: "success", icon: BarChart3 },
      { label: "Reports published", value: "87", detail: "12 this month", tone: "primary", icon: FileBarChart },
    ],
    records: [
      {
        id: "org-prime-bank",
        title: "Prime Bank Botswana",
        subtitle: "Financial Services · Gaborone",
        meta: "2,850 employees · Executive Care package · next activation Jul 18",
        status: "Active",
        statusTone: "success",
        search: "prime bank botswana financial services gaborone executive care",
        filters: { status: "Active", industry: "Financial Services", risk: "Medium" },
        fields: [
          { label: "Employees", value: "2,850" },
          { label: "Wellness score", value: "82" },
          { label: "Risk level", value: "Medium" },
          { label: "Reports", value: "14" },
        ],
        details: [
          { label: "Active package", value: "Executive Care" },
          { label: "Last activation", value: "Jun 12, 2026" },
          { label: "Next activation", value: "Jul 18, 2026" },
          { label: "Account status", value: "Active", tone: "success" },
        ],
        progress: 82,
      },
      {
        id: "org-kalahari-mining",
        title: "Kalahari Mining Group",
        subtitle: "Mining · Jwaneng",
        meta: "4,400 employees · Industrial Wellness package · equipment readiness pending",
        status: "Onboarding",
        statusTone: "warning",
        search: "kalahari mining group mining jwaneng industrial wellness",
        filters: { status: "Onboarding", industry: "Mining", risk: "Medium" },
        fields: [
          { label: "Employees", value: "4,400" },
          { label: "Wellness score", value: "71" },
          { label: "Risk level", value: "Medium" },
          { label: "Reports", value: "3" },
        ],
        details: [
          { label: "Active package", value: "Industrial Wellness" },
          { label: "Last activation", value: "May 24, 2026" },
          { label: "Next activation", value: "Jul 09, 2026" },
          { label: "Account status", value: "Onboarding", tone: "warning" },
        ],
        progress: 64,
        warning: "Site readiness checklist has two open logistics items.",
      },
      {
        id: "org-mowana-logistics",
        title: "Mowana Logistics",
        subtitle: "Logistics · Francistown",
        meta: "1,620 employees · Workforce Core package · hypertension follow-up flagged",
        status: "At Risk",
        statusTone: "danger",
        search: "mowana logistics francistown workforce core high risk",
        filters: { status: "At Risk", industry: "Logistics", risk: "High" },
        fields: [
          { label: "Employees", value: "1,620" },
          { label: "Wellness score", value: "63" },
          { label: "Risk level", value: "High" },
          { label: "Reports", value: "9" },
        ],
        details: [
          { label: "Active package", value: "Workforce Core" },
          { label: "Last activation", value: "Jul 02, 2026" },
          { label: "Next activation", value: "Jul 25, 2026" },
          { label: "Account status", value: "At Risk", tone: "danger" },
        ],
        progress: 46,
        warning: "Risk review recommended before next activation.",
      },
      {
        id: "org-gaborone-textiles",
        title: "Gaborone Textiles",
        subtitle: "Manufacturing · Gaborone",
        meta: "920 employees · Screening Essentials package · reports current",
        status: "Active",
        statusTone: "success",
        search: "gaborone textiles manufacturing screening essentials",
        filters: { status: "Active", industry: "Manufacturing", risk: "Low" },
        fields: [
          { label: "Employees", value: "920" },
          { label: "Wellness score", value: "86" },
          { label: "Risk level", value: "Low" },
          { label: "Reports", value: "7" },
        ],
        details: [
          { label: "Active package", value: "Screening Essentials" },
          { label: "Last activation", value: "Jun 29, 2026" },
          { label: "Next activation", value: "Aug 04, 2026" },
          { label: "Account status", value: "Active", tone: "success" },
        ],
        progress: 86,
      },
    ],
    formTitle: "Organization profile",
    formFields: ["Company name", "Industry", "Location", "Employee count", "Active package"],
    emptyTitle: "No organizations match this view",
    emptyDescription: "Adjust search or filters, or create a mock organization to populate the account list.",
  },
  activations: {
    id: "activations",
    eyebrow: commonEyebrow,
    title: "Wellness Activations",
    description: "Plan onsite delivery, assign practitioners, track service readiness, and monitor activation progress.",
    primaryAction: "Create activation",
    secondaryAction: "Assign team",
    searchPlaceholder: "Search activation, organization, location",
    filters: [
      { key: "status", label: "Status", options: ["All", "Scheduled", "In Progress", "Completed", "At Risk"] },
      { key: "location", label: "Location", options: ["All", "Gaborone", "Jwaneng", "Francistown", "Lobatse"] },
    ],
    metrics: [
      { label: "This month", value: "18", detail: "6 this week", tone: "primary", icon: CalendarCheck },
      { label: "Practitioners assigned", value: "64", detail: "12 open slots", tone: "warning", icon: Stethoscope },
      { label: "Expected employees", value: "5.8k", detail: "Across 11 sites", tone: "primary", icon: UsersRound },
      { label: "On track", value: "84%", detail: "Readiness average", tone: "success", icon: ClipboardCheck },
    ],
    records: [
      {
        id: "act-prime-bank",
        title: "Executive Wellness Review",
        subtitle: "Prime Bank Botswana · Jul 18, 2026 · 08:30",
        meta: "Gaborone HQ · BP, BMI, glucose, executive consult · 260 expected",
        status: "Scheduled",
        statusTone: "info",
        search: "prime bank executive wellness review gaborone",
        filters: { status: "Scheduled", location: "Gaborone" },
        fields: [
          { label: "Expected", value: "260" },
          { label: "Time", value: "08:30" },
          { label: "Services", value: "4" },
          { label: "Practitioners", value: "6" },
        ],
        details: [
          { label: "Assigned practitioners", value: "Dr. K. Molefe, Nurse G. Tiro, 4 more" },
          { label: "Services", value: "Blood pressure, BMI, glucose, executive consult" },
          { label: "Completion", value: "72%" },
          { label: "Status", value: "Scheduled", tone: "primary" },
        ],
        checklist: [
          { label: "Site contact confirmed", done: true },
          { label: "Clinical kit packed", done: true },
          { label: "Practitioner brief sent", done: false },
        ],
        progress: 72,
      },
      {
        id: "act-kalahari",
        title: "Annual Screening Day",
        subtitle: "Kalahari Mining Group · Jul 09, 2026 · 11:00",
        meta: "Jwaneng Site · occupational wellness, BP, glucose · 540 expected",
        status: "At Risk",
        statusTone: "danger",
        search: "kalahari mining annual screening day jwaneng",
        filters: { status: "At Risk", location: "Jwaneng" },
        fields: [
          { label: "Expected", value: "540" },
          { label: "Time", value: "11:00" },
          { label: "Services", value: "5" },
          { label: "Practitioners", value: "8" },
        ],
        details: [
          { label: "Assigned practitioners", value: "Nurse L. Setlhare, Dr. P. Sechele, 6 more" },
          { label: "Services", value: "BP, BMI, glucose, vision, occupational notes" },
          { label: "Completion", value: "48%" },
          { label: "Status", value: "At Risk", tone: "danger" },
        ],
        checklist: [
          { label: "Site access confirmed", done: false },
          { label: "Clinical kit packed", done: true },
          { label: "Practitioner brief sent", done: false },
        ],
        progress: 48,
        warning: "Two practitioner slots and site access confirmation are still open.",
      },
      {
        id: "act-mowana",
        title: "Hypertension Follow-up Clinic",
        subtitle: "Mowana Logistics · Jul 25, 2026 · 14:30",
        meta: "Francistown Depot · targeted follow-up · 180 expected",
        status: "Scheduled",
        statusTone: "info",
        search: "mowana logistics hypertension follow up francistown",
        filters: { status: "Scheduled", location: "Francistown" },
        fields: [
          { label: "Expected", value: "180" },
          { label: "Time", value: "14:30" },
          { label: "Services", value: "3" },
          { label: "Practitioners", value: "4" },
        ],
        details: [
          { label: "Assigned practitioners", value: "Dr. K. Molefe, Nurse T. Moremi, 2 more" },
          { label: "Services", value: "BP review, risk counselling, referral routing" },
          { label: "Completion", value: "68%" },
          { label: "Status", value: "Scheduled", tone: "primary" },
        ],
        progress: 68,
      },
    ],
    formTitle: "Activation setup",
    formFields: ["Organization", "Activation title", "Date", "Time", "Location", "Expected employees"],
    emptyTitle: "No activations in this schedule",
    emptyDescription: "Change status filters or create a mock activation for this period.",
  },
  practitioners: {
    id: "practitioners",
    eyebrow: commonEyebrow,
    title: "Practitioners",
    description: "Coordinate practitioner capacity, verification, service coverage, documents, and assignment readiness.",
    primaryAction: "Add practitioner",
    secondaryAction: "Review verification",
    searchPlaceholder: "Search practitioners, services, locations",
    filters: [
      { key: "profession", label: "Profession", options: ["All", "Doctor", "Nurse", "Dietitian", "Counsellor"] },
      { key: "location", label: "Location", options: ["All", "Gaborone", "Francistown", "Lobatse"] },
      { key: "verification", label: "Verification", options: ["All", "Verified", "Pending", "Expired"] },
      { key: "availability", label: "Availability", options: ["All", "Available", "Assigned", "Unavailable"] },
    ],
    metrics: [
      { label: "Verified", value: "126", detail: "38 available today", tone: "success", icon: ShieldCheck },
      { label: "Pending review", value: "9", detail: "Documents need QA", tone: "warning", icon: FileText },
      { label: "Assigned this week", value: "64", detail: "11 activations", tone: "primary", icon: CalendarCheck },
      { label: "Avg quality score", value: "94", detail: "+2 from June", tone: "success", icon: Stethoscope },
    ],
    records: [
      {
        id: "prac-molefe",
        title: "Dr. K. Molefe",
        subtitle: "Doctor · Gaborone · BP, glucose, executive consult",
        meta: "Verified · Available · 48 completed activations · quality score 97",
        status: "Verified",
        statusTone: "success",
        search: "dr k molefe doctor gaborone bp glucose executive consult verified available",
        filters: { profession: "Doctor", location: "Gaborone", verification: "Verified", availability: "Available" },
        fields: [
          { label: "Quality", value: "97" },
          { label: "Completed", value: "48" },
          { label: "Documents", value: "Current" },
          { label: "Availability", value: "Available" },
        ],
        details: [
          { label: "Services", value: "BP, glucose, executive consult" },
          { label: "Documents", value: "License current, ID verified, indemnity current", tone: "success" },
          { label: "Next assignment", value: "Prime Bank · Jul 18" },
          { label: "Verification", value: "Verified", tone: "success" },
        ],
        progress: 97,
      },
      {
        id: "prac-setlhare",
        title: "Nurse L. Setlhare",
        subtitle: "Nurse · Francistown · BP, BMI, onsite triage",
        meta: "Pending · Assigned · 31 completed activations · quality score 91",
        status: "Pending",
        statusTone: "warning",
        search: "nurse setlhare francistown bp bmi triage pending assigned",
        filters: { profession: "Nurse", location: "Francistown", verification: "Pending", availability: "Assigned" },
        fields: [
          { label: "Quality", value: "91" },
          { label: "Completed", value: "31" },
          { label: "Documents", value: "1 pending" },
          { label: "Availability", value: "Assigned" },
        ],
        details: [
          { label: "Services", value: "BP, BMI, onsite triage" },
          { label: "Documents", value: "Practice license pending review", tone: "warning" },
          { label: "Next assignment", value: "Kalahari Mining · Jul 09" },
          { label: "Verification", value: "Pending", tone: "warning" },
        ],
        progress: 78,
        warning: "Practice license renewal requires operations review.",
      },
      {
        id: "prac-dube",
        title: "T. Dube",
        subtitle: "Dietitian · Gaborone · nutrition consult, coaching",
        meta: "Verified · Unavailable · 22 completed activations · quality score 95",
        status: "Verified",
        statusTone: "success",
        search: "t dube dietitian gaborone nutrition coaching verified unavailable",
        filters: { profession: "Dietitian", location: "Gaborone", verification: "Verified", availability: "Unavailable" },
        fields: [
          { label: "Quality", value: "95" },
          { label: "Completed", value: "22" },
          { label: "Documents", value: "Current" },
          { label: "Availability", value: "Unavailable" },
        ],
        details: [
          { label: "Services", value: "Nutrition consult, coaching" },
          { label: "Documents", value: "All documents current", tone: "success" },
          { label: "Next assignment", value: "Not scheduled" },
          { label: "Verification", value: "Verified", tone: "success" },
        ],
        progress: 95,
      },
    ],
    formTitle: "Practitioner profile",
    formFields: ["Name", "Profession", "Location", "Services", "Availability"],
    emptyTitle: "No practitioners match these filters",
    emptyDescription: "Adjust filters or add a mock practitioner to the directory.",
  },
  screenings: {
    id: "screenings",
    eyebrow: commonEyebrow,
    title: "Screenings",
    description: "Review anonymized screening records, incomplete submissions, and risk distribution across activations.",
    primaryAction: "Add screening result",
    secondaryAction: "Review incomplete",
    searchPlaceholder: "Search employee reference, organization, activation",
    filters: [
      { key: "organization", label: "Organization", options: ["All", "Prime Bank Botswana", "Mowana Logistics", "Gaborone Textiles"] },
      { key: "department", label: "Department", options: ["All", "Operations", "Finance", "Executive", "Production"] },
      { key: "risk", label: "Risk", options: ["All", "Low", "Medium", "High", "Incomplete"] },
    ],
    metrics: [
      { label: "Records captured", value: "2,184", detail: "Today +186", tone: "primary", icon: Microscope },
      { label: "Incomplete", value: "17", detail: "Need correction", tone: "warning", icon: AlertIcon },
      { label: "High risk", value: "8%", detail: "Anonymized cohort", tone: "danger", icon: HeartPulse },
      { label: "QA complete", value: "91%", detail: "Across records", tone: "success", icon: ClipboardCheck },
    ],
    records: screeningRecords(),
    formTitle: "Screening result",
    formFields: ["Employee reference", "Organization", "Activation", "Department", "Risk level", "Reviewer note"],
    emptyTitle: "No screening records in this cohort",
    emptyDescription: "Try another organization, department, or risk level.",
  },
  results: {
    id: "results",
    eyebrow: commonEyebrow,
    title: "Screening Results",
    description: "Quality-assure anonymized result queues before reports and recommendations are generated.",
    primaryAction: "Add result",
    secondaryAction: "Open QA queue",
    searchPlaceholder: "Search result reference, organization, activation",
    filters: [
      { key: "organization", label: "Organization", options: ["All", "Prime Bank Botswana", "Mowana Logistics", "Gaborone Textiles"] },
      { key: "department", label: "Department", options: ["All", "Operations", "Finance", "Executive", "Production"] },
      { key: "risk", label: "Risk", options: ["All", "Low", "Medium", "High", "Incomplete"] },
    ],
    metrics: [
      { label: "Ready for QA", value: "312", detail: "11 activations", tone: "primary", icon: ClipboardCheck },
      { label: "Incomplete", value: "17", detail: "Missing fields", tone: "warning", icon: AlertIcon },
      { label: "Escalations", value: "14", detail: "Clinician review", tone: "danger", icon: HeartPulse },
      { label: "Approved", value: "91%", detail: "This month", tone: "success", icon: ShieldCheck },
    ],
    records: screeningRecords(),
    formTitle: "Result QA item",
    formFields: ["Result reference", "Organization", "Activation", "Risk level", "QA status", "Reviewer note"],
    emptyTitle: "No results match this QA view",
    emptyDescription: "Adjust filters or add a mock result to the queue.",
  },
  reports: {
    id: "reports",
    eyebrow: commonEyebrow,
    title: "Reports",
    description: "Prepare, preview, publish, and manage executive-ready wellness reports.",
    primaryAction: "Create report",
    secondaryAction: "Download bundle",
    searchPlaceholder: "Search reports, organizations, report types",
    filters: [
      { key: "organization", label: "Organization", options: ["All", "Prime Bank Botswana", "Mowana Logistics", "Gaborone Textiles"] },
      { key: "type", label: "Type", options: ["All", "Executive Summary", "Screening Outcomes", "ROI Overview"] },
      { key: "status", label: "Status", options: ["All", "Draft", "Review", "Published"] },
    ],
    metrics: [
      { label: "Published", value: "87", detail: "12 this month", tone: "success", icon: FileBarChart },
      { label: "In review", value: "7", detail: "3 due today", tone: "warning", icon: FileText },
      { label: "Drafts", value: "15", detail: "Across accounts", tone: "neutral", icon: ClipboardCheck },
      { label: "Downloads", value: "246", detail: "Client portal", tone: "primary", icon: Activity },
    ],
    records: [
      {
        id: "report-roi",
        title: "Workforce Wellness ROI",
        subtitle: "Prime Bank Botswana · Executive Summary",
        meta: "Published Jul 04, 2026 · finance notes included",
        status: "Published",
        statusTone: "success",
        search: "workforce wellness roi prime bank executive summary published",
        filters: { organization: "Prime Bank Botswana", type: "Executive Summary", status: "Published" },
        fields: [
          { label: "Type", value: "Executive Summary" },
          { label: "Pages", value: "18" },
          { label: "Owner", value: "Clinical QA" },
          { label: "Status", value: "Published" },
        ],
        details: [
          { label: "Preview", value: "Executive score, absenteeism impact, intervention ROI" },
          { label: "Last updated", value: "Jul 04, 2026" },
          { label: "Visibility", value: "Client portal", tone: "success" },
        ],
        progress: 100,
      },
      {
        id: "report-mowana",
        title: "Hypertension Risk Brief",
        subtitle: "Mowana Logistics · Screening Outcomes",
        meta: "Review · clinician sign-off requested",
        status: "Review",
        statusTone: "warning",
        search: "hypertension risk brief mowana logistics screening outcomes review",
        filters: { organization: "Mowana Logistics", type: "Screening Outcomes", status: "Review" },
        fields: [
          { label: "Type", value: "Screening Outcomes" },
          { label: "Pages", value: "12" },
          { label: "Owner", value: "Dr. K. Molefe" },
          { label: "Status", value: "Review" },
        ],
        details: [
          { label: "Preview", value: "Risk distribution, follow-up cohort, referral recommendations" },
          { label: "Last updated", value: "Jul 06, 2026" },
          { label: "Visibility", value: "Internal review", tone: "warning" },
        ],
        progress: 76,
        warning: "Clinical sign-off required before publishing.",
      },
      {
        id: "report-textiles",
        title: "Screening Outcomes Summary",
        subtitle: "Gaborone Textiles · Screening Outcomes",
        meta: "Draft · analytics generated",
        status: "Draft",
        statusTone: "neutral",
        search: "screening outcomes summary gaborone textiles draft",
        filters: { organization: "Gaborone Textiles", type: "Screening Outcomes", status: "Draft" },
        fields: [
          { label: "Type", value: "Screening Outcomes" },
          { label: "Pages", value: "10" },
          { label: "Owner", value: "Analytics" },
          { label: "Status", value: "Draft" },
        ],
        details: [
          { label: "Preview", value: "Participation, low-risk cohorts, wellness score movement" },
          { label: "Last updated", value: "Jul 05, 2026" },
          { label: "Visibility", value: "Internal draft", tone: "neutral" },
        ],
        progress: 52,
      },
    ],
    formTitle: "Report setup",
    formFields: ["Organization", "Report title", "Report type", "Owner", "Target publish date"],
    emptyTitle: "No reports found",
    emptyDescription: "Change report filters or create a mock report draft.",
  },
  insights: {
    id: "insights",
    eyebrow: commonEyebrow,
    title: "Insights",
    description: "Track operational wellness patterns, cohort risk trends, and department-level intervention signals.",
    primaryAction: "Save insight",
    secondaryAction: "Generate brief",
    searchPlaceholder: "Search insights, risks, departments",
    tabs: ["Overview", "Risks", "Trends", "Departments"],
    filters: [
      { key: "risk", label: "Risk", options: ["All", "Low", "Medium", "High"] },
      { key: "department", label: "Department", options: ["All", "Operations", "Finance", "Executive", "Production"] },
    ],
    metrics: [
      { label: "Risk trend", value: "+6%", detail: "Operations cohorts", tone: "warning", icon: BarChart3 },
      { label: "Improving", value: "4", detail: "Departments", tone: "success", icon: Activity },
      { label: "High-priority", value: "3", detail: "Intervention signals", tone: "danger", icon: HeartPulse },
      { label: "Saved briefs", value: "18", detail: "Executive-ready", tone: "primary", icon: FileText },
    ],
    records: [
      {
        id: "insight-risk-shift",
        title: "Operations risk concentration",
        subtitle: "Mowana Logistics · Operations · high-risk trend",
        meta: "Risk flags are concentrated in shift-based teams with low follow-up attendance.",
        status: "High",
        statusTone: "danger",
        search: "operations risk concentration mowana logistics shift teams high",
        filters: { risk: "High", department: "Operations" },
        fields: [
          { label: "Trend", value: "+6%" },
          { label: "Cohort", value: "Operations" },
          { label: "Confidence", value: "High" },
          { label: "Priority", value: "Urgent" },
        ],
        details: [
          { label: "Recommended action", value: "Schedule hypertension follow-up clinic and supervisor briefing." },
          { label: "Signal source", value: "Screening outcomes, repeat elevated readings, attendance patterns" },
          { label: "Risk", value: "High", tone: "danger" },
        ],
        progress: 82,
      },
      {
        id: "insight-exec-improve",
        title: "Executive cohort improvement",
        subtitle: "Prime Bank Botswana · Executive · positive trend",
        meta: "Presenteeism markers improved after coaching participation increased.",
        status: "Low",
        statusTone: "success",
        search: "executive cohort improvement prime bank coaching low",
        filters: { risk: "Low", department: "Executive" },
        fields: [
          { label: "Trend", value: "-5%" },
          { label: "Cohort", value: "Executive" },
          { label: "Confidence", value: "Medium" },
          { label: "Priority", value: "Maintain" },
        ],
        details: [
          { label: "Recommended action", value: "Keep quarterly executive wellness reviews in place." },
          { label: "Signal source", value: "Participation, follow-up attendance, self-reported wellbeing" },
          { label: "Risk", value: "Low", tone: "success" },
        ],
        progress: 74,
      },
      {
        id: "insight-production",
        title: "Production participation gap",
        subtitle: "Gaborone Textiles · Production · medium-risk trend",
        meta: "Production attendance trails office teams by 18 percentage points.",
        status: "Medium",
        statusTone: "warning",
        search: "production participation gap gaborone textiles medium",
        filters: { risk: "Medium", department: "Production" },
        fields: [
          { label: "Gap", value: "18 pts" },
          { label: "Cohort", value: "Production" },
          { label: "Confidence", value: "High" },
          { label: "Priority", value: "Planned" },
        ],
        details: [
          { label: "Recommended action", value: "Run shift-aligned reminders and supervisor scheduling support." },
          { label: "Signal source", value: "Invitation logs and attendance records" },
          { label: "Risk", value: "Medium", tone: "warning" },
        ],
        progress: 58,
      },
    ],
    formTitle: "Insight brief",
    formFields: ["Insight title", "Organization", "Department", "Risk level", "Recommended action"],
    emptyTitle: "No insights in this segment",
    emptyDescription: "Adjust tabs or filters to review another risk segment.",
  },
  recommendations: {
    id: "recommendations",
    eyebrow: commonEyebrow,
    title: "Recommendations",
    description: "Prioritize interventions, assign next actions, and move recommendations through planning and completion.",
    primaryAction: "Create recommendation",
    secondaryAction: "Review board",
    searchPlaceholder: "Search recommendations, risks, organizations",
    filters: [
      { key: "risk", label: "Risk", options: ["All", "Low", "Medium", "High"] },
      { key: "organization", label: "Organization", options: ["All", "Prime Bank Botswana", "Mowana Logistics", "Gaborone Textiles"] },
      { key: "status", label: "Status", options: ["All", "New", "Planned", "Completed"] },
    ],
    metrics: [
      { label: "Open actions", value: "21", detail: "7 high priority", tone: "warning", icon: Lightbulb },
      { label: "Completed", value: "14", detail: "This quarter", tone: "success", icon: ClipboardCheck },
      { label: "High risk", value: "7", detail: "Need owner", tone: "danger", icon: HeartPulse },
      { label: "Planned", value: "10", detail: "Implementation queued", tone: "primary", icon: CalendarCheck },
    ],
    records: [
      {
        id: "rec-mowana-follow-up",
        title: "Focused blood pressure follow-up",
        subtitle: "Mowana Logistics · High priority",
        meta: "Target repeat elevated readings with onsite follow-up and referral routing.",
        status: "New",
        statusTone: "danger",
        search: "focused blood pressure follow up mowana logistics high new",
        filters: { risk: "High", organization: "Mowana Logistics", status: "New" },
        fields: [
          { label: "Priority", value: "High" },
          { label: "Owner", value: "Clinical Ops" },
          { label: "Impact", value: "High" },
          { label: "Status", value: "New" },
        ],
        details: [
          { label: "Rationale", value: "Repeat elevated readings are concentrated in two operations cohorts." },
          { label: "Intervention", value: "Follow-up clinic, referral routing, supervisor briefing" },
          { label: "Risk", value: "High", tone: "danger" },
        ],
        progress: 28,
      },
      {
        id: "rec-prime-briefing",
        title: "Manager wellbeing briefing",
        subtitle: "Prime Bank Botswana · Medium priority",
        meta: "Equip managers with concise referral prompts and follow-up guidance.",
        status: "Planned",
        statusTone: "info",
        search: "manager wellbeing briefing prime bank medium planned",
        filters: { risk: "Medium", organization: "Prime Bank Botswana", status: "Planned" },
        fields: [
          { label: "Priority", value: "Medium" },
          { label: "Owner", value: "Client Success" },
          { label: "Impact", value: "Medium" },
          { label: "Status", value: "Planned" },
        ],
        details: [
          { label: "Rationale", value: "Manager involvement improves follow-up attendance." },
          { label: "Intervention", value: "Briefing pack and 30-minute virtual session" },
          { label: "Risk", value: "Medium", tone: "warning" },
        ],
        progress: 58,
      },
      {
        id: "rec-textiles-campaign",
        title: "Screening participation campaign",
        subtitle: "Gaborone Textiles · Low priority",
        meta: "Shift-aligned invitations to improve production team attendance.",
        status: "Completed",
        statusTone: "success",
        search: "screening participation campaign gaborone textiles low completed",
        filters: { risk: "Low", organization: "Gaborone Textiles", status: "Completed" },
        fields: [
          { label: "Priority", value: "Low" },
          { label: "Owner", value: "Activation Team" },
          { label: "Impact", value: "Medium" },
          { label: "Status", value: "Completed" },
        ],
        details: [
          { label: "Rationale", value: "Attendance improved after team-specific reminders." },
          { label: "Intervention", value: "SMS reminders, supervisor schedule alignment" },
          { label: "Risk", value: "Low", tone: "success" },
        ],
        progress: 100,
      },
    ],
    formTitle: "Recommendation",
    formFields: ["Organization", "Recommendation title", "Risk level", "Owner", "Expected impact"],
    emptyTitle: "No recommendations match this board",
    emptyDescription: "Change filters or create a recommendation for this risk segment.",
  },
  billing: {
    id: "billing",
    eyebrow: commonEyebrow,
    title: "Billing",
    description: "Track invoices, packages, payment status, activation billing, and account-level commercial health.",
    primaryAction: "Create invoice",
    secondaryAction: "Export billing",
    searchPlaceholder: "Search invoices, packages, organizations",
    filters: [
      { key: "status", label: "Payment", options: ["All", "Paid", "Due", "Overdue", "Draft"] },
      { key: "package", label: "Package", options: ["All", "Executive Care", "Industrial Wellness", "Workforce Core", "Screening Essentials"] },
    ],
    metrics: [
      { label: "Monthly billings", value: "P1.28m", detail: "+12% vs June", tone: "primary", icon: CreditCard },
      { label: "Overdue", value: "P86k", detail: "2 invoices", tone: "danger", icon: AlertIcon },
      { label: "Paid", value: "P940k", detail: "18 invoices", tone: "success", icon: ShieldCheck },
      { label: "Draft", value: "P254k", detail: "6 invoices", tone: "warning", icon: FileText },
    ],
    records: [
      {
        id: "inv-prime",
        title: "INV-2026-0718",
        subtitle: "Prime Bank Botswana · Executive Care",
        meta: "P182,400 · Due Jul 31, 2026 · activation and reporting bundle",
        status: "Due",
        statusTone: "warning",
        search: "inv 2026 0718 prime bank executive care due",
        filters: { status: "Due", package: "Executive Care" },
        fields: [
          { label: "Amount", value: "P182,400" },
          { label: "Package", value: "Executive Care" },
          { label: "Due", value: "Jul 31" },
          { label: "Status", value: "Due" },
        ],
        details: [
          { label: "Line items", value: "Activation delivery, executive report, practitioner fees" },
          { label: "Payment status", value: "Due", tone: "warning" },
          { label: "Account owner", value: "Client Success" },
        ],
        progress: 62,
      },
      {
        id: "inv-mowana",
        title: "INV-2026-0702",
        subtitle: "Mowana Logistics · Workforce Core",
        meta: "P86,200 · Overdue · payment follow-up required",
        status: "Overdue",
        statusTone: "danger",
        search: "inv 2026 0702 mowana logistics workforce core overdue",
        filters: { status: "Overdue", package: "Workforce Core" },
        fields: [
          { label: "Amount", value: "P86,200" },
          { label: "Package", value: "Workforce Core" },
          { label: "Due", value: "Jul 02" },
          { label: "Status", value: "Overdue" },
        ],
        details: [
          { label: "Line items", value: "Follow-up clinic, clinical review, risk brief" },
          { label: "Payment status", value: "Overdue", tone: "danger" },
          { label: "Account owner", value: "Operations Finance" },
        ],
        progress: 34,
        warning: "Payment follow-up note should be sent before Friday.",
      },
      {
        id: "inv-textiles",
        title: "INV-2026-0629",
        subtitle: "Gaborone Textiles · Screening Essentials",
        meta: "P74,800 · Paid Jul 03, 2026 · receipt issued",
        status: "Paid",
        statusTone: "success",
        search: "inv 2026 0629 gaborone textiles screening essentials paid",
        filters: { status: "Paid", package: "Screening Essentials" },
        fields: [
          { label: "Amount", value: "P74,800" },
          { label: "Package", value: "Screening Essentials" },
          { label: "Paid", value: "Jul 03" },
          { label: "Status", value: "Paid" },
        ],
        details: [
          { label: "Line items", value: "Screening delivery, summary report" },
          { label: "Payment status", value: "Paid", tone: "success" },
          { label: "Account owner", value: "Finance" },
        ],
        progress: 100,
      },
    ],
    formTitle: "Invoice",
    formFields: ["Organization", "Package", "Invoice date", "Due date", "Amount"],
    emptyTitle: "No invoices match this view",
    emptyDescription: "Change payment filters or create a mock invoice.",
  },
  users: {
    id: "users",
    eyebrow: commonEyebrow,
    title: "Users & Roles",
    description: "Manage admin portal users, role badges, invitations, and local role changes before auth work begins.",
    primaryAction: "Invite user",
    secondaryAction: "Review roles",
    searchPlaceholder: "Search users, roles, emails",
    filters: [
      { key: "role", label: "Role", options: ["All", "Operations Lead", "Clinical Reviewer", "Finance", "Viewer"] },
      { key: "status", label: "Status", options: ["All", "Active", "Invited", "Suspended"] },
    ],
    metrics: [
      { label: "Active users", value: "18", detail: "Admin workspace", tone: "success", icon: UsersRound },
      { label: "Invites", value: "4", detail: "Awaiting acceptance", tone: "warning", icon: FileText },
      { label: "Role changes", value: "6", detail: "This month", tone: "primary", icon: Settings },
      { label: "Suspended", value: "1", detail: "Access paused", tone: "danger", icon: LockIcon },
    ],
    records: [
      {
        id: "user-refiloe",
        title: "Refiloe M.",
        subtitle: "refiloe@pulse80.example · Operations Lead",
        meta: "Active · full admin operations access",
        status: "Active",
        statusTone: "success",
        search: "refiloe operations lead active",
        filters: { role: "Operations Lead", status: "Active" },
        fields: [
          { label: "Role", value: "Operations Lead" },
          { label: "Status", value: "Active" },
          { label: "Last seen", value: "Today" },
          { label: "Scope", value: "All portals" },
        ],
        details: [
          { label: "Access", value: "Organizations, activations, reports, billing, users" },
          { label: "Status", value: "Active", tone: "success" },
          { label: "Audit note", value: "Role can be changed locally for UI testing." },
        ],
      },
      {
        id: "user-clinical",
        title: "Dr. P. Sechele",
        subtitle: "p.sechele@pulse80.example · Clinical Reviewer",
        meta: "Invited · report QA and screening results",
        status: "Invited",
        statusTone: "warning",
        search: "sechele clinical reviewer invited",
        filters: { role: "Clinical Reviewer", status: "Invited" },
        fields: [
          { label: "Role", value: "Clinical Reviewer" },
          { label: "Status", value: "Invited" },
          { label: "Last seen", value: "Pending" },
          { label: "Scope", value: "Clinical" },
        ],
        details: [
          { label: "Access", value: "Screenings, results, report review" },
          { label: "Status", value: "Invited", tone: "warning" },
          { label: "Audit note", value: "Invite reminder available as placeholder action." },
        ],
      },
      {
        id: "user-finance",
        title: "Neo K.",
        subtitle: "neo@pulse80.example · Finance",
        meta: "Active · billing and practitioner payment visibility",
        status: "Active",
        statusTone: "success",
        search: "neo finance active billing",
        filters: { role: "Finance", status: "Active" },
        fields: [
          { label: "Role", value: "Finance" },
          { label: "Status", value: "Active" },
          { label: "Last seen", value: "Yesterday" },
          { label: "Scope", value: "Billing" },
        ],
        details: [
          { label: "Access", value: "Billing, invoices, practitioner payments" },
          { label: "Status", value: "Active", tone: "success" },
          { label: "Audit note", value: "Role selector updates local UI only." },
        ],
      },
    ],
    formTitle: "User invitation",
    formFields: ["Full name", "Email", "Role", "Portal scope"],
    emptyTitle: "No users match this role view",
    emptyDescription: "Adjust role/status filters or invite a mock admin user.",
  },
  settings: {
    id: "settings",
    eyebrow: commonEyebrow,
    title: "Settings",
    description: "Configure mock organization defaults, platform preferences, report branding, and notifications.",
    primaryAction: "Save settings",
    secondaryAction: "Reset draft",
    searchPlaceholder: "Search settings",
    filters: [
      { key: "area", label: "Area", options: ["All", "Organization", "Platform", "Branding", "Notifications"] },
    ],
    metrics: [
      { label: "Defaults", value: "12", detail: "Operational rules", tone: "primary", icon: Settings },
      { label: "Brand profiles", value: "4", detail: "Report templates", tone: "primary", icon: FileBarChart },
      { label: "Alerts active", value: "9", detail: "Notification rules", tone: "success", icon: BellIcon },
      { label: "Draft changes", value: "3", detail: "Local only", tone: "warning", icon: ClipboardCheck },
    ],
    records: [
      {
        id: "settings-org",
        title: "Organization settings",
        subtitle: "Default package, account owner, and account health thresholds",
        meta: "Applies to newly created mock organizations",
        status: "Draft",
        statusTone: "warning",
        search: "organization settings default package account owner thresholds",
        filters: { area: "Organization" },
        fields: [
          { label: "Default package", value: "Workforce Core" },
          { label: "Review cadence", value: "Monthly" },
          { label: "Risk threshold", value: "70" },
          { label: "Owner", value: "Operations" },
        ],
        details: [
          { label: "Editable fields", value: "Package defaults, risk threshold, review cadence" },
          { label: "Save behavior", value: "Shows success toast only; no backend connection." },
        ],
      },
      {
        id: "settings-branding",
        title: "Report branding settings",
        subtitle: "Executive report cover, footer note, and brand visibility",
        meta: "Used by report previews and mock downloads",
        status: "Active",
        statusTone: "success",
        search: "report branding settings executive report cover footer",
        filters: { area: "Branding" },
        fields: [
          { label: "Cover style", value: "Clinical" },
          { label: "Footer", value: "Pulse80" },
          { label: "Logo", value: "Enabled" },
          { label: "Template", value: "Executive" },
        ],
        details: [
          { label: "Editable fields", value: "Cover title, footer copy, report accent color" },
          { label: "Save behavior", value: "Local success state only." },
        ],
      },
      {
        id: "settings-notifications",
        title: "Notification settings",
        subtitle: "Risk alerts, report QA reminders, activation readiness prompts",
        meta: "Controls mock admin notification preferences",
        status: "Active",
        statusTone: "success",
        search: "notification settings risk alerts report qa activation readiness",
        filters: { area: "Notifications" },
        fields: [
          { label: "Risk alerts", value: "On" },
          { label: "QA reminders", value: "On" },
          { label: "Billing alerts", value: "Off" },
          { label: "Digest", value: "Daily" },
        ],
        details: [
          { label: "Editable fields", value: "Email digest, alert categories, reminder timing" },
          { label: "Save behavior", value: "Local success toast only." },
        ],
      },
    ],
    formTitle: "Settings draft",
    formFields: ["Setting name", "Owner", "Value", "Review cadence"],
    emptyTitle: "No settings match this area",
    emptyDescription: "Clear filters to review all mock admin settings.",
  },
};

function screeningRecords(): AdminRecord[] {
  return [
    {
      id: "scr-p80-1042",
      title: "P80-EMP-1042",
      subtitle: "Prime Bank Botswana · Executive Wellness Review",
      meta: "Executive · medium risk · complete anonymized result",
      status: "Medium",
      statusTone: "warning",
      search: "p80 emp 1042 prime bank executive medium complete",
      filters: { organization: "Prime Bank Botswana", department: "Executive", risk: "Medium" },
      fields: [
        { label: "Reference", value: "P80-EMP-1042" },
        { label: "Department", value: "Executive" },
        { label: "Risk", value: "Medium" },
        { label: "QA", value: "Complete" },
      ],
      details: [
        { label: "Activation", value: "Executive Wellness Review" },
        { label: "Risk summary", value: "Follow-up recommended; no personal identity stored in UI mock." },
        { label: "QA status", value: "Complete", tone: "success" },
      ],
      progress: 88,
    },
    {
      id: "scr-p80-2190",
      title: "P80-EMP-2190",
      subtitle: "Mowana Logistics · Hypertension Follow-up Clinic",
      meta: "Operations · high risk · escalation review",
      status: "High",
      statusTone: "danger",
      search: "p80 emp 2190 mowana logistics operations high escalation",
      filters: { organization: "Mowana Logistics", department: "Operations", risk: "High" },
      fields: [
        { label: "Reference", value: "P80-EMP-2190" },
        { label: "Department", value: "Operations" },
        { label: "Risk", value: "High" },
        { label: "QA", value: "Review" },
      ],
      details: [
        { label: "Activation", value: "Hypertension Follow-up Clinic" },
        { label: "Risk summary", value: "Clinical review required before report aggregation." },
        { label: "QA status", value: "Review", tone: "danger" },
      ],
      progress: 58,
      warning: "Incomplete escalation note detected.",
    },
    {
      id: "scr-p80-3308",
      title: "P80-EMP-3308",
      subtitle: "Gaborone Textiles · Screening Outcomes",
      meta: "Production · incomplete · missing reviewer note",
      status: "Incomplete",
      statusTone: "warning",
      search: "p80 emp 3308 gaborone textiles production incomplete",
      filters: { organization: "Gaborone Textiles", department: "Production", risk: "Incomplete" },
      fields: [
        { label: "Reference", value: "P80-EMP-3308" },
        { label: "Department", value: "Production" },
        { label: "Risk", value: "Incomplete" },
        { label: "QA", value: "Missing note" },
      ],
      details: [
        { label: "Activation", value: "Screening Outcomes" },
        { label: "Risk summary", value: "Result excluded from aggregation until required field is completed." },
        { label: "QA status", value: "Incomplete", tone: "warning" },
      ],
      progress: 32,
      warning: "Required result field is incomplete.",
    },
  ];
}
