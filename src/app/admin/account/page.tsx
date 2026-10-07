import { redirect } from "next/navigation";

import { AccountForm } from "@/components/admin/account-form";
import { SessionList } from "@/components/admin/session-list";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Akun",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sessionUser = session.user;
  let userId: string | null = null;
  if (sessionUser && typeof sessionUser === "object" && "id" in sessionUser) {
    const c = sessionUser.id;
    if (typeof c === "string") userId = c;
  }

  let username: string | null = null;
  if (userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    if (u) username = u.username;
  }
  if (!username) {
    if (sessionUser && typeof sessionUser === "object" && "username" in sessionUser) {
      const cand = sessionUser.username;
      if (typeof cand === "string") username = cand;
    }
    if (!username && sessionUser.email) {
      const u = await prisma.user.findUnique({ where: { username: sessionUser.email } });
      if (u) username = u.username;
    }
    if (!username && sessionUser.name) {
      const u = await prisma.user.findFirst({ where: { name: sessionUser.name }, select: { username: true } });
      if (u) username = u.username;
    }
  }
  if (!username) {
    const fallback = await prisma.user.findFirst({ select: { username: true } });
    username = fallback?.username ?? "admin";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AccountForm initialUsername={username} />
      <SessionList />
    </div>
  );
}
