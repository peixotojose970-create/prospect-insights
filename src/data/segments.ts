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

/** Categorias de pequenos negócios locais dos EUA — nomes e termos de busca em inglês. */
export type USProspectSegment = {
  label: string;
  /** Termo principal enviado à Places API. */
  term: string;
  /** Variações do mesmo ramo (consultas complementares). */
  extra?: string[];
};

export const US_PROSPECT_SEGMENTS: USProspectSegment[] = [
  { label: "Cleaning services", term: "cleaning service", extra: ["house cleaning", "maid service", "commercial cleaning", "janitorial service"] },
  { label: "Lawn care & landscaping", term: "lawn care service", extra: ["lawn mowing", "landscaping", "tree service"] },
  { label: "Pressure washing & window cleaning", term: "pressure washing", extra: ["window cleaning service"] },
  { label: "Barbershops", term: "barbershop" },
  { label: "Hair & beauty salons", term: "hair salon", extra: ["beauty salon"] },
  { label: "Nail salons", term: "nail salon" },
  { label: "Auto detailing & car wash", term: "auto detailing", extra: ["car wash"] },
  { label: "Auto repair & mobile mechanics", term: "auto repair shop", extra: ["mobile mechanic"] },
  { label: "Towing & tire shops", term: "towing service", extra: ["tire shop"] },
  { label: "Plumbers", term: "plumber" },
  { label: "Electricians", term: "electrician" },
  { label: "HVAC", term: "hvac contractor" },
  { label: "Roofing", term: "roofing contractor" },
  { label: "Handyman & general contractors", term: "handyman", extra: ["general contractor"] },
  { label: "Painters & flooring", term: "painter", extra: ["flooring contractor"] },
  { label: "Pest control", term: "pest control service" },
  { label: "Pool service", term: "pool cleaning service" },
  { label: "Moving & junk removal", term: "moving company", extra: ["junk removal"] },
  { label: "Fence, concrete & garage door", term: "fence contractor", extra: ["concrete contractor", "garage door repair"] },
  { label: "Locksmith & appliance repair", term: "locksmith", extra: ["appliance repair"] },
  { label: "Tattoo shops", term: "tattoo shop" },
  { label: "Pet grooming & dog boarding", term: "pet grooming", extra: ["dog boarding"] },
  { label: "Personal trainers & yoga studios", term: "personal trainer", extra: ["yoga studio"] },
  { label: "Massage & spas", term: "massage therapist", extra: ["day spa"] },
  { label: "Photographers & event services", term: "photographer", extra: ["event planner"] },
  { label: "Restaurants & food trucks", term: "restaurant", extra: ["food truck"] },
  { label: "Bakeries, coffee shops & catering", term: "bakery", extra: ["coffee shop", "catering service"] },
  { label: "Daycare & tutoring", term: "daycare", extra: ["tutoring service"] },
  { label: "Driving schools", term: "driving school" },
];

/** Descobre o segmento correspondente a um termo de busca já aplicado. */
export function segmentByTerm(term: string, isUS: boolean) {
  const t = term.trim().toLowerCase();
  if (isUS) {
    const us = US_PROSPECT_SEGMENTS.find((s) => s.term.toLowerCase() === t || s.label.toLowerCase() === t);
    if (us) return { label: us.label, br: "", us: us.term };
  }
  return PROSPECT_SEGMENTS.find((s) => (isUS ? s.us : s.br).toLowerCase() === t) ?? null;
}

/** Consultas complementares do segmento (somente termos do mesmo ramo). */
export function relatedTerms(term: string, isUS: boolean): string[] {
  const t = term.trim().toLowerCase();
  if (isUS) {
    const us = US_PROSPECT_SEGMENTS.find((s) => s.term.toLowerCase() === t || s.label.toLowerCase() === t);
    if (us) return us.extra ?? [];
  }
  const seg = segmentByTerm(term, isUS);
  return (isUS ? seg?.usExtra : seg?.brExtra) ?? [];
}
