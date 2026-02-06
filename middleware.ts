import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    // role is injected into JWT token in auth callbacks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (req as any).nextauth?.token?.role as string | undefined;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/creator") && role !== "CREATOR") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/buyer") && role !== "BUYER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/creator/:path*", "/buyer/:path*", "/dashboard"],
};
