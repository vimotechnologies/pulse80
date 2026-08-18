"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type {
  Organization,
  OrganizationForm,
} from "@/components/admin/AdminOrganizations";
import { graphqlRequest } from "@/lib/graphql/client";

const organisationFields = /* GraphQL */ `
  id name slug code logoUrl industry country primaryLocation region employees
  package contractStart contractEnd wellnessRiskScore wellnessRisk status
  customPackageNotes createdAt updatedAt
  contacts { id name roleLabel email phone method primary notes }
`;

const listQuery = /* GraphQL */ `query AdminOrganisations {
  adminOrganisations { ${organisationFields} }
}`;
const detailQuery = /* GraphQL */ `query AdminOrganisation($id: ID!) {
  adminOrganisation(id: $id) { ${organisationFields} }
}`;
const createMutation = /* GraphQL */ `mutation CreateOrganisation($input: CreateOrganisationInput!) {
  createOrganisation(input: $input) { ${organisationFields} }
}`;
const updateMutation = /* GraphQL */ `mutation UpdateAdminOrganisation($id: ID!, $input: UpdateOrganisationInput!) {
  updateAdminOrganisation(id: $id, input: $input) { ${organisationFields} }
}`;

const idSchema = z.uuid();

function withUiDefaults(organisation: Omit<Organization, "branches" | "clientUsers" | "activations" | "reports" | "insights" | "recommendations" | "lastActivation" | "nextActivation" | "reportsPublished">): Organization {
  return {
    ...organisation,
    logo: organisation.logoUrl ?? undefined,
    risk: organisation.wellnessRisk,
    branches: [],
    clientUsers: [],
    activations: [],
    reports: [],
    insights: [],
    recommendations: [],
    lastActivation: "Not available",
    nextActivation: "Not scheduled",
    reportsPublished: 0,
  };
}

function inputFromForm(form: OrganizationForm) {
  const contactRole = (prefix: "contact1" | "contact2") =>
    form[`${prefix}Role`] === "Other"
      ? form[`${prefix}CustomRole`] || "Other"
      : form[`${prefix}Role`];
  return {
    name: form.name,
    industry: form.industry,
    country: form.country,
    primaryLocation: form.town,
    region: form.region,
    employees: Number(form.employees),
    package: form.package,
    contractStart: form.contractStart,
    contractEnd: form.contractEnd,
    status: form.status,
    customPackageNotes: form.customPackageNotes || null,
    logoDataUrl: form.logo ?? null,
    contacts: [
      {
        name: form.contact1Name,
        roleLabel: contactRole("contact1"),
        email: form.contact1Email,
        phone: form.contact1Phone || null,
        method: form.contact1Method,
        primary: true,
        notes: "Primary organisation contact.",
      },
      {
        name: form.contact2Name,
        roleLabel: contactRole("contact2"),
        email: form.contact2Email,
        phone: form.contact2Phone || null,
        method: form.contact2Method,
        primary: false,
        notes: "Secondary organisation contact.",
      },
    ],
  };
}

export async function loadAdminOrganisations(): Promise<Organization[]> {
  const result = await graphqlRequest<{ adminOrganisations: Organization[] }>(listQuery);
  return result.adminOrganisations.map(withUiDefaults);
}

export async function loadAdminOrganisation(id: string): Promise<Organization | null> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return null;
  try {
    const result = await graphqlRequest<{ adminOrganisation: Organization }>(detailQuery, {
      variables: { id: parsed.data },
    });
    return withUiDefaults(result.adminOrganisation);
  } catch {
    return null;
  }
}

export async function createAdminOrganisation(form: OrganizationForm) {
  try {
    const result = await graphqlRequest<{ createOrganisation: Organization }>(createMutation, {
      variables: { input: inputFromForm(form) },
    });
    revalidatePath("/admin/organizations");
    return { ok: true as const, organisation: withUiDefaults(result.createOrganisation) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "CREATE_FAILED" };
  }
}

export async function updateAdminOrganisation(id: string, organisation: Organization, logoDataUrl?: string, removeLogo = false) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false as const, error: "Invalid organisation." };
  try {
    const input = {
      name: organisation.name,
      industry: organisation.industry,
      country: organisation.country,
      primaryLocation: organisation.primaryLocation,
      region: organisation.region,
      employees: organisation.employees,
      package: organisation.package,
      contractStart: organisation.contractStart,
      contractEnd: organisation.contractEnd,
      status: organisation.status,
      customPackageNotes: organisation.customPackageNotes ?? null,
      ...(logoDataUrl ? { logoDataUrl } : {}),
      ...(removeLogo ? { removeLogo: true } : {}),
      contacts: organisation.contacts.map((contact) => ({
        ...(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(contact.id) ? { id: contact.id } : {}),
        name: contact.name,
        roleLabel: contact.roleLabel,
        email: contact.email,
        phone: contact.phone || null,
        method: contact.method,
        primary: contact.primary,
        notes: contact.notes || null,
      })),
    };
    const result = await graphqlRequest<{ updateAdminOrganisation: Organization }>(updateMutation, {
      variables: { id: parsed.data, input },
    });
    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${parsed.data}`);
    return { ok: true as const, organisation: withUiDefaults(result.updateAdminOrganisation) };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "UPDATE_FAILED" };
  }
}
