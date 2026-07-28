import { beforeAll, describe, expect, it } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd";
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a plaintext secret", () => {
    const secret = "super-secret-imap-password!";
    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    const a = encryptSecret("same-input");
    const b = encryptSecret("same-input");
    expect(a).not.toBe(b);
  });

  it("throws on a tampered payload", () => {
    const encrypted = encryptSecret("value");
    const tampered = encrypted.slice(0, -2) + "00";
    expect(() => decryptSecret(tampered)).toThrow();
  });
});
