import { redirect } from "next/navigation";
import Link from "next/link";
import { Inbox, ShieldCheck } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const name = session.user.name ?? session.user.email ?? "Admin";

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex items-center gap-2.5 border-b px-5 py-5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Inbox className="size-4" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">eQuotation</p>
            <p className="text-[11px] text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <nav className="p-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 rounded-lg bg-primary/12 px-3 py-2 text-sm font-medium text-primary shadow-xs"
          >
            <Inbox className="size-4" />
            Dashboard
          </Link>
        </nav>

        <div className="mt-auto space-y-3 border-t p-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/60 p-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Administrator
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/85 px-4 py-3 backdrop-blur md:px-6">
          <div>
            <h1 className="text-sm font-semibold">Panel Admin</h1>
            <p className="text-xs text-muted-foreground">
              Kelola permintaan layanan yang masuk
            </p>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
