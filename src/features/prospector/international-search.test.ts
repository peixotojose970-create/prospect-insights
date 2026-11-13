import { describe, expect, it } from "vitest";
import { COUNTRY_CONFIG } from "@/data/countries";
import { belongsToCountry, internationalQuery, internationalTerms } from "./international-search";
import { normalizePhone, whatsappLink } from "./format";
import { regionsOf, regionOfCity } from "@/data/geo";
import { validMessageLanguage } from "./message-validation";

describe("prospecção internacional", () => {
  it.each([
    ["BR", "barbearia", "São Paulo", "pt-BR"], ["PT", "barbearia", "Lisboa", "pt-PT"],
    ["ES", "barbería", "Madrid", "es-ES"], ["FR", "barbier", "Paris", "fr-FR"], ["IT", "barbiere", "Milano", "it-IT"],
  ] as const)("%s usa idioma e país locais", (country, term, city, locale) => {
    const query = internationalQuery(country, term, city, "");
    expect(query.languageCode).toBe(locale);
    expect(query.regionCode).toBe(country);
    expect(query.textQuery).toContain(city);
    expect(query.textQuery).toContain(COUNTRY_CONFIG[country].localName);
    expect(query.pageSize).toBe(20);
  });
  it("Portugal usa sinônimos portugueses de barbearia", () => expect(internationalTerms("PT", "barbearia")).toEqual(["barbearia", "barbeiro", "salão de barbeiro"]));
  it("Espanha usa sinônimos locais", () => expect(internationalTerms("ES", "barbería")).toEqual(["barbería", "barbero", "peluquería masculina"]));
  it("França usa expressão comercial local", () => expect(internationalTerms("FR", "barbier")).toEqual(["barbier", "salon de coiffure homme"]));
  it("Itália usa expressões locais", () => expect(internationalTerms("IT", "barbiere")).toEqual(["barbiere", "barberia", "parrucchiere uomo"]));
  it("nome específico não vira busca ampla", () => expect(internationalTerms("FR", "barbier", "Salon Pierre")).toEqual(["Salon Pierre"]));
  it("regionCode não substitui validação do país retornado", () => {
    expect(belongsToCountry([{ shortText: "BR", types: ["country"] }], "PT")).toBe(false);
    expect(belongsToCountry([{ shortText: "PT", types: ["country"] }], "PT")).toBe(true);
    expect(belongsToCountry([], "PT")).toBe(false);
  });
  it("Lisboa é distrito, não região brasileira", () => {
    expect(regionOfCity("PT", "Lisboa")).toBe("Lisboa");
    expect(regionsOf("PT")).toContain("Porto");
    expect(regionsOf("PT")).not.toContain("SP");
  });
  it("WhatsApp internacional não recebe prefixo brasileiro", () => expect(whatsappLink("+351 912 345 678", "PT")).toBe("https://wa.me/351912345678"));
  it("França remove zero nacional mas Itália preserva zero de telefone fixo", () => {
    expect(whatsappLink("01 23 45 67 89", "FR")).toBe("https://wa.me/33123456789");
    expect(whatsappLink("02 12345678", "IT")).toBe("https://wa.me/390212345678");
  });
  it("assinatura legada brasileira permanece igual para /rapido", () => {
    expect(normalizePhone("+55 11 99999-9999")).toBe("11999999999");
    expect(whatsappLink("11999999999")).toBe("https://wa.me/5511999999999");
  });
  it("rejeita português brasileiro para francês", () => expect(validMessageLanguage(["Olá! Tudo bem? Falo com o responsável pela empresa?", "Me chamo José e trabalho com criação de sites para empresas locais. Posso preparar uma proposta para vocês?"], "fr")).toBe(false));
  it("rejeita expressões brasileiras para Portugal", () => expect(validMessageLanguage(["Oi, tudo bem?", "Legal, posso enviar pra vocês um site pelo celular?"], "pt-PT")).toBe(false));
  it("valida francês profissional", () => expect(validMessageLanguage(["Bonjour, puis-je parler à la personne responsable de votre établissement ?", "Merci pour votre réponse. Je représente un studio de création de sites internet et je souhaiterais vous proposer une présentation adaptée à votre entreprise, sans engagement."], "fr")).toBe(true));
});