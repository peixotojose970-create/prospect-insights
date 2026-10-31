/**
 * Segmentos com potencial para presença digital profissional.
 * Os termos são sugestões: a busca também aceita qualquer expressão digitada.
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
  { label: "Autoescolas e escolas", br: "autoescola", brExtra: ["escola", "curso profissionalizante", "escola de idiomas"], us: "driving school", usExtra: ["school", "training center"] },
  { label: "Oficinas e centros automotivos", br: "oficina mecânica", brExtra: ["auto center", "mecânica automotiva", "estética automotiva"], us: "auto repair shop", usExtra: ["auto service", "car detailing"] },
  { label: "Clínicas e consultórios", br: "clínica médica", brExtra: ["consultório", "clínica", "fisioterapia"], us: "medical clinic", usExtra: ["medical office", "physical therapy clinic"] },
  { label: "Dentistas e saúde", br: "dentista", brExtra: ["clínica odontológica", "odontologia", "consultório odontológico"], us: "dentist", usExtra: ["dental clinic"] },
  { label: "Pet shops e veterinária", br: "pet shop", brExtra: ["clínica veterinária", "veterinário", "banho e tosa"], us: "pet shop", usExtra: ["veterinary clinic", "pet grooming"] },
  { label: "Beleza, barbearia e estética", br: "salão de beleza", brExtra: ["barbearia", "clínica de estética", "manicure"], us: "hair salon", usExtra: ["barber shop", "beauty salon"] },
  { label: "Restaurantes e lanchonetes", br: "restaurante", brExtra: ["lanchonete", "hamburgueria", "pizzaria"], us: "restaurant", usExtra: ["fast food restaurant", "pizzeria"] },
  { label: "Cafeterias e açaí", br: "cafeteria", brExtra: ["açaiteria", "loja de açaí", "casa de açaí"], us: "cafe", usExtra: ["acai shop", "coffee shop"] },
  { label: "Energia solar", br: "energia solar", brExtra: ["energia fotovoltaica", "instalação de painéis solares"], us: "solar panel installer" },
  { label: "Elétrica, hidráulica e manutenção", br: "eletricista", brExtra: ["encanador", "desentupidora", "manutenção residencial"], us: "electrician", usExtra: ["plumber", "handyman"] },
  { label: "Construção e obras", br: "construtora", brExtra: ["empreiteira", "reformas e construção", "arquiteto"], us: "construction company", usExtra: ["general contractor", "remodeling contractor"] },
  { label: "Imobiliárias e corretores", br: "imobiliária", brExtra: ["corretor de imóveis", "administradora de imóveis"], us: "real estate agency", usExtra: ["real estate agent"] },
  { label: "Academias e atividades físicas", br: "academia", brExtra: ["estúdio de pilates", "crossfit", "personal trainer"], us: "gym", usExtra: ["fitness studio", "pilates studio"] },
  { label: "Lojas de bairro e varejo", br: "loja de bairro", brExtra: ["mercearia", "loja de roupas", "loja de móveis"], us: "local store", usExtra: ["clothing store", "furniture store"] },
  { label: "Profissionais e serviços locais", br: "prestador de serviços", brExtra: ["empresa de limpeza", "gráfica", "contabilidade"], us: "local service", usExtra: ["cleaning service", "print shop"] },
  { label: "Hotéis e turismo", br: "hotel", brExtra: ["pousada", "agência de turismo"], us: "hotel", usExtra: ["travel agency"] },
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
