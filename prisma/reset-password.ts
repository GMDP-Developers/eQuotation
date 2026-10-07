import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function printUsage(): void {
  console.log(`
Usage:
  npm run admin:reset-password -- <username> <new-password>
  npx tsx --env-file=.env prisma/reset-password.ts <username> <new-password>

Contoh:
  npm run admin:reset-password -- admin MyNewPass123

Catatan:
  - Butuh akses shell server (langsung update DB, tanpa password lama).
  - new-password minimal 8 karakter.
  - Sesi aktif user tersebut akan diakhiri (wajib login ulang).
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== "--");

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printUsage();
    const users = await prisma.user.findMany({ select: { username: true, name: true, role: true } });
    if (users.length > 0) {
      console.log("User terdaftar:");
      for (const u of users) console.log(`  - ${u.username} (${u.role}${u.name ? `, ${u.name}` : ""})`);
    }
    process.exit(0);
  }

  const username = args[0]?.trim();
  const newPassword = args[1];

  if (!username) {
    console.error("Error: username wajib diisi.");
    printUsage();
    process.exit(1);
  }
  if (!newPassword) {
    console.error("Error: new-password wajib diisi.");
    printUsage();
    process.exit(1);
  }
  if (newPassword.length < 8) {
    console.error("Error: password minimal 8 karakter.");
    process.exit(1);
  }
  if (newPassword.length > 72) {
    console.error("Error: password maksimal 72 karakter.");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    const all = await prisma.user.findMany({ select: { username: true } });
    console.error(`Error: user "${username}" tidak ditemukan.`);
    if (all.length > 0) console.error(`  Tersedia: ${all.map((u) => u.username).join(", ")}`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
  const revoked = await prisma.session.deleteMany({ where: { userId: user.id } }).catch(() => ({ count: 0 }));

  await prisma.auditLog
    .create({
      data: { action: "ACCOUNT_RESET_VIA_CLI", targetId: user.id, detail: `reset password via terminal (${username})` },
    })
    .catch(() => {});

  console.log(`OK: password "${username}" direset. Sesi diakhiri: ${revoked.count}. Silakan login dengan password baru.`);
}

main()
  .catch((e) => {
    console.error("Gagal:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
