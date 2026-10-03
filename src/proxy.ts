import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

// Next 16: konvensi file proxy (pengganti middleware.ts, yang deprecated)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuth = !!req.auth;

  if (pathname.startsWith("/admin") && !isAuth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }

  if (pathname === "/login" && isAuth) {
    return NextResponse.redirect(
      new URL("/admin/dashboard", req.nextUrl.origin)
    );
  }

  return NextResponse.next();
});

export const config = {
  // Jangan match asset statis
  matcher: ["/admin/:path*", "/login"],
};
