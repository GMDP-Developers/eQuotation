#!/usr/bin/env node
import { randomBytes } from "crypto";
import { existsSync, writeFileSync, readFileSync } from "fs";

if (existsSync(".env")) {
  const cur = readFileSync(".env", "utf8");
  if (cur.includes("dev-secret-ganti")) {
    const secret = randomBytes(32).toString("base64");
    const next = cur.replace("dev-secret-ganti-di-production-0123456789abcdef", secret);
    writeFileSync(".env", next);
    console.log("✓ NEXTAUTH_SECRET diganti (random)");
  } else {
    console.log(".env sudah ada — lewati. Hapus .env dulu bila mau generate ulang.");
  }
  process.exit(0);
}

const secret = randomBytes(32).toString("base64");
writeFileSync(
  ".env",
  `# Auto-generated ${new Date().toISOString()}
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="${secret}"
AUTH_TRUST_HOST=true
SEED_ADMIN_PASSWORD="admin123"
`
);
console.log("✓ .env dibuat. Ganti SEED_ADMIN_PASSWORD bila perlu, lalu: npm run build && npm start");
