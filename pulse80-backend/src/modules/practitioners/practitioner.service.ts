import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "../../config/env.js";
import type { Database } from "../../generated/database.types.js";

type TypedSupabase = SupabaseClient<Database>;

export interface PractitionerProfileUpdate {
  fullName?: string;
  professionalEmail?: string;
  phone?: string | null;
  country?: string;
  city?: string | null;
  preferredContactMethod?: string;
  specialisation?: string | null;
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

const profileSelect = `
  user_id, professional_email, phone, country, city, preferred_contact_method,
  profession, specialisation, years_experience, qualifications,
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

  async getCapabilities(userId: string) {
    const { data, error } = await this.supabase
      .from("practitioner_capabilities")
      .select("id, service_code, service_name, approval_status")
      .eq("practitioner_user_id", userId)
      .order("service_name");
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
    if (input.city !== undefined) values.city = input.city;
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
