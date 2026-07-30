"use server";

import { redirect } from "next/navigation";
import { authenticateDemoAccount } from "@/lib/auth/demo-accounts";
import { createSession, deleteSession, destinationForRole } from "@/lib/auth/session";

export async function loginAction(input: {
  email: unknown;
  password: unknown;
  remember: unknown;
}) {
  const account = authenticateDemoAccount(input);
  if (!account) {
    return { ok: false as const, error: "Enter a valid Pulse80 demo email and password." };
  }

  await createSession(account.email, account.role, input.remember === true);
  return { ok: true as const, destination: destinationForRole(account.role) };
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
