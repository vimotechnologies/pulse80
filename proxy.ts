import { NextRequest, NextResponse } from "next/server";
import {
  destinationForRole,
  SESSION_COOKIE,
  verifySessionToken,
  type DemoRole,
} from "@/lib/auth/session";

const protectedPrefixes: Array<{ prefix: string; role: DemoRole }> = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/client", role: "client" },
  { prefix: "/practitioner", role: "practitioner" },
];

export default async function proxy(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const pathname = request.nextUrl.pathname;

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL(destinationForRole(session.role), request.url));
  }

  const protectedRoute = protectedPrefixes.find(({ prefix }) => pathname.startsWith(prefix));
  if (!protectedRoute) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.role !== protectedRoute.role) {
    return NextResponse.redirect(new URL(destinationForRole(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/client/:path*", "/practitioner/:path*"],
};
