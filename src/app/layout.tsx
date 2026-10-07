import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getBrand } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const setting = await getBrand();
    const brandName = setting?.brandName ?? "eQuotation";
    return {
      title: {
        default: `${brandName} — Permintaan Layanan`,
        template: `%s · ${brandName}`,
      },
      description:
        "Formulir permintaan layanan jaringan interaktif: ULO, Tier One, Intermix, dan Supermix.",
    };
  } catch {
    return {
      title: {
        default: `eQuotation — Permintaan Layanan`,
        template: `%s · eQuotation`,
      },
      description:
        "Formulir permintaan layanan jaringan interaktif: ULO, Tier One, Intermix, dan Supermix.",
    };
  }
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
