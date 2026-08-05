import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type DemoRole = "admin" | "client" | "practitioner";
type DemoSession = { email: string; role: DemoRole; expiresAt: number };

export const SESSION_COOKIE = "pulse80_demo_session";
const sessionSecret = process.env.SESSION_SECRET ?? "pulse80-demo-only-change-before-production";
const destinations: Record<DemoRole, string> = {
  admin: "/admin/dashboard",
  client: "/client/dashboard",
  practitioner: "/practitioner/dashboard",
};

function encode(value: string | Uint8Array) {
  return Buffer.from(value).toString("base64url");
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return encode(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

export async function createSession(email: string, role: DemoRole, remember: boolean) {
  const expiresAt = Date.now() + (remember ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000);
  const payload = encode(JSON.stringify({ email, role, expiresAt } satisfies DemoSession));
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${payload}.${await sign(payload)}`, {
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
  if (!payload || !signature || extra || (await sign(payload)) !== signature) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as DemoSession;
    if (!session.email || !destinations[session.role] || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function requireRole(role: DemoRole) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login");
  if (session.role !== role) redirect(destinations[session.role]);
  return session;
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export function destinationForRole(role: DemoRole) {
  return destinations[role];
}
