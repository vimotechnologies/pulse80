"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  deleteSession,
  destinationForRole,
  type DemoRole,
} from "@/lib/auth/session";

type DemoAccount = {
  password: string;
  role: DemoRole;
};

const demoAccounts: Record<string, DemoAccount> = {
  "admin@pulse80.com": { password: "admin123", role: "admin" },
  "client@pulse80.com": { password: "client123", role: "client" },
  "health@pulse80.com": { password: "health123", role: "practitioner" },
};

export type LoginResult =
  | { ok: true; destination: string }
  | { ok: false; error: string };

export async function loginAction(input: {
  email: string;
  password: string;
  remember: boolean;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const account = demoAccounts[email];

  if (!account || account.password !== input.password) {
    return { ok: false, error: "Enter a valid Pulse80 demo email and password." };
  }

  await createSession(email, account.role, input.remember);
  return { ok: true, destination: destinationForRole(account.role) };
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
