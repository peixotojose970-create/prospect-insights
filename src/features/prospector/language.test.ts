import { describe, expect, it } from "vitest";
import { langForCountry, resolveLang } from "./language";

describe("idioma das abordagens pelo país", () => {
  it("Brasil e sem país → português BR", () => {
    expect(langForCountry("BR")).toBe("pt");
    expect(langForCountry(null)).toBe("pt");
  });
  it("Portugal → português europeu", () => expect(langForCountry("PT")).toBe("pt-PT"));
  it("Espanha → espanhol", () => expect(langForCountry("ES")).toBe("es"));
  it("França → francês", () => expect(langForCountry("FR")).toBe("fr"));
  it("Itália → italiano", () => expect(langForCountry("IT")).toBe("it"));
  it("EUA → inglês", () => expect(langForCountry("US")).toBe("en"));
  it("automático segue o país; escolha manual vence", () => {
    expect(resolveLang("auto", "FR")).toBe("fr");
    expect(resolveLang("en", "FR")).toBe("en");
  });
});
