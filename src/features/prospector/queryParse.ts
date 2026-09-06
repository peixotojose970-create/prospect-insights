import { CITY_STATE_HINTS, STATES } from "@/data/brazil";
import { findCategory, findCategoryExact } from "./osmCategories";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export type ParsedQuery = { category: string; city: string; state: string };

// "de/da/do" fazem parte de nomes de cidades e por isso são preservados.
const STOP_WORDS = new Set(["em", "para", "-"]);

/**
 * Interpreta buscas livres como "Barbearias Londrina PR" ou "Clínicas em Curitiba".
 * Retorna somente o que foi possível reconhecer — nada é inventado.
 */
export function parseQuery(raw: string): ParsedQuery {
  const cleaned = raw.replace(/,/g, " ").trim();
  const words = cleaned.split(/\s+/).filter((w) => w && !STOP_WORDS.has(normalize(w)));

  let state = "";
  const rest: string[] = [];
  for (const word of words) {
    const upper = word.toUpperCase();
    if (!state && word.length === 2 && (STATES as readonly string[]).includes(upper)) {
      state = upper;
      continue;
    }
    rest.push(word);
  }

  let category = "";
  for (let size = Math.min(3, rest.length); size >= 1 && !category; size -= 1) {
    for (let i = 0; i <= rest.length - size; i += 1) {
      const match = findCategoryExact(rest.slice(i, i + size).join(" "));
      if (match) {
        category = match.label;
        rest.splice(i, size);
        break;
      }
    }
  }
  if (!category) {
    for (let i = 0; i < rest.length; i += 1) {
      const match = findCategory(rest[i] ?? "");
      if (match) {
        category = match.label;
        rest.splice(i, 1);
        break;
      }
    }
  }

  const city = rest.join(" ").replace(/^(de|da|do|no|na)\s+/i, "").trim();
  if (!state && city) {
    const hint = CITY_STATE_HINTS[normalize(city)];
    if (hint) state = hint;
  }

  return { category, city, state };
}
