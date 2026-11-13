import { describe, expect, it } from "vitest";
import { countryPreference, DEFAULT_PREFERENCES, parsePreferences, updateCountryPreference } from "./preference-model";
describe("preferências por país", () => {
  it("Portugal restaura abordagem e português europeu após serialização", () => {
    const state = updateCountryPreference({ ...DEFAULT_PREFERENCES, country: "PT" }, "PT", { style: "comercial", language: "pt-PT" });
    const restored = parsePreferences(JSON.parse(JSON.stringify(state)));
    expect(restored.country).toBe("PT");
    expect(countryPreference(restored, "PT")).toEqual({ style: "comercial", language: "pt-PT" });
  });
  it("trocar Espanha não apaga escolhas de Portugal", () => {
    const portugal = updateCountryPreference(DEFAULT_PREFERENCES, "PT", { style: "comercial" });
    const spain = updateCountryPreference(portugal, "ES", { style: "direto", language: "es" });
    expect(countryPreference(spain, "PT")).toEqual({ style: "comercial", language: "pt-PT" });
    expect(countryPreference(spain, "ES")).toEqual({ style: "direto", language: "es" });
  });
  it("mudança manual substitui somente a escolha daquele país", () => {
    const state = updateCountryPreference(updateCountryPreference(DEFAULT_PREFERENCES, "FR", { style: "custom:meu-modelo", language: "fr" }), "FR", { language: "en" });
    expect(countryPreference(state, "FR")).toEqual({ style: "custom:meu-modelo", language: "en" });
    expect(countryPreference(state, "IT").language).toBe("it");
    expect(countryPreference(state, "BR").language).toBe("pt");
  });
});