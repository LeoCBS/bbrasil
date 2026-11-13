import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadNFeCertificatePfx, materializeNFeCertificateFile } from "@/lib/nfe-certificate";

const originalEnv = { ...process.env };

// Minimal fake PFX: DER SEQUENCE prefix (0x30 0x82) + payload, above the size check.
const fakePfx = Buffer.concat([Buffer.from([0x30, 0x82]), Buffer.alloc(200, 0x42)]);

let tempDir: string;

beforeEach(async () => {
  Object.assign(process.env, originalEnv);
  tempDir = await mkdtemp(join(tmpdir(), "nfe-cert-test-"));
});

afterEach(async () => {
  Object.assign(process.env, originalEnv);
  await rm(tempDir, { recursive: true, force: true });
});

describe("loadNFeCertificatePfx", () => {
  it("throws when NFE_CERTIFICATE_PATH is not configured", async () => {
    delete process.env.NFE_CERTIFICATE_PATH;
    await expect(loadNFeCertificatePfx()).rejects.toThrow("NFE_CERTIFICATE_PATH environment variable is not configured");
  });

  it("reads the certificate from a file path", async () => {
    const certPath = join(tempDir, "cert.pfx");
    await writeFile(certPath, fakePfx);
    process.env.NFE_CERTIFICATE_PATH = certPath;

    await expect(loadNFeCertificatePfx()).resolves.toEqual(fakePfx);
  });

  it("decodes a base64-encoded certificate", async () => {
    process.env.NFE_CERTIFICATE_PATH = fakePfx.toString("base64");

    await expect(loadNFeCertificatePfx()).resolves.toEqual(fakePfx);
  });

  it("decodes base64 with whitespace", async () => {
    const b64 = fakePfx.toString("base64");
    process.env.NFE_CERTIFICATE_PATH = `${b64.slice(0, 40)}\n${b64.slice(40)}`;

    await expect(loadNFeCertificatePfx()).resolves.toEqual(fakePfx);
  });

  it("rejects a path that does not exist", async () => {
    process.env.NFE_CERTIFICATE_PATH = join(tempDir, "missing.pfx");

    await expect(loadNFeCertificatePfx()).rejects.toThrow("Certificate file not found");
  });

  it("rejects invalid base64 data", async () => {
    process.env.NFE_CERTIFICATE_PATH = "a".repeat(300);

    await expect(loadNFeCertificatePfx()).rejects.toThrow("not a valid base64-encoded PFX certificate");
  });
});

describe("materializeNFeCertificateFile", () => {
  it("returns the original path when the certificate is a file", async () => {
    const certPath = join(tempDir, "cert.pfx");
    await writeFile(certPath, fakePfx);
    process.env.NFE_CERTIFICATE_PATH = certPath;

    const materialized = await materializeNFeCertificateFile();
    expect(materialized.path).toBe(certPath);
    await materialized.dispose();
  });

  it("writes a temporary file for base64 certificates and removes it on dispose", async () => {
    process.env.NFE_CERTIFICATE_PATH = fakePfx.toString("base64");

    const materialized = await materializeNFeCertificateFile();
    expect(materialized.path).not.toBe(process.env.NFE_CERTIFICATE_PATH);
    await expect(readFile(materialized.path)).resolves.toEqual(fakePfx);

    await materialized.dispose();
    await expect(readFile(materialized.path)).rejects.toThrow();
  });
});
