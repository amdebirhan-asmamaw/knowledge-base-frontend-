import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    // Admin area: must be authenticated
    if (pathname.startsWith("/admin")) {
      if (!token) {
        return NextResponse.redirect(new URL("/auth/login?from=" + encodeURIComponent(pathname), req.url));
      }
    }

    // Protected knowledge base: must be authenticated (any role)
    // Covers /, /documents/*, /faq, /ask-ai
    const isProtectedPublic =
      pathname === "/" ||
      pathname.startsWith("/documents") ||
      pathname.startsWith("/faq") ||
      pathname.startsWith("/ask-ai");

    if (isProtectedPublic && !token) {
      return NextResponse.redirect(new URL("/auth/login?from=" + encodeURIComponent(pathname), req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/auth/login" },
    callbacks: {
      // Let the middleware function above do all the logic.
      // Return true always so withAuth doesn't short-circuit to login on its own.
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/",
    "/documents/:path*",
    "/faq",
    "/ask-ai",
    "/ask-ai/:path*",
  ],
};
