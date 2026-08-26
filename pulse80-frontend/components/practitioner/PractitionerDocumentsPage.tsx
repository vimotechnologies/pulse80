"use client";

import { useEffect, useState } from "react";

import {
  uploadPractitionerDocument,
  type PractitionerProfile,
} from "@/app/actions/practitioner-profile";
import { CloudUpload, FileText } from "@/components/icons/IconsaxIcons";
import { ActionButton } from "@/components/portal/ActionButton";
import { DashboardWidget } from "@/components/portal/DashboardWidget";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

type Props = { initialProfile: PractitionerProfile };

const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;
const documentTypes = [
  "Professional licence",
  "Qualification certificate",
  "Identity document",
  "Verification evidence",
] as const;

type PreviewDocument = {
  fileName: string;
  downloadUrl: string;
};

export function PractitionerDocumentsPage({ initialProfile }: Props) {
  const [documents, setDocuments] = useState(initialProfile.documents);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({});
  const [documentErrors, setDocumentErrors] = useState<Record<string, string | null>>({});
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<PreviewDocument | null>(null);

  useEffect(() => {
    if (!previewDocument) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewDocument(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [previewDocument]);

  function showMessage(value: string) {
    setMessage(value);
    window.setTimeout(() => setMessage(null), 3200);
  }

  function selectDocument(documentType: string, file: File | null) {
    setUploadProgress(null);
    if (file && file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setDocumentFiles((current) => ({ ...current, [documentType]: null }));
      setDocumentErrors((current) => ({ ...current, [documentType]: "File exceeds the 2 MB size limit." }));
      return;
    }
    setDocumentFiles((current) => ({ ...current, [documentType]: file }));
    setDocumentErrors((current) => ({ ...current, [documentType]: null }));
  }

  async function readFile(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("File read failed"));
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function uploadDocuments() {
    const filesToUpload = documentTypes.filter((documentType) => documentFiles[documentType]);
    if (!filesToUpload.length) return showMessage("Choose at least one document to upload.");

    setUploading(true);
    setUploadProgress({ completed: 0, total: filesToUpload.length });
    let completed = 0;
    let failed = 0;

    for (const documentType of filesToUpload) {
      const file = documentFiles[documentType];
      if (!file) continue;
      const result = await uploadPractitionerDocument({
        documentType,
        expiryDate: null,
        file: { fileName: file.name, dataUrl: await readFile(file) },
      });
      if (!result.ok) {
        failed += 1;
        setDocumentErrors((current) => ({ ...current, [documentType]: result.error }));
        continue;
      }
      completed += 1;
      setUploadProgress({ completed, total: filesToUpload.length });
      setDocuments((current) => [result.document, ...current]);
      setDocumentFiles((current) => ({ ...current, [documentType]: null }));
    }

    setUploading(false);
    showMessage(failed ? `${completed} of ${filesToUpload.length} documents uploaded.` : "Document upload complete.");
  }

  return (
    <div className="space-y-5">
      <PortalPageHeader
        eyebrow="Health Practitioner"
        title="Documents"
        description="Track credentialing, identity, and compliance document readiness."
      />

      <DashboardWidget>
        <div className="flex items-center gap-2 border-b border-card-border px-5 py-4">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-navy">Documents & verification</h2>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            {documentTypes.map((documentType) => {
              const file = documentFiles[documentType];
              const error = documentErrors[documentType];
              const existingDocument = documents.find((document) => document.documentType === documentType);
              return (
                <div key={documentType} className={`rounded-lg border p-4 ${error ? "border-pulse-red bg-pulse-red/5" : "border-card-border bg-soft-bg"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-navy">{documentType}</p>
                      {existingDocument ? <p className="mt-1 truncate text-xs text-subtle" title={existingDocument.fileName}>Current: {existingDocument.fileName}</p> : null}
                    </div>
                    {existingDocument?.downloadUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDocument({ fileName: existingDocument.fileName, downloadUrl: existingDocument.downloadUrl! })}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Preview
                      </button>
                    ) : null}
                  </div>
                  <label
                    htmlFor={`practitioner-document-${documentType}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => { event.preventDefault(); selectDocument(documentType, event.dataTransfer.files[0] ?? null); }}
                    className={`mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white px-4 py-4 text-center text-sm text-subtle ${error ? "border-pulse-red" : "border-primary/40 hover:border-primary hover:bg-primary/5"}`}
                  >
                    <CloudUpload className={`mb-2 h-6 w-6 ${error ? "text-pulse-red" : "text-primary"}`} />
                    <span className="font-semibold text-navy">{file?.name ?? (existingDocument ? "Choose a replacement document" : "Drop a document here or choose a file")}</span>
                    <span className="mt-1 text-xs">PDF, PNG, or JPEG · Maximum 2 MB</span>
                  </label>
                  <input
                    id={`practitioner-document-${documentType}`}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    className="sr-only"
                    onChange={(event) => { selectDocument(documentType, event.target.files?.[0] ?? null); event.currentTarget.value = ""; }}
                  />
                  {error ? <p role="alert" className="mt-2 text-xs font-semibold text-pulse-red">{error}</p> : null}
                </div>
              );
            })}
          </div>

          {uploadProgress ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-navy">
                <span>Documents uploaded</span>
                <span>{uploadProgress.completed}/{uploadProgress.total}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-soft-bg">
                <div className="h-full rounded-full bg-success transition-all duration-300" style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }} />
              </div>
            </div>
          ) : null}

          <ActionButton loading={uploading} onClick={uploadDocuments} className="w-full sm:w-auto">Upload documents</ActionButton>
        </div>
      </DashboardWidget>

      {message ? <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-card-border bg-white px-4 py-3 text-sm font-semibold text-navy shadow-xl">{message}</div> : null}
      {previewDocument ? <DocumentPreviewModal document={previewDocument} onClose={() => setPreviewDocument(null)} /> : null}
    </div>
  );
}

function DocumentPreviewModal({ document, onClose }: { document: PreviewDocument; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-preview-title"
        className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-card-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Document preview</p>
            <h2 id="document-preview-title" className="truncate text-base font-semibold text-navy">{document.fileName}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-card-border px-4 py-2 text-xs font-semibold text-navy hover:bg-soft-bg">
            Close
          </button>
        </header>
        <iframe
          src={document.downloadUrl}
          title={`Preview of ${document.fileName}`}
          className="min-h-0 flex-1 bg-soft-bg"
        />
      </section>
    </div>
  );
}
