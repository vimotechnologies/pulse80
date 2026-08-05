import "server-only";

import type { DemoRole } from "@/lib/auth/session";

type DemoAccount = {
  password: string;
  role: DemoRole;
};

const demoAccounts: Readonly<Record<string, DemoAccount>> = Object.freeze({
  "admin@pulse80.com": Object.freeze({ password: "admin123", role: "admin" }),
  "client@pulse80.com": Object.freeze({ password: "client123", role: "client" }),
  "health@pulse80.com": Object.freeze({ password: "health123", role: "practitioner" }),
});

export function authenticateDemoAccount(input: {
  email: unknown;
  password: unknown;
}): { email: string; role: DemoRole } | null {
  if (typeof input.email !== "string" || typeof input.password !== "string") {
    return null;
  }

  const email = input.email.trim().toLowerCase();
  if (!email || email.length > 254 || input.password.length > 128) {
    return null;
  }

  const account = demoAccounts[email];
  if (!account || account.password !== input.password) {
    return null;
  }

  return { email, role: account.role };
}
