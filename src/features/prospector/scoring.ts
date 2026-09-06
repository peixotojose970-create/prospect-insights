import type { Business, ScoreFactor } from "@/types";

/**
 * Lead Score calculado SOMENTE com dados realmente presentes na fonte.
 * Nada é inferido: sem nota Google, sem número de avaliações.
 */
export function scoreBusiness(
  business: Omit<Business, "score" | "scoreFactors">,
): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];

  if (!business.website) factors.push({ label: "Sem site informado na fonte", points: 30 });
  if (business.phone) factors.push({ label: "Telefone encontrado", points: 20 });
  if (business.street && business.houseNumber) factors.push({ label: "Endereço completo", points: 10 });
  else if (business.street) factors.push({ label: "Endereço parcial", points: 5 });
  if (business.city && business.state) factors.push({ label: "Localização completa", points: 10 });
  if (business.category !== "Não informado") factors.push({ label: "Categoria identificada", points: 10 });
  if (business.openingHours) factors.push({ label: "Horário de funcionamento", points: 5 });
  if (business.instagram) factors.push({ label: "Instagram informado", points: 5 });
  if (business.postalCode) factors.push({ label: "CEP informado", points: 5 });
  if (business.neighborhood) factors.push({ label: "Bairro informado", points: 5 });

  const score = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.points, 0),
  );
  return { score, factors };
}
