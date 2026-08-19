export interface LegalContactInfo {
  name: string;
  street: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  privacyEmail: string;
  editorialName: string;
  editorialStreet: string;
  editorialCity: string;
  editorialCountry: string;
}

export type LegalContactKey = keyof LegalContactInfo;
