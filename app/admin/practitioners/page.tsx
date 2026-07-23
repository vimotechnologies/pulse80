"use client";

import { useMemo, useState } from "react";
import {
  AddCircle,
  CalendarCheck,
  CloseSquare,
  Download,
  MoreHorizontal,
  Search,
  ShieldCheck,
  UsersRound,
} from "@/components/icons/IconsaxIcons";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCardShell } from "@/components/ui/MetricCardShell";
import { ResizableGridTable } from "@/components/ui/ResizableGridTable";
import {
  ListClearButton,
  ListFilterCard,
  ListFilterField,
  ListSearchField,
  practitionerFilterGridClass,
} from "@/components/ui/ListFilterCard";
import { cn } from "@/lib/utils/cn";

type PractitionerStatus = "Active" | "Inactive" | "Pending";
type Availability = "Available" | "Limited" | "Booked" | "Unavailable";
type Verification = "Verified" | "Pending";

type Practitioner = {
  id: string;
  name: string;
  credential: string;
  profession: string;
  location: string;
  country: "South Africa" | "Botswana";
  availability: Availability;
  verification: Verification;
  verificationBody: "HPCSA" | "BHPC";
  upcomingAssignments: number;
  nextAssignment: string;
  rating?: number;
  ratingCount?: number;
  status: PractitionerStatus;
  services: string[];
  documents: string;
  qualityNote: string;
};

const practitioners: Practitioner[] = [
  {
    id: "naledi-phiri",
    name: "Dr Naledi Phiri",
    credential: "HPCSA: MP123456",
    profession: "Occupational Health Physician",
    location: "Johannesburg, Gauteng",
    country: "South Africa",
    availability: "Available",
    verification: "Verified",
    verificationBody: "HPCSA",
    upcomingAssignments: 3,
    nextAssignment: "12 Jun 2024",
    rating: 4.9,
    ratingCount: 42,
    status: "Active",
    services: ["Executive wellness reviews", "Occupational screenings", "Clinical escalation"],
    documents: "License, indemnity, ID verified",
    qualityNote: "Consistently high client feedback across executive wellness days.",
  },
  {
    id: "thabo-mokoena",
    name: "Mr Thabo Mokoena",
    credential: "HPCSA: PR789654",
    profession: "Physiotherapist",
    location: "Pretoria, Gauteng",
    country: "South Africa",
    availability: "Available",
    verification: "Verified",
    verificationBody: "HPCSA",
    upcomingAssignments: 2,
    nextAssignment: "10 Jun 2024",
    rating: 4.8,
    ratingCount: 37,
    status: "Active",
    services: ["Ergonomics sessions", "Injury prevention", "Functional movement screening"],
    documents: "License and compliance documents current",
    qualityNote: "Strong onsite facilitation and practical follow-up notes.",
  },
  {
    id: "lerato-dlamini",
    name: "Ms Lerato Dlamini",
    credential: "BHPC: HP012345",
    profession: "Clinical Psychologist",
    location: "Gaborone, Botswana",
    country: "Botswana",
    availability: "Limited",
    verification: "Verified",
    verificationBody: "BHPC",
    upcomingAssignments: 1,
    nextAssignment: "15 Jun 2024",
    rating: 4.7,
    ratingCount: 28,
    status: "Active",
    services: ["Mental wellbeing briefings", "Risk conversations", "Manager support"],
    documents: "BHPC registration verified",
    qualityNote: "Excellent fit for confidential executive and HR briefings.",
  },
  {
    id: "sipho-ndlovu",
    name: "Dr Sipho Ndlovu",
    credential: "HPCSA: MP456789",
    profession: "General Practitioner",
    location: "Bloemfontein, Free State",
    country: "South Africa",
    availability: "Booked",
    verification: "Verified",
    verificationBody: "HPCSA",
    upcomingAssignments: 4,
    nextAssignment: "11 Jun 2024",
    rating: 4.9,
    ratingCount: 53,
    status: "Active",
    services: ["Blood pressure review", "Glucose screening", "Referral routing"],
    documents: "All clinical credentials current",
    qualityNote: "Preferred clinical lead for larger regional wellness days.",
  },
  {
    id: "palesa-khumalo",
    name: "Ms Palesa Khumalo",
    credential: "HPCSA: DT987654",
    profession: "Dietitian",
    location: "Durban, KwaZulu-Natal",
    country: "South Africa",
    availability: "Available",
    verification: "Verified",
    verificationBody: "HPCSA",
    upcomingAssignments: 2,
    nextAssignment: "13 Jun 2024",
    rating: 4.6,
    ratingCount: 31,
    status: "Active",
    services: ["Nutrition consults", "Metabolic risk coaching", "Group education"],
    documents: "Practice registration verified",
    qualityNote: "Clear education style for shift-based teams.",
  },
  {
    id: "onkabetse-moseki",
    name: "Ms Onkabetse Moseki",
    credential: "BHPC: OT223344",
    profession: "Optometrist",
    location: "Francistown, Botswana",
    country: "Botswana",
    availability: "Unavailable",
    verification: "Verified",
    verificationBody: "BHPC",
    upcomingAssignments: 0,
    nextAssignment: "Not scheduled",
    rating: 4.5,
    ratingCount: 18,
    status: "Inactive",
    services: ["Vision screening", "Referral notes", "Workstation guidance"],
    documents: "Registration verified; availability paused",
    qualityNote: "Paused for new assignments until availability is updated.",
  },
  {
    id: "kabelo-setlhodi",
    name: "Mr Kabelo Setlhodi",
    credential: "HPCSA: PS112233",
    profession: "Counsellor",
    location: "Polokwane, Limpopo",
    country: "South Africa",
    availability: "Available",
    verification: "Pending",
    verificationBody: "HPCSA",
    upcomingAssignments: 1,
    nextAssignment: "20 Jun 2024",
    status: "Pending",
    services: ["Wellbeing support", "Employee assistance referral", "Group debriefs"],
    documents: "Practice card requires review",
    qualityNote: "Pending credential review before full activation roster access.",
  },
];

const practitionerTableColumns = [
  { key: "practitioner", label: "Practitioner", width: 244, minWidth: 208 },
  { key: "profession", label: "Profession", width: 180, minWidth: 160 },
  { key: "location", label: "Location", width: 172, minWidth: 148 },
  { key: "availability", label: "Availability", width: 136, minWidth: 120 },
  { key: "verification", label: "Verification", width: 144, minWidth: 128 },
  { key: "assignments", label: "Upcoming Assignments", width: 164, minWidth: 148 },
  { key: "rating", label: "Rating", width: 112, minWidth: 96 },
  { key: "status", label: "Status", width: 112, minWidth: 96 },
];

const filterOptions = {
  status: ["All", "Active", "Inactive", "Pending"],
  profession: ["All", "Occupational Health Physician", "Physiotherapist", "Clinical Psychologist", "General Practitioner", "Dietitian", "Optometrist", "Counsellor"],
  country: ["All", "South Africa", "Botswana"],
  location: ["All", "Gauteng", "Botswana", "Free State", "KwaZulu-Natal", "Limpopo"],
  availability: ["All", "Available", "Limited", "Booked", "Unavailable"],
  verification: ["All", "Verified", "Pending"],
};

type FilterKey = keyof typeof filterOptions;

export default function AdminPractitionersPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "All",
    profession: "All",
    country: "All",
    location: "All",
    availability: "All",
    verification: "All",
  });
  const [filterResetSignal, setFilterResetSignal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, PractitionerStatus>>({});
  const [toast, setToast] = useState<string | null>(null);

  const practitionerRecords = useMemo(
    () => practitioners.map((practitioner) => ({ ...practitioner, status: statusOverrides[practitioner.id] ?? practitioner.status })),
    [statusOverrides],
  );

  const visiblePractitioners = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = practitionerRecords.filter((practitioner) => {
      const matchesQuery = normalizedQuery
        ? `${practitioner.name} ${practitioner.profession} ${practitioner.credential} ${practitioner.location}`.toLowerCase().includes(normalizedQuery)
        : true;
      const matchesStatus = filters.status === "All" || practitioner.status === filters.status;
      const matchesProfession = filters.profession === "All" || practitioner.profession === filters.profession;
      const matchesCountry = filters.country === "All" || practitioner.country === filters.country;
      const matchesLocation = filters.location === "All" || practitioner.location.includes(filters.location);
      const matchesAvailability = filters.availability === "All" || practitioner.availability === filters.availability;
      const matchesVerification = filters.verification === "All" || practitioner.verification === filters.verification;

      return matchesQuery && matchesStatus && matchesProfession && matchesCountry && matchesLocation && matchesAvailability && matchesVerification;
    });

    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [filters, practitionerRecords, query]);

  const selectedPractitioner = practitionerRecords.find((practitioner) => practitioner.id === selectedPractitionerId) ?? null;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  function clearFilters() {
    setQuery("");
    setFilters({
      status: "All",
      profession: "All",
      country: "All",
      location: "All",
      availability: "All",
      verification: "All",
    });
    setFilterResetSignal((value) => value + 1);
  }

  function updateFilter(key: FilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-6 text-black">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold leading-8 text-black">Practitioners</h1>
          <p className="mt-2 text-[14px] leading-6 text-black/65">
            Manage your healthcare practitioner network, credentials and assignments.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-[12px] font-semibold text-black shadow-[0_4px_14px_rgba(15,23,42,0.025)] transition hover:bg-black hover:text-white active:scale-[0.98] active:bg-primary active:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <AddCircle className="h-[18px] w-[18px]" aria-hidden="true" />
            Add Practitioner
          </button>
          <ToolbarButton icon={Download} onClick={() => showToast("CSV import placeholder opened.")}>Import CSV</ToolbarButton>
          <ToolbarButton icon={Download} onClick={() => showToast("Practitioner export prepared locally.")}>Export</ToolbarButton>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black transition hover:bg-black hover:text-white active:scale-[0.96] active:bg-primary active:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={UsersRound} label="Verified Practitioners" value="126" detail="118 Active" />
        <MetricCard icon={CalendarCheck} label="Available This Week" value="84" detail="Ready for assignments" />
        <MetricCard icon={CalendarCheck} label="Upcoming Assignments" value="42" detail="Across 18 wellness days" />
        <MetricCard icon={ShieldCheck} label="Credentials Expiring" value="7" detail="Require renewal" />
      </section>

      <ListFilterCard
        search={<ListSearchField value={query} onChange={setQuery} placeholder="Search by name or license number" />}
        actions={<ListClearButton onClick={clearFilters} />}
        filterGridClassName={practitionerFilterGridClass}
      >
        <ListFilterField key={`status-${filterResetSignal}`} label="Status" value={filters.status} options={filterOptions.status} onChange={(status) => updateFilter("status", status)} />
        <ListFilterField key={`profession-${filterResetSignal}`} label="Profession" value={filters.profession} options={filterOptions.profession} onChange={(profession) => updateFilter("profession", profession)} />
        <ListFilterField key={`country-${filterResetSignal}`} label="Country" value={filters.country} options={filterOptions.country} onChange={(country) => updateFilter("country", country)} />
        <ListFilterField key={`location-${filterResetSignal}`} label="Location" value={filters.location} options={filterOptions.location} onChange={(location) => updateFilter("location", location)} />
        <ListFilterField key={`availability-${filterResetSignal}`} label="Availability" value={filters.availability} options={filterOptions.availability} onChange={(availability) => updateFilter("availability", availability)} />
        <ListFilterField key={`verification-${filterResetSignal}`} label="Verification" value={filters.verification} options={filterOptions.verification} onChange={(verification) => updateFilter("verification", verification)} />
      </ListFilterCard>

      {visiblePractitioners.length === 0 ? (
        <section className="rounded-lg bg-white p-10 text-center shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-[16px] font-semibold text-black">No practitioners match this view</h2>
          <p className="mt-2 text-[12px] text-black/60">Clear filters or search again to return to the active network.</p>
          <button type="button" onClick={clearFilters} className="mt-4 h-9 rounded-lg px-4 text-[12px] font-semibold text-black transition hover:bg-black hover:text-white active:scale-[0.98] active:bg-primary active:text-white">
            Clear filters
          </button>
        </section>
      ) : (
        <PractitionerTable practitioners={visiblePractitioners} onSelect={(practitioner) => setSelectedPractitionerId(practitioner.id)} />
      )}

      <div className="flex flex-col gap-3 text-[12px] text-black/65 md:flex-row md:items-center md:justify-between">
        <span>Showing 1 to {visiblePractitioners.length} of 126 practitioners</span>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              type="button"
              className={cn(
                "h-8 min-w-8 rounded-lg px-3 text-[12px] font-semibold transition active:scale-[0.96] active:bg-primary active:text-white",
                page === 1 ? " bg-primary text-white" : " bg-white text-black hover:bg-black hover:text-white",
              )}
            >
              {page}
            </button>
          ))}
          <span className="px-2">...</span>
          <button type="button" className="h-8 min-w-8 rounded-lg bg-white px-3 text-[12px] font-semibold text-black transition hover:bg-black hover:text-white active:scale-[0.96] active:bg-primary active:text-white">13</button>
        </div>
      </div>

      {modalOpen ? <AddPractitionerModal onClose={() => setModalOpen(false)} onSubmit={() => {
        setModalOpen(false);
        showToast("Practitioner profile created locally.");
      }} /> : null}
      {selectedPractitioner ? (
        <PractitionerDetailsModal
          practitioner={selectedPractitioner}
          onClose={() => setSelectedPractitionerId(null)}
          onRequestInfo={() => showToast(`Information request prepared for ${selectedPractitioner.name}.`)}
          onSave={() => showToast(`${selectedPractitioner.name} updates saved locally.`)}
          onToggleSuspension={() => {
            const nextStatus = selectedPractitioner.status === "Inactive" ? "Active" : "Inactive";
            setStatusOverrides((current) => ({ ...current, [selectedPractitioner.id]: nextStatus }));
            showToast(nextStatus === "Inactive" ? `${selectedPractitioner.name} suspended locally.` : `${selectedPractitioner.name} suspension lifted locally.`);
          }}
        />
      ) : null}
      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-white px-4 py-3 text-[12px] font-semibold text-black shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  detail: string;
}) {
  return <MetricCardShell label={label} value={value} detail={detail} icon={Icon} />;
}

function ToolbarButton({ icon: Icon, children, onClick }: { icon: typeof Download; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-[12px] font-semibold text-black shadow-[0_4px_14px_rgba(15,23,42,0.025)] transition hover:bg-black hover:text-white active:scale-[0.98] active:bg-primary active:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      {children}
    </button>
  );
}

function PractitionerTable({ practitioners, onSelect }: { practitioners: Practitioner[]; onSelect: (practitioner: Practitioner) => void }) {
  return (
    <ResizableGridTable
      columns={practitionerTableColumns}
      rows={practitioners}
      getRowKey={(practitioner) => practitioner.id}
      renderRow={(practitioner, gridTemplateColumns) => (
        <button
          type="button"
          onClick={() => onSelect(practitioner)}
          className="grid w-full cursor-pointer items-center px-5 py-3 text-left text-[12px] text-black transition hover:bg-[#f8fafc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          style={{ gridTemplateColumns }}
        >
          <div className="flex min-w-0 items-center gap-3 pr-4">
            <Avatar name={practitioner.name} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{practitioner.name}</p>
              <p className="mt-1 truncate text-black/60">{practitioner.credential}</p>
            </div>
          </div>
          <span className="pr-4 leading-5">{practitioner.profession}</span>
          <span className="pr-4 leading-5">{practitioner.location}</span>
          <AvailabilityBadge value={practitioner.availability} />
          <span className="pr-4">
            <span className={cn("flex items-center gap-1 font-semibold", practitioner.verification === "Verified" ? "text-success" : "text-warning")}>
              <ShieldCheck className="h-[14px] w-[14px]" aria-hidden="true" />
              {practitioner.verification}
            </span>
            <span className="mt-1 block text-black/60">{practitioner.verificationBody}</span>
          </span>
          <span className="pr-4">
            <span className="font-semibold">{practitioner.upcomingAssignments}</span>
            <span className="mt-1 block text-black/60">Next: {practitioner.nextAssignment}</span>
          </span>
          <span className="pr-4">
            {practitioner.rating ? (
              <>
                <span className="font-semibold text-black"><span className="text-warning">★</span> {practitioner.rating}</span>
                <span className="mt-1 block text-black/60">({practitioner.ratingCount})</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-black/55">—</span>
                <span className="mt-1 block text-black/60">No ratings</span>
              </>
            )}
          </span>
          <StatusBadge status={practitioner.status} tone={practitioner.status === "Active" ? "success" : practitioner.status === "Pending" ? "warning" : "neutral"} />
        </button>
      )}
    />
  );
}

function PractitionerDetailsModal({
  practitioner,
  onClose,
  onRequestInfo,
  onSave,
  onToggleSuspension,
}: {
  practitioner: Practitioner;
  onClose: () => void;
  onRequestInfo: () => void;
  onSave: () => void;
  onToggleSuspension: () => void;
}) {
  const [form, setForm] = useState({
    profession: practitioner.profession,
    location: practitioner.location,
    availability: practitioner.availability,
    verification: practitioner.verification,
    internalNote: practitioner.qualityNote,
    requestMessage: "Please upload updated compliance documents and confirm availability for upcoming wellness days.",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-labelledby="practitioner-details-title">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex flex-col gap-4 border-b border-[#d0d5dd] p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={practitioner.name} size="lg" />
            <div>
              <h2 id="practitioner-details-title" className="text-[20px] font-semibold leading-7 text-black">{practitioner.name}</h2>
              <p className="mt-1 text-[12px] text-black/60">{practitioner.credential}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={practitioner.status} tone={practitioner.status === "Active" ? "success" : practitioner.status === "Pending" ? "warning" : "neutral"} />
                <AvailabilityBadge value={practitioner.availability} />
                <StatusBadge status={practitioner.verification} tone={practitioner.verification === "Verified" ? "success" : "warning"} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onRequestInfo} className="h-9 rounded-lg bg-[#f2f4f7] px-4 text-[12px] font-semibold text-black transition hover:bg-black hover:text-white">
              Request information
            </button>
            <button
              type="button"
              onClick={onToggleSuspension}
              className={cn(
                "h-9 rounded-lg px-4 text-[12px] font-semibold text-white transition hover:bg-black active:scale-[0.98] active:bg-primary",
                practitioner.status === "Inactive" ? "bg-success" : "bg-pulse-red",
              )}
            >
              {practitioner.status === "Inactive" ? "Lift suspension" : "Suspend practitioner"}
            </button>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-black transition hover:bg-black hover:text-white" aria-label="Close practitioner details">
              <CloseSquare className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-84px)] overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-lg bg-[#f8fafc] p-4">
              <h3 className="text-[14px] font-semibold text-black">Admin Profile Controls</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ModalInput label="Profession" value={form.profession} onChange={(value) => updateField("profession", value)} />
                <ModalInput label="Location" value={form.location} onChange={(value) => updateField("location", value)} />
                <label className="grid gap-1 text-[12px] font-semibold text-black">
                  Availability
                  <select value={form.availability} onChange={(event) => updateField("availability", event.target.value)} className="h-10 rounded-lg border border-[#d0d5dd] px-3 text-[12px] font-normal text-black outline-none transition focus:ring-4 focus:ring-primary/10">
                    {filterOptions.availability.filter((option) => option !== "All").map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-[12px] font-semibold text-black">
                  Verification
                  <select value={form.verification} onChange={(event) => updateField("verification", event.target.value)} className="h-10 rounded-lg border border-[#d0d5dd] px-3 text-[12px] font-normal text-black outline-none transition focus:ring-4 focus:ring-primary/10">
                    {filterOptions.verification.filter((option) => option !== "All").map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              </div>
              <label className="mt-4 grid gap-1 text-[12px] font-semibold text-black">
                Internal admin note
                <textarea value={form.internalNote} onChange={(event) => updateField("internalNote", event.target.value)} className="min-h-24 rounded-lg border border-[#d0d5dd] px-3 py-2 text-[12px] font-normal text-black outline-none transition focus:ring-4 focus:ring-primary/10" />
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={onSave} className="h-9 rounded-lg bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black active:scale-[0.98]">
                  Save local edits
                </button>
                <button type="button" onClick={() => onRequestInfo()} className="h-9 rounded-lg bg-white px-4 text-[12px] font-semibold text-black transition hover:bg-black hover:text-white">
                  Send request
                </button>
              </div>
            </section>

            <section className="rounded-lg bg-[#f8fafc] p-4">
              <h3 className="text-[14px] font-semibold text-black">Operational Summary</h3>
              <div className="mt-4 grid gap-3 text-[12px] text-black">
                <DetailRow label="Council" value={practitioner.verificationBody} />
                <DetailRow label="Documents" value={practitioner.documents} />
                <DetailRow label="Assignments" value={`${practitioner.upcomingAssignments} upcoming, next ${practitioner.nextAssignment}`} />
                <DetailRow label="Quality" value={practitioner.rating ? `${practitioner.rating} from ${practitioner.ratingCount} reviews` : "No ratings yet"} />
              </div>
            </section>
          </div>

          <section className="mt-4 rounded-lg bg-[#f8fafc] p-4">
            <h3 className="text-[14px] font-semibold text-black">Services & Admin Actions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {practitioner.services.map((service) => (
                <span key={service} className="rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-black">{service}</span>
              ))}
            </div>
            <label className="mt-4 grid gap-1 text-[12px] font-semibold text-black">
              Information request message
              <textarea value={form.requestMessage} onChange={(event) => updateField("requestMessage", event.target.value)} className="min-h-20 rounded-lg border border-[#d0d5dd] px-3 py-2 text-[12px] font-normal text-black outline-none transition focus:ring-4 focus:ring-primary/10" />
            </label>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={onRequestInfo} className="h-9 rounded-lg bg-white px-3 text-[12px] font-semibold text-black transition hover:bg-black hover:text-white">Request documents</button>
              <button type="button" onClick={onSave} className="h-9 rounded-lg bg-white px-3 text-[12px] font-semibold text-black transition hover:bg-black hover:text-white">Update assignment fit</button>
              <button type="button" onClick={onSave} className="h-9 rounded-lg bg-white px-3 text-[12px] font-semibold text-black transition hover:bg-black hover:text-white">Flag credential review</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#d0d5dd] pb-3 last:border-b-0 last:pb-0">
      <span className="font-semibold text-black/60">{label}</span>
      <span className="max-w-[70%] text-right font-semibold text-black">{value}</span>
    </div>
  );
}

function AddPractitionerModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [name, setName] = useState("");
  const canSubmit = name.trim().length > 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true">
      <form
        className="w-full max-w-xl rounded-lg bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit();
        }}
      >
        <div className="flex items-center justify-between border-b border-[#d0d5dd] p-5">
          <h2 className="text-[16px] font-semibold text-black">Add Practitioner</h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-black transition hover:bg-black hover:text-white">
            <CloseSquare className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <ModalInput label="Full name" value={name} onChange={setName} required />
          <ModalInput label="Profession" />
          <ModalInput label="Council number" />
          <ModalInput label="Location" />
        </div>
        <div className="flex justify-end gap-2 border-t border-[#d0d5dd] p-5">
          <button type="button" onClick={onClose} className="h-9 rounded-lg px-4 text-[12px] font-semibold text-black transition hover:bg-black hover:text-white">Cancel</button>
          <button type="submit" disabled={!canSubmit} className="h-9 rounded-lg bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45">Create locally</button>
        </div>
      </form>
    </div>
  );
}

function ModalInput({ label, value, onChange, required }: { label: string; value?: string; onChange?: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1 text-[12px] font-semibold text-black">
      {label} {required ? <span className="text-pulse-red">*</span> : null}
      <input
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 rounded-lg border border-[#d0d5dd] px-3 text-[12px] font-normal text-black outline-none transition focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function AvailabilityBadge({ value }: { value: Availability }) {
  const className = {
    Available: "bg-success/12 text-success",
    Limited: "bg-warning/12 text-warning",
    Booked: "bg-pulse-red/10 text-pulse-red",
    Unavailable: "bg-slate-100 text-black/65",
  }[value];

  return <span className={cn("inline-flex w-fit rounded-md px-2 py-1 text-[12px] font-semibold", className)}>{value}</span>;
}

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .replace(/^(Dr|Mr|Ms)\s+/, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#dbeafe,#fce7f3)] font-semibold text-black shadow-inner",
        size === "lg" ? "h-14 w-14 text-[14px]" : "h-11 w-11 text-[12px]",
      )}
    >
      {initials}
    </span>
  );
}
