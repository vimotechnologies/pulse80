import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "../../config/env.js";
import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

export interface PractitionerProfileUpdate {
  fullName?: string;
  professionalEmail?: string;
  phone?: string | null;
  country?: string;
  profession?: string;
  registrationNumber?: string | null;
  registrationAuthority?: string | null;
  registrationCountry?: string | null;
  registrationExpiryDate?: string | null;
  city?: string | null;
  districtProvince?: string | null;
  clinicHospital?: string | null;
  preferredContactMethod?: string;
  specialisation?: string | null;
  specialisations?: string[];
  selectedServiceCodes?: string[];
  yearsExperience?: number;
  qualifications?: string[];
  assignmentNotifications?: boolean;
  documentNotifications?: boolean;
  paymentNotifications?: boolean;
}

export interface EncodedFile {
  fileName: string;
  dataUrl: string;
}

export interface PractitionerVerificationUpdate {
  verificationStatus: "Verified" | "Under Review" | "Action Required" | "Expired";
  practitionerStatus: "Active" | "Pending Verification" | "Suspended";
}

export type PractitionerDocumentVerificationStatus =
  | "Verified"
  | "Under Review"
  | "Expired"
  | "Action Required";

export interface PractitionerAssignmentInput {
  practitionerUserId: string;
  organisationId: string;
  programmeName: string;
  activityName: string;
  serviceName: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  status: "Scheduled" | "Confirmed" | "In Progress" | "Completed" | "Cancelled" | "Action Required";
}

const profileSelect = `
  user_id, professional_email, phone, country, city, preferred_contact_method,
  profession, specialisation, years_experience, qualifications, district_province, clinic_hospital,
  registration_number, registration_authority, registration_country,
  registration_expiry_date, verification_status, practitioner_status,
  profile_photo_path, assignment_notifications, document_notifications,
  payment_notifications, created_at, updated_at
`;

function decodeFile(dataUrl: string, allowedTypes: readonly string[], maxBytes: number) {
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match || !allowedTypes.includes(match[1]!)) throw new Error("Unsupported file format.");
  const bytes = Buffer.from(match[2]!, "base64");
  if (!bytes.length || bytes.length > maxBytes) throw new Error(`File must be smaller than ${Math.floor(maxBytes / 1048576)} MB.`);
  return { bytes, contentType: match[1]! };
}

function safeFileName(value: string) {
  const clean = value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return clean.slice(0, 120) || "document";
}

export class PractitionerService {
  constructor(private readonly supabase: TypedSupabase) {}

  async getProfile(userId: string) {
    const [{ data: profile, error: profileError }, { data: identity, error: identityError }] = await Promise.all([
      this.supabase.from("practitioner_profiles").select(profileSelect).eq("user_id", userId).single(),
      this.supabase.from("profiles").select("full_name").eq("id", userId).single(),
    ]);
    if (profileError) throw new Error(profileError.message);
    if (identityError) throw new Error(identityError.message);
    return { ...profile, full_name: identity.full_name };
  }

  async listForAdmin() {
    const { data, error } = await this.supabase
      .from("practitioner_profiles")
      .select(`
        ${profileSelect},
        profiles (full_name),
        practitioner_capabilities (id, service_code, service_name, approval_status),
        practitioner_assignments (id, status),
        practitioner_documents (
          id, document_type, file_name, storage_path, expiry_date,
          verification_status, uploaded_at, reviewed_at
        )
      `)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async updateVerification(userId: string, input: PractitionerVerificationUpdate) {
    if (input.verificationStatus === "Verified") {
      const practitioner = await this.getAdminProfile(userId);
      const documents = practitioner.practitioner_documents ?? [];
      const registrationIsCurrent = practitioner.registration_expiry_date
        ? practitioner.registration_expiry_date >= new Date().toISOString().slice(0, 10)
        : false;

      if (
        !practitioner.registration_number ||
        !practitioner.registration_authority ||
        !registrationIsCurrent ||
        !documents.length ||
        documents.some((document) => document.verification_status !== "Verified")
      ) {
        throw new Error(
          "Current registration details and verified supporting documents are required.",
        );
      }
    }

    const { error } = await this.supabase
      .from("practitioner_profiles")
      .update({
        verification_status: input.verificationStatus,
        practitioner_status: input.practitionerStatus,
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return this.getAdminProfile(userId);
  }

  async reviewDocument(documentId: string, status: PractitionerDocumentVerificationStatus) {
    const { data, error } = await this.supabase
      .from("practitioner_documents")
      .update({ verification_status: status, reviewed_at: new Date().toISOString() })
      .eq("id", documentId)
      .select("practitioner_user_id")
      .single();
    if (error) throw new Error(error.message);

    if (status === "Action Required" || status === "Expired") {
      const { error: profileError } = await this.supabase
        .from("practitioner_profiles")
        .update({
          verification_status: "Action Required",
          practitioner_status: "Pending Verification",
        })
        .eq("user_id", data.practitioner_user_id);
      if (profileError) throw new Error(profileError.message);
    }

    return this.getAdminProfile(data.practitioner_user_id);
  }

  private async getAdminProfile(userId: string) {
    const practitioners = await this.listForAdmin();
    const practitioner = practitioners.find((item) => item.user_id === userId);
    if (!practitioner) throw new Error("Practitioner not found.");
    return practitioner;
  }

  async getCapabilities(userId: string) {
    const { data, error } = await this.supabase
      .from("practitioner_capabilities")
      .select("id, service_code, service_name, approval_status")
      .eq("practitioner_user_id", userId)
      .order("service_name");
    if (error) throw new Error(error.message);
    return data;
  }

  async getSpecialisations(userId: string) {
    const { data, error } = await this.supabase.from("practitioner_specialisations")
      .select("id, name, sort_order").eq("practitioner_user_id", userId).order("sort_order").order("name");
    if (error) throw new Error(error.message);
    return data;
  }

  async getAssignments(userId: string, limit = 5) {
    const { data, error } = await this.supabase
      .from("practitioner_assignments")
      .select("id, organisation_id, programme_name, activity_name, service_name, location, starts_at, ends_at, status, organisations(name)")
      .eq("practitioner_user_id", userId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(limit);
    if (error) throw new Error(error.message);
    return data;
  }

  async listAssignmentsForAdmin() {
    const { data, error } = await this.supabase
      .from("practitioner_assignments")
      .select(`
        id, practitioner_user_id, organisation_id, programme_name,
        activity_name, service_name, location, starts_at, ends_at,
        status, created_at, updated_at,
        organisations (name),
        practitioner_profiles (profession, profiles (full_name))
      `)
      .order("starts_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async createAssignment(input: PractitionerAssignmentInput) {
    await this.validateAssignment(input);
    const { data, error } = await this.supabase
      .from("practitioner_assignments")
      .insert({
        practitioner_user_id: input.practitionerUserId,
        organisation_id: input.organisationId,
        programme_name: input.programmeName,
        activity_name: input.activityName,
        service_name: input.serviceName,
        location: input.location,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        status: input.status,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return this.getAssignmentForAdmin(data.id);
  }

  async updateAssignment(assignmentId: string, input: PractitionerAssignmentInput) {
    await this.validateAssignment(input, assignmentId);
    const { error } = await this.supabase
      .from("practitioner_assignments")
      .update({
        practitioner_user_id: input.practitionerUserId,
        organisation_id: input.organisationId,
        programme_name: input.programmeName,
        activity_name: input.activityName,
        service_name: input.serviceName,
        location: input.location,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        status: input.status,
      })
      .eq("id", assignmentId);
    if (error) throw new Error(error.message);
    return this.getAssignmentForAdmin(assignmentId);
  }

  private async validateAssignment(input: PractitionerAssignmentInput, assignmentId?: string) {
    const [{ data: practitioner, error: practitionerError }, { data: capability, error: capabilityError }] =
      await Promise.all([
        this.supabase
          .from("practitioner_profiles")
          .select("user_id, verification_status, practitioner_status")
          .eq("user_id", input.practitionerUserId)
          .single(),
        this.supabase
          .from("practitioner_capabilities")
          .select("id")
          .eq("practitioner_user_id", input.practitionerUserId)
          .eq("service_name", input.serviceName)
          .eq("approval_status", "Approved")
          .maybeSingle(),
      ]);
    if (practitionerError) throw new Error(practitionerError.message);
    if (capabilityError) throw new Error(capabilityError.message);
    if (practitioner.verification_status !== "Verified" || practitioner.practitioner_status !== "Active") {
      throw new Error("Only active, verified practitioners can be assigned.");
    }
    if (!capability) throw new Error("The practitioner is not approved for this service.");

    let conflictQuery = this.supabase
      .from("practitioner_assignments")
      .select("id")
      .eq("practitioner_user_id", input.practitionerUserId)
      .neq("status", "Cancelled")
      .lt("starts_at", input.endsAt ?? input.startsAt)
      .or(`ends_at.is.null,ends_at.gt.${input.startsAt}`);
    if (assignmentId) conflictQuery = conflictQuery.neq("id", assignmentId);
    const { data: conflicts, error: conflictError } = await conflictQuery.limit(1);
    if (conflictError) throw new Error(conflictError.message);
    if (conflicts.length) throw new Error("The practitioner already has an overlapping assignment.");
  }

  private async getAssignmentForAdmin(assignmentId: string) {
    const assignments = await this.listAssignmentsForAdmin();
    const assignment = assignments.find((item) => item.id === assignmentId);
    if (!assignment) throw new Error("Assignment not found.");
    return assignment;
  }

  async getDocuments(userId: string) {
    const { data, error } = await this.supabase
      .from("practitioner_documents")
      .select("id, document_type, file_name, storage_path, expiry_date, verification_status, uploaded_at")
      .eq("practitioner_user_id", userId)
      .order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return Promise.all(data.map(async (document) => {
      const { data: signed } = await this.supabase.storage
        .from("practitioner-verification-documents")
        .createSignedUrl(document.storage_path, 900);
      return { ...document, download_url: signed?.signedUrl ?? null };
    }));
  }

  async updateProfile(userId: string, input: PractitionerProfileUpdate) {
    if (input.fullName !== undefined) {
      const { error } = await this.supabase.from("profiles").update({ full_name: input.fullName }).eq("id", userId);
      if (error) throw new Error(error.message);
    }
    const values: Database["public"]["Tables"]["practitioner_profiles"]["Update"] = {};
    if (input.professionalEmail !== undefined) values.professional_email = input.professionalEmail;
    if (input.phone !== undefined) values.phone = input.phone;
    if (input.country !== undefined) values.country = input.country;
    if (input.profession !== undefined) values.profession = input.profession;
    if (input.registrationNumber !== undefined) values.registration_number = input.registrationNumber;
    if (input.registrationAuthority !== undefined) values.registration_authority = input.registrationAuthority;
    if (input.registrationCountry !== undefined) values.registration_country = input.registrationCountry;
    if (input.registrationExpiryDate !== undefined) values.registration_expiry_date = input.registrationExpiryDate;
    if (input.city !== undefined) values.city = input.city;
    if (input.districtProvince !== undefined) values.district_province = input.districtProvince;
    if (input.clinicHospital !== undefined) values.clinic_hospital = input.clinicHospital;
    if (input.preferredContactMethod !== undefined) values.preferred_contact_method = input.preferredContactMethod;
    if (input.specialisation !== undefined) values.specialisation = input.specialisation;
    if (input.yearsExperience !== undefined) values.years_experience = input.yearsExperience;
    if (input.qualifications !== undefined) values.qualifications = input.qualifications;
    if (input.assignmentNotifications !== undefined) values.assignment_notifications = input.assignmentNotifications;
    if (input.documentNotifications !== undefined) values.document_notifications = input.documentNotifications;
    if (input.paymentNotifications !== undefined) values.payment_notifications = input.paymentNotifications;
    if (Object.keys(values).length) {
      const { error } = await this.supabase.from("practitioner_profiles").update(values).eq("user_id", userId);
      if (error) throw new Error(error.message);
    }
    if (input.specialisations !== undefined) {
      const { error: deleteError } = await this.supabase.from("practitioner_specialisations").delete().eq("practitioner_user_id", userId);
      if (deleteError) throw new Error(deleteError.message);
      if (input.specialisations.length) {
        const { error: insertError } = await this.supabase.from("practitioner_specialisations").insert(input.specialisations.map((name, index) => ({ practitioner_user_id: userId, name, sort_order: index })));
        if (insertError) throw new Error(insertError.message);
      }
    }
    if (input.selectedServiceCodes !== undefined) {
      const existing = await this.getCapabilities(userId);
      const { error: deleteError } = await this.supabase.from("practitioner_capabilities").delete().eq("practitioner_user_id", userId);
      if (deleteError) throw new Error(deleteError.message);
      const rows = input.selectedServiceCodes.map((code) => ({ practitioner_user_id: userId, service_code: code, service_name: code, approval_status: existing.find((item) => item.service_code === code)?.approval_status ?? "Pending" }));
      if (rows.length) { const { error: insertError } = await this.supabase.from("practitioner_capabilities").insert(rows); if (insertError) throw new Error(insertError.message); }
    }
    return this.getProfile(userId);
  }

  async uploadPhoto(userId: string, file: EncodedFile) {
    const decoded = decodeFile(file.dataUrl, ["image/png", "image/jpeg", "image/webp"], 2 * 1024 * 1024);
    const extension = decoded.contentType === "image/jpeg" ? "jpg" : decoded.contentType.split("/")[1]!;
    const path = `${userId}/profile.${extension}`;
    const { error: uploadError } = await this.supabase.storage
      .from("practitioner-profile-photos")
      .upload(path, decoded.bytes, { contentType: decoded.contentType, upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { error } = await this.supabase.from("practitioner_profiles").update({ profile_photo_path: path }).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return this.getProfile(userId);
  }

  async deletePhoto(userId: string) {
    const profile = await this.getProfile(userId);
    if (profile.profile_photo_path) {
      const { error: removeError } = await this.supabase.storage.from("practitioner-profile-photos").remove([profile.profile_photo_path]);
      if (removeError) throw new Error(removeError.message);
    }
    const { error } = await this.supabase.from("practitioner_profiles").update({ profile_photo_path: null }).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return this.getProfile(userId);
  }

  async uploadDocument(userId: string, documentType: string, expiryDate: string | null, file: EncodedFile) {
    const decoded = decodeFile(file.dataUrl, ["application/pdf", "image/png", "image/jpeg"], 5 * 1024 * 1024);
    const path = `${userId}/${crypto.randomUUID()}-${safeFileName(file.fileName)}`;
    const { error: uploadError } = await this.supabase.storage
      .from("practitioner-verification-documents")
      .upload(path, decoded.bytes, { contentType: decoded.contentType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data, error } = await this.supabase.from("practitioner_documents").insert({
      practitioner_user_id: userId,
      document_type: documentType,
      file_name: file.fileName,
      storage_path: path,
      expiry_date: expiryDate,
      verification_status: "Under Review",
    }).select("id, document_type, file_name, storage_path, expiry_date, verification_status, uploaded_at").single();
    if (error) {
      await this.supabase.storage.from("practitioner-verification-documents").remove([path]);
      throw new Error(error.message);
    }
    const { data: signed } = await this.supabase.storage.from("practitioner-verification-documents").createSignedUrl(path, 900);
    return { ...data, download_url: signed?.signedUrl ?? null };
  }

  photoUrl(path: string | null) {
    return path ? `${env.SUPABASE_URL}/storage/v1/object/public/practitioner-profile-photos/${path}` : null;
  }
}
