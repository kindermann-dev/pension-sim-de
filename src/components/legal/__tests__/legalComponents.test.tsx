import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ObfuscatedContact } from "../ObfuscatedContact";
import { ImpressumContent } from "../ImpressumContent";
import { PrivacyPolicyContent } from "../PrivacyPolicyContent";
import { LegalModal } from "../LegalModal";
import { Footer } from "../../layout/Footer";

describe("Legal Components", () => {
  describe("ObfuscatedContact", () => {
    it("renders a reveal button initially and decodes on click even when isRevealed={false}", () => {
      render(
        <ObfuscatedContact fieldKey="name" label="Name:" isRevealed={false} />,
      );

      // Initially, the text should NOT contain "Max Mustermann" in plain rendered text (it only has the reveal button)
      const revealBtn = screen.getByRole("button", {
        name: /Klicken um Name: anzuzeigen/i,
      });
      expect(revealBtn).toBeDefined();

      // Click to reveal individual item
      fireEvent.click(revealBtn);

      // Now "Max Mustermann" should be revealed
      expect(screen.getByText("Max Mustermann")).toBeDefined();
    });

    it("renders mailto link for email type when revealed", () => {
      render(
        <ObfuscatedContact fieldKey="email" type="email" isRevealed={true} />,
      );

      const emailLink = screen.getByRole("link", {
        name: "max.mustermann@beispiel.de",
      });
      expect(emailLink).toBeDefined();
      expect(emailLink.getAttribute("href")).toBe(
        "mailto:max.mustermann@beispiel.de",
      );
    });

    it("renders tel link for phone type when revealed", () => {
      render(
        <ObfuscatedContact fieldKey="phone" type="phone" isRevealed={true} />,
      );

      const phoneLink = screen.getByRole("link", { name: "+49 123 456789" });
      expect(phoneLink).toBeDefined();
      expect(phoneLink.getAttribute("href")).toBe("tel:+49123456789");
    });

    it("allows individual reveals when rendered alongside other unrevealed fields", () => {
      render(
        <div>
          <ObfuscatedContact fieldKey="name" label="Name:" isRevealed={false} />
          <ObfuscatedContact
            fieldKey="email"
            label="E-Mail:"
            isRevealed={false}
          />
        </div>,
      );

      const nameBtn = screen.getByRole("button", {
        name: /Klicken um Name: anzuzeigen/i,
      });
      const emailBtn = screen.getByRole("button", {
        name: /Klicken um E-Mail: anzuzeigen/i,
      });
      expect(nameBtn).toBeDefined();

      // Click ONLY the email button
      fireEvent.click(emailBtn);

      // Email is revealed, Name is still hidden
      expect(screen.getByText("max.mustermann@beispiel.de")).toBeDefined();
      expect(
        screen.getByRole("button", { name: /Klicken um Name: anzuzeigen/i }),
      ).toBeDefined();
      expect(screen.queryByText("Max Mustermann")).toBeNull();
    });
  });

  describe("ImpressumContent", () => {
    it("renders section headings and reveals all data when button is clicked", () => {
      render(<ImpressumContent />);

      expect(screen.getByText("Angaben gemäß § 5 DDG")).toBeDefined();
      expect(screen.getByText("Kontakt")).toBeDefined();
      expect(
        screen.getByText("Redaktionell verantwortlich gemäß § 18 Abs. 2 MStV"),
      ).toBeDefined();
      expect(screen.getByText("Spamschutz nach deutschem Recht")).toBeDefined();

      const revealAllBtn = screen.getByRole("button", {
        name: "Alle Daten aufdecken",
      });
      fireEvent.click(revealAllBtn);

      expect(screen.getAllByText("Max Mustermann").length).toBeGreaterThan(0);
      expect(screen.getByText("max.mustermann@beispiel.de")).toBeDefined();
    });
  });

  describe("PrivacyPolicyContent", () => {
    it("renders all 5 GDPR sections and spam protection banner identical to Impressum", () => {
      render(<PrivacyPolicyContent />);

      expect(screen.getByText("Spamschutz nach deutschem Recht")).toBeDefined();
      expect(screen.getByText(/1\. Verantwortlicher/i)).toBeDefined();
      expect(
        screen.getByText(/2\. Clientseitige Datenverarbeitung & Cookies/i),
      ).toBeDefined();
      expect(screen.getByText(/3\. Hosting auf GitHub Pages/i)).toBeDefined();
      expect(
        screen.getByText(/4\. SSL- bzw\. TLS-Verschlüsselung/i),
      ).toBeDefined();
      expect(screen.getByText(/5\. Ihre Rechte/i)).toBeDefined();

      expect(screen.getByText(/EU-US Data Privacy Framework/i)).toBeDefined();

      // Test reveal all button in Datenschutz
      const revealAllBtn = screen.getByRole("button", {
        name: "Alle Daten aufdecken",
      });
      fireEvent.click(revealAllBtn);

      expect(screen.getByText("Max Mustermann")).toBeDefined();
      expect(screen.getByText("datenschutz@beispiel.de")).toBeDefined();
    });
  });

  describe("LegalModal & Footer", () => {
    it("calls onOpenLegal when footer links are clicked", () => {
      const onOpenLegal = vi.fn();
      render(<Footer onOpenLegal={onOpenLegal} />);

      fireEvent.click(screen.getByRole("button", { name: "Impressum" }));
      expect(onOpenLegal).toHaveBeenCalledWith("impressum");

      fireEvent.click(
        screen.getByRole("button", { name: "Datenschutzerklärung" }),
      );
      expect(onOpenLegal).toHaveBeenCalledWith("datenschutz");
    });

    it("renders modal when isOpen is true and switches tabs", () => {
      const onClose = vi.fn();
      const onTabChange = vi.fn();

      const { rerender } = render(
        <LegalModal
          isOpen={true}
          activeTab="impressum"
          onClose={onClose}
          onTabChange={onTabChange}
        />,
      );

      expect(screen.getByText("Angaben gemäß § 5 DDG")).toBeDefined();

      fireEvent.click(
        screen.getByRole("button", { name: "Datenschutzerklärung" }),
      );
      expect(onTabChange).toHaveBeenCalledWith("datenschutz");

      rerender(
        <LegalModal
          isOpen={true}
          activeTab="datenschutz"
          onClose={onClose}
          onTabChange={onTabChange}
        />,
      );

      expect(screen.getByText(/3\. Hosting auf GitHub Pages/i)).toBeDefined();
    });
  });
});
