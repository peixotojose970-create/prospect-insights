import type { Business, ScoreFactor } from "@/types";

/**
 * Lead Score calculado SOMENTE com dados realmente retornados pelo Google Places.
 * Nada é inferido nem inventado.
 */
export function scoreBusiness(
  business: Omit<Business, "score" | "scoreFactors">,
): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];

  if (!business.website) factors.push({ label: "Site não informado (a verificar)", points: 30 });
  if (business.phone) factors.push({ label: "Telefone encontrado", points: 20 });
  if (business.rating !== null && business.rating >= 4) factors.push({ label: "Boa avaliação no Google", points: 10 });
  if (business.reviews !== null && business.reviews >= 30)
    factors.push({ label: "Volume relevante de avaliações", points: 10 });
  if (business.street && business.houseNumber) factors.push({ label: "Endereço completo", points: 10 });
  else if (business.street) factors.push({ label: "Endereço parcial", points: 5 });
  if (business.city && business.state) factors.push({ label: "Localização completa", points: 10 });
  if (business.category !== "Não informado") factors.push({ label: "Categoria identificada", points: 10 });
  if (business.openingHours) factors.push({ label: "Horário de funcionamento", points: 5 });
  if (business.photoRefs.length > 0) factors.push({ label: "Fotos disponíveis", points: 5 });
  if (business.postalCode) factors.push({ label: "CEP informado", points: 5 });
  if (business.neighborhood) factors.push({ label: "Bairro informado", points: 5 });

  const score = Math.min(
    100,
    factors.reduce((sum, f) => sum + f.points, 0),
  );
  return { score, factors };
}
