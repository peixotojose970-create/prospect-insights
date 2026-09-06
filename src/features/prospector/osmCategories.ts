/**
 * Mapeamento central entre termos de negócio (pt-BR) e tags do OpenStreetMap.
 * Nenhuma tag OSM deve ser escrita fora deste arquivo.
 */

export type OsmCategory = {
  /** rótulo exibido na interface */
  label: string;
  /** termos que o usuário pode digitar */
  aliases: string[];
  /** filtros OSM no formato [chave=valor] */
  tags: string[];
};

export const OSM_CATEGORIES: OsmCategory[] = [
  {
    label: "Barbearia",
    aliases: ["barbearia", "barbearias", "barbeiro", "barber"],
    tags: ["shop=hairdresser"],
  },
  {
    label: "Salão de beleza",
    aliases: ["salao de beleza", "saloes de beleza", "salao", "estetica", "beleza", "manicure", "cabeleireiro", "cabeleireira"],
    tags: ["shop=beauty"],
  },
  {
    label: "Clínica",
    aliases: ["clinica", "clinicas", "clinica medica", "consultorio", "medico", "fisioterapia", "psicologo", "psicologia"],
    tags: ["healthcare=clinic", "amenity=clinic"],
  },
  {
    label: "Dentista",
    aliases: ["dentista", "dentistas", "odontologia", "odonto"],
    tags: ["healthcare=dentist", "amenity=dentist"],
  },
  {
    label: "Restaurante",
    aliases: ["restaurante", "restaurantes", "comida", "almoco", "pizzaria", "pizzarias", "pizza", "churrascaria", "sushi", "japones", "marmitaria"],
    tags: ["amenity=restaurant"],
  },
  {
    label: "Lanchonete",
    aliases: ["lanchonete", "lanchonetes", "hamburgueria", "hamburguerias", "fast food", "burger", "pastelaria", "salgados", "acai"],
    tags: ["amenity=fast_food"],
  },
  {
    label: "Cafeteria",
    aliases: ["cafeteria", "cafeterias", "cafe", "cafes"],
    tags: ["amenity=cafe"],
  },
  {
    label: "Academia",
    aliases: ["academia", "academias", "ginastica", "crossfit", "musculacao", "pilates", "personal"],
    tags: ["leisure=fitness_centre"],
  },
  {
    label: "Pet shop",
    aliases: ["pet shop", "petshop", "pet", "pets"],
    tags: ["shop=pet"],
  },
  {
    label: "Clínica veterinária",
    aliases: ["veterinaria", "veterinario", "clinica veterinaria", "vet"],
    tags: ["amenity=veterinary"],
  },
  {
    label: "Oficina mecânica",
    aliases: ["oficina", "oficinas", "mecanica", "auto center", "funilaria"],
    tags: ["shop=car_repair"],
  },
  {
    label: "Farmácia",
    aliases: ["farmacia", "farmacias", "drogaria", "drogarias"],
    tags: ["amenity=pharmacy"],
  },
  {
    label: "Padaria",
    aliases: ["padaria", "padarias", "panificadora"],
    tags: ["shop=bakery"],
  },
  {
    label: "Advocacia",
    aliases: ["advocacia", "advogado", "advogados", "escritorio de advocacia"],
    tags: ["office=lawyer"],
  },
  {
    label: "Contabilidade",
    aliases: ["contabilidade", "contador", "escritorio de contabilidade"],
    tags: ["office=accountant"],
  },
  {
    label: "Imobiliária",
    aliases: ["imobiliaria", "imobiliarias", "corretor de imoveis"],
    tags: ["office=estate_agent"],
  },
  {
    label: "Loja de roupas",
    aliases: ["loja de roupas", "roupas", "moda", "boutique"],
    tags: ["shop=clothes"],
  },
  {
    label: "Mercado",
    aliases: ["mercado", "mercados", "supermercado", "mercearia"],
    tags: ["shop=supermarket", "shop=convenience"],
  },
  {
    label: "Hotel / pousada",
    aliases: ["hotel", "hoteis", "pousada", "pousadas", "hospedagem"],
    tags: ["tourism=hotel", "tourism=guest_house"],
  },
  {
    label: "Escola / curso",
    aliases: ["escola", "escolas", "curso", "cursos", "idiomas"],
    tags: ["amenity=school", "amenity=language_school"],
  },
];

export const CATEGORY_LABELS = OSM_CATEGORIES.map((c) => c.label);

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Correspondência estrita: apenas rótulo ou alias idêntico. */
export function findCategoryExact(term: string): OsmCategory | null {
  const t = normalize(term);
  if (!t) return null;
  return (
    OSM_CATEGORIES.find((c) => normalize(c.label) === t) ??
    OSM_CATEGORIES.find((c) => c.aliases.some((a) => normalize(a) === t)) ??
    null
  );
}

export function findCategory(term: string): OsmCategory | null {
  const t = normalize(term);
  if (!t) return null;
  return (
    OSM_CATEGORIES.find((c) => normalize(c.label) === t) ??
    OSM_CATEGORIES.find((c) => c.aliases.some((a) => normalize(a) === t)) ??
    OSM_CATEGORIES.find((c) =>
      [c.label, ...c.aliases].some((a) => {
        const n = normalize(a);
        return t.includes(n) || n.includes(t);
      }),
    ) ??
    null
  );
}

/** Rótulo legível a partir das tags OSM de um elemento. */
export function labelFromTags(tags: Record<string, string>): string {
  for (const category of OSM_CATEGORIES) {
    for (const tag of category.tags) {
      const [key, value] = tag.split("=");
      if (key && value && tags[key] === value) return category.label;
    }
  }
  const fallback =
    tags["shop"] ?? tags["amenity"] ?? tags["healthcare"] ?? tags["office"] ?? tags["leisure"] ?? tags["tourism"];
  return fallback ? fallback.replace(/_/g, " ") : "Não informado";
}
