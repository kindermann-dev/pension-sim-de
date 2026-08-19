import { describe, it, expect } from "vitest";
import {
  encodeBase64,
  decodeBase64,
  getEncodedLegalConfig,
  getDecodedLegalConfig,
  getDecodedLegalField,
  DEFAULT_LEGAL_CONFIG_B64,
} from "../legalConfig";

describe("legalConfig & Base64 Obfuscation", () => {
  it("should correctly encode and decode standard and UTF-8 strings with German umlauts", () => {
    const testStrings = [
      "Max Mustermann",
      "Münchner Straße 42b, 80331 München",
      "info@vermögensaufbau-vorsorge.de",
      "+49 (0) 89 123456-78",
      "Große Äpfel & süße Kirschen – € 100,-",
    ];

    for (const str of testStrings) {
      const encoded = encodeBase64(str);
      expect(encoded).not.toBe(str);
      const decoded = decodeBase64(encoded);
      expect(decoded).toBe(str);
    }
  });

  it("should handle empty or invalid base64 gracefully", () => {
    expect(decodeBase64("")).toBe("");
    expect(encodeBase64("")).toBe("");
  });

  it("should return default legal configuration when no build-time constants are injected", () => {
    const encoded = getEncodedLegalConfig();
    expect(encoded.name).toBe(DEFAULT_LEGAL_CONFIG_B64.name);
    expect(encoded.email).toBe(DEFAULT_LEGAL_CONFIG_B64.email);
    expect(encoded.street).toBe(DEFAULT_LEGAL_CONFIG_B64.street);

    const decoded = getDecodedLegalConfig();
    expect(decoded.name).toBe("Max Mustermann");
    expect(decoded.email).toBe("max.mustermann@beispiel.de");
    expect(decoded.street).toBe("Musterstraße 12");
    expect(decoded.phone).toBe("+49 123 456789");
    expect(decoded.privacyEmail).toBe("datenschutz@beispiel.de");
  });

  it("should decode a single field on demand", () => {
    expect(getDecodedLegalField("name")).toBe("Max Mustermann");
    expect(getDecodedLegalField("email")).toBe("max.mustermann@beispiel.de");
    expect(getDecodedLegalField("phone")).toBe("+49 123 456789");
  });
});
