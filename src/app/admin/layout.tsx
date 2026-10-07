import { redirect } from "next/navigation";
import Link from "next/link";
import { Inbox, Layers, Settings, ShieldCheck, Table2, UserCog } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { getBrand } from "@/lib/brand";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const setting = await getBrand();
  const brandName = setting?.brandName ?? "eQuotation";
  const brandSubtitle = setting?.brandSubtitle ?? "Service Request";
  const brandLogo = setting?.brandLogo ?? null;

  const name = session.user.name ?? session.user.email ?? "Admin";

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2.5 border-b px-5 py-5">
          <BrandLogo src={brandLogo} className="h-9 w-auto max-w-32 object-contain">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Inbox className="size-4" />
            </span>
          </BrandLogo>
          <div>
            <p className="text-sm font-bold leading-tight">{brandName}</p>
            <p className="text-[11px] text-muted-foreground">{brandSubtitle}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 rounded-lg bg-primary/12 px-3 py-2 text-sm font-medium text-primary shadow-xs"
          >
            <Inbox className="size-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/spreadsheet"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Table2 className="size-4" />
            Spreadsheet
          </Link>
          <Link
            href="/admin/services"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Layers className="size-4" />
            Layanan
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
            Pengaturan
          </Link>
          <Link
            href="/admin/account"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <UserCog className="size-4" />
            Akun
          </Link>
        </nav>
        <div className="mt-auto space-y-3 border-t p-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-[11px] text-muted-foreground">Administrator</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/85 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <h1 className="text-sm font-semibold">{brandName} Admin</h1>
            <p className="text-xs text-muted-foreground">Kelola permintaan layanan yang masuk</p>
          </div>
          <SignOutButton />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
