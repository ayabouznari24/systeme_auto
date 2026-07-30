export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/api/emails/:path*", "/api/stats/:path*", "/api/accounts/:path*", "/api/notifications/:path*"],
};
