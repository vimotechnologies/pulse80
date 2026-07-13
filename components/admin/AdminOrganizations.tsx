"use client";

import { useMemo, useState } from "react";
import {
  AddCircle,
  ArrowLeft2,
  ArrowRight,
  Building2,
  CloseSquare,
  Download,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  Sort,
  Trash,
  User,
} from "@/components/icons/IconsaxIcons";
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
    code: "ABC-001",
    logo: "AB",
    industry: "Insurance & Financial Services",
    country: "Botswana",
    primaryLocation: "Gaborone",
    region: "South East District",
    employees: 780,
    package: "Enterprise Wellness Intelligence Package",
    contractStart: "2026-01-15",
    contractEnd: "2026-12-15",
    risk: "Medium",
    status: "Active",
    lastActivation: "May 10, 2026",
    nextActivation: "Aug 18, 2026",
    reportsPublished: 8,
  }),
  createOrganization({
    id: "org-delta",
    name: "Delta Mining Group",
    code: "DMG-014",
    logo: "DM",
    industry: "Mining",
    country: "Botswana",
    primaryLocation: "Jwaneng",
    region: "Southern District",
    employees: 1240,
    package: "Enterprise Wellness Intelligence Package",
    contractStart: "2025-09-01",
    contractEnd: "2026-08-25",
    risk: "High",
    status: "Active",
    lastActivation: "May 22, 2026",
    nextActivation: "Sep 04, 2026",
    reportsPublished: 12,
  }),
  createOrganization({
    id: "org-nova",
    name: "Nova Finance",
    code: "NVF-022",
    logo: "NF",
    industry: "Banking",
    country: "Botswana",
    primaryLocation: "CBD Branch",
    region: "Gaborone",
    employees: 460,
    package: "Corporate Wellness Package",
    contractStart: "2026-03-01",
    contractEnd: "2027-02-28",
    risk: "Low",
    status: "Onboarding",
    lastActivation: "Not started",
    nextActivation: "Jul 28, 2026",
    reportsPublished: 1,
  }),
  createOrganization({
    id: "org-legae",
    name: "Legae Academy",
    code: "LGA-105",
    industry: "Education",
    country: "Botswana",
    primaryLocation: "Phakalane",
    region: "Gaborone",
    employees: 190,
    package: "Starter Wellness Package",
    contractStart: "2025-10-01",
    contractEnd: "2026-09-15",
    risk: "Medium",
    status: "Active",
    lastActivation: "Apr 19, 2026",
    nextActivation: "Oct 02, 2026",
    reportsPublished: 4,
  }),
  createOrganization({
    id: "org-btcl",
    name: "BTCL",
    code: "BTC-009",
    logo: "BT",
    industry: "Telecommunications",
    country: "Botswana",
    primaryLocation: "Gaborone Office",
    region: "South East District",
    employees: 960,
    package: "Corporate Wellness Package",
    contractStart: "2025-08-01",
    contractEnd: "2026-08-20",
    risk: "High",
    status: "Paused",
    lastActivation: "May 29, 2026",
    nextActivation: "Pending confirmation",
    reportsPublished: 6,
  }),
  createOrganization({
    id: "org-fsg",
    name: "FSG",
    code: "FSG-017",
    logo: "FS",
    industry: "Security & Facilities",
    country: "Botswana",
    primaryLocation: "Francistown",
    region: "North East District",
    employees: 1430,
    package: "Custom Package",
    contractStart: "2025-07-01",
    contractEnd: "2026-07-30",
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
    code: "DVG-031",
    industry: "Logistics",
    country: "Botswana",
    primaryLocation: "Lobatse",
    region: "South East District",
    employees: 340,
    package: "Starter Wellness Package",
    contractStart: "2026-04-01",
    contractEnd: "2026-11-30",
    risk: "Low",
    status: "Prospect",
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
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState("Overview");
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
  const selectedOrganization =
    organizations.find((organization) => organization.id === selectedOrganizationId) ?? null;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function addOrganization(form: OrganizationForm) {
    const organization = organizationFromForm(form);
    setOrganizations((current) => [organization, ...current]);
    setSelectedOrganizationId(organization.id);
    setAddOpen(false);
    showToast(`${organization.name} was added locally.`);
  }

  function updateOrganization(updatedOrganization: Organization) {
    setOrganizations((current) =>
      current.map((organization) =>
        organization.id === updatedOrganization.id ? updatedOrganization : organization,
      ),
    );
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

  function archiveOrganization(id: string) {
    setOrganizations((current) =>
      current.map((organization) =>
        organization.id === id ? { ...organization, status: "Archived" } : organization,
      ),
    );
    showToast("Organization archived locally.");
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
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-card-border bg-white px-4 text-[12px] font-semibold text-black transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <AddCircle className="h-4 w-4" aria-hidden="true" />
            Add Organization
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Organizations" value="24" />
        <SummaryCard title="Active Contracts" value="18" />
        <SummaryCard title="Contracts Expiring Soon" value="4" tone="warning" />
        <SummaryCard title="High-Risk Organizations" value="3" tone="danger" />
      </section>

      <section className="rounded-2xl border border-card-border bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_repeat(7,minmax(120px,1fr))]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/45" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search organizations, industries, locations"
              className="h-9 w-full rounded-2xl border border-card-border bg-white pl-9 pr-3 text-[12px] text-black outline-none transition placeholder:text-black/40 focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <FilterSelect label="Status" value={statusFilter} options={["All", ...statusOptions]} onChange={setStatusFilter} />
          <FilterSelect label="Industry" value={industryFilter} options={["All", ...industries]} onChange={setIndustryFilter} />
          <FilterSelect label="Package" value={packageFilter} options={["All", ...packageOptions]} onChange={setPackageFilter} />
          <FilterSelect label="Risk" value={riskFilter} options={["All", ...riskOptions]} onChange={setRiskFilter} />
          <FilterSelect label="Country" value={countryFilter} options={["All", ...countries]} onChange={setCountryFilter} />
          <FilterSelect label="Town" value={townFilter} options={["All", ...towns]} onChange={setTownFilter} />
          <FilterSelect label="Expiry" value={expiryFilter} options={["All", "Within 60 days", "Expired", "Healthy"]} onChange={setExpiryFilter} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-[12px] text-black/60">
            <Filter className="h-4 w-4 text-black" aria-hidden="true" />
            {filteredOrganizations.length} organizations in this view
          </div>
          <label className="inline-flex items-center gap-2 text-[12px] text-black">
            <Sort className="h-4 w-4" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-9 rounded-2xl border border-card-border bg-white px-3 text-[12px] outline-none focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
            >
              {["Organization name", "Employee count", "Contract end date", "Wellness risk", "Latest activation"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
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
              <button
                key={organization.id}
                type="button"
                onClick={() => {
                  setSelectedOrganizationId(organization.id);
                  setDrawerTab("Overview");
                }}
                className="grid w-full cursor-pointer grid-cols-[1.5fr_1fr_1fr_0.55fr_0.7fr_1.15fr_1fr_0.75fr_0.85fr_64px] items-center gap-3 px-4 py-3 text-left text-[12px] text-black transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <LogoMark organization={organization} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{organization.name}</span>
                    <span className="block truncate text-black/55">{organization.code}</span>
                  </span>
                </span>
                <span className="min-w-0 truncate text-black/70">{organization.industry}</span>
                <span className="min-w-0 truncate text-black/70">{organization.primaryLocation}</span>
                <span>{organization.branches.length}</span>
                <span>{organization.employees.toLocaleString()}</span>
                <span className="min-w-0 truncate text-black/70">{organization.package}</span>
                <span className="text-black/70">{formatDateRange(organization.contractStart, organization.contractEnd)}</span>
                <RiskBadge risk={organization.risk} />
                <StatusBadge status={organization.status} />
                <span className="flex justify-end gap-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#e4e7ec]">
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#e4e7ec]">
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </button>
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
              <ArrowLeft2 className="h-4 w-4" aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page === totalPages}
              className="inline-flex h-8 items-center gap-1 rounded-2xl border border-card-border px-3 text-[12px] font-semibold text-black transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {selectedOrganization ? (
        <OrganizationDrawer
          organization={selectedOrganization}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          onClose={() => setSelectedOrganizationId(null)}
          onArchive={() => archiveOrganization(selectedOrganization.id)}
          onUpdate={updateOrganization}
          onInvite={() => {
            setInviteOrganizationId(selectedOrganization.id);
            setInviteOpen(true);
          }}
          onToast={showToast}
        />
      ) : null}

      {addOpen ? (
        <AddOrganizationModal
          onClose={() => setAddOpen(false)}
          onSubmit={addOrganization}
        />
      ) : null}

      {inviteOpen ? (
        <InviteClientUserModal
          organizations={organizations}
          initialOrganizationId={inviteOrganizationId ?? selectedOrganizationId ?? organizations[0]?.id}
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

function SummaryCard({ title, value, tone = "primary" }: { title: string; value: string; tone?: "primary" | "warning" | "danger" }) {
  const toneClass = tone === "warning" ? "text-warning" : tone === "danger" ? "text-pulse-red" : "text-primary";
  return (
    <div className="rounded-2xl border border-card-border bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <p className="text-[14px] font-semibold leading-5 text-black">{title}</p>
      <p className={cn("mt-2 text-[24px] font-semibold leading-7", toneClass)}>{value}</p>
      <p className="mt-1 text-[12px] leading-4 text-black/55">Current portfolio snapshot</p>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-2xl border border-card-border bg-white px-3 text-[12px] text-black outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10"
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function LogoMark({ organization }: { organization: Organization }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-card-border bg-[#f2f4f7] bg-cover bg-center text-[12px] font-semibold text-black"
      style={organization.logo?.startsWith("data:") ? { backgroundImage: `url(${organization.logo})` } : undefined}
    >
      {organization.logo?.startsWith("data:") ? null : organization.logo ?? initials(organization.name)}
    </span>
  );
}

function StatusBadge({ status }: { status: OrganizationStatus }) {
  const styles: Record<OrganizationStatus, string> = {
    Prospect: "border-card-border bg-[#f2f4f7] text-black/70",
    Onboarding: "border-primary/20 bg-primary/10 text-primary",
    Active: "border-success/20 bg-success/10 text-success",
    Paused: "border-warning/25 bg-warning/10 text-warning",
    "Contract Expired": "border-pulse-red/20 bg-pulse-red/10 text-pulse-red",
    Archived: "border-slate-300 bg-slate-100 text-slate-500",
  };
  return <span className={cn("inline-flex w-fit rounded-full border px-2.5 py-1 text-[12px] font-medium leading-4", styles[status])}>{status}</span>;
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

const drawerTabs = [
  "Overview",
  "Contacts",
  "Branches & Departments",
  "Contract",
  "Activations",
  "Reports",
  "Insights",
  "Recommendations",
  "Client Portal Access",
];

function OrganizationDrawer({
  organization,
  activeTab,
  onTabChange,
  onClose,
  onArchive,
  onUpdate,
  onInvite,
  onToast,
}: {
  organization: Organization;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  onArchive: () => void;
  onUpdate: (organization: Organization) => void;
  onInvite: () => void;
  onToast: (message: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/20" role="dialog" aria-modal="true">
      <aside className="ml-auto flex h-full w-full max-w-3xl flex-col border-l border-card-border bg-white shadow-[0_24px_70px_rgba(15,23,42,0.2)]">
        <div className="border-b border-card-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <LogoMark organization={organization} />
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-semibold leading-5 text-black">{organization.name}</h2>
                <p className="mt-1 text-[12px] leading-4 text-black/60">
                  {organization.industry} · {organization.package} · {organization.primaryLocation}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={organization.status} />
                  <RiskBadge risk={organization.risk} />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-2xl border border-card-border text-black transition hover:bg-black hover:text-white"
            >
              <CloseSquare className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close drawer</span>
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {drawerTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={cn(
                  "shrink-0 rounded-2xl px-3 py-2 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                  activeTab === tab ? "bg-primary/10 text-primary" : "text-black hover:bg-[#f8fafc]",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "Overview" ? <OverviewTab organization={organization} /> : null}
          {activeTab === "Contacts" ? <ContactsTab organization={organization} /> : null}
          {activeTab === "Branches & Departments" ? (
            <BranchesTab organization={organization} onUpdate={onUpdate} onToast={onToast} />
          ) : null}
          {activeTab === "Contract" ? <ContractTab organization={organization} /> : null}
          {activeTab === "Activations" ? <ActivationsTab organization={organization} /> : null}
          {activeTab === "Reports" ? <ReportsTab organization={organization} /> : null}
          {activeTab === "Insights" ? <SimpleList title="Wellness Insights" items={organization.insights} /> : null}
          {activeTab === "Recommendations" ? <RecommendationsTab organization={organization} /> : null}
          {activeTab === "Client Portal Access" ? (
            <ClientPortalTab organization={organization} onInvite={onInvite} onUpdate={onUpdate} onToast={onToast} />
          ) : null}
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-card-border px-5 py-4">
          <button
            type="button"
            onClick={onArchive}
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-card-border px-4 text-[12px] font-semibold text-black transition hover:bg-[#f8fafc]"
          >
            <Trash className="h-4 w-4" aria-hidden="true" />
            Archive Organization
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black"
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
            Edit Organization
          </button>
        </div>
      </aside>
    </div>
  );
}

function OverviewTab({ organization }: { organization: Organization }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[
        ["Organization name", organization.name],
        ["Industry", organization.industry],
        ["Country", organization.country],
        ["Primary location", organization.primaryLocation],
        ["Total employees", organization.employees.toLocaleString()],
        ["Branches", String(organization.branches.length)],
        ["Departments", String(countDepartments(organization))],
        ["Package", organization.package],
        ["Status", organization.status],
        ["Wellness risk", organization.risk],
        ["Last activation", organization.lastActivation],
        ["Next activation", organization.nextActivation],
        ["Reports published", String(organization.reportsPublished)],
      ].map(([label, value]) => <DetailTile key={label} label={label} value={value} />)}
    </div>
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

function BranchesTab({
  organization,
  onUpdate,
  onToast,
}: {
  organization: Organization;
  onUpdate: (organization: Organization) => void;
  onToast: (message: string) => void;
}) {
  function addBranch() {
    const branch: Branch = {
      id: `branch-${Date.now()}`,
      name: "New Branch",
      country: organization.country,
      region: organization.region,
      town: organization.primaryLocation,
      address: "Address to be confirmed",
      employees: 0,
      primary: false,
      departments: [],
      status: "Active",
    };
    onUpdate({ ...organization, branches: [...organization.branches, branch] });
    onToast("Branch added locally.");
  }

  function addDepartment(branchId: string) {
    onUpdate({
      ...organization,
      branches: organization.branches.map((branch) =>
        branch.id === branchId
          ? {
              ...branch,
              departments: [
                ...branch.departments,
                {
                  id: `dept-${Date.now()}`,
                  name: "New Department",
                  branchId,
                  employees: 0,
                  wellnessScore: 0,
                  risk: "Low",
                  latestActivation: "Not scheduled",
                  status: "Active",
                },
              ],
            }
          : branch,
      ),
    });
    onToast("Department added locally.");
  }

  function archiveBranch(branchId: string) {
    onUpdate({
      ...organization,
      branches: organization.branches.map((branch) =>
        branch.id === branchId ? { ...branch, status: "Archived" } : branch,
      ),
    });
    onToast("Branch archived locally.");
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={addBranch} className="rounded-2xl bg-primary px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-black">
        Add branch
      </button>
      <div className="overflow-hidden rounded-2xl border border-card-border">
        <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.7fr_0.6fr_1fr] gap-3 bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-black">
          <span>Branch</span><span>Region</span><span>Town</span><span>Employees</span><span>Departments</span><span>Actions</span>
        </div>
        {organization.branches.map((branch) => (
          <div key={branch.id} className="border-t border-card-border">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.7fr_0.6fr_1fr] gap-3 px-4 py-3 text-[12px] text-black">
              <span className="font-semibold">{branch.name}<span className="block font-normal text-black/55">{branch.address}</span></span>
              <span>{branch.region}</span>
              <span>{branch.town}</span>
              <span>{branch.employees}</span>
              <span>{branch.departments.length}</span>
              <span className="flex flex-wrap gap-2">
                <button type="button" onClick={() => addDepartment(branch.id)} className="text-[12px] font-semibold text-primary">Add department</button>
                <button type="button" onClick={() => archiveBranch(branch.id)} className="text-[12px] font-semibold text-black/60">Archive</button>
              </span>
            </div>
            {branch.departments.map((department) => (
              <div key={department.id} className="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.7fr_0.6fr_1fr] gap-3 bg-[#fbfcfd] px-4 py-2 text-[12px] text-black/70">
                <span className="pl-6">{department.name}</span>
                <span>{branch.name}</span>
                <span>{department.status}</span>
                <span>{department.employees}</span>
                <span>{department.wellnessScore}%</span>
                <span><RiskBadge risk={department.risk} /></span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
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

function RecommendationsTab({ organization }: { organization: Organization }) {
  return <MiniTable columns={["Recommendation", "Priority", "Suggested activation", "Impact", "Status", "Owner"]} rows={organization.recommendations.map((item) => [item.title, item.priority, item.activation, item.impact, item.status, item.owner])} />;
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
        <User className="h-4 w-4" aria-hidden="true" />
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
            <CloseSquare className="h-4 w-4" aria-hidden="true" />
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
      <Building2 className="h-8 w-8 text-black/35" aria-hidden="true" />
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
