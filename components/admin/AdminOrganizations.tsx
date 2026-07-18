"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Activity,
  AddCircle,
  AlertCircle,
  ArrowDown,
  ArrowLeft2,
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  CloseSquare,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Globe2,
  HeartPulse,
  Location,
  Mail,
  MoreHorizontal,
  Refresh,
  Search,
  ShieldCheck,
  Sort,
  Trash,
  User,
  UsersRound,
} from "@/components/icons/IconsaxIcons";
import {
  AdminBadge,
  AdminButton,
  AdminIconButton,
  AdminMetricCard,
  AdminTabButton,
} from "@/components/admin/ui/PulseAdminUI";
import { cn } from "@/lib/utils/cn";

type OrganizationStatus =
  | "Prospect"
  | "Onboarding"
  | "Active"
  | "Paused"
  | "Contract Expired"
  | "Archived";
type WellnessRisk = "Low" | "Medium" | "High" | "Critical";
type PackageName =
  | "Starter Wellness Package"
  | "Corporate Wellness Package"
  | "Enterprise Wellness Intelligence Package"
  | "Custom Package";
type ContactMethod = "Email" | "Phone" | "WhatsApp" | "Portal";
type ClientRole = "Client Admin" | "Client Viewer";
type InvitationStatus =
  | "Not Invited"
  | "Invitation Pending"
  | "Account Activated"
  | "Invitation Expired"
  | "Access Suspended";

type OrganizationContact = {
  id: string;
  name: string;
  roleLabel: string;
  email: string;
  phone: string;
  method: ContactMethod;
  primary: boolean;
  notes: string;
};

type Branch = {
  id: string;
  name: string;
  country: string;
  region: string;
  town: string;
  address: string;
  employees: number;
  primary: boolean;
  departments: Department[];
  status: "Active" | "Paused" | "Archived";
};

type Department = {
  id: string;
  name: string;
  branchId: string;
  employees: number;
  wellnessScore: number;
  risk: WellnessRisk;
  latestActivation: string;
  status: "Active" | "Paused" | "Archived";
};

type Activation = {
  title: string;
  type: string;
  date: string;
  branch: string;
  status: string;
  participation: string;
  reportStatus: string;
};

type Report = {
  title: string;
  type: string;
  period: string;
  status: string;
  publishedDate: string;
};

type Recommendation = {
  title: string;
  priority: "Low" | "Medium" | "High";
  activation: string;
  impact: string;
  status: string;
  owner: string;
};

type ClientUser = {
  id: string;
  name: string;
  email: string;
  role: ClientRole;
  invitationStatus: InvitationStatus;
  lastActive: string;
};

type Organization = {
  id: string;
  name: string;
  code: string;
  logo?: string;
  industry: string;
  country: string;
  primaryLocation: string;
  region: string;
  employees: number;
  package: PackageName;
  contractStart: string;
  contractEnd: string;
  risk: WellnessRisk;
  status: OrganizationStatus;
  branches: Branch[];
  lastActivation: string;
  nextActivation: string;
  reportsPublished: number;
  contacts: [OrganizationContact, OrganizationContact];
  clientUsers: ClientUser[];
  activations: Activation[];
  reports: Report[];
  insights: string[];
  recommendations: Recommendation[];
  customPackageNotes?: string;
  quickSummary?: string;
};

type OrganizationForm = {
  logo?: string;
  name: string;
  industry: string;
  country: string;
  town: string;
  region: string;
  employees: string;
  package: PackageName;
  contractStart: string;
  contractEnd: string;
  status: OrganizationStatus;
  risk: WellnessRisk;
  contact1Name: string;
  contact1Role: string;
  contact1CustomRole: string;
  contact1Email: string;
  contact1Phone: string;
  contact1Method: ContactMethod;
  contact2Name: string;
  contact2Role: string;
  contact2CustomRole: string;
  contact2Email: string;
  contact2Phone: string;
  contact2Method: ContactMethod;
};

const packageOptions: PackageName[] = [
  "Starter Wellness Package",
  "Corporate Wellness Package",
  "Enterprise Wellness Intelligence Package",
  "Custom Package",
];

const statusOptions: OrganizationStatus[] = [
  "Prospect",
  "Onboarding",
  "Active",
  "Paused",
  "Contract Expired",
  "Archived",
];

const riskOptions: WellnessRisk[] = ["Low", "Medium", "High", "Critical"];
const sortOptions = [
  { value: "Organization name", label: "Sort by: Organization (A-Z)" },
  { value: "Employee count", label: "Sort by: Employees" },
  { value: "Contract end date", label: "Sort by: Contract Expiry" },
  { value: "Wellness risk", label: "Sort by: Wellness Risk" },
  { value: "Latest activation", label: "Sort by: Latest Activation" },
];
const roleLabelOptions = [
  "HR Manager",
  "Wellness Coordinator",
  "Executive Sponsor",
  "Finance Contact",
  "Operations Manager",
  "Procurement Contact",
  "Occupational Health Lead",
  "Other",
];

const initialForm: OrganizationForm = {
  name: "",
  industry: "Financial Services",
  country: "Botswana",
  town: "",
  region: "",
  employees: "",
  package: "Corporate Wellness Package",
  contractStart: "2026-01-01",
  contractEnd: "2026-12-31",
  status: "Prospect",
  risk: "Low",
  contact1Name: "",
  contact1Role: "HR Manager",
  contact1CustomRole: "",
  contact1Email: "",
  contact1Phone: "",
  contact1Method: "Email",
  contact2Name: "",
  contact2Role: "Executive Sponsor",
  contact2CustomRole: "",
  contact2Email: "",
  contact2Phone: "",
  contact2Method: "Email",
};

const mockOrganizations: Organization[] = [
  createOrganization({
    id: "org-abc",
    name: "ABC Holdings",
    code: "ABC001",
    logo: "ABC",
    industry: "Conglomerate",
    country: "South Africa",
    primaryLocation: "Johannesburg, Gauteng",
    region: "Gauteng",
    employees: 2450,
    package: "Enterprise Wellness Intelligence Package",
    contractStart: "2024-01-01",
    contractEnd: "2025-12-31",
    risk: "High",
    status: "Active",
    lastActivation: "10 May 2024",
    nextActivation: "20 Jun 2024",
    reportsPublished: 8,
  }),
  createOrganization({
    id: "org-delta",
    name: "Delta Mining Group",
    code: "DMG002",
    logo: "DMG",
    industry: "Mining",
    country: "Botswana",
    primaryLocation: "Rustenburg, North West",
    region: "North West",
    employees: 1120,
    package: "Corporate Wellness Package",
    contractStart: "2024-03-01",
    contractEnd: "2025-02-28",
    risk: "Medium",
    status: "Active",
    lastActivation: "May 22, 2026",
    nextActivation: "Sep 04, 2026",
    reportsPublished: 12,
  }),
  createOrganization({
    id: "org-nova",
    name: "Nova Finance",
    code: "NF003",
    logo: "NF",
    industry: "Financial Services",
    country: "South Africa",
    primaryLocation: "Cape Town, Western Cape",
    region: "Western Cape",
    employees: 860,
    package: "Corporate Wellness Package",
    contractStart: "2024-02-15",
    contractEnd: "2025-02-14",
    risk: "Low",
    status: "Onboarding",
    lastActivation: "Not started",
    nextActivation: "Jul 28, 2026",
    reportsPublished: 1,
  }),
  createOrganization({
    id: "org-legae",
    name: "Legae Academy",
    code: "LA004",
    logo: "LA",
    industry: "Education",
    country: "South Africa",
    primaryLocation: "Pretoria, Gauteng",
    region: "Gauteng",
    employees: 320,
    package: "Starter Wellness Package",
    contractStart: "2024-08-01",
    contractEnd: "2025-07-31",
    risk: "Low",
    status: "Onboarding",
    lastActivation: "Apr 19, 2026",
    nextActivation: "Oct 02, 2026",
    reportsPublished: 4,
  }),
  createOrganization({
    id: "org-btcl",
    name: "BTCL",
    code: "BTCL005",
    logo: "BTCL",
    industry: "Telecommunications",
    country: "Botswana",
    primaryLocation: "Gaborone, Botswana",
    region: "South East District",
    employees: 780,
    package: "Enterprise Wellness Intelligence Package",
    contractStart: "2023-01-01",
    contractEnd: "2024-12-31",
    risk: "High",
    status: "Paused",
    lastActivation: "May 29, 2026",
    nextActivation: "Pending confirmation",
    reportsPublished: 6,
  }),
  createOrganization({
    id: "org-fsg",
    name: "FSG",
    code: "FSG006",
    logo: "FSG",
    industry: "Manufacturing",
    country: "South Africa",
    primaryLocation: "Durban, KwaZulu-Natal",
    region: "KwaZulu-Natal",
    employees: 540,
    package: "Custom Package",
    contractStart: "2023-07-01",
    contractEnd: "2024-06-30",
    risk: "Critical",
    status: "Contract Expired",
    lastActivation: "Mar 18, 2026",
    nextActivation: "Renewal required",
    reportsPublished: 9,
    customPackageNotes: "Includes night-shift screening and depot wellness rotations.",
  }),
  createOrganization({
    id: "org-devre",
    name: "De Vre Group",
    code: "DVG007",
    logo: "DV",
    industry: "Retail",
    country: "South Africa",
    primaryLocation: "Bloemfontein, Free State",
    region: "Free State",
    employees: 210,
    package: "Starter Wellness Package",
    contractStart: "2024-11-01",
    contractEnd: "2025-10-31",
    risk: "Medium",
    status: "Active",
    lastActivation: "Proposal stage",
    nextActivation: "Discovery call",
    reportsPublished: 0,
  }),
];

export function AdminOrganizations() {
  const [organizations, setOrganizations] = useState(mockOrganizations);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [packageFilter, setPackageFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [townFilter, setTownFilter] = useState("All");
  const [expiryFilter, setExpiryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Organization name");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteOrganizationId, setInviteOrganizationId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const industries = uniqueOptions(organizations.map((organization) => organization.industry));
  const countries = uniqueOptions(organizations.map((organization) => organization.country));
  const towns = uniqueOptions(organizations.map((organization) => organization.primaryLocation));

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return organizations
      .filter((organization) => {
        const searchable = [
          organization.name,
          organization.code,
          organization.industry,
          organization.primaryLocation,
          organization.package,
        ]
          .join(" ")
          .toLowerCase();
        return !normalizedQuery || searchable.includes(normalizedQuery);
      })
      .filter((organization) => statusFilter === "All" || organization.status === statusFilter)
      .filter((organization) => industryFilter === "All" || organization.industry === industryFilter)
      .filter((organization) => packageFilter === "All" || organization.package === packageFilter)
      .filter((organization) => riskFilter === "All" || organization.risk === riskFilter)
      .filter((organization) => countryFilter === "All" || organization.country === countryFilter)
      .filter((organization) => townFilter === "All" || organization.primaryLocation === townFilter)
      .filter((organization) => {
        if (expiryFilter === "All") return true;
        const days = daysUntil(organization.contractEnd);
        if (expiryFilter === "Within 60 days") return days >= 0 && days <= 60;
        if (expiryFilter === "Expired") return days < 0;
        return days > 60;
      })
      .sort((a, b) => compareOrganizations(a, b, sortBy));
  }, [
    organizations,
    query,
    statusFilter,
    industryFilter,
    packageFilter,
    riskFilter,
    countryFilter,
    townFilter,
    expiryFilter,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / pageSize));
  const paginatedOrganizations = filteredOrganizations.slice((page - 1) * pageSize, page * pageSize);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function addOrganization(form: OrganizationForm) {
    const organization = organizationFromForm(form);
    setOrganizations((current) => [organization, ...current]);
    setAddOpen(false);
    showToast(`${organization.name} was added locally.`);
  }

  function inviteClientUser(payload: InvitePayload) {
    const targetId = payload.organizationId;
    setOrganizations((current) =>
      current.map((organization) =>
        organization.id === targetId
          ? {
              ...organization,
              clientUsers: [
                ...organization.clientUsers,
                {
                  id: `client-${Date.now()}`,
                  name: payload.name,
                  email: payload.email,
                  role: payload.role,
                  invitationStatus: "Invitation Pending",
                  lastActive: "Invitation sent today",
                },
              ],
            }
          : organization,
      ),
    );
    setInviteOpen(false);
    setInviteOrganizationId(targetId);
    const orgName = organizations.find((organization) => organization.id === targetId)?.name ?? "organization";
    showToast(`Invitation simulated for ${payload.email}. Email includes ${orgName}, role, and a secure time-limited setup link.`);
  }

  return (
    <div className="space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[20px] font-semibold leading-6 text-black">Organizations</h1>
            <p className="mt-2 text-[12px] leading-5 text-black/60">
              Manage client organizations, contracts, branches, departments, and portal access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-card-border bg-white px-4 text-[12px] font-semibold text-black shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <Download className="h-[18px] w-[18px]" aria-hidden="true" />
              Export
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(0,102,255,0.25)] transition hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <AddCircle className="h-[18px] w-[18px]" aria-hidden="true" />
              Add Organization
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Total Organizations" value="24" detail="All client organizations" icon={Building2} />
          <SummaryCard title="Active Contracts" value="18" detail="With active contracts" icon={ClipboardCheck} tone="success" />
          <SummaryCard title="Contracts Expiring Soon" value="4" detail="Within 60 days" icon={Clock} tone="warning" />
          <SummaryCard title="High-Risk Organizations" value="3" detail="High or critical risk" icon={ShieldCheck} tone="danger" />
        </section>

      <section className="rounded-2xl border border-card-border bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.7fr)_repeat(5,minmax(118px,1fr))]">
          <label className="relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#43536b]" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search organizations..."
              className="h-10 w-full rounded-lg border border-card-border bg-white pl-4 pr-10 text-[12px] font-medium text-black outline-none transition placeholder:text-[#667085] focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <FilterSelect label="Status" value={statusFilter} options={["All", ...statusOptions]} onChange={setStatusFilter} />
          <FilterSelect label="Industry" value={industryFilter} options={["All", ...industries]} onChange={setIndustryFilter} />
          <FilterSelect label="Package" value={packageFilter} options={["All", ...packageOptions]} onChange={setPackageFilter} />
          <FilterSelect label="Wellness Risk" value={riskFilter} options={["All", ...riskOptions]} onChange={setRiskFilter} />
          <FilterSelect label="Country" value={countryFilter} options={["All", ...countries]} onChange={setCountryFilter} />
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(160px,0.9fr)_minmax(180px,1.1fr)_minmax(280px,1.7fr)_auto_1fr]">
          <FilterSelect label="Town / Province" value={townFilter} options={["All", ...towns]} onChange={setTownFilter} />
          <FilterSelect label="Contract Expiry" value={expiryFilter} options={["All", "Within 60 days", "Expired", "Healthy"]} onChange={setExpiryFilter} />
          <label className="relative">
            <span className="sr-only">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-card-border bg-white pl-4 pr-20 text-[12px] font-medium text-black outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-3 text-[#43536b]">
              <ArrowDown className="h-[18px] w-[18px]" aria-hidden="true" />
              <Sort className="h-[18px] w-[18px]" aria-hidden="true" />
              <Refresh className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("All");
              setIndustryFilter("All");
              setPackageFilter("All");
              setRiskFilter("All");
              setCountryFilter("All");
              setTownFilter("All");
              setExpiryFilter("All");
              setSortBy("Organization name");
              setPage(1);
            }}
            className="inline-flex h-10 items-center justify-center px-2 text-[12px] font-semibold text-primary transition hover:text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            Clear Filters
          </button>
        </div>
      </section>

      {contractsExpiringSoon(organizations) > 0 ? (
        <StateBanner
          tone="warning"
          title={`${contractsExpiringSoon(organizations)} contracts are expiring within 60 days`}
          detail="Review renewal reminders and contract owners before upcoming activations are confirmed."
        />
      ) : null}
      {error ? <StateBanner tone="error" title="Unable to load organizations" detail={error} /> : null}

      <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_0.55fr_0.7fr_1.15fr_1fr_0.75fr_0.85fr_64px] gap-3 border-b border-card-border bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-black">
          {["Organization", "Industry", "Primary Location", "Branches", "Employees", "Package", "Contract Period", "Wellness Risk", "Status", "Actions"].map((label) => (
            <span key={label} className="min-w-0">{label}</span>
          ))}
        </div>

        {isLoading ? <LoadingState /> : null}
        {!isLoading && filteredOrganizations.length === 0 ? <EmptyState /> : null}
        {!isLoading && paginatedOrganizations.length > 0 ? (
          <div className="divide-y divide-card-border">
            {paginatedOrganizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/admin/organizations/${organization.id}`}
                className="grid w-full cursor-pointer grid-cols-[1.5fr_1fr_1fr_0.55fr_0.7fr_1.15fr_1fr_0.75fr_0.85fr_64px] items-center gap-3 border-l-2 border-transparent px-4 py-3 text-left text-[12px] text-black transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <LogoMark organization={organization} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{organization.name}</span>
                    <span className="block truncate text-black/55">{organization.code}</span>
                  </span>
                </span>
                <span className="min-w-0 truncate text-black/70">{organization.industry}</span>
                <span className="min-w-0 truncate text-black/70">
                  <span className="mr-2" aria-hidden="true">{countryFlag(organization.country)}</span>
                  {organization.primaryLocation}
                </span>
                <span>{displayBranchCount(organization)}</span>
                <span>{organization.employees.toLocaleString()}</span>
                <span className="min-w-0 truncate text-black/70">{organization.package}</span>
                <span className="text-black/70">{formatDateRange(organization.contractStart, organization.contractEnd)}</span>
                <RiskBadge risk={organization.risk} />
                <StatusBadge status={organization.status} />
                <span className="flex justify-end gap-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#e4e7ec]">
                    <Eye className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#e4e7ec]">
                    <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-card-border px-4 py-3">
          <p className="text-[12px] text-black/60">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-8 rounded-2xl border border-card-border bg-white px-2 text-[12px] text-black outline-none"
            >
              {[4, 6, 8].map((size) => <option key={size} value={size}>{size} rows</option>)}
            </select>
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page === 1}
              className="inline-flex h-8 items-center gap-1 rounded-2xl border border-card-border px-3 text-[12px] font-semibold text-black transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft2 className="h-[18px] w-[18px]" aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page === totalPages}
              className="inline-flex h-8 items-center gap-1 rounded-2xl border border-card-border px-3 text-[12px] font-semibold text-black transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {addOpen ? (
        <AddOrganizationModal
          onClose={() => setAddOpen(false)}
          onSubmit={addOrganization}
        />
      ) : null}

      {inviteOpen ? (
        <InviteClientUserModal
          organizations={organizations}
          initialOrganizationId={inviteOrganizationId ?? organizations[0]?.id}
          onClose={() => setInviteOpen(false)}
          onSubmit={inviteClientUser}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-success/20 bg-white px-4 py-3 text-[12px] font-semibold text-black shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export function AdminOrganizationDetails({ organizationId }: { organizationId: string }) {
  const initialOrganization = mockOrganizations.find((organization) => organization.id === organizationId) ?? null;
  const [organization, setOrganization] = useState<Organization | null>(initialOrganization);
  const [activeTab, setActiveTab] = useState("Overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function updateOrganization(updatedOrganization: Organization) {
    setOrganization(updatedOrganization);
  }

  function inviteClientUser(payload: InvitePayload) {
    if (!organization) return;
    setOrganization({
      ...organization,
      clientUsers: [
        ...organization.clientUsers,
        {
          id: `client-${Date.now()}`,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          invitationStatus: "Invitation Pending",
          lastActive: "Invitation sent today",
        },
      ],
    });
    setInviteOpen(false);
    showToast(`Invitation simulated for ${payload.email}.`);
  }

  if (!organization) {
    return (
      <section className="rounded-2xl border border-card-border bg-white p-6 text-black shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
        <p className="text-[14px] font-semibold">Organization not found</p>
        <p className="mt-2 text-[12px] text-black/60">Return to the organizations list and select an available organization.</p>
        <Link href="/admin/organizations" className="mt-4 inline-flex h-9 items-center gap-2 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black">
          <ArrowLeft2 className="h-[18px] w-[18px]" aria-hidden="true" />
          Back to organizations
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[16px] font-medium leading-5">
        <Link href="/admin/organizations" className="text-black transition hover:text-primary">
          Organizations
        </Link>
        <span className="text-black/35">/</span>
        <span className="text-black">{organization.name}</span>
      </div>

      <section className="rounded-lg border border-card-border bg-white px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.035)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <LogoMark organization={organization} size="xl" />
            <div className="min-w-0">
              <h1 className="text-[14px] font-semibold leading-5 text-black">{organization.name}</h1>
              <div className="mt-3 grid gap-x-6 gap-y-2 text-[12px] text-black md:grid-cols-2 xl:grid-cols-3">
                <HeaderMeta icon={Building2} label="Industry:" value={organization.industry} />
                <span className="inline-flex items-center gap-2">
                  <StatusBadge status={organization.status} />
                </span>
                <HeaderMeta icon={ClipboardCheck} label="Package:" value={organization.package} />
                <HeaderMeta icon={Location} label="Location:" value={organization.primaryLocation} />
                <HeaderMeta icon={User} label="Member Since:" value={formatShortDate(organization.contractStart)} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <AdminButton
              onClick={() => setInviteOpen(true)}
              icon={Mail}
              size="xs"
              variant="secondary"
            >
              Invite Client User
            </AdminButton>
            {isEditing ? (
              <>
                <AdminButton
                  onClick={() => setIsEditing(false)}
                  size="xs"
                  variant="secondary"
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  onClick={() => {
                    setIsEditing(false);
                    showToast("Changes saved locally.");
                  }}
                  size="xs"
                  variant="primary"
                >
                  Save Changes
                </AdminButton>
              </>
            ) : (
              <AdminButton
                onClick={() => setIsEditing(true)}
                icon={Edit}
                size="xs"
                variant="primary"
              >
                Edit Organization
              </AdminButton>
            )}
          </div>
        </div>
      </section>

      <div className="border-b border-card-border">
        <div className="flex overflow-x-auto">
              {detailTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <AdminTabButton
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    active={activeTab === tab.label}
                    icon={Icon}
                  >
                    {tab.label}
                  </AdminTabButton>
                );
              })}
        </div>
      </div>

      <section className="-mt-4">
        <section className="rounded-b-2xl rounded-t-none border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.055)]">
          {activeTab === "Overview" ? (
            <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="p-5">
                <OrganizationOverviewForm organization={organization} />
              </div>
              <div className="border-t border-card-border p-5 xl:border-l xl:border-t-0">
                <WellnessRiskGauge risk={organization.risk} />
              </div>
            </div>
          ) : (
            <div className="p-5">
            {activeTab === "Contacts" ? <ContactsTab organization={organization} /> : null}
            {activeTab === "Branches & Departments" ? (
              <BranchesTab organization={organization} onUpdate={updateOrganization} onToast={showToast} />
            ) : null}
            {activeTab === "Contract" ? <ContractTab organization={organization} /> : null}
            {activeTab === "Operations" ? <OperationsTab organization={organization} /> : null}
            {activeTab === "Client Portal Access" ? (
              <ClientPortalTab organization={organization} onInvite={() => setInviteOpen(true)} onUpdate={updateOrganization} onToast={showToast} />
            ) : null}
            </div>
          )}
        </section>
      </section>

      {inviteOpen ? (
        <InviteClientUserModal
          organizations={[organization]}
          initialOrganizationId={organization.id}
          onClose={() => setInviteOpen(false)}
          onSubmit={inviteClientUser}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-success/20 bg-white px-4 py-3 text-[12px] font-semibold text-black shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "primary",
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Building2;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-success border-success/35 bg-success/10"
      : tone === "warning"
        ? "text-warning border-warning/40 bg-warning/10"
        : tone === "danger"
          ? "text-pulse-red border-pulse-red/35 bg-pulse-red/10"
          : "text-primary border-primary/35 bg-primary/10";
  return (
    <div className="rounded-2xl border border-card-border bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.055)]">
      <div className="flex items-center gap-4">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full border", toneClass)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[12px] font-medium leading-4 text-black">{title}</p>
          <p className="mt-1 text-[24px] font-semibold leading-7 text-black">{value}</p>
        </div>
      </div>
      <p className="mt-5 text-[12px] leading-4 text-black/60">{detail}</p>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-card-border bg-white pl-4 pr-10 text-[12px] font-medium text-black outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? label : option}
          </option>
        ))}
      </select>
      <ArrowDown className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#43536b]" aria-hidden="true" />
    </label>
  );
}

function HeaderMeta({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-[12px] leading-4">
      <Icon className="h-[18px] w-[18px] shrink-0 text-[#475467]" aria-hidden="true" />
      <span className="shrink-0 text-black/70">{label}</span>
      <span className="min-w-0 truncate text-black">{value}</span>
    </span>
  );
}

function LogoMark({ organization, size = "sm" }: { organization: Organization; size?: "sm" | "lg" | "xl" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border border-card-border bg-[#f2f4f7] bg-cover bg-center font-semibold text-black",
        size === "xl"
          ? "h-20 w-20 rounded-md bg-white text-[20px] text-primary shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
          : size === "lg"
          ? "h-20 w-20 rounded-full text-[22px] ring-4 ring-primary/10"
          : "h-9 w-9 rounded-2xl text-[12px]",
      )}
      style={organization.logo?.startsWith("data:") ? { backgroundImage: `url(${organization.logo})` } : undefined}
    >
      {organization.logo?.startsWith("data:") ? null : organization.logo ?? initials(organization.name)}
    </span>
  );
}

function StatusBadge({ status }: { status: OrganizationStatus }) {
  const tone: Record<OrganizationStatus, "neutral" | "info" | "success" | "warning" | "danger"> = {
    Prospect: "neutral",
    Onboarding: "info",
    Active: "success",
    Paused: "warning",
    "Contract Expired": "danger",
    Archived: "neutral",
  };
  return <AdminBadge tone={tone[status]}>{status}</AdminBadge>;
}

function RiskBadge({ risk }: { risk: WellnessRisk }) {
  const styles: Record<WellnessRisk, string> = {
    Low: "border-success/20 bg-success/10 text-success",
    Medium: "border-warning/25 bg-warning/10 text-warning",
    High: "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
    Critical: "border-pulse-red/35 bg-pulse-red/15 text-pulse-red",
  };
  return <span className={cn("inline-flex w-fit rounded-full border px-2.5 py-1 text-[12px] font-medium leading-4", styles[risk])}>{risk}</span>;
}

function WellnessRiskGauge({ risk }: { risk: WellnessRisk }) {
  const riskMeta: Record<WellnessRisk, { score: number; label: string; tone: string; rotation: number }> = {
    Low: { score: 22, label: "LOW", tone: "text-success", rotation: -54 },
    Medium: { score: 45, label: "MEDIUM", tone: "text-black", rotation: -12 },
    High: { score: 78, label: "HIGH", tone: "text-pulse-red", rotation: 42 },
    Critical: { score: 92, label: "CRITICAL", tone: "text-pulse-red", rotation: 64 },
  };
  const meta = riskMeta[risk];

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-black">Wellness Risk Score</h2>
          <AlertCircle className="h-[18px] w-[18px] text-[#475467]" aria-hidden="true" />
        </div>
        <ArrowDown className="h-[18px] w-[18px] rotate-180 text-black" aria-hidden="true" />
      </div>

      <div className="mt-8 flex flex-col items-center">
        <div className="relative h-36 w-64 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-64 w-64 rounded-full"
            style={{
              background:
                "conic-gradient(from 270deg at 50% 50%, #48bb78 0deg 45deg, #9bd330 45deg 90deg, #fbbf24 90deg 135deg, #fb923c 135deg 162deg, #ef4444 162deg 180deg, #e5e7eb 180deg 360deg)",
            }}
          />
          <div className="absolute left-1/2 top-8 h-48 w-48 -translate-x-1/2 rounded-full bg-white" />
          <div className="absolute left-0 top-[118px] text-[12px] font-medium text-black/55">0</div>
          <div className="absolute right-0 top-[118px] text-[12px] font-medium text-black/55">100</div>
          <div className="absolute bottom-0 left-1/2 h-20 w-1 origin-bottom rounded-full bg-[#fb923c] transition-transform" style={{ transform: `translateX(-50%) rotate(${meta.rotation}deg)` }} />
          <div className="absolute bottom-[-5px] left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-[#fb923c] shadow" />
          <div className="absolute inset-x-0 bottom-0 text-center">
            <p className="text-[28px] font-semibold leading-7 text-black">
              {meta.score}<span className="text-[14px] font-medium">/100</span>
            </p>
            <p className={cn("mt-2 text-[12px] font-semibold", meta.tone)}>{meta.label}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-[12px] text-black/65">
        <LegendDot color="bg-[#48bb78]" label="0-25" />
        <LegendDot color="bg-[#9bd330]" label="26-50" />
        <LegendDot color="bg-[#fb923c]" label="51-75" />
        <LegendDot color="bg-[#ef4444]" label="76-100" />
      </div>

      <div className="mt-8 flex gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <Refresh className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
        <div>
          <p className="text-[12px] font-semibold text-black">Auto-calculated on page load</p>
          <p className="mt-1 text-[12px] text-black/60">Calculating from 0 to {meta.score} over 3 seconds</p>
        </div>
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      {label}
    </span>
  );
}

const detailTabs = [
  { label: "Overview", icon: Building2 },
  { label: "Contacts", icon: User },
  { label: "Branches & Departments", icon: Building2 },
  { label: "Contract", icon: ClipboardCheck },
  { label: "Operations", icon: Activity },
  { label: "Client Portal Access", icon: Globe2 },
];

function OrganizationOverviewForm({ organization }: { organization: Organization }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-[18px] w-[18px] text-black" aria-hidden="true" />
        <h2 className="text-[14px] font-semibold text-black">Organization Overview</h2>
      </div>

      <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        <ReadonlyField label="Organization Name" required value={organization.name} />
        <ReadonlyField label="Reference Number" value={referenceNumber(organization)} />
        <ReadonlyField label="Industry" required value={organization.industry} select />
        <ReadonlyField label="Country" required value={organization.country} select />
        <ReadonlyField label="Primary Location" required value={organization.primaryLocation} select />
        <ReadonlyField label="Region" value={organization.region} select />
        <ReadonlyField label="Employee Count" required value={organization.employees.toLocaleString()} />
        <ReadonlyField label="Number of Branches" required value={String(displayBranchCount(organization))} />
        <ReadonlyField label="Number of Departments" required value={String(displayDepartmentCount(organization))} />
        <ReadonlyField label="Package" required value={organization.package} select />
        <ReadonlyField label="Status" required value={organization.status} select />
        <ReadonlyField label="Wellness Risk" value={organization.risk} muted />
        <ReadonlyField label="Contract Start Date" value={formatShortDate(organization.contractStart)} icon={CalendarDays} />
        <ReadonlyField label="Contract End Date" value={formatShortDate(organization.contractEnd)} icon={CalendarDays} />
        <ReadonlyField label="Last Activation" value={organization.lastActivation} icon={CalendarDays} />
        <ReadonlyField label="Next Activation" value={organization.nextActivation} icon={CalendarDays} />
        <ReadonlyField label="Reports Published" value={String(organization.reportsPublished)} />
        <ReadonlyField label="Portal Users" value={String(organization.clientUsers.length)} />
      </div>

      <div className="space-y-2">
        <p className="text-[12px] font-medium text-black">Organization Logo</p>
        <div className="flex flex-wrap items-center gap-3">
          <LogoMark organization={organization} />
          <div className="flex h-11 min-w-[240px] items-center justify-center gap-2 rounded-lg border border-dashed border-card-border bg-white px-4 text-[12px] text-black/65">
            <Download className="h-[18px] w-[18px] rotate-180 text-black/55" aria-hidden="true" />
            Click to upload or drag and drop
          </div>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-card-border bg-white px-4 text-[12px] font-semibold text-primary transition hover:bg-black hover:text-white">
            <Edit className="h-[18px] w-[18px]" aria-hidden="true" />
            Replace
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-card-border bg-white px-4 text-[12px] font-semibold text-pulse-red transition hover:bg-black hover:text-white">
            <Trash className="h-[18px] w-[18px]" aria-hidden="true" />
            Remove
          </button>
        </div>
        <p className="text-[12px] text-black/55">Recommended size: 512 x 512px. Square images work best.</p>
      </div>
    </div>
  );
}

function ReadonlyField({
  label,
  value,
  required,
  select,
  muted,
  icon: Icon,
}: {
  label: string;
  value: string;
  required?: boolean;
  select?: boolean;
  muted?: boolean;
  icon?: typeof Building2;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-black/70">
        {label} {required ? <span className="text-pulse-red">*</span> : null}
      </span>
      <span className={cn("flex h-9 items-center gap-2 rounded-lg border border-card-border px-3 text-[12px] text-black", muted ? "bg-[#f2f4f7] text-black/55" : "bg-white")}>
        {Icon ? <Icon className="h-[18px] w-[18px] shrink-0 text-[#475467]" aria-hidden="true" /> : null}
        <span className="min-w-0 flex-1 truncate">{value}</span>
        {select ? <ArrowDown className="h-[18px] w-[18px] shrink-0 text-[#475467]" aria-hidden="true" /> : null}
      </span>
    </label>
  );
}

function ContactsTab({ organization }: { organization: Organization }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-card-border">
      <div className="grid grid-cols-[1fr_0.9fr_1.2fr_0.8fr_0.6fr] gap-3 bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-black">
        <span>Full name</span><span>Role label</span><span>Email</span><span>Preferred</span><span>Primary</span>
      </div>
      {organization.contacts.map((contact) => (
        <div key={contact.id} className="grid grid-cols-[1fr_0.9fr_1.2fr_0.8fr_0.6fr] gap-3 border-t border-card-border px-4 py-3 text-[12px] text-black">
          <span className="font-semibold">{contact.name}<span className="block font-normal text-black/55">{contact.phone}</span></span>
          <span>{contact.roleLabel}</span>
          <span className="truncate">{contact.email}</span>
          <span>{contact.method}</span>
          <span>{contact.primary ? "Yes" : "No"}</span>
          <span className="col-span-5 text-black/60">{contact.notes}</span>
        </div>
      ))}
    </div>
  );
}

type BranchStatus = "Active" | "Paused" | "Archived";

type DepartmentOverview = {
  id: string;
  name: string;
  employees: number;
  wellnessScore: number;
  risk: WellnessRisk;
  latestActivation: string;
  status: BranchStatus;
};

type BranchOverview = {
  id: string;
  name: string;
  locationLines: string[];
  primary: boolean;
  departments: number;
  employees: number;
  wellnessScore: number;
  wellnessLabel: string;
  risk: WellnessRisk;
  status: BranchStatus;
  departmentRows: DepartmentOverview[];
};

type BranchOverviewForm = {
  name: string;
  country: string;
  province: string;
  town: string;
  address: string;
  employees: string;
  primary: boolean;
  status: BranchStatus;
  risk: WellnessRisk;
  contactName: string;
  email: string;
  phone: string;
};

type DepartmentOverviewForm = {
  name: string;
  branchId: string;
  lead: string;
  employees: string;
  risk: WellnessRisk;
  wellnessScore: string;
  status: BranchStatus;
  notes: string;
};

const initialBranchOverview: BranchOverview[] = [
  {
    id: "head-office-sandton",
    name: "Head Office – Sandton",
    locationLines: ["Sandton", "Johannesburg", "Gauteng"],
    primary: true,
    departments: 14,
    employees: 1250,
    wellnessScore: 82,
    wellnessLabel: "Good",
    risk: "Low",
    status: "Active",
    departmentRows: [
      { id: "hr", name: "Human Resources", employees: 45, wellnessScore: 88, risk: "Low", latestActivation: "Wellness Day · 15 May 2024", status: "Active" },
      { id: "finance", name: "Finance", employees: 78, wellnessScore: 76, risk: "Medium", latestActivation: "Financial Wellness Webinar · 10 Apr 2024", status: "Active" },
      { id: "it", name: "Information Technology", employees: 120, wellnessScore: 81, risk: "Low", latestActivation: "Ergonomics Workshop · 22 Apr 2024", status: "Active" },
      { id: "operations", name: "Operations", employees: 340, wellnessScore: 72, risk: "Medium", latestActivation: "Stress Management Session · 05 Apr 2024", status: "Active" },
      { id: "sales", name: "Sales & Marketing", employees: 190, wellnessScore: 85, risk: "Low", latestActivation: "Nutrition Talk · 18 May 2024", status: "Active" },
    ],
  },
  {
    id: "gaborone-branch",
    name: "Gaborone Branch",
    locationLines: ["Gaborone", "South East District"],
    primary: false,
    departments: 10,
    employees: 780,
    wellnessScore: 74,
    wellnessLabel: "Good",
    risk: "Medium",
    status: "Active",
    departmentRows: [],
  },
  {
    id: "cape-town-branch",
    name: "Cape Town Branch",
    locationLines: ["Cape Town", "Western Cape"],
    primary: false,
    departments: 8,
    employees: 420,
    wellnessScore: 71,
    wellnessLabel: "Good",
    risk: "Medium",
    status: "Active",
    departmentRows: [],
  },
];

function BranchesTab({
  organization,
  onToast,
}: {
  organization: Organization;
  onUpdate: (organization: Organization) => void;
  onToast: (message: string) => void;
}) {
  const [branches, setBranches] = useState<BranchOverview[]>(initialBranchOverview);
  const [expandedBranchId, setExpandedBranchId] = useState("head-office-sandton");
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [addDepartmentBranchId, setAddDepartmentBranchId] = useState<string | null>(null);
  const activeBranches = branches.filter((branch) => branch.status !== "Archived");
  const organizationName = organization.name;
  const totalBranches = activeBranches.length;
  const totalDepartments = activeBranches.reduce((sum, branch) => sum + branch.departments, 0);
  const totalEmployees = activeBranches.reduce((sum, branch) => sum + branch.employees, 0);
  const averageWellnessScore = Math.round(
    activeBranches.reduce((sum, branch) => sum + branch.wellnessScore * branch.employees, 0) / Math.max(totalEmployees, 1),
  );
  const expandedBranch = branches.find((branch) => branch.id === addDepartmentBranchId) ?? branches[0];

  function toggleBranch(branchId: string) {
    setExpandedBranchId((current) => (current === branchId ? "" : branchId));
  }

  function createBranch(form: BranchOverviewForm) {
    const branch: BranchOverview = {
      id: `branch-${Date.now()}`,
      name: form.name || "New Branch",
      locationLines: [form.town || "Town to confirm", form.province || form.country || "Region to confirm"],
      primary: form.primary,
      departments: 0,
      employees: Number(form.employees.replace(/,/g, "")) || 0,
      wellnessScore: 0,
      wellnessLabel: "Good",
      risk: form.risk as WellnessRisk,
      status: form.status as BranchStatus,
      departmentRows: [],
    };
    setBranches((current) => [...current, branch]);
    setExpandedBranchId(branch.id);
    setAddBranchOpen(false);
    onToast("Branch added locally.");
  }

  function createDepartment(form: DepartmentOverviewForm) {
    const targetBranchId = form.branchId || addDepartmentBranchId;
    if (!targetBranchId) return;
    setBranches((current) =>
      current.map((branch) =>
        branch.id === targetBranchId
          ? {
              ...branch,
              departments: branch.departments + 1,
              departmentRows: [
                ...branch.departmentRows,
                {
                  id: `department-${Date.now()}`,
                  name: form.name || "New Department",
                  employees: Number(form.employees.replace(/,/g, "")) || 0,
                  wellnessScore: Number(form.wellnessScore) || 0,
                  risk: form.risk as WellnessRisk,
                  latestActivation: form.notes || "Not scheduled",
                  status: form.status as BranchStatus,
                },
              ],
            }
          : branch,
      ),
    );
    setAddDepartmentBranchId(null);
    onToast("Department added locally.");
  }

  function deleteDepartment(branchId: string, departmentId: string) {
    if (!window.confirm("Delete this department?")) return;
    setBranches((current) =>
      current.map((branch) =>
        branch.id === branchId
          ? {
              ...branch,
              departments: Math.max(0, branch.departments - 1),
              departmentRows: branch.departmentRows.filter((department) => department.id !== departmentId),
            }
          : branch,
      ),
    );
    onToast("Department deleted locally.");
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-black">Branches Overview</h2>
        <span className="sr-only">Branches overview for {organizationName}</span>
        <div className="flex items-center gap-2">
          <AdminButton
            onClick={() => setAddBranchOpen(true)}
            icon={AddCircle}
            size="xs"
            variant="primary"
          >
            Add Branch
          </AdminButton>
          <AdminIconButton>
            <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="sr-only">More branch actions</span>
          </AdminIconButton>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={Building2} value={String(totalBranches)} label="Total Branches" subtext="Across 2 provinces" tone="info" />
        <AdminMetricCard icon={ClipboardCheck} value={String(totalDepartments)} label="Total Departments" subtext="Across all branches" tone="warning" />
        <AdminMetricCard icon={UsersRound} value={totalEmployees.toLocaleString()} label="Total Employees" subtext="Across all branches" tone="success" />
        <AdminMetricCard icon={HeartPulse} value={String(averageWellnessScore)} label="Avg. Wellness Score" subtext="Across all branches" tone="danger" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_12px_30px_rgba(15,23,42,0.045)]">
        <div className="divide-y divide-card-border">
          {branches.map((branch) => {
            const isExpanded = expandedBranchId === branch.id;
            return (
              <div key={branch.id}>
                <button
                  type="button"
                  onClick={() => toggleBranch(branch.id)}
                  className="grid w-full cursor-pointer grid-cols-[24px_minmax(220px,1.5fr)_0.55fr_0.7fr_0.9fr_0.7fr_0.65fr_36px] items-center gap-2.5 px-4 py-2.5 text-left text-[12px] text-black transition hover:bg-[#f8fafc]"
                  style={{ fontSize: 12, lineHeight: "16px" }}
                >
                  <ArrowDown className={cn("h-[18px] w-[18px] text-black/55 transition-transform duration-200", isExpanded ? "" : "-rotate-90")} aria-hidden="true" />
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/15 bg-primary/10 text-primary">
                      <Building2 className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[12px] font-semibold leading-4">{branch.name}</span>
                        {branch.primary ? <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary">Primary</span> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] leading-4 text-black/55">{branch.locationLines.join(", ")}</span>
                    </span>
                  </span>
                  <BranchMetric label="Departments" value={String(branch.departments)} />
                  <BranchMetric label="Employees" value={branch.employees.toLocaleString()} />
                  <span className="flex items-center gap-2">
                    <CircularScore value={branch.wellnessScore} />
                    <span className="font-medium text-black/70">{branch.wellnessLabel}</span>
                  </span>
                  <RiskBadge risk={branch.risk} />
                  <BranchStatusBadge status={branch.status} />
                  <span className="flex justify-end">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-black transition hover:bg-[#eef2f6]">
                      <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                  </span>
                </button>

                <div className={cn("grid transition-[grid-template-rows] duration-200 ease-out", isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <div className="border-t border-card-border bg-[#fbfcfd] px-4 py-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-[12px] font-semibold leading-4 text-black">Departments ({branch.departments})</h3>
                        <AdminButton
                          onClick={() => setAddDepartmentBranchId(branch.id)}
                          icon={AddCircle}
                          size="xs"
                          variant="outlinePrimary"
                        >
                          Add Department
                        </AdminButton>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-card-border bg-white text-[12px]" style={{ fontSize: 12, lineHeight: "16px" }}>
                        <div className="grid grid-cols-[1.1fr_0.5fr_0.7fr_0.6fr_1.1fr_0.6fr_70px] gap-3 bg-[#f8fafc] px-4 py-2.5 text-[12px] font-semibold leading-4 text-black">
                          <span>Department Name</span>
                          <span>Employees</span>
                          <span>Wellness Score</span>
                          <span>Risk Level</span>
                          <span>Latest Activation</span>
                          <span>Status</span>
                          <span>Actions</span>
                        </div>
                        {branch.departmentRows.slice(0, branch.id === "head-office-sandton" ? 5 : branch.departmentRows.length).map((department) => (
                          <div key={department.id} className="grid grid-cols-[1.1fr_0.5fr_0.7fr_0.6fr_1.1fr_0.6fr_70px] items-center gap-3 border-t border-card-border px-4 py-3 text-[12px] text-black transition hover:bg-[#f8fafc]">
                            <span className="font-medium">{department.name}</span>
                            <span>{department.employees}</span>
                            <span className="inline-flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-success" />
                              {department.wellnessScore}
                            </span>
                            <RiskBadge risk={department.risk} />
                            <span className="text-black/65">{department.latestActivation}</span>
                            <BranchStatusBadge status={department.status} />
                            <span className="flex items-center gap-1">
                              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10">
                                <Edit className="h-[18px] w-[18px]" aria-hidden="true" />
                                <span className="sr-only">Edit department</span>
                              </button>
                              <button type="button" onClick={() => deleteDepartment(branch.id, department.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-pulse-red transition hover:bg-pulse-red/10">
                                <Trash className="h-[18px] w-[18px]" aria-hidden="true" />
                                <span className="sr-only">Delete department</span>
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                      {branch.id === "head-office-sandton" ? (
                        <button type="button" className="mt-3 inline-flex items-center gap-1 rounded-none border-0 bg-transparent p-0 text-[12px] font-medium leading-4 text-primary transition hover:text-black" style={{ fontSize: 12, lineHeight: "16px" }}>
                          View all 14 departments
                          <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[12px] text-black/55">Showing 1 to {branches.length} of {branches.length} branches</p>

      {addBranchOpen ? <AddBranchModal onClose={() => setAddBranchOpen(false)} onSubmit={createBranch} /> : null}
      {addDepartmentBranchId ? (
        <AddDepartmentModal
          branches={branches}
          defaultBranchId={expandedBranch?.id}
          onClose={() => setAddDepartmentBranchId(null)}
          onSubmit={createDepartment}
        />
      ) : null}
    </div>
  );
}

function BranchMetric({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="block text-[12px] leading-4 text-black/55">{label}</span>
      <span className="mt-0.5 block text-[12px] font-semibold leading-4 text-black">{value}</span>
    </span>
  );
}

function CircularScore({ value }: { value: number }) {
  return (
    <span
      className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-semibold text-success"
      style={{ background: `conic-gradient(#22c55e ${value * 3.6}deg, #e5e7eb 0deg)` }}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white">{value}</span>
    </span>
  );
}

function BranchStatusBadge({ status }: { status: BranchStatus }) {
  const tone: Record<BranchStatus, "success" | "warning" | "neutral"> = {
    Active: "success",
    Paused: "warning",
    Archived: "neutral",
  };
  return <AdminBadge tone={tone[status]}>{status}</AdminBadge>;
}

function AddBranchModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (form: BranchOverviewForm) => void }) {
  const [form, setForm] = useState<BranchOverviewForm>({
    name: "",
    country: "South Africa",
    province: "",
    town: "",
    address: "",
    employees: "",
    primary: false,
    status: "Active",
    risk: "Low",
    contactName: "",
    email: "",
    phone: "",
  });

  return (
    <Modal title="Add Branch" onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Branch Name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} required />
          <TextInput label="Country" value={form.country} onChange={(country) => setForm((current) => ({ ...current, country }))} />
          <TextInput label="Province" value={form.province} onChange={(province) => setForm((current) => ({ ...current, province }))} />
          <TextInput label="Town" value={form.town} onChange={(town) => setForm((current) => ({ ...current, town }))} />
          <TextInput label="Address" value={form.address} onChange={(address) => setForm((current) => ({ ...current, address }))} />
          <TextInput label="Employee Count" value={form.employees} onChange={(employees) => setForm((current) => ({ ...current, employees }))} />
          <SelectInput label="Status" value={form.status} options={["Active", "Paused", "Archived"]} onChange={(status) => setForm((current) => ({ ...current, status: status as BranchStatus }))} />
          <SelectInput label="Risk" value={form.risk} options={riskOptions} onChange={(risk) => setForm((current) => ({ ...current, risk: risk as WellnessRisk }))} />
          <TextInput label="Contact Name" value={form.contactName} onChange={(contactName) => setForm((current) => ({ ...current, contactName }))} />
          <TextInput label="Email" value={form.email} onChange={(email) => setForm((current) => ({ ...current, email }))} />
          <TextInput label="Phone" value={form.phone} onChange={(phone) => setForm((current) => ({ ...current, phone }))} />
          <label className="flex items-center gap-2 self-end rounded-2xl border border-card-border px-3 py-2 text-[12px] font-semibold text-black">
            <input type="checkbox" checked={form.primary} onChange={(event) => setForm((current) => ({ ...current, primary: event.target.checked }))} />
            Primary Branch
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-2xl border border-card-border px-4 text-[12px] font-semibold text-black">Cancel</button>
          <button type="submit" className="h-9 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black">Add Branch</button>
        </div>
      </form>
    </Modal>
  );
}

function AddDepartmentModal({
  branches,
  defaultBranchId,
  onClose,
  onSubmit,
}: {
  branches: BranchOverview[];
  defaultBranchId?: string;
  onClose: () => void;
  onSubmit: (form: DepartmentOverviewForm) => void;
}) {
  const [form, setForm] = useState<DepartmentOverviewForm>({
    name: "",
    branchId: defaultBranchId ?? branches[0]?.id ?? "",
    lead: "",
    employees: "",
    risk: "Low",
    wellnessScore: "",
    status: "Active",
    notes: "",
  });

  return (
    <Modal title="Add Department" onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Department Name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} required />
          <label className="grid gap-1 text-[12px] font-semibold text-black">
            Branch
            <select value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))} className="h-10 rounded-2xl border border-card-border px-3 text-[12px] font-normal outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10">
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </label>
          <TextInput label="Department Lead" value={form.lead} onChange={(lead) => setForm((current) => ({ ...current, lead }))} />
          <TextInput label="Employees" value={form.employees} onChange={(employees) => setForm((current) => ({ ...current, employees }))} />
          <SelectInput label="Risk" value={form.risk} options={riskOptions} onChange={(risk) => setForm((current) => ({ ...current, risk: risk as WellnessRisk }))} />
          <TextInput label="Wellness Score" value={form.wellnessScore} onChange={(wellnessScore) => setForm((current) => ({ ...current, wellnessScore }))} />
          <SelectInput label="Status" value={form.status} options={["Active", "Paused", "Archived"]} onChange={(status) => setForm((current) => ({ ...current, status: status as BranchStatus }))} />
          <TextInput label="Notes" value={form.notes} onChange={(notes) => setForm((current) => ({ ...current, notes }))} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-2xl border border-card-border px-4 text-[12px] font-semibold text-black">Cancel</button>
          <button type="submit" className="h-9 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black">Add Department</button>
        </div>
      </form>
    </Modal>
  );
}

function ContractTab({ organization }: { organization: Organization }) {
  const remaining = daysUntil(organization.contractEnd);
  return (
    <div className="space-y-3">
      {remaining <= 60 ? (
        <StateBanner tone="warning" title="Contract renewal warning" detail="This contract is expiring within 60 days. Confirm renewal owner and reminder cadence." />
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        <DetailTile label="Package" value={organization.package} />
        <DetailTile label="Contract start date" value={organization.contractStart} />
        <DetailTile label="Contract end date" value={organization.contractEnd} />
        <DetailTile label="Contract duration" value={contractDuration(organization.contractStart, organization.contractEnd)} />
        <DetailTile label="Contract status" value={remaining < 0 ? "Expired" : "Active"} />
        <DetailTile label="Days remaining" value={remaining < 0 ? "Expired" : `${remaining} days`} />
        <DetailTile label="Renewal reminder" value={remaining <= 60 ? "Required now" : "Scheduled 60 days before expiry"} />
        <DetailTile label="Custom package notes" value={organization.customPackageNotes ?? "None"} />
      </div>
    </div>
  );
}

function ActivationsTab({ organization }: { organization: Organization }) {
  return <MiniTable columns={["Activation", "Type", "Date", "Branch", "Status", "Participation", "Report"]} rows={organization.activations.map((item) => [item.title, item.type, item.date, item.branch, item.status, item.participation, item.reportStatus])} />;
}

function ReportsTab({ organization }: { organization: Organization }) {
  return <MiniTable columns={["Report", "Type", "Period", "Status", "Published", "Actions"]} rows={organization.reports.map((item) => [item.title, item.type, item.period, item.status, item.publishedDate, "Preview · Download"])} />;
}

function OperationsTab({ organization }: { organization: Organization }) {
  return (
    <div className="space-y-5">
      <OperationsSection title="Activations" icon={CalendarCheck}>
        <ActivationsTab organization={organization} />
      </OperationsSection>
      <OperationsSection title="Reports" icon={FileText}>
        <ReportsTab organization={organization} />
      </OperationsSection>
      <OperationsSection title="Insights" icon={HeartPulse}>
        <SimpleList title="Wellness Insights" items={organization.insights} />
      </OperationsSection>
    </div>
  );
}

function OperationsSection({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-[18px] w-[18px] text-black" aria-hidden="true" />
        <h2 className="text-[14px] font-semibold text-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ClientPortalTab({
  organization,
  onInvite,
  onUpdate,
  onToast,
}: {
  organization: Organization;
  onInvite: () => void;
  onUpdate: (organization: Organization) => void;
  onToast: (message: string) => void;
}) {
  function updateUser(id: string, invitationStatus: InvitationStatus, message: string) {
    onUpdate({
      ...organization,
      clientUsers: organization.clientUsers.map((user) =>
        user.id === id ? { ...user, invitationStatus } : user,
      ),
    });
    onToast(message);
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={onInvite} className="inline-flex h-9 items-center gap-2 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black">
        <User className="h-[18px] w-[18px]" aria-hidden="true" />
        Invite Client User
      </button>
      <div className="overflow-hidden rounded-2xl border border-card-border">
        <div className="grid grid-cols-[1fr_1.3fr_0.7fr_0.9fr_0.8fr_1.2fr] gap-3 bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-black">
          <span>Name</span><span>Email</span><span>Role</span><span>Invitation</span><span>Last active</span><span>Actions</span>
        </div>
        {organization.clientUsers.map((user) => (
          <div key={user.id} className="grid grid-cols-[1fr_1.3fr_0.7fr_0.9fr_0.8fr_1.2fr] gap-3 border-t border-card-border px-4 py-3 text-[12px] text-black">
            <span className="font-semibold">{user.name}</span>
            <span className="truncate">{user.email}</span>
            <span>{user.role}</span>
            <span>{user.invitationStatus}</span>
            <span>{user.lastActive}</span>
            <span className="flex flex-wrap gap-2">
              <button type="button" onClick={() => updateUser(user.id, "Invitation Pending", "Invitation resent locally.")} className="font-semibold text-primary">Resend</button>
              <button type="button" onClick={() => updateUser(user.id, "Not Invited", "Invitation revoked locally.")} className="font-semibold text-black/60">Revoke</button>
              <button type="button" onClick={() => updateUser(user.id, "Access Suspended", "Access suspended locally.")} className="font-semibold text-warning">Suspend</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white px-4 py-3">
      <p className="text-[12px] leading-4 text-black/55">{label}</p>
      <p className="mt-1 text-[12px] font-semibold leading-4 text-black">{value}</p>
    </div>
  );
}

function MiniTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-card-border">
      <div className="grid gap-3 bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-black" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => <span key={column}>{column}</span>)}
      </div>
      {rows.map((row) => (
        <div key={row.join("-")} className="grid gap-3 border-t border-card-border px-4 py-3 text-[12px] text-black/70" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {row.map((cell) => <span key={cell} className="min-w-0 truncate">{cell}</span>)}
        </div>
      ))}
    </div>
  );
}

function SimpleList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-card-border bg-white p-4">
      <h3 className="text-[14px] font-semibold text-black">{title}</h3>
      <div className="mt-3 divide-y divide-card-border">
        {items.map((item) => <p key={item} className="py-3 text-[12px] leading-5 text-black/70">{item}</p>)}
      </div>
    </div>
  );
}

function AddOrganizationModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (form: OrganizationForm) => void }) {
  const [form, setForm] = useState(initialForm);
  const canSubmit = form.name.trim() && form.town.trim() && form.employees.trim() && form.contact1Email.trim() && form.contact2Email.trim();

  return (
    <Modal title="Add Organization" onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(form);
        }}
      >
        <LogoUpload value={form.logo} onChange={(logo) => setForm((current) => ({ ...current, logo }))} />
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Company name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} required />
          <TextInput label="Industry" value={form.industry} onChange={(industry) => setForm((current) => ({ ...current, industry }))} />
          <TextInput label="Country" value={form.country} onChange={(country) => setForm((current) => ({ ...current, country }))} />
          <TextInput label="Primary town / city" value={form.town} onChange={(town) => setForm((current) => ({ ...current, town }))} required />
          <TextInput label="Province / district / region" value={form.region} onChange={(region) => setForm((current) => ({ ...current, region }))} />
          <TextInput label="Employee count" value={form.employees} onChange={(employees) => setForm((current) => ({ ...current, employees }))} required />
          <SelectInput label="Package" value={form.package} options={packageOptions} onChange={(value) => setForm((current) => ({ ...current, package: value as PackageName }))} />
          <SelectInput label="Status" value={form.status} options={statusOptions} onChange={(value) => setForm((current) => ({ ...current, status: value as OrganizationStatus }))} />
          <SelectInput label="Wellness risk" value={form.risk} options={riskOptions} onChange={(value) => setForm((current) => ({ ...current, risk: value as WellnessRisk }))} />
          <TextInput label="Contract start date" value={form.contractStart} onChange={(contractStart) => setForm((current) => ({ ...current, contractStart }))} />
          <TextInput label="Contract end date" value={form.contractEnd} onChange={(contractEnd) => setForm((current) => ({ ...current, contractEnd }))} />
        </div>
        <ContactFields title="Contact 1" prefix="contact1" form={form} setForm={setForm} />
        <ContactFields title="Contact 2" prefix="contact2" form={form} setForm={setForm} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-2xl border border-card-border px-4 text-[12px] font-semibold text-black">Cancel</button>
          <button type="submit" disabled={!canSubmit} className="h-9 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45">Create organization</button>
        </div>
      </form>
    </Modal>
  );
}

type InvitePayload = {
  name: string;
  email: string;
  role: ClientRole;
  organizationId: string;
  message: string;
};

function InviteClientUserModal({
  organizations,
  initialOrganizationId,
  onClose,
  onSubmit,
}: {
  organizations: Organization[];
  initialOrganizationId?: string;
  onClose: () => void;
  onSubmit: (payload: InvitePayload) => void;
}) {
  const [payload, setPayload] = useState<InvitePayload>({
    name: "",
    email: "",
    role: "Client Viewer",
    organizationId: initialOrganizationId ?? organizations[0]?.id ?? "",
    message: "",
  });
  const canSubmit = payload.name.trim() && payload.email.trim() && payload.organizationId;
  return (
    <Modal title="Invite Client User" onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(payload);
        }}
      >
        <TextInput label="Full name" value={payload.name} onChange={(name) => setPayload((current) => ({ ...current, name }))} required />
        <TextInput label="Email address" value={payload.email} onChange={(email) => setPayload((current) => ({ ...current, email }))} required />
        <SelectInput label="Client role" value={payload.role} options={["Client Admin", "Client Viewer"]} onChange={(role) => setPayload((current) => ({ ...current, role: role as ClientRole }))} />
        <label className="grid gap-1 text-[12px] font-semibold text-black">
          Organization
          <select value={payload.organizationId} onChange={(event) => setPayload((current) => ({ ...current, organizationId: event.target.value }))} className="h-10 rounded-2xl border border-card-border px-3 text-[12px] font-normal outline-none focus:ring-4 focus:ring-primary/10">
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-[12px] font-semibold text-black">
          Optional personalized message
          <textarea value={payload.message} onChange={(event) => setPayload((current) => ({ ...current, message: event.target.value }))} className="min-h-24 rounded-2xl border border-card-border px-3 py-2 text-[12px] font-normal outline-none focus:ring-4 focus:ring-primary/10" />
        </label>
        <StateBanner tone="info" title="Frontend-only invitation simulation" detail="The simulated email includes organization name, Pulse80 portal information, user role, a secure time-limited invitation link, and instructions to create a password. No permanent password is emailed." />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-2xl border border-card-border px-4 text-[12px] font-semibold text-black">Cancel</button>
          <button type="submit" disabled={!canSubmit} className="h-9 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45">Send invitation</button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-card-border bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h2 className="text-[14px] font-semibold text-black">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-2xl border border-card-border text-black transition hover:bg-black hover:text-white">
            <CloseSquare className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function LogoUpload({ value, onChange }: { value?: string; onChange: (value?: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-card-border bg-[#f8fafc] p-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-card-border bg-white bg-cover bg-center text-[12px] font-semibold text-black" style={value ? { backgroundImage: `url(${value})` } : undefined}>
        {value ? null : "Logo"}
      </span>
      <label className="cursor-pointer text-[12px] font-semibold text-primary">
        Upload or replace logo
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange(typeof reader.result === "string" ? reader.result : undefined);
            reader.readAsDataURL(file);
          }}
        />
      </label>
      {value ? <button type="button" onClick={() => onChange(undefined)} className="text-[12px] font-semibold text-black/60">Remove</button> : null}
    </div>
  );
}

function ContactFields({
  title,
  prefix,
  form,
  setForm,
}: {
  title: string;
  prefix: "contact1" | "contact2";
  form: OrganizationForm;
  setForm: React.Dispatch<React.SetStateAction<OrganizationForm>>;
}) {
  const role = form[`${prefix}Role`];
  return (
    <fieldset className="rounded-2xl border border-card-border p-4">
      <legend className="px-2 text-[14px] font-semibold text-black">{title}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput label="Full name" value={form[`${prefix}Name`]} onChange={(value) => setForm((current) => ({ ...current, [`${prefix}Name`]: value }))} />
        <SelectInput label="Suggested role label" value={role} options={roleLabelOptions} onChange={(value) => setForm((current) => ({ ...current, [`${prefix}Role`]: value }))} />
        {role === "Other" ? <TextInput label="Custom role label" value={form[`${prefix}CustomRole`]} onChange={(value) => setForm((current) => ({ ...current, [`${prefix}CustomRole`]: value }))} /> : null}
        <TextInput label="Email" value={form[`${prefix}Email`]} onChange={(value) => setForm((current) => ({ ...current, [`${prefix}Email`]: value }))} />
        <TextInput label="Phone" value={form[`${prefix}Phone`]} onChange={(value) => setForm((current) => ({ ...current, [`${prefix}Phone`]: value }))} />
        <SelectInput label="Preferred communication method" value={form[`${prefix}Method`]} options={["Email", "Phone", "WhatsApp", "Portal"]} onChange={(value) => setForm((current) => ({ ...current, [`${prefix}Method`]: value as ContactMethod }))} />
      </div>
    </fieldset>
  );
}

function TextInput({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1 text-[12px] font-semibold text-black">
      {label}
      <input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-2xl border border-card-border px-3 text-[12px] font-normal outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10" />
    </label>
  );
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-[12px] font-semibold text-black">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-2xl border border-card-border px-3 text-[12px] font-normal outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function StateBanner({ tone, title, detail }: { tone: "warning" | "error" | "info"; title: string; detail: string }) {
  const styles = tone === "error" ? "border-pulse-red/20 bg-pulse-red/5 text-pulse-red" : tone === "warning" ? "border-warning/20 bg-warning/10 text-warning" : "border-primary/20 bg-primary/10 text-primary";
  return (
    <div className={cn("rounded-2xl border px-4 py-3", styles)}>
      <p className="text-[12px] font-semibold leading-4">{title}</p>
      <p className="mt-1 text-[12px] leading-4 text-black/60">{detail}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center px-4 py-12 text-center">
      <Building2 className="h-[18px] w-[18px] text-black/35" aria-hidden="true" />
      <p className="mt-3 text-[14px] font-semibold text-black">No organizations match this view</p>
      <p className="mt-1 text-[12px] text-black/55">Adjust search or filters to return organizations.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-2 px-4 py-5">
      {[0, 1, 2].map((item) => <div key={item} className="h-12 animate-pulse rounded-2xl bg-[#f2f4f7]" />)}
    </div>
  );
}

function createOrganization(base: Omit<Organization, "branches" | "contacts" | "clientUsers" | "activations" | "reports" | "insights" | "recommendations">): Organization {
  const branchOne: Branch = {
    id: `${base.id}-branch-1`,
    name: `${base.primaryLocation} Main Branch`,
    country: base.country,
    region: base.region,
    town: base.primaryLocation,
    address: `${base.primaryLocation} business district`,
    employees: Math.round(base.employees * 0.62),
    primary: true,
    status: "Active",
    departments: [],
  };
  const branchTwo: Branch = {
    id: `${base.id}-branch-2`,
    name: `${base.primaryLocation} Operations Site`,
    country: base.country,
    region: base.region,
    town: base.primaryLocation,
    address: `${base.primaryLocation} operations campus`,
    employees: base.employees - branchOne.employees,
    primary: false,
    status: base.status === "Paused" ? "Paused" : "Active",
    departments: [],
  };
  branchOne.departments = [
    createDepartment(`${base.id}-dept-1`, "People & Culture", branchOne.id, Math.round(branchOne.employees * 0.2), base.risk),
    createDepartment(`${base.id}-dept-2`, "Operations", branchOne.id, Math.round(branchOne.employees * 0.5), base.risk),
  ];
  branchTwo.departments = [
    createDepartment(`${base.id}-dept-3`, "Finance", branchTwo.id, Math.round(branchTwo.employees * 0.25), "Low"),
    createDepartment(`${base.id}-dept-4`, "Field Teams", branchTwo.id, Math.round(branchTwo.employees * 0.55), base.risk),
  ];

  return {
    ...base,
    branches: [branchOne, branchTwo],
    contacts: [
      {
        id: `${base.id}-contact-1`,
        name: "Naledi Motsumi",
        roleLabel: "HR Manager",
        email: `hr@${slug(base.name)}.co.bw`,
        phone: "+267 390 1122",
        method: "Email",
        primary: true,
        notes: "Owns workforce wellness coordination and activation attendance.",
      },
      {
        id: `${base.id}-contact-2`,
        name: "Kabelo Dube",
        roleLabel: "Executive Sponsor",
        email: `sponsor@${slug(base.name)}.co.bw`,
        phone: "+267 391 4455",
        method: "Portal",
        primary: false,
        notes: "Reviews executive reports and commercial renewals.",
      },
    ],
    clientUsers: [
      {
        id: `${base.id}-user-1`,
        name: "Naledi Motsumi",
        email: `hr@${slug(base.name)}.co.bw`,
        role: "Client Admin",
        invitationStatus: base.status === "Prospect" ? "Not Invited" : "Account Activated",
        lastActive: base.status === "Prospect" ? "Never" : "2 days ago",
      },
    ],
    activations: [
      {
        title: `${base.name} preventive screening`,
        type: "BP, BMI & Glucose",
        date: base.lastActivation,
        branch: branchOne.name,
        status: "Completed",
        participation: "72%",
        reportStatus: "Published",
      },
      {
        title: `${base.name} wellness activation`,
        type: "Mental wellness",
        date: base.nextActivation,
        branch: branchTwo.name,
        status: "Scheduled",
        participation: "Planned",
        reportStatus: "Pending",
      },
    ],
    reports: [
      {
        title: `${base.name} Executive Wellness Report`,
        type: "Executive",
        period: "Q2 2026",
        status: base.reportsPublished > 0 ? "Published" : "Draft",
        publishedDate: base.reportsPublished > 0 ? "Jun 18, 2026" : "Not published",
      },
    ],
    insights: [
      "Participation trends improved in departments with manager-led reminders.",
      "High-risk departments need focused screening follow-up and education.",
      "Absenteeism and presenteeism indicators should be reviewed before renewal.",
    ],
    recommendations: [
      {
        title: "Run manager-led engagement reminder",
        priority: base.risk === "Low" ? "Medium" : "High",
        activation: "Engagement campaign",
        impact: "Higher participation",
        status: "Proposed",
        owner: "Pulse80 Ops",
      },
      {
        title: "Schedule targeted education follow-up",
        priority: base.risk === "Critical" ? "High" : "Medium",
        activation: "Risk education",
        impact: "Reduced screening risk",
        status: "Pending client approval",
        owner: "Clinical Lead",
      },
    ],
  };
}

function createDepartment(id: string, name: string, branchId: string, employees: number, risk: WellnessRisk): Department {
  return {
    id,
    name,
    branchId,
    employees,
    wellnessScore: risk === "Low" ? 84 : risk === "Medium" ? 68 : risk === "High" ? 52 : 41,
    risk,
    latestActivation: "May 2026",
    status: "Active",
  };
}

function organizationFromForm(form: OrganizationForm): Organization {
  const name = form.name.trim();
  const contact1Role = form.contact1Role === "Other" ? form.contact1CustomRole || "Other" : form.contact1Role;
  const contact2Role = form.contact2Role === "Other" ? form.contact2CustomRole || "Other" : form.contact2Role;
  const organization = createOrganization({
    id: `org-${Date.now()}`,
    name,
    code: `${initials(name)}-${Math.floor(Math.random() * 900 + 100)}`,
    logo: form.logo,
    industry: form.industry,
    country: form.country,
    primaryLocation: form.town,
    region: form.region,
    employees: Number(form.employees) || 0,
    package: form.package,
    contractStart: form.contractStart,
    contractEnd: form.contractEnd,
    risk: form.risk,
    status: form.status,
    lastActivation: "Not started",
    nextActivation: "To be scheduled",
    reportsPublished: 0,
  });
  organization.contacts = [
    {
      id: `${organization.id}-contact-1`,
      name: form.contact1Name,
      roleLabel: contact1Role,
      email: form.contact1Email,
      phone: form.contact1Phone,
      method: form.contact1Method,
      primary: true,
      notes: "Added during organization creation.",
    },
    {
      id: `${organization.id}-contact-2`,
      name: form.contact2Name,
      roleLabel: contact2Role,
      email: form.contact2Email,
      phone: form.contact2Phone,
      method: form.contact2Method,
      primary: false,
      notes: "Added during organization creation.",
    },
  ];
  organization.clientUsers = [];
  return organization;
}

function compareOrganizations(a: Organization, b: Organization, sortBy: string) {
  if (sortBy === "Employee count") return b.employees - a.employees;
  if (sortBy === "Contract end date") return new Date(a.contractEnd).getTime() - new Date(b.contractEnd).getTime();
  if (sortBy === "Wellness risk") return riskRank(b.risk) - riskRank(a.risk);
  if (sortBy === "Latest activation") return a.lastActivation.localeCompare(b.lastActivation);
  return a.name.localeCompare(b.name);
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function countDepartments(organization: Organization) {
  return organization.branches.reduce((total, branch) => total + branch.departments.length, 0);
}

function displayBranchCount(organization: Organization) {
  const counts: Record<string, number> = {
    "org-abc": 3,
    "org-delta": 2,
    "org-nova": 4,
    "org-legae": 1,
    "org-btcl": 2,
    "org-fsg": 3,
    "org-devre": 1,
  };
  return counts[organization.id] ?? organization.branches.length;
}

function displayDepartmentCount(organization: Organization) {
  const counts: Record<string, number> = {
    "org-abc": 12,
    "org-delta": 8,
    "org-nova": 9,
    "org-legae": 4,
    "org-btcl": 7,
    "org-fsg": 6,
    "org-devre": 3,
  };
  return counts[organization.id] ?? countDepartments(organization);
}

function countryFlag(country: string) {
  if (country === "South Africa") return "🇿🇦";
  if (country === "Botswana") return "🇧🇼";
  return "🏳";
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function referenceNumber(organization: Organization) {
  const digits = organization.code.replace(/\D/g, "").padStart(4, "0").slice(-4);
  return `ORG-2024-${digits}`;
}

function contractsExpiringSoon(organizations: Organization[]) {
  return organizations.filter((organization) => {
    const days = daysUntil(organization.contractEnd);
    return days >= 0 && days <= 60;
  }).length;
}

function daysUntil(date: string) {
  const today = new Date("2026-07-13T00:00:00");
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function contractDuration(start: string, end: string) {
  const months = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 2_592_000_000));
  return `${months} months`;
}

function formatDateRange(start: string, end: string) {
  return `${shortDate(start)} - ${shortDate(end)}`;
}

function shortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/^$/, "organization");
}

function riskRank(risk: WellnessRisk) {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[risk];
}
