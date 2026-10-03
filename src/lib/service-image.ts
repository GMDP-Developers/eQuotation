import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const SERVICES_DIR = path.join(process.cwd(), "public", "images", "services");

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class ImageValidationError extends Error {}

export async function saveServiceImage(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new ImageValidationError("Gambar terlalu besar (maks 5MB)");
  }
  const ext = MIME_EXT[file.type];
  const buf = new Uint8Array(await file.arrayBuffer());
  if (!ext || !hasMagicBytes(file.type, buf)) {
    throw new ImageValidationError("Format gambar tidak didukung");
  }
  await mkdir(SERVICES_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(SERVICES_DIR, filename), buf);
  return `/images/services/${filename}`;
}

function hasMagicBytes(mime: string, b: Uint8Array): boolean {
  switch (mime) {
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return (
        b[0] === 0x89 &&
        b[1] === 0x50 &&
        b[2] === 0x4e &&
        b[3] === 0x47 &&
        b[4] === 0x0d &&
        b[5] === 0x0a &&
        b[6] === 0x1a &&
        b[7] === 0x0a
      );
    case "image/gif":
      return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38; // GIF8
    case "image/webp":
      return (
        b[0] === 0x52 &&
        b[1] === 0x49 &&
        b[2] === 0x46 &&
        b[3] === 0x46 && // RIFF
        b[8] === 0x57 &&
        b[9] === 0x45 &&
        b[10] === 0x42 &&
        b[11] === 0x50 // WEBP
      );
    default:
      return false;
  }
}

export async function removeServiceImage(
  storedPath: string | null
): Promise<void> {
  if (!storedPath) return;
  const filename = path.basename(storedPath);
  if (!filename || filename === "." || filename === "..") return;
  const full = path.resolve(SERVICES_DIR, filename);
  if (!full.startsWith(SERVICES_DIR + path.sep)) return; // guard traversal
  try {
    await unlink(full);
  } catch (err) {
    if (
      typeof err !== "object" ||
      err === null ||
      !("code" in err) ||
      err.code !== "ENOENT"
    ) {
      throw err;
    }
  }
}
