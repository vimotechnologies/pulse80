import type { IconsaxIcon } from "@/components/icons/IconsaxIcons";
import {
  Activity,
  CalendarCheck,
  ClipboardCheck,
  CreditCard,
  FileText,
  Settings,
  ShieldCheck,
  Stethoscope,
} from "@/components/icons/IconsaxIcons";

export type PractitionerTone = "primary" | "success" | "warning" | "danger" | "neutral";

export type PractitionerMetric = {
  label: string;
  value: string;
  detail: string;
  tone: PractitionerTone;
  icon: IconsaxIcon;
};

export type PractitionerRecord = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  statusTone: "success" | "warning" | "danger" | "info" | "neutral";
  search: string;
  filters: Record<string, string>;
  fields: { label: string; value: string }[];
  details: { label: string; value: string; tone?: PractitionerTone }[];
  checklist?: { label: string; done: boolean }[];
  progress?: number;
  warning?: string;
};

export type PractitionerPageConfig = {
  id: "dashboard" | "assignments" | "screenings" | "profile" | "documents" | "payments" | "settings";
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  searchPlaceholder: string;
  filters: { key: string; label: string; options: string[] }[];
  metrics: PractitionerMetric[];
  records: PractitionerRecord[];
  formFields: string[];
  emptyTitle: string;
  emptyDescription: string;
};

const eyebrow = "Health Practitioner";

const assignmentPrime: PractitionerRecord = {
  id: "assign-prime",
  title: "Prime Bank wellness activation",
  subtitle: "Tomorrow · 08:00 · Gaborone HQ",
  meta: "BP, BMI, glucose capture · onsite team of 6 · confirmed",
  status: "Confirmed",
  statusTone: "success",
  search: "prime bank wellness activation gaborone bp bmi glucose confirmed",
  filters: { status: "Confirmed", location: "Gaborone" },
  fields: [
    { label: "Arrival", value: "07:30" },
    { label: "Team", value: "6" },
    { label: "Expected", value: "260" },
  ],
  details: [
    { label: "Site contact", value: "Client wellness coordinator, reception desk" },
    { label: "Services", value: "Blood pressure, BMI, glucose, consent confirmation" },
    { label: "Privacy note", value: "Capture uses employee reference codes only.", tone: "success" },
  ],
  checklist: [
    { label: "Review protocol", done: true },
    { label: "Confirm kit readiness", done: true },
    { label: "Submit arrival confirmation", done: false },
  ],
  progress: 82,
};

const assignmentDelta: PractitionerRecord = {
  id: "assign-delta",
  title: "Delta Foods screening day",
  subtitle: "Jul 10 · 09:30 · Lobatse",
  meta: "Onsite team of 4 · screening and wellness questionnaire",
  status: "Scheduled",
  statusTone: "info",
  search: "delta foods screening day lobatse scheduled questionnaire",
  filters: { status: "Scheduled", location: "Lobatse" },
  fields: [
    { label: "Arrival", value: "09:00" },
    { label: "Team", value: "4" },
    { label: "Expected", value: "180" },
  ],
  details: [
    { label: "Site contact", value: "HR coordinator at main gate" },
    { label: "Services", value: "BP, BMI, glucose, wellness questionnaire" },
  ],
  checklist: [
    { label: "Review protocol", done: true },
    { label: "Confirm transport", done: false },
    { label: "Download consent pack", done: true },
  ],
  progress: 64,
};

const assignmentMowana: PractitionerRecord = {
  id: "assign-mowana",
  title: "Mowana Logistics follow-up clinic",
  subtitle: "Jul 14 · 14:00 · Francistown",
  meta: "Hypertension follow-up · clinical review focus",
  status: "Action needed",
  statusTone: "warning",
  search: "mowana logistics follow up clinic francistown hypertension action needed",
  filters: { status: "Action needed", location: "Francistown" },
  fields: [
    { label: "Arrival", value: "13:30" },
    { label: "Team", value: "3" },
    { label: "Expected", value: "80" },
  ],
  details: [
    { label: "Site contact", value: "Operations supervisor" },
    { label: "Services", value: "BP review, risk counselling, referral routing" },
    { label: "Clinical note", value: "Review escalation protocol before site arrival.", tone: "warning" },
  ],
  checklist: [
    { label: "Review flagged reference list", done: false },
    { label: "Confirm escalation route", done: false },
    { label: "Kit ready", done: true },
  ],
  progress: 46,
  warning: "Escalation route must be confirmed before arrival.",
};

const screeningBatch: PractitionerRecord = {
  id: "screen-batch",
  title: "Prime Bank capture queue",
  subtitle: "42 records ready · employee references only",
  meta: "3 incomplete forms require correction before submission.",
  status: "In progress",
  statusTone: "info",
  search: "prime bank capture queue incomplete forms in progress",
  filters: { status: "In progress", risk: "Medium" },
  fields: [
    { label: "Captured", value: "42" },
    { label: "Incomplete", value: "3" },
    { label: "Risk", value: "Medium" },
  ],
  details: [
    { label: "Submission rule", value: "Records are anonymized and use employee reference codes." },
    { label: "Incomplete state", value: "Missing consent confirmation on 3 records.", tone: "warning" },
  ],
  progress: 76,
  warning: "Incomplete records must be corrected before final submission.",
};

const screeningSubmitted: PractitionerRecord = {
  id: "screen-submitted",
  title: "Delta Foods batch",
  subtitle: "Submitted yesterday · 42 records",
  meta: "All required fields complete; operations QA passed.",
  status: "Submitted",
  statusTone: "success",
  search: "delta foods batch submitted complete qa passed",
  filters: { status: "Submitted", risk: "Low" },
  fields: [
    { label: "Records", value: "42" },
    { label: "Incomplete", value: "0" },
    { label: "Risk", value: "Low" },
  ],
  details: [{ label: "Submission note", value: "Batch accepted for reporting aggregation." }],
  progress: 100,
};

const profileProfessional: PractitionerRecord = {
  id: "profile-professional",
  title: "Professional profile",
  subtitle: "Doctor · Gaborone, Francistown availability",
  meta: "Speciality, services, and contact details complete.",
  status: "Complete",
  statusTone: "success",
  search: "professional profile doctor speciality services contact complete",
  filters: { area: "Professional" },
  fields: [
    { label: "Profession", value: "Doctor" },
    { label: "Regions", value: "2" },
    { label: "Services", value: "4" },
  ],
  details: [{ label: "Profile summary", value: "Professional details are ready for assignment matching." }],
  progress: 96,
};

const profileAvailability: PractitionerRecord = {
  id: "profile-availability",
  title: "Availability",
  subtitle: "Weekday mornings and selected Saturdays",
  meta: "Next open slot after Prime Bank activation: Jul 11.",
  status: "Active",
  statusTone: "info",
  search: "availability weekday mornings selected saturdays active",
  filters: { area: "Availability" },
  fields: [
    { label: "Open slots", value: "6" },
    { label: "Assigned", value: "3" },
    { label: "Unavailable", value: "2" },
  ],
  details: [{ label: "Scheduling note", value: "Availability changes are local UI only in this phase." }],
  progress: 72,
};

const docLicense: PractitionerRecord = {
  id: "doc-license",
  title: "Practice license",
  subtitle: "Expires Aug 01, 2026",
  meta: "Renewal upload requested before expiry.",
  status: "Pending renewal",
  statusTone: "warning",
  search: "practice license expires renewal pending",
  filters: { status: "Pending", type: "License" },
  fields: [
    { label: "Type", value: "License" },
    { label: "Expires", value: "Aug 01" },
    { label: "Status", value: "Pending" },
  ],
  details: [{ label: "Review note", value: "Upload replacement document before expiry to avoid assignment pause.", tone: "warning" }],
  progress: 58,
  warning: "Document renewal required soon.",
};

const docIdentity: PractitionerRecord = {
  id: "doc-identity",
  title: "Identity document",
  subtitle: "Verified · no action required",
  meta: "Identity verification is current.",
  status: "Verified",
  statusTone: "success",
  search: "identity document verified current",
  filters: { status: "Verified", type: "Identity" },
  fields: [
    { label: "Type", value: "Identity" },
    { label: "Expires", value: "N/A" },
    { label: "Status", value: "Verified" },
  ],
  details: [{ label: "Review note", value: "Identity document is verified for current assignments." }],
  progress: 100,
};

const paymentPrime: PractitionerRecord = {
  id: "pay-prime",
  title: "Prime Bank activation payment",
  subtitle: "Pending summary · estimated P2,400",
  meta: "Payment moves to approved after activation summary is submitted.",
  status: "Pending summary",
  statusTone: "warning",
  search: "prime bank activation payment pending summary",
  filters: { status: "Pending", period: "July" },
  fields: [
    { label: "Amount", value: "P2,400" },
    { label: "Period", value: "July" },
    { label: "Status", value: "Pending" },
  ],
  details: [{ label: "Payment note", value: "Submit activation summary within 24 hours to unlock approval.", tone: "warning" }],
  progress: 42,
};

const paymentDelta: PractitionerRecord = {
  id: "pay-delta",
  title: "Delta Foods screening payment",
  subtitle: "Approved · P1,850",
  meta: "Scheduled for payout in the next payment run.",
  status: "Approved",
  statusTone: "success",
  search: "delta foods screening payment approved payout",
  filters: { status: "Approved", period: "July" },
  fields: [
    { label: "Amount", value: "P1,850" },
    { label: "Period", value: "July" },
    { label: "Status", value: "Approved" },
  ],
  details: [{ label: "Payment note", value: "Approved for the next payment run." }],
  progress: 88,
};

const settingNotifications: PractitionerRecord = {
  id: "set-notifications",
  title: "Notification preferences",
  subtitle: "Assignment reminders, document alerts, payment updates",
  meta: "Daily digest enabled; urgent assignment alerts enabled.",
  status: "Active",
  statusTone: "success",
  search: "notification preferences assignment reminders document alerts payment updates",
  filters: { area: "Notifications" },
  fields: [
    { label: "Assignments", value: "On" },
    { label: "Documents", value: "On" },
    { label: "Payments", value: "Daily" },
  ],
  details: [{ label: "Save behavior", value: "Preferences save locally only." }],
};

const settingBanking: PractitionerRecord = {
  id: "set-banking",
  title: "Banking profile",
  subtitle: "Verified payment destination",
  meta: "Banking changes are disabled in this frontend-only phase.",
  status: "Verified",
  statusTone: "success",
  search: "banking profile verified payment destination",
  filters: { area: "Payments" },
  fields: [
    { label: "Status", value: "Verified" },
    { label: "Payout", value: "Monthly" },
    { label: "Changes", value: "Disabled" },
  ],
  details: [{ label: "Security note", value: "No banking data is stored or edited in this mock UI." }],
};

export const practitionerPageConfigs: Record<PractitionerPageConfig["id"], PractitionerPageConfig> = {
  dashboard: {
    id: "dashboard",
    eyebrow,
    title: "Practitioner workspace",
    description: "A focused field workflow for assignments, screening submissions, profile readiness, documents, and payments.",
    primaryAction: "Confirm next assignment",
    searchPlaceholder: "Search assignments, tasks, documents",
    filters: [{ key: "status", label: "Status", options: ["All", "Confirmed", "Scheduled", "Action needed", "Submitted"] }],
    metrics: [
      { label: "Upcoming assignments", value: "6", detail: "Next starts tomorrow", tone: "primary", icon: CalendarCheck },
      { label: "Completed screenings", value: "184", detail: "+42 this month", tone: "success", icon: ClipboardCheck },
      { label: "Verification", value: "Verified", detail: "Credentials active", tone: "success", icon: ShieldCheck },
      { label: "Pending submissions", value: "3", detail: "Summaries due", tone: "warning", icon: FileText },
    ],
    records: [assignmentPrime, screeningBatch, docLicense, paymentPrime],
    formFields: ["Confirmation note", "Arrival time", "Contact number"],
    emptyTitle: "No practitioner tasks found",
    emptyDescription: "Clear filters to return to your active field workflow.",
  },
  assignments: {
    id: "assignments",
    eyebrow,
    title: "Assignments",
    description: "Review upcoming activations, site details, service requirements, and readiness checklists.",
    primaryAction: "Confirm assignment",
    searchPlaceholder: "Search assignments, locations, services",
    filters: [
      { key: "status", label: "Status", options: ["All", "Confirmed", "Scheduled", "Action needed"] },
      { key: "location", label: "Location", options: ["All", "Gaborone", "Lobatse", "Francistown"] },
    ],
    metrics: [
      { label: "Confirmed", value: "3", detail: "Ready to attend", tone: "success", icon: CalendarCheck },
      { label: "Needs action", value: "1", detail: "Review before arrival", tone: "warning", icon: Activity },
      { label: "This month", value: "6", detail: "Assigned activations", tone: "primary", icon: Stethoscope },
      { label: "Travel sites", value: "3", detail: "Across regions", tone: "neutral", icon: Settings },
    ],
    records: [assignmentPrime, assignmentDelta, assignmentMowana],
    formFields: ["Assignment note", "Arrival confirmation", "Transport note"],
    emptyTitle: "No assignments match this view",
    emptyDescription: "Adjust status or location filters to review another assignment set.",
  },
  screenings: {
    id: "screenings",
    eyebrow,
    title: "Screenings",
    description: "Manage anonymized capture queues, submission readiness, and incomplete screening corrections.",
    primaryAction: "Submit screening batch",
    searchPlaceholder: "Search screening queue, activation, status",
    filters: [
      { key: "status", label: "Status", options: ["All", "In progress", "Submitted"] },
      { key: "risk", label: "Risk", options: ["All", "Low", "Medium"] },
    ],
    metrics: [
      { label: "Captured", value: "184", detail: "This month", tone: "success", icon: ClipboardCheck },
      { label: "Incomplete", value: "3", detail: "Need correction", tone: "warning", icon: Activity },
      { label: "Submitted", value: "6", detail: "Accepted batches", tone: "primary", icon: FileText },
      { label: "Privacy", value: "Refs only", detail: "No names shown", tone: "success", icon: ShieldCheck },
    ],
    records: [screeningBatch, screeningSubmitted],
    formFields: ["Batch reference", "Records completed", "Reviewer note"],
    emptyTitle: "No screening batches in this view",
    emptyDescription: "Clear filters to review active and submitted screening batches.",
  },
  profile: {
    id: "profile",
    eyebrow,
    title: "Profile",
    description: "Maintain professional details, service coverage, regions, and availability readiness.",
    primaryAction: "Save profile",
    searchPlaceholder: "Search profile areas",
    filters: [{ key: "area", label: "Area", options: ["All", "Professional", "Availability"] }],
    metrics: [
      { label: "Profile readiness", value: "96%", detail: "Assignment ready", tone: "success", icon: Stethoscope },
      { label: "Regions", value: "2", detail: "Available areas", tone: "primary", icon: CalendarCheck },
      { label: "Services", value: "4", detail: "Screening types", tone: "primary", icon: ClipboardCheck },
      { label: "Open slots", value: "6", detail: "Next 14 days", tone: "warning", icon: Activity },
    ],
    records: [profileProfessional, profileAvailability],
    formFields: ["Profile area", "Updated value", "Availability note"],
    emptyTitle: "No profile sections found",
    emptyDescription: "Clear filters to review professional details and availability.",
  },
  documents: {
    id: "documents",
    eyebrow,
    title: "Documents",
    description: "Track credentialing, identity, and compliance document readiness.",
    primaryAction: "Upload placeholder",
    searchPlaceholder: "Search documents, status, type",
    filters: [
      { key: "status", label: "Status", options: ["All", "Verified", "Pending"] },
      { key: "type", label: "Type", options: ["All", "License", "Identity"] },
    ],
    metrics: [
      { label: "Verified", value: "4", detail: "Current files", tone: "success", icon: ShieldCheck },
      { label: "Pending", value: "1", detail: "Renewal needed", tone: "warning", icon: FileText },
      { label: "Assignment status", value: "Eligible", detail: "No pause active", tone: "success", icon: CalendarCheck },
      { label: "Next expiry", value: "Aug 01", detail: "Practice license", tone: "warning", icon: Activity },
    ],
    records: [docLicense, docIdentity],
    formFields: ["Document type", "Expiry date", "Upload note"],
    emptyTitle: "No documents match this view",
    emptyDescription: "Clear filters to review verified and pending documents.",
  },
  payments: {
    id: "payments",
    eyebrow,
    title: "Payments",
    description: "Track activation summaries, approval status, and upcoming practitioner payouts.",
    primaryAction: "Submit summary",
    searchPlaceholder: "Search payments, activation, status",
    filters: [
      { key: "status", label: "Status", options: ["All", "Pending", "Approved"] },
      { key: "period", label: "Period", options: ["All", "July"] },
    ],
    metrics: [
      { label: "Pending", value: "P2,400", detail: "Needs summary", tone: "warning", icon: CreditCard },
      { label: "Approved", value: "P1,850", detail: "Next payout", tone: "success", icon: ShieldCheck },
      { label: "Completed", value: "2", detail: "This month", tone: "primary", icon: ClipboardCheck },
      { label: "Banking", value: "Verified", detail: "Ready for payout", tone: "success", icon: CreditCard },
    ],
    records: [paymentPrime, paymentDelta],
    formFields: ["Activation", "Summary note", "Hours confirmed"],
    emptyTitle: "No payments match this view",
    emptyDescription: "Clear filters to review pending and approved payments.",
  },
  settings: {
    id: "settings",
    eyebrow,
    title: "Settings",
    description: "Manage practitioner notifications, portal preferences, and payment profile visibility.",
    primaryAction: "Save settings",
    searchPlaceholder: "Search settings",
    filters: [{ key: "area", label: "Area", options: ["All", "Notifications", "Payments"] }],
    metrics: [
      { label: "Alerts", value: "On", detail: "Assignments and documents", tone: "success", icon: Activity },
      { label: "Digest", value: "Daily", detail: "Payment updates", tone: "primary", icon: Settings },
      { label: "Banking", value: "Verified", detail: "Read only", tone: "success", icon: CreditCard },
      { label: "Portal", value: "Ready", detail: "Preferences active", tone: "success", icon: ShieldCheck },
    ],
    records: [settingNotifications, settingBanking],
    formFields: ["Setting", "Preference", "Note"],
    emptyTitle: "No settings match this area",
    emptyDescription: "Clear filters to review all practitioner settings.",
  },
};
