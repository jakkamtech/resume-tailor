import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/login") || pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }

  // Allow tailor API only if authenticated
  if (pathname.startsWith("/api/")) {
    const authed = req.cookies.get("rt_auth")?.value === "1";
    if (!authed) return new NextResponse("Unauthorized", { status: 401 });
    return NextResponse.next();
  }

  // Protect all other pages
  const authed = req.cookies.get("rt_auth")?.value === "1";
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
