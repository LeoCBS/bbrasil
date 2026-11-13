import { createHash } from "crypto";
import { readFile, writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

// PFX/PKCS#12 files are DER-encoded and always start with a SEQUENCE tag (0x30 0x82).
const PFX_DER_PREFIX = Buffer.from([0x30, 0x82]);
const MIN_PFX_SIZE = 100;

function certificateSource() {
  const source = process.env.NFE_CERTIFICATE_PATH;
  if (!source) {
    throw new Error("NFE_CERTIFICATE_PATH environment variable is not configured");
  }
  return source;
}

async function readCertificateFile(path: string) {
  try {
    return await readFile(path);
  } catch {
    return null;
  }
}

function looksLikeFilePath(source: string) {
  return source.includes("/") || source.includes("\\") || /\.(pfx|p12)$/i.test(source);
}

function decodePfxBase64(source: string): Buffer {
  const decoded = Buffer.from(source.replace(/\s+/g, ""), "base64");
  if (decoded.length < MIN_PFX_SIZE || decoded[0] !== PFX_DER_PREFIX[0] || decoded[1] !== PFX_DER_PREFIX[1]) {
    if (looksLikeFilePath(source)) {
      throw new Error("Certificate file not found");
    }
    throw new Error("NFE_CERTIFICATE_PATH is not a valid base64-encoded PFX certificate");
  }
  return decoded;
}

/**
 * Loads the NFe client certificate (PFX) from NFE_CERTIFICATE_PATH.
 * Accepts either a filesystem path or the base64-encoded contents of the .pfx file,
 * which is required on serverless platforms (e.g. Vercel) without a persistent disk.
 */
export async function loadNFeCertificatePfx(): Promise<Buffer> {
  const source = certificateSource();
  const fromDisk = await readCertificateFile(source);
  if (fromDisk) return fromDisk;
  return decodePfxBase64(source);
}

/**
 * Same as loadNFeCertificatePfx, but returns a filesystem path to a PFX file,
 * writing a temporary file when the certificate is provided as base64.
 * Call dispose() after use to remove the temporary file.
 */
export async function materializeNFeCertificateFile(): Promise<{ path: string; dispose: () => Promise<void> }> {
  const source = certificateSource();
  const fromDisk = await readCertificateFile(source);
  if (fromDisk) {
    return { path: source, dispose: async () => {} };
  }

  const pfx = decodePfxBase64(source);
  const fileName = `nfe-cert-${createHash("sha256").update(source).digest("hex").slice(0, 16)}.pfx`;
  const path = join(tmpdir(), fileName);
  await writeFile(path, pfx, { mode: 0o600 });

  return { path, dispose: () => unlink(path).catch(() => {}) };
}
