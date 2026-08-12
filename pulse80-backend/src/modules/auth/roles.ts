export const organisationRoles = [
  "owner",
  "client_admin",
  "hr",
  "occupational_health",
  "executive",
  "practitioner",
] as const;

export type OrganisationRole = (typeof organisationRoles)[number];

export function isOrganisationRole(value: string): value is OrganisationRole {
  return (organisationRoles as readonly string[]).includes(value);
}

export const platformRoles = [
  "super_admin",
  "operations",
  "business_development",
  "finance",
  "wellness_coordinator",
] as const;

export type PlatformRole = (typeof platformRoles)[number];

export function isPlatformRole(value: string): value is PlatformRole {
  return (platformRoles as readonly string[]).includes(value);
}

export const permissions = [
  "organisation:read",
  "organisation:update",

  "members:manage",

  "programme:read",
  "programme:manage",

  "provider:manage",

  "screening:capture",
  "screening:read_aggregate",

  "referral:read",
  "referral:manage",

  "analytics:read",

  "reports:read",

  "billing:read",
] as const;

export type Permission = (typeof permissions)[number];

export const organisationRolePermissions: Record<
  OrganisationRole,
  readonly Permission[]
> = {
  owner: [
    "organisation:read",
    "organisation:update",
    "members:manage",
    "programme:read",
    "programme:manage",
    "provider:manage",
    "screening:read_aggregate",
    "referral:read",
    "referral:manage",
    "analytics:read",
    "reports:read",
    "billing:read",
  ],

  client_admin: [
    "organisation:read",
    "organisation:update",
    "members:manage",
    "programme:read",
    "programme:manage",
    "provider:manage",
    "screening:read_aggregate",
    "referral:read",
    "analytics:read",
    "reports:read",
  ],

  hr: [
    "organisation:read",
    "programme:read",
    "programme:manage",
    "analytics:read",
    "reports:read",
  ],

  occupational_health: [
    "organisation:read",
    "programme:read",
    "screening:read_aggregate",
    "referral:read",
    "referral:manage",
    "analytics:read",
    "reports:read",
  ],

  executive: [
    "organisation:read",
    "analytics:read",
    "reports:read",
  ],

  practitioner: [
    "organisation:read",
    "programme:read",
    "screening:capture",
  ],
};

export const platformRolePermissions: Record<
  PlatformRole,
  readonly Permission[]
> = {
  super_admin: permissions,

  operations: [
    "organisation:read",
    "organisation:update",
    "members:manage",
    "programme:read",
    "programme:manage",
    "provider:manage",
    "analytics:read",
    "reports:read",
  ],

  business_development: [
    "organisation:read",
    "programme:read",
  ],

  finance: [
    "organisation:read",
    "billing:read",
  ],

  wellness_coordinator: [
    "organisation:read",
    "programme:read",
    "programme:manage",
    "provider:manage",
    "analytics:read",
    "reports:read",
  ],
};

export function getOrganisationPermissions(
  role: OrganisationRole | null,
): readonly Permission[] {
  if (!role) {
    return [];
  }

  return organisationRolePermissions[role];
}

export function getPlatformPermissions(
  role: PlatformRole | null,
): readonly Permission[] {
  if (!role) {
    return [];
  }

  return platformRolePermissions[role];
}

export function calculatePermissions(
  organisationRole: OrganisationRole | null,
  platformRole: PlatformRole | null,
): Permission[] {
  const combined = new Set<Permission>([
    ...getOrganisationPermissions(organisationRole),
    ...getPlatformPermissions(platformRole),
  ]);

  return [...combined];
}
