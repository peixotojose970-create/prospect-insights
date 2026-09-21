/**
 * Segmentos com alto potencial de compra de site institucional.
 * O termo de busca é uma única expressão que o Google Places interpreta bem
 * (sem palavras empilhadas, que diluem a consulta e trazem resultados genéricos).
 */
export type ProspectSegment = {
  label: string;
  br: string;
  us: string;
};

export const PROSPECT_SEGMENTS: ProspectSegment[] = [
  { label: "Energia solar", br: "energia solar", us: "solar panel installer" },
  { label: "Oficinas", br: "oficina mecânica", us: "auto repair shop" },
  { label: "Eletricistas", br: "eletricista", us: "electrician" },
  { label: "Encanadores", br: "encanador", us: "plumber" },
  { label: "Construção", br: "construtora", us: "construction company" },
  { label: "Marcenarias", br: "marcenaria", us: "carpenter" },
  { label: "Vidraçarias", br: "vidraçaria", us: "glass company" },
  { label: "Clínicas", br: "clínica", us: "medical clinic" },
  { label: "Salões de beleza", br: "salão de beleza", us: "hair salon" },
  { label: "Restaurantes", br: "restaurante", us: "restaurant" },
  { label: "Imobiliárias", br: "imobiliária", us: "real estate agency" },
  { label: "Empresas de limpeza", br: "empresa de limpeza", us: "cleaning company" },
  { label: "Academias", br: "academia de ginástica", us: "gym" },
  { label: "Fotógrafos", br: "estúdio fotográfico", us: "photographer" },
  { label: "Segurança", br: "empresa de segurança eletrônica", us: "security company" },
];

/** Descobre o segmento correspondente a um termo de busca já aplicado. */
export function segmentByTerm(term: string, isUS: boolean) {
  const t = term.trim().toLowerCase();
  return PROSPECT_SEGMENTS.find((s) => (isUS ? s.us : s.br).toLowerCase() === t) ?? null;
}
