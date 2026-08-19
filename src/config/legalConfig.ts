import type { LegalContactInfo, LegalContactKey } from "../types/legal";

export function decodeBase64(b64: string): string {
  if (!b64) return "";
  try {
    if (typeof atob === "function") {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder("utf-8").decode(bytes);
    }
  } catch {
    // Fallback if TextDecoder or atob fails
  }

  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    return b64;
  }
}

export function encodeBase64(str: string): string {
  if (!str) return "";
  try {
    if (typeof TextEncoder !== "undefined") {
      const bytes = new TextEncoder().encode(str);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        if (byte !== undefined) {
          binary += String.fromCharCode(byte);
        }
      }
      return btoa(binary);
    }
  } catch {
    // Fallback
  }

  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str);
  }
}

// Fallback base64-encoded defaults so zero plaintext contacts exist in source files
export const DEFAULT_LEGAL_CONFIG_B64: Record<LegalContactKey, string> = {
  name: "TWF4IE11c3Rlcm1hbm4=", // Max Mustermann
  street: "TXVzdGVyc3RyYcOfZSAxMg==", // Musterstraße 12
  city: "MTIzNDUgTXVzdGVyc3RhZHQ=", // 12345 Musterstadt
  country: "RGV1dHNjaGxhbmQ=", // Deutschland
  phone: "KzQ5IDEyMyA0NTY3ODk=", // +49 123 456789
  email: "bWF4Lm11c3Rlcm1hbm5AYmVpc3BpZWwuZGU=", // max.mustermann@beispiel.de
  privacyEmail: "ZGF0ZW5zY2h1dHpAYmVpc3BpZWwuZGU=", // datenschutz@beispiel.de
  editorialName: "TWF4IE11c3Rlcm1hbm4=",
  editorialStreet: "TXVzdGVyc3RyYcOfZSAxMg==",
  editorialCity: "MTIzNDUgTXVzdGVyc3RhZHQ=",
  editorialCountry: "RGV1dHNjaGxhbmQ=",
};

/**
 * Returns Base64-encoded legal contact strings.
 * Prioritizes build-time injected constants from CI/CD pipeline.
 */
export function getEncodedLegalConfig(): Record<LegalContactKey, string> {
  const globalInjected =
    typeof __LEGAL_CONFIG_B64__ !== "undefined"
      ? __LEGAL_CONFIG_B64__
      : undefined;

  const result: Record<LegalContactKey, string> = {
    name: globalInjected?.["name"] || DEFAULT_LEGAL_CONFIG_B64.name,
    street: globalInjected?.["street"] || DEFAULT_LEGAL_CONFIG_B64.street,
    city: globalInjected?.["city"] || DEFAULT_LEGAL_CONFIG_B64.city,
    country: globalInjected?.["country"] || DEFAULT_LEGAL_CONFIG_B64.country,
    phone: globalInjected?.["phone"] || DEFAULT_LEGAL_CONFIG_B64.phone,
    email: globalInjected?.["email"] || DEFAULT_LEGAL_CONFIG_B64.email,
    privacyEmail:
      globalInjected?.["privacyEmail"] || DEFAULT_LEGAL_CONFIG_B64.privacyEmail,
    editorialName:
      globalInjected?.["editorialName"] ||
      globalInjected?.["name"] ||
      DEFAULT_LEGAL_CONFIG_B64.editorialName,
    editorialStreet:
      globalInjected?.["editorialStreet"] ||
      globalInjected?.["street"] ||
      DEFAULT_LEGAL_CONFIG_B64.editorialStreet,
    editorialCity:
      globalInjected?.["editorialCity"] ||
      globalInjected?.["city"] ||
      DEFAULT_LEGAL_CONFIG_B64.editorialCity,
    editorialCountry:
      globalInjected?.["editorialCountry"] ||
      globalInjected?.["country"] ||
      DEFAULT_LEGAL_CONFIG_B64.editorialCountry,
  };

  return result;
}

export function getDecodedLegalField(key: LegalContactKey): string {
  const encoded = getEncodedLegalConfig();
  const val = encoded[key];
  return val ? decodeBase64(val) : "";
}

export function getDecodedLegalConfig(): LegalContactInfo {
  const encoded = getEncodedLegalConfig();
  return {
    name: decodeBase64(encoded.name),
    street: decodeBase64(encoded.street),
    city: decodeBase64(encoded.city),
    country: decodeBase64(encoded.country),
    phone: decodeBase64(encoded.phone),
    email: decodeBase64(encoded.email),
    privacyEmail: decodeBase64(encoded.privacyEmail),
    editorialName: decodeBase64(encoded.editorialName),
    editorialStreet: decodeBase64(encoded.editorialStreet),
    editorialCity: decodeBase64(encoded.editorialCity),
    editorialCountry: decodeBase64(encoded.editorialCountry),
  };
}
