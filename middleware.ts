import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Hand-rolled instead of `export { default } from "next-auth/middleware"`:
// that convenience wrapper depends on an internal subpath export that isn't
// reliably resolvable across every Next.js/next-auth version combination.
// `next-auth/jwt` is the stable, documented low-level API.
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/emails/:path*",
    "/api/stats/:path*",
    "/api/accounts/:path*",
    "/api/notifications/:path*",
  ],
};
