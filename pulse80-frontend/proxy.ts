import { type NextRequest, NextResponse } from "next/server";

import { refreshSupabaseSession } from "@/lib/supabase/proxy";

const protectedPrefixes = ["/admin", "/client", "/practitioner"];

export default async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await refreshSupabaseSession(request);
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
