/**
 * Segmentos com alto potencial de compra de site institucional.
 * O termo de busca é uma única expressão que o Google Places interpreta bem
 * (sem palavras empilhadas, que diluem a consulta e trazem resultados genéricos).
 */
export type ProspectSegment = {
  label: string;
  br: string;
  us: string;
  /** Termos equivalentes usados como consultas complementares (ampliam a cobertura). */
  brExtra?: string[];
  usExtra?: string[];
};

export const PROSPECT_SEGMENTS: ProspectSegment[] = [
  { label: "Energia solar", br: "energia solar", brExtra: ["placas solares","energia fotovoltaica"], us: "solar panel installer" },
  { label: "Oficinas", br: "oficina mecânica", brExtra: ["auto center","mecânica automotiva"], us: "auto repair shop" },
  { label: "Eletricistas", br: "eletricista", brExtra: ["serviços elétricos","instalações elétricas"], us: "electrician" },
  { label: "Encanadores", br: "encanador", brExtra: ["desentupidora","serviços hidráulicos"], us: "plumber" },
  { label: "Construção", br: "construtora", brExtra: ["empreiteira","reformas e construção"], us: "construction company" },
  { label: "Marcenarias", br: "marcenaria", brExtra: ["móveis planejados","marceneiro"], us: "carpenter" },
  { label: "Vidraçarias", br: "vidraçaria", brExtra: ["vidros temperados","box para banheiro"], us: "glass company" },
  { label: "Clínicas", br: "clínica", brExtra: ["consultório médico","clínica médica"], us: "medical clinic" },
  { label: "Salões de beleza", br: "salão de beleza", brExtra: ["cabeleireiro","barbearia"], us: "hair salon" },
  { label: "Restaurantes", br: "restaurante", brExtra: ["lanchonete","pizzaria"], us: "restaurant" },
  { label: "Imobiliárias", br: "imobiliária", brExtra: ["corretor de imóveis","administradora de imóveis"], us: "real estate agency" },
  { label: "Empresas de limpeza", br: "empresa de limpeza", brExtra: ["limpeza pós obra","diarista"], us: "cleaning company" },
  { label: "Academias", br: "academia de ginástica", brExtra: ["academia","crossfit"], us: "gym" },
  { label: "Fotógrafos", br: "estúdio fotográfico", brExtra: ["fotógrafo","fotografia de eventos"], us: "photographer" },
  { label: "Segurança", br: "empresa de segurança eletrônica", brExtra: ["câmeras de segurança","alarmes e monitoramento"], us: "security company" },
];

/** Descobre o segmento correspondente a um termo de busca já aplicado. */
export function segmentByTerm(term: string, isUS: boolean) {
  const t = term.trim().toLowerCase();
  return PROSPECT_SEGMENTS.find((s) => (isUS ? s.us : s.br).toLowerCase() === t) ?? null;
}

/** Consultas complementares do segmento (somente termos do mesmo ramo). */
export function relatedTerms(term: string, isUS: boolean): string[] {
  const seg = segmentByTerm(term, isUS);
  return (isUS ? seg?.usExtra : seg?.brExtra) ?? [];
}
