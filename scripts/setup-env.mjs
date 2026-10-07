#!/usr/bin/env node
import { randomBytes } from "crypto";
import { existsSync, writeFileSync, readFileSync } from "fs";

function randomSecret() {
  return randomBytes(32).toString("base64");
}

// Pastikan .env punya secret valid + AUTH_SECRET (Auth.js v5) sinkron NEXTAUTH_SECRET.
function ensureSecrets(env) {
  let next = env;
  let changed = false;

  // Ganti secret placeholder apa pun yang masih berbentuk <...> (termasuk <openssl rand -base64 32>)
  next = next.replace(
    /^(NEXTAUTH_SECRET|AUTH_SECRET)="([^"]*)"/gm,
    (line, key, val) => {
      if (val.startsWith("<") && val.endsWith(">")) {
        changed = true;
        console.log(`✓ ${key} placeholder diganti (random)`);
        return `${key}="${randomSecret()}"`;
      }
      return line;
    }
  );

  if (!/^AUTH_SECRET=/m.test(next)) {
    const m = next.match(/^NEXTAUTH_SECRET="([^"]*)"/m);
    const secret = m?.[1] && !m[1].includes("<") ? m[1] : randomSecret();
    next = `${next.replace(/\n*$/, "\n")}AUTH_SECRET="${secret}"\n`;
    changed = true;
    console.log("✓ AUTH_SECRET ditambahkan (sinkron NEXTAUTH_SECRET)");
  }

  return { env: next, changed };
}

if (existsSync(".env")) {
  const cur = readFileSync(".env", "utf8");
  if (cur.includes("dev-secret-ganti")) {
    const secret = randomSecret();
    const replaced = cur.replace(
      "dev-secret-ganti-di-production-0123456789abcdef",
      secret
    );
    const r = ensureSecrets(replaced);
    writeFileSync(".env", r.env);
    console.log("✓ NEXTAUTH_SECRET diganti (random)");
  } else {
    const r = ensureSecrets(cur);
    if (r.changed) {
      writeFileSync(".env", r.env);
      console.log("✓ .env dilengkapi (secret + AUTH_SECRET)");
    } else {
      console.log(".env sudah ada — lewati. Hapus .env dulu bila mau generate ulang.");
    }
  }
  process.exit(0);
}

const secret = randomSecret();
writeFileSync(
  ".env",
  `# Auto-generated ${new Date().toISOString()}
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="${secret}"
AUTH_SECRET="${secret}"
AUTH_TRUST_HOST=true
SEED_ADMIN_PASSWORD="admin123"
`
);
console.log("✓ .env dibuat. Ganti SEED_ADMIN_PASSWORD bila perlu, lalu: npm run build && npm start");
