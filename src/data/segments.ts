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

/** Categorias de pequenos negócios americanos (nomes e termos em inglês). */
export const US_SEGMENTS: ProspectSegment[] = [
  { label: "Cleaning services", br: "", us: "house cleaning", usExtra: ["maid service", "commercial cleaning", "janitorial service"] },
  { label: "Lawn care & landscaping", br: "", us: "lawn care", usExtra: ["landscaping", "tree service"] },
  { label: "Pressure washing & window cleaning", br: "", us: "pressure washing", usExtra: ["window cleaning"] },
  { label: "Barbershops", br: "", us: "barber shop", usExtra: [] },
  { label: "Hair & beauty salons", br: "", us: "hair salon", usExtra: ["beauty salon"] },
  { label: "Nail salons", br: "", us: "nail salon", usExtra: [] },
  { label: "Auto detailing & car wash", br: "", us: "auto detailing", usExtra: ["car wash"] },
  { label: "Auto repair & mobile mechanics", br: "", us: "auto repair shop", usExtra: ["mobile mechanic"] },
  { label: "Towing & tire shops", br: "", us: "towing service", usExtra: ["tire shop"] },
  { label: "Plumbers", br: "", us: "plumber", usExtra: [] },
  { label: "Electricians", br: "", us: "electrician", usExtra: [] },
  { label: "HVAC", br: "", us: "hvac contractor", usExtra: [] },
  { label: "Roofing", br: "", us: "roofing contractor", usExtra: [] },
  { label: "Handyman & general contractors", br: "", us: "handyman", usExtra: ["general contractor"] },
  { label: "Painters & flooring", br: "", us: "house painter", usExtra: ["flooring contractor"] },
  { label: "Pest control", br: "", us: "pest control service", usExtra: [] },
  { label: "Pool service", br: "", us: "pool cleaning service", usExtra: [] },
  { label: "Moving & junk removal", br: "", us: "moving company", usExtra: ["junk removal"] },
  { label: "Fence, concrete & garage door", br: "", us: "fence contractor", usExtra: ["concrete contractor", "garage door repair"] },
  { label: "Locksmith & appliance repair", br: "", us: "locksmith", usExtra: ["appliance repair"] },
  { label: "Tattoo shops", br: "", us: "tattoo shop", usExtra: [] },
  { label: "Pet grooming & dog boarding", br: "", us: "pet grooming", usExtra: ["dog boarding"] },
  { label: "Personal trainers & yoga studios", br: "", us: "personal trainer", usExtra: ["yoga studio"] },
  { label: "Massage & spas", br: "", us: "massage therapist", usExtra: ["day spa"] },
  { label: "Photographers & event services", br: "", us: "photographer", usExtra: ["event planner"] },
  { label: "Restaurants & food trucks", br: "", us: "restaurant", usExtra: ["food truck"] },
  { label: "Bakeries, coffee shops & catering", br: "", us: "bakery", usExtra: ["coffee shop", "catering service"] },
  { label: "Daycare & tutoring", br: "", us: "daycare", usExtra: ["tutoring service"] },
  { label: "Driving schools", br: "", us: "driving school", usExtra: [] },
];

/** Descobre o segmento correspondente a um termo de busca já aplicado. */
export function segmentByTerm(term: string, isUS: boolean, country?: string) {
  const t = term.trim().toLowerCase();
  if (country && country !== "BR" && country !== "US") return segmentsForCountry(country).find((s) => s.us.toLowerCase() === t) ?? null;
  return isUS ? US_SEGMENTS.find((s) => s.us.toLowerCase() === t) ?? null : PROSPECT_SEGMENTS.find((s) => s.br.toLowerCase() === t) ?? null;
}

/** Consultas complementares do segmento (somente termos do mesmo ramo). */
export function relatedTerms(term: string, isUS: boolean): string[] {
  const seg = segmentByTerm(term, isUS);
  return (isUS ? seg?.usExtra : seg?.brExtra) ?? [];
}

/** Países europeus com busca no idioma local (mesma integração do Google Places). */
export type EuropeCountry = "PT" | "ES" | "FR" | "IT";

/** [rótulo, termo principal, termos complementares] por país, no idioma local. */
const EU_TERMS: Record<EuropeCountry, [string, string, string[]][]> = {
  PT: [
    ["Barbearias", "barbearia", []], ["Salões de beleza", "salão de beleza", ["cabeleireiro"]], ["Lavagem automóvel", "lavagem automóvel", []],
    ["Jardinagem", "jardinagem", []], ["Limpeza", "empresa de limpeza", ["limpezas"]], ["Oficinas automóveis", "oficina automóvel", ["mecânico"]],
    ["Eletricistas", "eletricista", []], ["Canalizadores", "canalizador", []], ["Construção e obras", "empresa de construção", ["remodelações"]],
    ["Clínicas", "clínica", ["clínica dentária"]], ["Restaurantes", "restaurante", []], ["Imobiliárias", "imobiliária", ["agência imobiliária"]],
    ["Ginásios", "ginásio", ["personal trainer"]], ["Fotógrafos", "fotógrafo", []], ["Painéis solares", "painéis solares", ["energia solar"]],
  ],
  ES: [
    ["Barberías", "barbería", []], ["Peluquerías", "peluquería", ["salón de belleza"]], ["Lavado de coches", "lavado de coches", []],
    ["Jardinería", "jardinería", []], ["Limpieza", "empresa de limpieza", []], ["Talleres mecánicos", "taller mecánico", []],
    ["Electricistas", "electricista", []], ["Fontaneros", "fontanero", []], ["Construcción y reformas", "empresa de construcción", ["reformas"]],
    ["Clínicas", "clínica", ["clínica dental"]], ["Restaurantes", "restaurante", []], ["Inmobiliarias", "inmobiliaria", []],
    ["Gimnasios", "gimnasio", ["entrenador personal"]], ["Fotógrafos", "fotógrafo", []], ["Placas solares", "instalación de placas solares", ["energía solar"]],
  ],
  FR: [
    ["Barbiers", "barbier", []], ["Salons de coiffure", "salon de coiffure", ["institut de beauté"]], ["Lavage auto", "lavage auto", []],
    ["Jardinage", "jardinage", ["paysagiste"]], ["Nettoyage", "entreprise de nettoyage", []], ["Garages automobiles", "garage automobile", []],
    ["Électriciens", "électricien", []], ["Plombiers", "plombier", []], ["Construction et rénovation", "entreprise de construction", ["rénovation"]],
    ["Cliniques", "clinique", ["cabinet dentaire"]], ["Restaurants", "restaurant", []], ["Agences immobilières", "agence immobilière", []],
    ["Salles de sport", "salle de sport", ["coach sportif"]], ["Photographes", "photographe", []], ["Panneaux solaires", "installateur panneaux solaires", []],
  ],
  IT: [
    ["Barbieri", "barbiere", []], ["Parrucchieri", "parrucchiere", ["centro estetico"]], ["Autolavaggi", "autolavaggio", []],
    ["Giardinaggio", "giardinaggio", []], ["Pulizie", "impresa di pulizie", []], ["Officine meccaniche", "officina meccanica", []],
    ["Elettricisti", "elettricista", []], ["Idraulici", "idraulico", []], ["Edilizia e ristrutturazioni", "impresa edile", ["ristrutturazioni"]],
    ["Cliniche", "clinica", ["studio dentistico"]], ["Ristoranti", "ristorante", []], ["Agenzie immobiliari", "agenzia immobiliare", []],
    ["Palestre", "palestra", ["personal trainer"]], ["Fotografi", "fotografo", []], ["Pannelli solari", "installazione pannelli solari", []],
  ],
};

/** Segmentos de cada país europeu; o termo local fica em `us` (caminho internacional). */
export const EU_SEGMENTS: Record<EuropeCountry, ProspectSegment[]> = Object.fromEntries(
  (Object.keys(EU_TERMS) as EuropeCountry[]).map((c) => [c, EU_TERMS[c].map(([label, term, extra]) => ({ label, br: "", us: term, usExtra: extra }))]),
) as Record<EuropeCountry, ProspectSegment[]>;

/** Lista de segmentos usada na tela para o país escolhido. */
export function segmentsForCountry(country: string): ProspectSegment[] {
  if (country === "US") return US_SEGMENTS;
  if (country in EU_SEGMENTS) return EU_SEGMENTS[country as EuropeCountry];
  return PROSPECT_SEGMENTS;
}
