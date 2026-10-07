"use client";

import Link from "next/link";
import { inviteOrganisationUser } from "@/app/actions/users";
import { OrganisationOperations } from "@/components/admin/OrganisationOperations";
import { OrganisationUnits } from "@/components/admin/OrganisationUnits";
import { useMemo, useState } from "react";
import {
  createAdminOrganisation,
  saveAdminOrganisationContacts,
  updateAdminOrganisation,
} from "@/app/actions/admin-organisations";
import {
  Activity,
  AddCircle,
  ArrowDown,
  ArrowLeft2,
  Building2,
  CalendarDays,
  ClipboardCheck,
  CloseSquare,
  Clock,
  Download,
  Edit,
  Eye,
  Globe2,
  Location,
  MoreHorizontal,
  ShieldCheck,
  User,
} from "@/components/icons/IconsaxIcons";
import {
  UnifiedTablePagination,
  UnifiedTableSurface,
  UnifiedTableViewport,
} from "@/components/ui/UnifiedDataTable";
import { UnifiedMetricCard } from "@/components/ui/UnifiedMetricCard";
import { ToastMessage } from "@/components/ui/ToastMessage";
import {
  UnifiedFilterCard,
  UnifiedFilterClear,
  UnifiedFilterSearch,
  UnifiedFilterSelect,
  UnifiedFilterSort,
} from "@/components/ui/UnifiedFilterCard";
import { downloadPdf } from "@/lib/pdf/download";
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

export type OrganizationContact = {
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

export type Organization = {
  id: string;
  name: string;
  code: string;
  logo?: string;
  logoUrl?: string | null;
  industry: string;
  country: string;
  primaryLocation: string;
  region: string;
  employees: number;
  package: PackageName;
  contractStart: string;
  contractEnd: string;
  risk: WellnessRisk;
  wellnessRisk: WellnessRisk;
  wellnessRiskScore: number;
  status: OrganizationStatus;
  branches: Branch[];
  lastActivation: string;
  nextActivation: string;
  reportsPublished: number;
  contacts: OrganizationContact[];
  clientUsers: ClientUser[];
  activations: Activation[];
  reports: Report[];
  insights: string[];
  recommendations: Recommendation[];
  customPackageNotes?: string;
  quickSummary?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrganizationForm = {
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
  customPackageNotes: string;
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
const industryOptions = [
  "Agriculture, Forestry & Fishing", "Arts, Entertainment & Recreation", "Construction",
  "Education", "Energy & Utilities", "Financial Services & Insurance",
  "Government & Public Administration", "Healthcare & Social Assistance",
  "Hospitality & Tourism", "Information & Communications Technology", "Manufacturing",
  "Mining & Quarrying", "Non-profit & Community Services", "Professional & Technical Services",
  "Real Estate", "Retail & Wholesale Trade", "Safety & Security",
  "Transportation & Logistics", "Water & Sanitation", "Other",
];
const organizationCountryOptions = ["Botswana", "South Africa"];

const districtsByCountry: Record<string, string[]> = {
  Botswana: [
    "Central", "Chobe", "Ghanzi", "Kgalagadi", "Kgatleng", "Kweneng",
    "North-East", "North-West", "South-East", "Southern",
  ],
  "South Africa": [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
    "Mpumalanga", "Northern Cape", "North West", "Western Cape",
  ],
};

const citiesByCountryAndRegion: Record<string, Record<string, string[]>> = {
  Botswana: {
    Central: ["Bobonong", "Gweta", "Letlhakane", "Mahalapye", "Mmadinare", "Nata", "Orapa", "Palapye", "Rakops", "Selebi-Phikwe", "Serowe", "Shoshong", "Sowa Town", "Tonota", "Tutume"],
    Chobe: ["Kasane", "Kazungula", "Pandamatenga"],
    Ghanzi: ["Charles Hill", "Ghanzi"],
    Kgalagadi: ["Bokspits", "Hukuntsi", "Kang", "Tsabong"],
    Kgatleng: ["Artesia", "Mochudi", "Oodi", "Pilane"],
    Kweneng: ["Gabane", "Letlhakeng", "Molepolole", "Thamaga"],
    "North-East": ["Francistown", "Masunga", "Matsiloje", "Tati Siding"],
    "North-West": ["Etsha", "Gumare", "Maun", "Shakawe"],
    "South-East": ["Gaborone", "Lobatse", "Mogoditshane", "Mmopane", "Ramotswa", "Tlokweng"],
    Southern: ["Goodhope", "Jwaneng", "Kanye", "Moshupa"],
  },
  "South Africa": {
    "Eastern Cape": ["East London", "Gqeberha", "Grahamstown (Makhanda)", "King William's Town (Qonce)", "Komani", "Mthatha", "Port Alfred"],
    "Free State": ["Bethlehem", "Bloemfontein", "Harrismith", "Kroonstad", "Parys", "Sasolburg", "Welkom"],
    Gauteng: ["Johannesburg", "Pretoria", "Ekurhuleni", "Soweto", "Centurion", "Midrand", "Vanderbijlpark", "Vereeniging"],
    "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Richards Bay", "Newcastle", "Ladysmith", "Pinetown", "Port Shepstone", "uMhlanga"],
    Limpopo: ["Polokwane", "Tzaneen", "Thohoyandou", "Lephalale", "Mokopane", "Musina", "Makhado", "Giyani"],
    Mpumalanga: ["Mbombela", "eMalahleni", "Middelburg", "Secunda", "Ermelo", "Standerton", "Barberton", "White River"],
    "Northern Cape": ["Kimberley", "Upington", "Springbok", "Kuruman", "De Aar", "Kathu", "Postmasburg"],
    "North West": ["Mahikeng", "Rustenburg", "Klerksdorp", "Potchefstroom", "Brits", "Vryburg", "Zeerust"],
    "Western Cape": ["Cape Town", "Stellenbosch", "George", "Paarl", "Worcester", "Knysna", "Oudtshoorn", "Mossel Bay", "Hermanus", "Saldanha"],
  },
};

function cleanOrganizationValue(value: string) {
  return value.trim().toLowerCase() === "not specified" ? "" : value;
}

function optionsWithCurrentValue(options: string[], currentValue: string) {
  const value = cleanOrganizationValue(currentValue);
  return value && !options.includes(value) ? [...options, value].sort() : options;
}

function regionLabel(country: string) {
  return country === "Botswana" ? "District" : "Province";
}
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
  industry: "",
  country: "",
  town: "",
  region: "",
  employees: "",
  package: "Corporate Wellness Package",
  contractStart: "2026-01-01",
  contractEnd: "2026-12-31",
  status: "Prospect",
  risk: "Low",
  customPackageNotes: "",
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

export function AdminOrganizations({ initialOrganizations }: { initialOrganizations: Organization[] }) {
  const [exporting, setExporting] = useState(false);
  const [organizations, setOrganizations] = useState(initialOrganizations);
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

  async function addOrganization(form: OrganizationForm) {
    const result = await createAdminOrganisation(form);
    if (!result.ok) {
      showToast("The organization could not be saved. Please check the fields and try again.");
      return false;
    }
    setOrganizations((current) => [result.organisation, ...current]);
    setAddOpen(false);
    showToast(`${result.organisation.name} was saved.`);
    return true;
  }

  async function inviteClientUser(payload: InvitePayload) {
    const result = await inviteOrganisationUser({ organisationId: payload.organizationId, fullName: payload.name, email: payload.email, role: payload.role === "Client Admin" ? "client_admin" : "executive" });
    if (!result.ok) { showToast(result.error.replaceAll("_", " ")); return; }
    setInviteOpen(false);
    showToast("User access saved. New users receive a setup email.");
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
              onClick={() => { setInviteOrganizationId(null); setInviteOpen(true); }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-card-border bg-white px-4 text-[12px] font-semibold text-black shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              Invite Client User
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                try {
                  await downloadPdf({ title: "Organizations", sections: filteredOrganizations.map((item) => ({
                    title: item.name,
                    client: { name: item.name, logoUrl: item.logoUrl ?? item.logo },
                    lines: [`Code: ${item.code}`, `Industry: ${item.industry}`, `Location: ${item.primaryLocation}, ${item.country}`,
                      `Branches: ${item.branches.length}`, `Employees: ${item.employees}`, `Package: ${item.package}`,
                      `Contract: ${item.contractStart} to ${item.contractEnd}`, `Wellness risk: ${item.risk}`, `Status: ${item.status}`],
                  })) });
                  setToast("PDF download started.");
                } catch { setToast("Could not generate the PDF. Please try again."); }
                finally { setExporting(false); }
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-card-border bg-white px-4 text-[12px] font-semibold text-black shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-semibold text-white shadow-[0_8px_20px_rgba(0,102,255,0.25)] transition hover:bg-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <AddCircle className="h-4 w-4" aria-hidden="true" />
              Add Organization
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Total Organizations" value={String(organizations.length)} detail="All client organizations" icon={Building2} />
          <SummaryCard title="Active Contracts" value={String(organizations.filter((item) => item.status === "Active").length)} detail="With active contracts" icon={ClipboardCheck} tone="success" />
          <SummaryCard title="Contracts Expiring Soon" value={String(contractsExpiringSoon(organizations))} detail="Within 60 days" icon={Clock} tone="warning" />
          <SummaryCard title="High-Risk Organizations" value={String(organizations.filter((item) => item.risk === "High" || item.risk === "Critical").length)} detail="High or critical risk" icon={ShieldCheck} tone="danger" />
        </section>

      <UnifiedFilterCard>
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1.7fr)_repeat(5,minmax(118px,1fr))]">
          <UnifiedFilterSearch value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search organizations..." />
          <UnifiedFilterSelect label="Status" value={statusFilter} options={["All", ...statusOptions]} onChange={setStatusFilter} />
          <UnifiedFilterSelect label="Industry" value={industryFilter} options={["All", ...industries]} onChange={setIndustryFilter} />
          <UnifiedFilterSelect label="Package" value={packageFilter} options={["All", ...packageOptions]} onChange={setPackageFilter} />
          <UnifiedFilterSelect label="Wellness Risk" value={riskFilter} options={["All", ...riskOptions]} onChange={setRiskFilter} />
          <UnifiedFilterSelect label="Country" value={countryFilter} options={["All", ...countries]} onChange={setCountryFilter} />
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(160px,0.9fr)_minmax(180px,1.1fr)_minmax(280px,1.7fr)_auto_1fr]">
          <UnifiedFilterSelect label="Town / Province" value={townFilter} options={["All", ...towns]} onChange={setTownFilter} />
          <UnifiedFilterSelect label="Contract Expiry" value={expiryFilter} options={["All", "Within 60 days", "Expired", "Healthy"]} onChange={setExpiryFilter} />
          <UnifiedFilterSort value={sortBy} options={sortOptions} onChange={setSortBy} />
          <UnifiedFilterClear
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
          />
        </div>
      </UnifiedFilterCard>

      {contractsExpiringSoon(organizations) > 0 ? (
        <StateBanner
          tone="warning"
          title={`${contractsExpiringSoon(organizations)} contracts are expiring within 60 days`}
          detail="Review renewal reminders and contract owners before upcoming activations are confirmed."
        />
      ) : null}
      {error ? <StateBanner tone="error" title="Unable to load organizations" detail={error} /> : null}

      <UnifiedTableSurface>
        <UnifiedTableViewport>
          <div className="min-w-[1120px]">
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
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#e4e7ec]">
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </UnifiedTableViewport>

        <UnifiedTablePagination
          page={page}
          totalPages={totalPages}
          rowsPerPage={pageSize}
          rowOptions={[4, 6, 8]}
          totalRows={filteredOrganizations.length}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </UnifiedTableSurface>

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

      <ToastMessage message={toast} />
    </div>
  );
}

export function AdminOrganizationDetails({ organizationId, initialOrganization }: { organizationId: string; initialOrganization: Organization | null }) {
  const [organization, setOrganization] = useState<Organization | null>(initialOrganization);
  const [draft, setDraft] = useState<Organization | null>(initialOrganization);
  const [contactDraft, setContactDraft] = useState<OrganizationContact[]>(initialOrganization?.contacts ?? []);
  const [activeTab, setActiveTab] = useState("Overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const contactsEditing = editingContactId !== null;
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingContacts, setIsSavingContacts] = useState(false);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  async function inviteClientUser(payload: InvitePayload) {
    const result = await inviteOrganisationUser({ organisationId: payload.organizationId, fullName: payload.name, email: payload.email, role: payload.role === "Client Admin" ? "client_admin" : "executive" });
    if (!result.ok) { showToast(result.error.replaceAll("_", " ")); return; }
    setInviteOpen(false);
    showToast("User access saved. New accounts receive a setup email.");
  }

  async function saveContacts() {
    if (!organization || isSavingContacts) return;
    setIsSavingContacts(true);
    try {
      const result = await saveAdminOrganisationContacts(organization.id, contactDraft);
      if (!result.ok) { showToast(result.error); return; }
      setOrganization(result.organisation);
      setDraft(result.organisation);
      setContactDraft(result.organisation.contacts);
      setEditingContactId(null);
      showToast("Organization contacts were saved.");
    } finally {
      setIsSavingContacts(false);
    }
  }

  if (!organization) {
    return (
      <section className="rounded-2xl border border-card-border bg-white p-6 text-black shadow-[0_12px_32px_rgba(15,23,42,0.07)]">
        <p className="text-[14px] font-semibold">Organization not found</p>
        <p className="mt-2 text-[12px] text-black/60">Return to the organizations list and select an available organization.</p>
        <Link href="/admin/organizations" className="mt-4 inline-flex h-9 items-center gap-2 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black">
          <ArrowLeft2 className="h-4 w-4" aria-hidden="true" />
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
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => { setDraft(organization); setIsEditing(false); }}
                  className="inline-flex h-7 items-center rounded-md border border-card-border bg-white px-2.5 text-[12px] font-medium leading-3 text-black shadow-[0_4px_14px_rgba(15,23,42,0.03)] transition hover:bg-black hover:text-white"
                  style={{ fontSize: 12, lineHeight: "12px" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    if (!draft) return;
                    if (![draft.name, draft.industry, draft.country, draft.region, draft.primaryLocation].every((value) => value.trim() && value.trim().toLowerCase() !== "not specified")) {
                      showToast("Choose an industry, country, district or province, and city or town before saving.");
                      return;
                    }
                    setIsSaving(true);
                    try {
                      const result = await updateAdminOrganisation(
                        organizationId,
                        draft,
                        draft.logo?.startsWith("data:") ? draft.logo : undefined,
                        Boolean(organization.logo && !draft.logo),
                      );
                      if (!result.ok) { showToast(result.error); return; }
                      setOrganization(result.organisation);
                      setDraft(result.organisation);
                      setContactDraft(result.organisation.contacts);
                      setIsEditing(false);
                      showToast("Organization changes were saved.");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-[12px] font-medium leading-3 text-white shadow-[0_8px_20px_rgba(0,102,255,0.22)] transition hover:bg-black"
                  style={{ fontSize: 12, lineHeight: "12px" }}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setDraft({ ...organization, industry: cleanOrganizationValue(organization.industry), country: cleanOrganizationValue(organization.country), region: cleanOrganizationValue(organization.region), primaryLocation: cleanOrganizationValue(organization.primaryLocation) }); setIsEditing(true); }}
                disabled={contactsEditing}
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[12px] font-medium leading-3 text-white shadow-[0_8px_20px_rgba(0,102,255,0.22)] transition hover:bg-black"
                style={{ fontSize: 12, lineHeight: "12px" }}
              >
                <Edit className="h-3 w-3" aria-hidden="true" />
                Edit Organization
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="border-b border-card-border">
        <div className="flex overflow-x-auto">
              {detailTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setActiveTab(tab.label)}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-t-2xl border-b-2 px-3 text-[14px] font-medium leading-4 transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                      activeTab === tab.label
                        ? "border-primary text-primary"
                        : "border-transparent text-black hover:-translate-y-0.5 hover:rounded-2xl hover:bg-[#f8fafc] hover:text-primary",
                    )}
                    style={{ fontSize: 14, lineHeight: "16px" }}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
        </div>
      </div>

      <section className="-mt-4">
        <section className="rounded-b-2xl rounded-t-none border border-card-border bg-white shadow-[0_12px_32px_rgba(15,23,42,0.055)]">
          {activeTab === "Overview" ? (
            <div className="p-5">
              <OrganizationOverviewForm organization={draft ?? organization} editable={isEditing} onChange={setDraft} />
            </div>
          ) : (
            <div className="p-5">
            {activeTab === "Contacts" ? (
              <ContactsTab
                contacts={contactDraft}
                editingContactId={editingContactId}
                saving={isSavingContacts}
                onChange={setContactDraft}
                onEdit={(id) => { setIsEditing(false); setDraft(organization); setContactDraft(organization.contacts); setEditingContactId(id); }}
                onAdd={() => {
                  const contact: OrganizationContact = {
                    id: `new-${crypto.randomUUID()}`, name: "", roleLabel: "HR Manager", email: "", phone: "",
                    method: "Email", primary: organization.contacts.length === 0, notes: "",
                  };
                  setIsEditing(false);
                  setDraft(organization);
                  setContactDraft([...organization.contacts, contact]);
                  setEditingContactId(contact.id);
                }}
                onCancel={() => { setContactDraft(organization.contacts); setEditingContactId(null); }}
                onSave={saveContacts}
              />
            ) : null}
            {activeTab === "Branches & Departments" ? (
              <OrganisationUnits organisationId={organization.id} />
            ) : null}
            {activeTab === "Contract" ? <ContractTab organization={organization} /> : null}
            {activeTab === "Operations" ? <OrganisationOperations organisationId={organization.id} /> : null}
            {activeTab === "Client Portal Access" ? (
              <div className="space-y-3"><p className="text-sm">Review current memberships and manage access in Users &amp; Roles.</p><Link href="/admin/users" className="text-primary underline">Manage users and roles</Link><button type="button" onClick={() => setInviteOpen(true)} className="ml-4 text-primary">Invite client user</button></div>
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

      <ToastMessage message={toast} />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Building2;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  return <UnifiedMetricCard label={title} value={value} detail={detail} icon={icon} />;
}

function HeaderMeta({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-[12px] leading-4">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#475467]" aria-hidden="true" />
      <span className="shrink-0 text-black/70">{label}</span>
      <span className="min-w-0 truncate text-black">{value}</span>
    </span>
  );
}

function LogoMark({ organization, size = "sm" }: { organization: Organization; size?: "sm" | "lg" | "xl" }) {
  const logoSource = organization.logo?.startsWith("data:image/")
    ? organization.logo
    : organization.logoUrl ?? (/^https?:\/\//i.test(organization.logo ?? "") ? organization.logo : undefined);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center border border-card-border bg-[#f2f4f7] bg-contain bg-center bg-no-repeat font-semibold text-black",
        size === "xl"
          ? "h-20 w-20 rounded-md bg-white text-[20px] text-primary shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
          : size === "lg"
          ? "h-20 w-20 rounded-full text-[22px] ring-4 ring-primary/10"
          : "h-9 w-9 rounded-2xl text-[12px]",
      )}
      role={logoSource ? "img" : undefined}
      aria-label={logoSource ? `${organization.name} logo` : undefined}
      style={logoSource ? { backgroundImage: `url("${logoSource}")` } : undefined}
    >
      {logoSource ? null : initials(organization.name)}
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
  return <span className={cn("inline-flex w-fit rounded-md border px-3 py-1 text-[12px] font-medium leading-4", styles[status])}>{status}</span>;
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

const detailTabs = [
  { label: "Overview", icon: Building2 },
  { label: "Contacts", icon: User },
  { label: "Branches & Departments", icon: Building2 },
  { label: "Contract", icon: ClipboardCheck },
  { label: "Operations", icon: Activity },
  { label: "Client Portal Access", icon: Globe2 },
];

function OrganizationOverviewForm({
  organization,
  editable,
  onChange,
}: {
  organization: Organization;
  editable: boolean;
  onChange: (organization: Organization) => void;
}) {
  const update = <K extends keyof Organization>(key: K, value: Organization[K]) =>
    onChange({ ...organization, [key]: value });
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-black" aria-hidden="true" />
        <h2 className="text-[14px] font-semibold text-black">Organization Overview</h2>
      </div>

      <div className="grid gap-x-5 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        <OverviewField label="Organization Name" required value={organization.name} editable={editable} onChange={(value) => update("name", value)} />
        <ReadonlyField label="Reference Number" value={referenceNumber(organization)} />
        <OverviewField label="Industry" required value={organization.industry} editable={editable} options={optionsWithCurrentValue(industryOptions, organization.industry)} placeholder="Select industry" onChange={(value) => update("industry", value)} />
        <OverviewField label="Country" required value={organization.country} editable={editable} options={organizationCountryOptions} placeholder="Select country" onChange={(value) => onChange({ ...organization, country: value, region: "", primaryLocation: "" })} />
        <OverviewField label={regionLabel(organization.country)} required value={organization.region} editable={editable} options={optionsWithCurrentValue(districtsByCountry[organization.country] ?? [], organization.region)} placeholder={organization.country ? `Select ${regionLabel(organization.country).toLowerCase()}` : "Select country first"} disabled={!organization.country} onChange={(value) => onChange({ ...organization, region: value, primaryLocation: "" })} />
        <OverviewField label="City / Town" required value={organization.primaryLocation} editable={editable} options={optionsWithCurrentValue(citiesByCountryAndRegion[organization.country]?.[organization.region] ?? [], organization.primaryLocation)} placeholder={organization.region ? "Select city or town" : "Select region first"} disabled={!organization.region} onChange={(value) => update("primaryLocation", value)} />
        <OverviewField label="Employee Count" required type="number" value={String(organization.employees)} editable={editable} onChange={(value) => update("employees", Number(value) || 0)} />
        <ReadonlyField label="Number of Branches" required value={String(displayBranchCount(organization))} />
        <ReadonlyField label="Number of Departments" required value={String(displayDepartmentCount(organization))} />
        <OverviewField label="Package" required value={organization.package} editable={editable} options={packageOptions} onChange={(value) => update("package", value as PackageName)} />
        <OverviewField label="Status" required value={organization.status} editable={editable} options={statusOptions} onChange={(value) => update("status", value as OrganizationStatus)} />
        <ReadonlyField label="Wellness Risk" value={organization.risk} muted />
        <OverviewField label="Contract Start Date" type="date" value={organization.contractStart} editable={editable} onChange={(value) => update("contractStart", value)} />
        <OverviewField label="Contract End Date" type="date" value={organization.contractEnd} editable={editable} onChange={(value) => update("contractEnd", value)} />
        <ReadonlyField label="Last Activation" value={organization.lastActivation} icon={CalendarDays} />
        <ReadonlyField label="Next Activation" value={organization.nextActivation} icon={CalendarDays} />
        <ReadonlyField label="Reports Published" value={String(organization.reportsPublished)} />
        <ReadonlyField label="Portal Users" value={String(organization.clientUsers.length)} />
      </div>

      <div className="space-y-2">
        <p className="text-[12px] font-medium text-black">Organization Logo</p>
        {editable ? (
          <LogoUpload value={organization.logo} onChange={(logo) => update("logo", logo)} />
        ) : (
          <div className="flex items-center gap-3"><LogoMark organization={organization} /><span className="text-[12px] text-black/55">Use Edit Organization to replace this logo.</span></div>
        )}
        <p className="text-[12px] text-black/55">Recommended size: 512 x 512px. Square images work best.</p>
      </div>
    </div>
  );
}

function OverviewField({ label, value, editable, onChange, required, options, placeholder, disabled = false, type = "text" }: {
  label: string; value: string; editable: boolean; onChange: (value: string) => void;
  required?: boolean; options?: readonly string[]; placeholder?: string; disabled?: boolean; type?: string;
}) {
  if (!editable) return <ReadonlyField label={label} value={type === "date" ? formatShortDate(value) : value} required={required} />;
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-black/70">{label} {required ? <span className="text-pulse-red">*</span> : null}</span>
      {options ? (
        <select required={required} disabled={disabled} value={cleanOrganizationValue(value)} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-primary/35 bg-white px-3 text-[12px] outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-[#f2f4f7]">
          {placeholder ? <option value="" disabled={required}>{placeholder}</option> : null}
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input type={type} min={type === "number" ? 0 : undefined} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-primary/35 bg-white px-3 text-[12px] outline-none focus:ring-4 focus:ring-primary/10" />
      )}
    </label>
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
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-[#475467]" aria-hidden="true" /> : null}
        <span className="min-w-0 flex-1 truncate">{value}</span>
        {select ? <ArrowDown className="h-3.5 w-3.5 shrink-0 text-[#475467]" aria-hidden="true" /> : null}
      </span>
    </label>
  );
}

function ContactsTab({ contacts, editingContactId, saving, onChange, onEdit, onAdd, onCancel, onSave }: {
  contacts: OrganizationContact[];
  editingContactId: string | null;
  saving: boolean;
  onChange: (contacts: OrganizationContact[]) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const editable = editingContactId !== null;
  const canSave = contacts.length > 0 && contacts.length <= 10 && contacts.filter((contact) => contact.primary).length === 1 &&
    contacts.every((contact) => contact.name.trim().length >= 2 && contact.roleLabel.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()));
  function updateContact(index: number, values: Partial<OrganizationContact>) {
    onChange(contacts.map((contact, contactIndex) => contactIndex === index ? { ...contact, ...values } : contact));
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        {!editable ? <button type="button" onClick={onAdd} disabled={saving || contacts.length >= 10} className="rounded-lg bg-primary px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-45">Add contact</button> : null}
        {editable ? <>
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-card-border px-3 py-2 text-[12px] font-semibold text-black disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onSave} disabled={!canSave || saving} className="rounded-lg bg-primary px-3 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{saving ? "Saving…" : "Save contact"}</button>
        </> : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-card-border">
      <div className="grid grid-cols-[1fr_0.9fr_1.2fr_0.8fr_0.6fr_auto] gap-3 bg-[#f8fafc] px-4 py-3 text-[12px] font-semibold text-black">
        <span>Full name</span><span>Role label</span><span>Email</span><span>Preferred</span><span>Primary</span><span />
      </div>
      {contacts.map((contact, index) => {
        const rowEditable = contact.id === editingContactId;
        return (
        <div key={contact.id} className="grid grid-cols-[1fr_0.9fr_1.2fr_0.8fr_0.6fr_auto] gap-3 border-t border-card-border px-4 py-3 text-[12px] text-black">
          {rowEditable ? <input value={contact.name} onChange={(event) => updateContact(index, { name: event.target.value })} className="h-9 rounded-lg border border-primary/30 px-2" /> : <span className="font-semibold">{contact.name}<span className="block font-normal text-black/55">{contact.phone}</span></span>}
          {rowEditable ? <input value={contact.roleLabel} onChange={(event) => updateContact(index, { roleLabel: event.target.value })} className="h-9 rounded-lg border border-primary/30 px-2" /> : <span>{contact.roleLabel}</span>}
          {rowEditable ? <input type="email" value={contact.email} onChange={(event) => updateContact(index, { email: event.target.value })} className="h-9 rounded-lg border border-primary/30 px-2" /> : <span className="truncate">{contact.email}</span>}
          {rowEditable ? <select value={contact.method} onChange={(event) => updateContact(index, { method: event.target.value as ContactMethod })} className="h-9 rounded-lg border border-primary/30 px-2">{["Email", "Phone", "WhatsApp", "Portal"].map((method) => <option key={method}>{method}</option>)}</select> : <span>{contact.method}</span>}
          {rowEditable ? <label className="flex items-center gap-2"><input type="radio" name="primary-organisation-contact" checked={contact.primary} onChange={() => onChange(contacts.map((item, itemIndex) => ({ ...item, primary: itemIndex === index })))} /><span className="sr-only">Primary contact</span></label> : <span>{contact.primary ? "Yes" : "No"}</span>}
          {rowEditable ? <button type="button" disabled={contacts.length <= 1 || contact.primary || saving} title={contact.primary ? "Choose another primary contact before removing this contact." : undefined} onClick={() => onChange(contacts.filter((_, contactIndex) => contactIndex !== index))} aria-label={`Remove ${contact.name || "contact"}`} className="text-pulse-red disabled:opacity-30">Remove</button> : <button type="button" onClick={() => onEdit(contact.id)} disabled={editable || saving} aria-label={`Edit contact ${contact.name}`} className="font-semibold text-primary disabled:opacity-45">Edit contact</button>}
          {rowEditable ? <><input value={contact.phone} onChange={(event) => updateContact(index, { phone: event.target.value })} placeholder="Phone" aria-label={`${contact.name || "Contact"} phone`} className="col-span-2 h-9 rounded-lg border border-primary/30 px-2" /><input value={contact.notes} onChange={(event) => updateContact(index, { notes: event.target.value })} placeholder="Notes" aria-label={`${contact.name || "Contact"} notes`} className="col-span-3 h-9 rounded-lg border border-primary/30 px-2" /></> : <span className="col-span-6 text-black/60">{contact.notes}</span>}
        </div>
      );
      })}
      {!contacts.length ? <p className="border-t border-card-border px-4 py-6 text-[12px] text-black/55">No contacts have been added yet.</p> : null}
      </div>
    </div>
  );
}

function ContractTab({ organization }: { organization: Organization }) {
  const remaining = daysUntil(organization.contractEnd);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <a href={`/api/admin/organizations/${organization.id}/contract`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black">
          <Download className="h-4 w-4" aria-hidden="true" />
          Download PDF contract
        </a>
      </div>
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
        <DetailTile label="Renewal reminder" value={remaining <= 60 ? "Review renewal now" : "Review 60 days before expiry"} />
        <DetailTile label="Custom package notes" value={organization.customPackageNotes ?? "None"} />
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

function AddOrganizationModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (form: OrganizationForm) => Promise<boolean> }) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSubmit = form.name.trim() && form.industry && form.country && form.region && form.town && form.employees.trim() && form.contact1Name.trim() && form.contact1Email.trim() && form.contact2Name.trim() && form.contact2Email.trim();

  return (
    <Modal title="Add Organization" onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!canSubmit || isSubmitting) return;
          setIsSubmitting(true);
          const saved = await onSubmit(form);
          if (!saved) setIsSubmitting(false);
        }}
      >
        <LogoUpload value={form.logo} onChange={(logo) => setForm((current) => ({ ...current, logo }))} />
        <div className="grid gap-3 md:grid-cols-2">
          <TextInput label="Company name" value={form.name} onChange={(name) => setForm((current) => ({ ...current, name }))} required />
          <SelectInput label="Industry" value={form.industry} options={industryOptions} placeholder="Select industry" onChange={(industry) => setForm((current) => ({ ...current, industry }))} required />
          <SelectInput label="Country" value={form.country} options={organizationCountryOptions} placeholder="Select country" onChange={(country) => setForm((current) => ({ ...current, country, region: "", town: "" }))} required />
          <SelectInput label={regionLabel(form.country)} value={form.region} options={districtsByCountry[form.country] ?? []} placeholder={form.country ? `Select ${regionLabel(form.country).toLowerCase()}` : "Select country first"} onChange={(region) => setForm((current) => ({ ...current, region, town: "" }))} disabled={!form.country} required />
          <SelectInput label="City / Town" value={form.town} options={citiesByCountryAndRegion[form.country]?.[form.region] ?? []} placeholder={form.region ? "Select city or town" : "Select region first"} onChange={(town) => setForm((current) => ({ ...current, town }))} disabled={!form.region} required />
          <TextInput label="Employee count" value={form.employees} onChange={(employees) => setForm((current) => ({ ...current, employees }))} required />
          <SelectInput label="Package" value={form.package} options={packageOptions} onChange={(value) => setForm((current) => ({ ...current, package: value as PackageName }))} />
          <SelectInput label="Status" value={form.status} options={statusOptions} onChange={(value) => setForm((current) => ({ ...current, status: value as OrganizationStatus }))} />
          <TextInput label="Contract start date" value={form.contractStart} onChange={(contractStart) => setForm((current) => ({ ...current, contractStart }))} />
          <TextInput label="Contract end date" value={form.contractEnd} onChange={(contractEnd) => setForm((current) => ({ ...current, contractEnd }))} />
          <TextInput label="Custom package notes" value={form.customPackageNotes} onChange={(customPackageNotes) => setForm((current) => ({ ...current, customPackageNotes }))} />
        </div>
        <ContactFields title="Contact 1" prefix="contact1" form={form} setForm={setForm} />
        <ContactFields title="Contact 2" prefix="contact2" form={form} setForm={setForm} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-2xl border border-card-border px-4 text-[12px] font-semibold text-black">Cancel</button>
          <button type="submit" disabled={!canSubmit || isSubmitting} className="h-9 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45">{isSubmitting ? "Saving..." : "Create organization"}</button>
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
  onSubmit: (payload: InvitePayload) => Promise<void>;
}) {
  const [payload, setPayload] = useState<InvitePayload>({
    name: "",
    email: "",
    role: "Client Viewer",
    organizationId: initialOrganizationId ?? organizations[0]?.id ?? "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const canSubmit = payload.name.trim() && payload.email.trim() && payload.organizationId;
  return (
    <Modal title="Invite Client User" onClose={onClose}>
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (canSubmit && !submitting) { setSubmitting(true); try { await onSubmit(payload); } finally { setSubmitting(false); } }
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
        <StateBanner tone="info" title="Organisation access" detail="New users receive a secure setup email. Existing users are added to this organisation." />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-2xl border border-card-border px-4 text-[12px] font-semibold text-black">Cancel</button>
          <button type="submit" disabled={!canSubmit || submitting} className="h-9 rounded-2xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45">{submitting ? "Saving…" : "Invite or add user"}</button>
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
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
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

function SelectInput({ label, value, options, onChange, placeholder, disabled = false, required = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; placeholder?: string; disabled?: boolean; required?: boolean }) {
  return (
    <label className="grid gap-1 text-[12px] font-semibold text-black">
      {label}
      <select required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-2xl border border-card-border px-3 text-[12px] font-normal outline-none transition focus:border-primary/45 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-[#f2f4f7]">
        {placeholder ? <option value="" disabled={required}>{placeholder}</option> : null}
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
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
  return organization.branches.length;
}

function displayDepartmentCount(organization: Organization) {
  return countDepartments(organization);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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

function riskRank(risk: WellnessRisk) {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[risk];
}
