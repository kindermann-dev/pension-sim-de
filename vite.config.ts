import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const fallbackLegalConfig = {
  name: "Max Mustermann",
  street: "Musterstraße 12",
  city: "12345 Musterstadt",
  country: "Deutschland",
  phone: "+49 123 456789",
  email: "max.mustermann@beispiel.de",
  privacyEmail: "datenschutz@beispiel.de",
  editorialName: "Max Mustermann",
  editorialStreet: "Musterstraße 12",
  editorialCity: "12345 Musterstadt",
  editorialCountry: "Deutschland",
};

const legalEnv = {
  name:
    process.env.LEGAL_NAME ||
    process.env.VITE_LEGAL_NAME ||
    fallbackLegalConfig.name,
  street:
    process.env.LEGAL_STREET ||
    process.env.VITE_LEGAL_STREET ||
    fallbackLegalConfig.street,
  city:
    process.env.LEGAL_CITY ||
    process.env.VITE_LEGAL_CITY ||
    fallbackLegalConfig.city,
  country:
    process.env.LEGAL_COUNTRY ||
    process.env.VITE_LEGAL_COUNTRY ||
    fallbackLegalConfig.country,
  phone:
    process.env.LEGAL_PHONE ||
    process.env.VITE_LEGAL_PHONE ||
    fallbackLegalConfig.phone,
  email:
    process.env.LEGAL_EMAIL ||
    process.env.VITE_LEGAL_EMAIL ||
    fallbackLegalConfig.email,
  privacyEmail:
    process.env.PRIVACY_EMAIL ||
    process.env.VITE_PRIVACY_EMAIL ||
    fallbackLegalConfig.privacyEmail,
  editorialName:
    process.env.LEGAL_EDITORIAL_NAME ||
    process.env.VITE_LEGAL_EDITORIAL_NAME ||
    process.env.LEGAL_NAME ||
    process.env.VITE_LEGAL_NAME ||
    fallbackLegalConfig.editorialName,
  editorialStreet:
    process.env.LEGAL_EDITORIAL_STREET ||
    process.env.VITE_LEGAL_EDITORIAL_STREET ||
    process.env.LEGAL_STREET ||
    process.env.VITE_LEGAL_STREET ||
    fallbackLegalConfig.editorialStreet,
  editorialCity:
    process.env.LEGAL_EDITORIAL_CITY ||
    process.env.VITE_LEGAL_EDITORIAL_CITY ||
    process.env.LEGAL_CITY ||
    process.env.VITE_LEGAL_CITY ||
    fallbackLegalConfig.editorialCity,
  editorialCountry:
    process.env.LEGAL_EDITORIAL_COUNTRY ||
    process.env.VITE_LEGAL_EDITORIAL_COUNTRY ||
    process.env.LEGAL_COUNTRY ||
    process.env.VITE_LEGAL_COUNTRY ||
    fallbackLegalConfig.editorialCountry,
};

const encodedLegalConfig = Object.fromEntries(
  Object.entries(legalEnv).map(([key, val]) => [
    key,
    Buffer.from(val, "utf-8").toString("base64"),
  ]),
);

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "./",
  plugins: [react(), tailwindcss()],
  define: {
    __LEGAL_CONFIG_B64__: JSON.stringify(encodedLegalConfig),
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts")) {
            return "recharts";
          }
        },
      },
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
  },
});
