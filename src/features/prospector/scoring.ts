import type { Business, ScoreFactor } from "@/types";
import { normalizePhone } from "./format";

/** Categorias com maior aderência a venda de site institucional. */
const RELEVANT = [
  "barbearia",
  "cabelereiro",
  "cabeleireiro",
  "salão",
  "salao",
  "clínica",
  "clinica",
  "dentista",
  "odonto",
  "restaurante",
  "pizzaria",
  "lanchonete",
  "academia",
  "estética",
  "estetica",
  "pet",
  "veterinár",
  "advocacia",
  "advogado",
  "oficina",
  "auto",
  "imobiliár",
  "arquitet",
  "contabil",
  "hotel",
  "pousada",
  "loja",
];

export function isRelevantCategory(category: string) {
  const c = category.toLowerCase();
  return RELEVANT.some((k) => c.includes(k));
}

/**
 * Lead Score 0–100 calculado SOMENTE com dados realmente retornados pelo Google Places.
 * Nada é inferido nem inventado.
 */
export function scoreBusiness(
  business: Omit<Business, "score" | "scoreFactors">,
): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];

  if (!business.website) factors.push({ label: "Site não informado na fonte", points: 30 });
  if (business.phone) factors.push({ label: "Telefone disponível", points: 15 });
  if (normalizePhone(business.phone)) factors.push({ label: "WhatsApp provável", points: 10 });
  if (business.rating !== null && business.rating > 4.5)
    factors.push({ label: `Nota ${business.rating.toFixed(1)} no Google`, points: 10 });
  if (business.reviews !== null && business.reviews > 100)
    factors.push({ label: `${business.reviews} avaliações`, points: 10 });
  if (business.instagram) factors.push({ label: "Instagram identificado", points: 5 });
  if (business.city && business.state && business.street)
    factors.push({ label: "Localização completa", points: 5 });
  if (isRelevantCategory(business.category))
    factors.push({ label: "Categoria relevante para venda de site", points: 10 });

  const extra: string[] = [];
  if (business.openingHours) extra.push("horário de funcionamento");
  if (business.photoRefs.length > 0) extra.push("fotos no perfil");
  if (business.postalCode) extra.push("CEP");
  if (business.neighborhood) extra.push("bairro");
  if (extra.length > 0)
    factors.push({ label: `Outros sinais: ${extra.join(", ")}`, points: Math.min(5, extra.length) });

  const score = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.points, 0),
  );
  return { score, factors };
}

export type Priority = "quente" | "media" | "baixa";

export function priorityFor(score: number): {
  key: Priority;
  label: string;
  emoji: string;
} {
  if (score >= 80) return { key: "quente", label: "Oportunidade quente", emoji: "🔥" };
  if (score >= 60) return { key: "media", label: "Oportunidade média", emoji: "🟡" };
  return { key: "baixa", label: "Baixa prioridade", emoji: "⚪" };
}

/** Frase objetiva com os sinais reais que tornam a empresa uma oportunidade. */
export function opportunityHeadline(business: Business) {
  const signals: string[] = [];
  if (!business.website) signals.push("sem site informado");
  else signals.push("site encontrado");
  if (business.phone) signals.push("telefone");
  if (normalizePhone(business.phone)) signals.push("WhatsApp provável");
  if (business.rating !== null && business.rating >= 4.5) signals.push("boa reputação");
  if (business.reviews !== null && business.reviews > 100) signals.push("muitas avaliações");
  return signals.join(" + ");
}

export function mainOpportunity(business: Business) {
  if (!business.website && normalizePhone(business.phone))
    return "Criar site e abordar direto pelo WhatsApp";
  if (!business.website) return "Criar a primeira presença online da empresa";
  if (business.rating !== null && business.rating >= 4.5)
    return "Transformar a boa reputação em um site mais profissional";
  return "Melhorar a apresentação digital existente";
}
