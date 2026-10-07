import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

// Next 16: proxy (ex-middleware). Auth.js `trustHost:true` sudah di authConfig.
// Di balik NAT Proxmox / Nginx: pastikan proxy forward
//   Host + X-Forwarded-Host + X-Forwarded-Proto (https saat publik via TLS)
// agar CSRF + cookie tidak mismatch. Contoh Nginx:
//   proxy_set_header Host $host;
//   proxy_set_header X-Forwarded-Host $host;
//   proxy_set_header X-Forwarded-Proto $scheme;
//   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
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
