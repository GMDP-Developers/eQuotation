import { NextResponse } from "next/server";
import { coordsFromMapsUrl } from "@/lib/geo";

// Resolve link pendek Google Maps → koordinat.
// Cukup baca URL final hasil redirect, tidak perlu body.
export async function GET(req: Request) {
  const input = new URL(req.url).searchParams.get("url") ?? "";
  let host: string;
  try {
    host = new URL(input).hostname;
  } catch {
    return NextResponse.json({ error: "URL tidak valid" }, { status: 400 });
  }
  // Anti-SSRF: hanya host Google ini yang diizinkan
  if (host !== "maps.app.goo.gl" && !host.endsWith(".google.com")) {
    return NextResponse.json({ error: "URL tidak diizinkan" }, { status: 400 });
  }

  try {
    const r = await fetch(input, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    const final = r.url;
    const coords = coordsFromMapsUrl(final);
    if (!coords) {
      return NextResponse.json(
        { error: "Koordinat tidak ditemukan di link tersebut" },
        { status: 404 }
      );
    }
    return NextResponse.json(coords);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil link" }, { status: 502 });
  }
}
