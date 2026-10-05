import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev mode memblokir aset/endpoints dev lintas-origin (default: localhost saja);
  // izinkan origin LAN supaya halaman dari IP lain ter-hydrate (klik/login hidup)
  allowedDevOrigins: ["10.202.10.15", "10.10.10.254"],
};

export default nextConfig;
