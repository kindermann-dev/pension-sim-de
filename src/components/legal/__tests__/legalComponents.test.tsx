import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ObfuscatedContact } from "../ObfuscatedContact";
import { ImpressumContent } from "../ImpressumContent";
import { PrivacyPolicyContent } from "../PrivacyPolicyContent";
import { LegalModal } from "../LegalModal";
import { Footer } from "../../layout/Footer";
import { getDecodedLegalField } from "../../../config/legalConfig";

describe("Legal Components", () => {
  const expectedName = getDecodedLegalField("name");
  const expectedEmail = getDecodedLegalField("email");
  const expectedPhone = getDecodedLegalField("phone");
  const expectedPrivacyEmail = getDecodedLegalField("privacyEmail");

  describe("ObfuscatedContact", () => {
    it("renders a reveal button initially and decodes on click even when isRevealed={false}", () => {
      render(
        <ObfuscatedContact fieldKey="name" label="Name:" isRevealed={false} />,
      );

      // Initially, the text should NOT contain the name in plain rendered text (it only has the reveal button)
      const revealBtn = screen.getByRole("button", {
        name: /Klicken um Name: anzuzeigen/i,
      });
      expect(revealBtn).toBeDefined();

      // Click to reveal individual item
      fireEvent.click(revealBtn);

      // Now the name should be revealed
      expect(screen.getByText(expectedName)).toBeDefined();
    });

    it("renders mailto link for email type when revealed", () => {
      render(
        <ObfuscatedContact fieldKey="email" type="email" isRevealed={true} />,
      );

      const emailLink = screen.getByRole("link", {
        name: expectedEmail,
      });
      expect(emailLink).toBeDefined();
      expect(emailLink.getAttribute("href")).toBe(`mailto:${expectedEmail}`);
    });

    it("renders tel link for phone type when revealed", () => {
      render(
        <ObfuscatedContact fieldKey="phone" type="phone" isRevealed={true} />,
      );

      const phoneLink = screen.getByRole("link", { name: expectedPhone });
      expect(phoneLink).toBeDefined();
      const sanitizedPhone = expectedPhone.replace(/\s+/g, "");
      expect(phoneLink.getAttribute("href")).toBe(`tel:${sanitizedPhone}`);
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
      expect(screen.getByText(expectedEmail)).toBeDefined();
      expect(
        screen.getByRole("button", { name: /Klicken um Name: anzuzeigen/i }),
      ).toBeDefined();
      expect(screen.queryByText(expectedName)).toBeNull();
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

      expect(screen.getAllByText(expectedName).length).toBeGreaterThan(0);
      expect(screen.getByText(expectedEmail)).toBeDefined();
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

      expect(screen.getByText(expectedName)).toBeDefined();
      expect(screen.getByText(expectedPrivacyEmail)).toBeDefined();
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
