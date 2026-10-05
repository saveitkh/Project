import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

/**
 * Saves an uploaded File to local disk under /uploads and returns the
 * relative path stored in the DB. For production, replace this with a
 * secured object-storage backend (e.g., S3-compatible) with access
 * control — local disk storage is a development-grade limitation,
 * documented in README-PROTECTION-SERVICE.md.
 */
export async function saveUploadedFile(file: File): Promise<{ path: string; name: string }> {
  await mkdir(UPLOAD_ROOT, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const fullPath = path.join(UPLOAD_ROOT, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);
  return { path: `uploads/${storedName}`, name: file.name };
}
