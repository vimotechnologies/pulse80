import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type DemoRole = "admin" | "client" | "practitioner";

export type DemoSession = {
  email: string;
  role: DemoRole;
  expiresAt: number;
};

export const SESSION_COOKIE = "pulse80_demo_session";

const DEMO_SESSION_SECRET =
  process.env.SESSION_SECRET ?? "pulse80-demo-only-session-secret-change-before-production";

const roleDestinations: Record<DemoRole, string> = {
  admin: "/admin/dashboard",
  client: "/client/dashboard",
  practitioner: "/practitioner/dashboard",
};

function encode(value: string | Uint8Array) {
  const buffer = typeof value === "string" ? Buffer.from(value, "utf8") : Buffer.from(value);
  return buffer.toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(DEMO_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encode(new Uint8Array(signature));
}

export async function createSession(email: string, role: DemoRole, remember: boolean) {
  const duration = remember ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
  const expiresAt = Date.now() + duration;
  const payload = encode(JSON.stringify({ email, role, expiresAt } satisfies DemoSession));
  const token = `${payload}.${await sign(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function verifySessionToken(token?: string | null): Promise<DemoSession | null> {
  if (!token) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  const expectedSignature = await sign(payload);
  if (signature.length !== expectedSignature.length) return null;

  let mismatch = 0;
  for (let index = 0; index < signature.length; index += 1) {
    mismatch |= signature.charCodeAt(index) ^ expectedSignature.charCodeAt(index);
  }
  if (mismatch !== 0) return null;

  try {
    const session = JSON.parse(decode(payload)) as DemoSession;
    const validRole = session.role === "admin" || session.role === "client" || session.role === "practitioner";

    if (!session.email || !validRole || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function requireRole(role: DemoRole) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role !== role) redirect(roleDestinations[session.role]);

  return session;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function destinationForRole(role: DemoRole) {
  return roleDestinations[role];
}
