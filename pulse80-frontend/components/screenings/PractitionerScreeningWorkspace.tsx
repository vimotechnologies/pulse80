"use client";

import { useMemo, useRef, useState, useTransition, type DragEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { captureScreening, captureScreeningBatch } from "@/app/actions/screening-operations";
import { Activity, ClipboardCheck, CloudUpload, HeartPulse, Microscope } from "@/components/icons/IconsaxIcons";
import { ListSummaryMetric } from "@/components/portal/DataListPage";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import {
  UnifiedFilterCard,
  UnifiedFilterClear,
  UnifiedFilterSearch,
  UnifiedFilterSelect,
} from "@/components/ui/UnifiedFilterCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToastMessage } from "@/components/ui/ToastMessage";
import type { Screening, ScreeningAssignmentOption, ScreeningCaptureForm } from "@/types/screening";

type ImportRow = {
  employeeReference: string;
  department: string;
  systolicMmhg: string;
  diastolicMmhg: string;
  glucoseMmolL: string;
  cholesterolMmolL: string;
  heightCm: string;
  weightKg: string;
  consentConfirmed: boolean;
  practitionerNote: string;
};

type CaptureErrors = Partial<Record<
  | "assignmentId"
  | "participantReference"
  | "department"
  | "measurements"
  | "systolicMmhg"
  | "diastolicMmhg"
  | "glucoseMmolL"
  | "cholesterolMmolL"
  | "heightCm"
  | "weightKg"
  | "consentConfirmed",
  string
>>;

const recordsPerPage = 10;

export function PractitionerScreeningWorkspace({ screenings, assignments }: { screenings: Screening[]; assignments: ScreeningAssignmentOption[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [organisationFilter, setOrganisationFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importAssignmentId, setImportAssignmentId] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const organisationOptions = useMemo(
    () => ["All", ...Array.from(new Set(assignments.map((item) => item.organisationName))).sort()],
    [assignments],
  );

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return screenings.filter((item) => {
      const searchable = `${item.participantReference} ${item.activationName ?? ""} ${item.organisationName} ${item.department ?? ""} ${item.status}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesRisk = riskFilter === "All" || item.result.riskLevel === riskFilter;
      const matchesOrganisation = organisationFilter === "All" || item.organisationName === organisationFilter;
      return matchesQuery && matchesStatus && matchesRisk && matchesOrganisation;
    });
  }, [organisationFilter, query, riskFilter, screenings, statusFilter]);

  const selectedImportAssignment = assignments.find((item) => item.id === importAssignmentId);
  const pageCount = Math.max(1, Math.ceil(rows.length / recordsPerPage));
  const activePage = Math.min(currentPage, pageCount);
  const paginatedRows = rows.slice((activePage - 1) * recordsPerPage, activePage * recordsPerPage);
  const needsCorrection = screenings.filter((item) => item.status === "Needs Correction").length;
  const submitted = screenings.filter((item) => item.status === "Submitted").length;
  const escalated = screenings.filter((item) => item.result.escalationRequired).length;

  function clearFilters() {
    setQuery("");
    setStatusFilter("All");
    setRiskFilter("All");
    setOrganisationFilter("All");
    setCurrentPage(1);
  }

  function stageFile(file: File) {
    setImportError(null);
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setSelectedFile(null);
      setImportError("Choose a CSV or Excel file (.csv, .xlsx, or .xls).");
      return;
    }
    setSelectedFile(file);
  }

  async function handleImport(file: File) {
    setImportError(null);
    try {
      if (!/\.(csv|xlsx|xls)$/i.test(file.name)) throw new Error("Choose a CSV or Excel file (.csv, .xlsx, or .xls).");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sourceRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      const parsed = sourceRows.map(normalizeImportRow).filter((item) => item.employeeReference);
      if (!parsed.length) throw new Error("No employee screening rows were found in this file.");
      setImportRows(parsed);
      setImportFileName(file.name);
    } catch (error) {
      setImportRows([]);
      setImportFileName("");
      setImportError(error instanceof Error ? error.message : "The spreadsheet could not be read.");
    } finally {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function submitImport() {
    if (!importAssignmentId) {
      setImportError("Select one of your assignments before submitting imported records.");
      return;
    }
    if (!importRows.length) return;

    const forms = importRows.map((row): ScreeningCaptureForm => ({
      assignmentId: importAssignmentId,
      participantReference: row.employeeReference,
      department: row.department,
      consentConfirmed: row.consentConfirmed,
      practitionerNote: row.practitionerNote,
      systolicMmhg: row.systolicMmhg,
      diastolicMmhg: row.diastolicMmhg,
      glucoseMmolL: row.glucoseMmolL,
      cholesterolMmolL: row.cholesterolMmolL,
      heightCm: row.heightCm,
      weightKg: row.weightKg,
    }));

    startTransition(async () => {
      const result = await captureScreeningBatch(forms);
      if (result.ok) {
        setMessage(`${result.results.length} screening records submitted for quality assurance.`);
        setImportRows([]);
        setImportFileName("");
        setImportAssignmentId("");
        setImportError(null);
        router.refresh();
      } else {
        setImportError(`${result.submittedCount ? `${result.submittedCount} records were submitted before the error. ` : ""}${errorText(result.error)}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <PortalPageHeader
        eyebrow="Health Practitioner"
        title="Screenings"
        description="Capture and manage anonymized employee wellness screening records linked to your assigned programmes."
        actions={<button type="button" onClick={() => setManualOpen(true)} className="rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white">Capture screening</button>}
      />
      <ToastMessage message={message} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ListSummaryMetric metric={{ label: "Captured", value: (screenings.length + importRows.length).toLocaleString("en-BW"), detail: "Screening records", tone: "primary", icon: ClipboardCheck }} />
        <ListSummaryMetric metric={{ label: "Needs correction", value: needsCorrection.toLocaleString("en-BW"), detail: "Require your action", tone: "primary", icon: Activity }} />
        <ListSummaryMetric metric={{ label: "Submitted", value: submitted.toLocaleString("en-BW"), detail: "Awaiting quality assurance", tone: "primary", icon: Microscope }} />
        <ListSummaryMetric metric={{ label: "Escalated", value: escalated.toLocaleString("en-BW"), detail: "Require clinical attention", tone: "primary", icon: HeartPulse }} />
      </section>

      <UnifiedFilterCard>
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_170px_150px_210px_auto]">
          <UnifiedFilterSearch value={query} onChange={(value) => { setQuery(value); setCurrentPage(1); }} placeholder="Search screenings" />
          <UnifiedFilterSelect label="Status" value={statusFilter} options={["All", "Submitted", "Needs Correction", "Approved"]} onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }} />
          <UnifiedFilterSelect label="Risk" value={riskFilter} options={["All", "Low", "Medium", "High"]} onChange={(value) => { setRiskFilter(value); setCurrentPage(1); }} />
          <UnifiedFilterSelect label="Organisation" value={organisationFilter} options={organisationOptions} onChange={(value) => { setOrganisationFilter(value); setCurrentPage(1); }} />
          <UnifiedFilterClear onClick={clearFilters} />
        </div>
      </UnifiedFilterCard>

      <section
        className={`rounded-lg border p-4 transition-colors ${isDraggingFile ? "border-primary bg-primary/5" : "border-card-border bg-[#f8fafc]"}`}
        onDragEnter={(event) => { event.preventDefault(); if (!event.dataTransfer.types.includes("Files")) return; dragDepthRef.current += 1; setIsDraggingFile(true); }}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
        onDragLeave={(event) => { event.preventDefault(); dragDepthRef.current = Math.max(0, dragDepthRef.current - 1); if (!dragDepthRef.current) setIsDraggingFile(false); }}
        onDrop={(event: DragEvent<HTMLElement>) => { event.preventDefault(); dragDepthRef.current = 0; setIsDraggingFile(false); const file = event.dataTransfer.files[0]; if (file) stageFile(file); }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-navy">Bulk import screenings</h2>
            <p className="mt-1 text-xs leading-5 text-muted">Drag and drop your CSV or Excel file here, or click to browse.</p>
            <p className="text-[11px] leading-5 text-muted">Supported formats: CSV, XLSX and XLS.</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedFile ? <span className="max-w-64 truncate text-xs font-medium text-muted">{selectedFile.name}</span> : null}
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-card-border bg-white px-4 text-xs font-semibold text-navy transition hover:border-primary/35 hover:text-primary">
              <CloudUpload className="h-4 w-4" aria-hidden="true" />
              Choose file
            </button>
            {selectedFile ? <button type="button" onClick={() => void handleImport(selectedFile)} className="h-10 rounded-lg bg-primary px-4 text-xs font-semibold text-white">Upload</button> : null}
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) stageFile(file); }} />
        </div>
        {importError ? <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{importError}</p> : null}
      </section>

      {importRows.length ? (
        <section className="rounded-lg border border-card-border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-navy">Import preview</h2>
              <p className="mt-1 text-xs text-muted">{importFileName} · {importRows.length} employee records</p>
            </div>
            <button type="button" onClick={() => { setImportRows([]); setImportFileName(""); setImportError(null); }} className="text-xs font-semibold text-primary">Clear import</button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(260px,1fr)_auto]">
            <label className="space-y-2 text-xs font-semibold text-navy">
              <span>Assignment / activation</span>
              <select className={inputClass} value={importAssignmentId} onChange={(event) => setImportAssignmentId(event.target.value)}>
                <option value="">Choose assignment</option>
                {assignments.map((item) => <option key={item.id} value={item.id}>{item.organisationName} · {item.activationName ?? item.serviceName} · {item.location}</option>)}
              </select>
            </label>
            <button type="button" disabled={!importAssignmentId || pending} onClick={submitImport} className="self-end rounded-lg bg-primary px-4 py-3 text-xs font-semibold text-white disabled:opacity-40">{pending ? "Submitting…" : `Submit ${importRows.length} records`}</button>
          </div>

          <p className="mt-2 text-xs text-muted">Risk in this preview is an estimate from the uploaded measurements. The backend calculates the final risk when records are submitted.</p>

          <CompactTable headers={["Reference", "Activation", "Organisation", "Department", "Risk", "Captured", "Status"]}>
            {importRows.map((row, index) => {
              const risk = previewRisk(row);
              return (
                <tr key={`${row.employeeReference}-${index}`} className="border-t border-card-border">
                  <Cell><strong>{row.employeeReference}</strong></Cell>
                  <Cell>{selectedImportAssignment?.activationName ?? selectedImportAssignment?.serviceName ?? "Select assignment"}</Cell>
                  <Cell>{selectedImportAssignment?.organisationName ?? "Select assignment"}</Cell>
                  <Cell>{row.department || "Not set"}</Cell>
                  <Cell><StatusBadge status={risk} tone={risk === "High" ? "danger" : risk === "Medium" ? "warning" : "success"} /></Cell>
                  <Cell>Pending</Cell>
                  <Cell><StatusBadge status={row.consentConfirmed ? "Ready" : "Consent missing"} tone={row.consentConfirmed ? "info" : "danger"} /></Cell>
                </tr>
              );
            })}
          </CompactTable>
        </section>
      ) : null}

      <section className="rounded-lg border border-card-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-navy">Screening records</h2>
          </div>
          <p className="text-xs font-medium text-muted">{rows.length} of {screenings.length} records</p>
        </div>

        <CompactTable headers={["Reference", "Activation", "Organisation", "Department", "Risk", "Captured", "Status"]}>
          {paginatedRows.map((item) => (
            <tr
              key={item.id}
              tabIndex={0}
              role="link"
              aria-label={`Open screening ${item.participantReference}`}
              onClick={() => router.push(`/practitioner/screenings/${item.id}`)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") router.push(`/practitioner/screenings/${item.id}`); }}
              className="cursor-pointer border-t border-card-border transition-colors hover:bg-[#f8fafc] focus:bg-[#f8fafc] focus:outline-none"
            >
              <Cell><strong className="text-primary">{item.participantReference}</strong></Cell>
              <Cell>{item.activationName ?? "Assignment capture"}</Cell>
              <Cell>{item.organisationName}</Cell>
              <Cell>{item.department ?? "Not set"}</Cell>
              <Cell><RiskBadge risk={item.result.riskLevel} /></Cell>
              <Cell>{formatDate(item.capturedAt)}</Cell>
              <Cell><StatusBadge status={item.status} tone={statusTone(item.status)} /></Cell>
            </tr>
          ))}
        </CompactTable>

        {!rows.length ? <Empty text={screenings.length ? "No screening records match the selected filters." : "No screening records have been captured yet."} /> : null}
        {rows.length ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-card-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">Showing {(activePage - 1) * recordsPerPage + 1}–{Math.min(activePage * recordsPerPage, rows.length)} of {rows.length}</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={activePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-card-border px-3 py-2 text-xs font-semibold text-navy disabled:opacity-40">Previous</button>
              <span className="px-2 text-xs font-semibold text-navy">Page {activePage} of {pageCount}</span>
              <button type="button" disabled={activePage === pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} className="rounded-lg border border-card-border px-3 py-2 text-xs font-semibold text-navy disabled:opacity-40">Next</button>
            </div>
          </div>
        ) : null}
      </section>

      {manualOpen ? <CaptureModal assignments={assignments} screenings={screenings} pending={pending} onClose={() => setManualOpen(false)} onSave={(form) => startTransition(async () => {
        const result = await captureScreening(form);
        setMessage(result.ok ? "Screening submitted for quality assurance." : errorText(result.error));
        if (result.ok) {
          setManualOpen(false);
          router.refresh();
        }
      })} /> : null}
    </div>
  );
}

function CompactTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs"><thead className="bg-[#f8fafc] text-muted"><tr>{headers.map((header) => <th key={header} className="px-3 py-2.5 font-semibold">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function Cell({ children }: { children: ReactNode }) {
  return <td className="px-3 py-3 text-navy">{children}</td>;
}

function RiskBadge({ risk }: { risk: string }) {
  return <StatusBadge status={risk} tone={risk === "High" ? "danger" : risk === "Medium" ? "warning" : "success"} />;
}

function Empty({ text }: { text: string }) {
  return <div className="border-t border-card-border px-4 py-10 text-center"><p className="text-sm font-medium text-navy">No screening records</p><p className="mt-1 text-xs text-muted">{text}</p></div>;
}

function normalizeImportRow(source: Record<string, unknown>): ImportRow {
  const normalized = Object.fromEntries(Object.entries(source).map(([key, value]) => [key.trim().toLowerCase().replace(/[\s-]+/g, "_"), value]));
  const text = (...keys: string[]) => {
    for (const key of keys) {
      const value = normalized[key];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return "";
  };
  const consentValue = text("consent_confirmed", "consent", "consentconfirmed").toLowerCase();
  return {
    employeeReference: text("employee_reference", "participant_reference", "reference", "employee_ref"),
    department: text("department"),
    systolicMmhg: text("systolic_mmhg", "systolic", "systolic_bp"),
    diastolicMmhg: text("diastolic_mmhg", "diastolic", "diastolic_bp"),
    glucoseMmolL: text("glucose_mmol_l", "glucose"),
    cholesterolMmolL: text("cholesterol_mmol_l", "cholesterol"),
    heightCm: text("height_cm", "height"),
    weightKg: text("weight_kg", "weight"),
    consentConfirmed: ["true", "yes", "1", "confirmed", "y"].includes(consentValue),
    practitionerNote: text("practitioner_note", "note", "notes"),
  };
}

function previewRisk(row: ImportRow) {
  const systolic = Number(row.systolicMmhg || 0);
  const diastolic = Number(row.diastolicMmhg || 0);
  const glucose = Number(row.glucoseMmolL || 0);
  const heightM = Number(row.heightCm || 0) / 100;
  const weight = Number(row.weightKg || 0);
  const bmi = heightM > 0 && weight > 0 ? weight / (heightM * heightM) : 0;
  if (systolic >= 160 || diastolic >= 100 || glucose >= 11.1 || bmi >= 35) return "High";
  if (systolic >= 140 || diastolic >= 90 || glucose >= 7 || bmi >= 30) return "Medium";
  return "Low";
}

function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "Approved") return "success";
  if (status === "Needs Correction") return "danger";
  if (status === "Submitted") return "warning";
  return "info";
}

function CaptureModal({ assignments, screenings, pending, onClose, onSave }: { assignments: ScreeningAssignmentOption[]; screenings: Screening[]; pending: boolean; onClose: () => void; onSave: (form: ScreeningCaptureForm) => void }) {
  const [form, setForm] = useState<ScreeningCaptureForm>({ assignmentId: "", participantReference: "", department: "", consentConfirmed: false, practitionerNote: "", systolicMmhg: "", diastolicMmhg: "", glucoseMmolL: "", cholesterolMmolL: "", heightCm: "", weightKg: "" });
  const [submitted, setSubmitted] = useState(false);

  const errors = validateCaptureForm(form, screenings);
  const errorCount = Object.keys(errors).length;
  const set = (key: keyof ScreeningCaptureForm, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const showError = (key: keyof CaptureErrors) => submitted ? errors[key] : undefined;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!errorCount) onSave(form);
  }

  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy/45 p-4">
    <form onSubmit={submit} noValidate className="my-6 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-navy">Capture screening</h2><button type="button" onClick={onClose} className="text-xs font-semibold text-muted">Close</button></div>

      {submitted && errorCount ? <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3"><p className="text-xs font-semibold text-danger">{errorCount === 1 ? "1 field needs attention." : `${errorCount} fields need attention.`}</p></div> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <ValidatedField label="Assignment" error={showError("assignmentId")}>
          <select className={fieldClass(Boolean(showError("assignmentId")))} value={form.assignmentId} onChange={(event) => set("assignmentId", event.target.value)} aria-invalid={Boolean(showError("assignmentId"))}>
            <option value="">Choose assignment</option>
            {assignments.map((item) => <option key={item.id} value={item.id}>{item.organisationName} · {item.activationName ?? item.serviceName}</option>)}
          </select>
        </ValidatedField>

        <ValidatedField label="Participant reference" error={showError("participantReference")}>
          <input className={fieldClass(Boolean(showError("participantReference")))} value={form.participantReference} onChange={(event) => set("participantReference", event.target.value)} aria-invalid={Boolean(showError("participantReference"))} />
        </ValidatedField>

        <ValidatedField label="Department" error={showError("department")}>
          <input className={fieldClass(Boolean(showError("department")))} value={form.department} onChange={(event) => set("department", event.target.value)} aria-invalid={Boolean(showError("department"))} />
        </ValidatedField>

        <div className="hidden sm:block" aria-hidden="true" />

        {showError("measurements") ? <p className="sm:col-span-2 text-xs font-medium text-danger">{showError("measurements")}</p> : null}

        <ValidatedField label="Systolic (mmHg)" error={showError("systolicMmhg")}>
          <input className={fieldClass(Boolean(showError("systolicMmhg")))} type="number" value={form.systolicMmhg} onChange={(event) => set("systolicMmhg", event.target.value)} aria-invalid={Boolean(showError("systolicMmhg"))} />
        </ValidatedField>

        <ValidatedField label="Diastolic (mmHg)" error={showError("diastolicMmhg")}>
          <input className={fieldClass(Boolean(showError("diastolicMmhg")))} type="number" value={form.diastolicMmhg} onChange={(event) => set("diastolicMmhg", event.target.value)} aria-invalid={Boolean(showError("diastolicMmhg"))} />
        </ValidatedField>

        <ValidatedField label="Glucose (mmol/L)" error={showError("glucoseMmolL")}>
          <input className={fieldClass(Boolean(showError("glucoseMmolL")))} type="number" step="0.01" value={form.glucoseMmolL} onChange={(event) => set("glucoseMmolL", event.target.value)} aria-invalid={Boolean(showError("glucoseMmolL"))} />
        </ValidatedField>

        <ValidatedField label="Cholesterol (mmol/L)" error={showError("cholesterolMmolL")}>
          <input className={fieldClass(Boolean(showError("cholesterolMmolL")))} type="number" step="0.01" value={form.cholesterolMmolL} onChange={(event) => set("cholesterolMmolL", event.target.value)} aria-invalid={Boolean(showError("cholesterolMmolL"))} />
        </ValidatedField>

        <ValidatedField label="Height (cm)" error={showError("heightCm")}>
          <input className={fieldClass(Boolean(showError("heightCm")))} type="number" value={form.heightCm} onChange={(event) => set("heightCm", event.target.value)} aria-invalid={Boolean(showError("heightCm"))} />
        </ValidatedField>

        <ValidatedField label="Weight (kg)" error={showError("weightKg")}>
          <input className={fieldClass(Boolean(showError("weightKg")))} type="number" value={form.weightKg} onChange={(event) => set("weightKg", event.target.value)} aria-invalid={Boolean(showError("weightKg"))} />
        </ValidatedField>

        <Field label="Practitioner note"><input className={inputClass} value={form.practitionerNote} onChange={(event) => set("practitionerNote", event.target.value)} /></Field>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-3 text-sm font-semibold text-navy"><input type="checkbox" checked={form.consentConfirmed} onChange={(event) => set("consentConfirmed", event.target.checked)} aria-invalid={Boolean(showError("consentConfirmed"))} />Participant consent has been confirmed</label>
          {showError("consentConfirmed") ? <p className="mt-2 text-xs font-medium text-danger">{showError("consentConfirmed")}</p> : null}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-card-border px-4 py-2 text-xs font-semibold text-navy">Cancel</button><button disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{pending ? "Saving…" : "Save"}</button></div>
    </form>
  </div>;
}

function validateCaptureForm(form: ScreeningCaptureForm, screenings: Screening[]): CaptureErrors {
  const errors: CaptureErrors = {};
  const reference = form.participantReference.trim().toLowerCase();

  if (!form.assignmentId) errors.assignmentId = "Select an assignment before capturing this screening.";
  if (!reference) {
    errors.participantReference = "Participant reference is required.";
  } else if (form.assignmentId && screenings.some((item) => item.assignmentId === form.assignmentId && item.participantReference.trim().toLowerCase() === reference)) {
    errors.participantReference = "This participant reference already has a screening for this assignment.";
  }
  if (!form.department.trim()) errors.department = "Select or enter the employee's department.";
  if (!form.consentConfirmed) errors.consentConfirmed = "Confirm participant consent before submitting.";

  const hasMeasurement = [form.systolicMmhg, form.diastolicMmhg, form.glucoseMmolL, form.cholesterolMmolL, form.heightCm, form.weightKg].some((value) => value.trim());
  if (!hasMeasurement) errors.measurements = "Record at least one screening measurement.";

  if (Boolean(form.systolicMmhg.trim()) !== Boolean(form.diastolicMmhg.trim())) {
    if (!form.systolicMmhg.trim()) errors.systolicMmhg = "Enter both systolic and diastolic blood pressure.";
    if (!form.diastolicMmhg.trim()) errors.diastolicMmhg = "Enter both systolic and diastolic blood pressure.";
  }

  if (form.systolicMmhg.trim() && !withinRange(form.systolicMmhg, 40, 300)) errors.systolicMmhg = "Enter a valid blood pressure measurement.";
  if (form.diastolicMmhg.trim() && !withinRange(form.diastolicMmhg, 20, 200)) errors.diastolicMmhg = "Enter a valid blood pressure measurement.";
  if (form.glucoseMmolL.trim() && !withinRange(form.glucoseMmolL, 0.5, 50)) errors.glucoseMmolL = "Enter a valid glucose measurement in mmol/L.";
  if (form.cholesterolMmolL.trim() && !withinRange(form.cholesterolMmolL, 0.5, 30)) errors.cholesterolMmolL = "Enter a valid cholesterol measurement in mmol/L.";

  if (Boolean(form.heightCm.trim()) !== Boolean(form.weightKg.trim())) {
    if (!form.heightCm.trim()) errors.heightCm = "Enter both height and weight to calculate BMI.";
    if (!form.weightKg.trim()) errors.weightKg = "Enter both height and weight to calculate BMI.";
  }

  if (form.heightCm.trim() && !withinRange(form.heightCm, 50, 260)) errors.heightCm = "Enter a valid height/weight measurement.";
  if (form.weightKg.trim() && !withinRange(form.weightKg, 2, 500)) errors.weightKg = "Enter a valid height/weight measurement.";

  return errors;
}

function withinRange(value: string, min: number, max: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max;
}

function ValidatedField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="space-y-2 text-xs font-semibold text-navy"><span>{label}</span>{children}{error ? <span className="block text-xs font-medium leading-4 text-danger">{error}</span> : null}</label>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-2 text-xs font-semibold text-navy"><span>{label}</span>{children}</label>;
}

function fieldClass(hasError: boolean) {
  return `${inputClass} ${hasError ? "border-danger focus:border-danger focus:ring-danger/10" : ""}`;
}

const inputClass = "h-11 w-full rounded-lg border border-card-border bg-white px-3 text-sm font-normal text-navy outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";
const formatDate = (value: string) => new Intl.DateTimeFormat("en-BW", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Gaborone" }).format(new Date(value));
const errorText = (error: string) => error === "INTERNAL_SERVER_ERROR" ? "The screening could not be saved. Check the assignment, measurements, and permissions." : error.replaceAll("_", " ");