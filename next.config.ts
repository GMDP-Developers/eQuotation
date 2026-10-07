import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kosong = zero-config. Auth.js pakai trustHost:true (auth.config.ts) jadi
  // otomatis ikut Host publik via NAT Proxmox — tidak perlu set NEXTAUTH_URL.
  // Dev LAN: bila `next dev` diblokir dari IP lain, set ALLOWED_DEV_ORIGINS="10.x.x.x,IP_PUBLIK"
  ...(process.env.ALLOWED_DEV_ORIGINS
    ? { allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean) }
    : {}),
};

export default nextConfig;
