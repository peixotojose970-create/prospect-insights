import type { ProspectCountry } from "@/types";

export type MessageLang = "pt" | "pt-PT" | "es" | "fr" | "it" | "en";
type CountryConfig = { name: string; localName: string; locale: string; messageLang: MessageLang; currency: string; prep: string; divisions: readonly string[]; addressFormat: string; callingCode: string };
export const COUNTRY_CONFIG: Record<ProspectCountry, CountryConfig> = {
  BR: { name: "Brasil", localName: "Brasil", locale: "pt-BR", messageLang: "pt", currency: "BRL", prep: "em", divisions: ["Estado brasileiro", "Cidade, bairro ou região"], addressFormat: "logradouro, número, bairro, cidade - UF, CEP", callingCode: "55" },
  US: { name: "Estados Unidos", localName: "United States", locale: "en-US", messageLang: "en", currency: "USD", prep: "in", divisions: ["Estado", "Condado", "Cidade"], addressFormat: "street, city, state ZIP", callingCode: "1" },
  PT: { name: "Portugal", localName: "Portugal", locale: "pt-PT", messageLang: "pt-PT", currency: "EUR", prep: "em", divisions: ["Distrito", "Município", "Freguesia", "Cidade/localidade"], addressFormat: "rua, número, código postal, localidade", callingCode: "351" },
  ES: { name: "Espanha", localName: "España", locale: "es-ES", messageLang: "es", currency: "EUR", prep: "en", divisions: ["Comunidade autónoma", "Província", "Município", "Cidade"], addressFormat: "calle, número, código postal, municipio, provincia", callingCode: "34" },
  FR: { name: "França", localName: "France", locale: "fr-FR", messageLang: "fr", currency: "EUR", prep: "à", divisions: ["Região", "Departamento", "Comuna", "Cidade"], addressFormat: "numéro, rue, code postal, commune", callingCode: "33" },
  IT: { name: "Itália", localName: "Italia", locale: "it-IT", messageLang: "it", currency: "EUR", prep: "a", divisions: ["Região", "Província", "Município (Comune)", "Cidade"], addressFormat: "via, numero, CAP, comune, provincia", callingCode: "39" },
};
export function isProspectCountry(value: string): value is ProspectCountry { return Object.hasOwn(COUNTRY_CONFIG, value); }