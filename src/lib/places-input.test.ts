import { expect, it } from "vitest";
import { photoRefSchema, placeIdSchema } from "./places-input";
it("aceita somente referências de fotos no caminho Places", () => {
  expect(photoRefSchema.parse("places/ChIJ123/photos/Abc_123-xyz")).toBe("places/ChIJ123/photos/Abc_123-xyz");
  for (const value of ["../other", "places/id/photos/../secret", "places/id/photos/a?x=1", "https://example.org/a"]) expect(photoRefSchema.safeParse(value).success).toBe(false);
});
it("impede identificadores de empresa com caminhos ou parâmetros", () => {
  expect(placeIdSchema.safeParse("ChIJ_123-xyz").success).toBe(true);
  expect(placeIdSchema.safeParse("abc?key=secret").success).toBe(false);
});