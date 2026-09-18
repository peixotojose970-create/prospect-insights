/**
 * Segmentos com alto potencial de compra de site institucional.
 * Cada item traz o termo de busca usado no Brasil e nos EUA.
 */
export type ProspectSegment = {
  label: string;
  br: string;
  us: string;
};

export const PROSPECT_SEGMENTS: ProspectSegment[] = [
  { label: "Energia solar", br: "energia solar painel solar", us: "solar panel installer" },
  { label: "Oficinas", br: "oficina mecanica", us: "auto repair shop" },
  { label: "Eletricistas", br: "eletricista", us: "electrician" },
  { label: "Encanadores", br: "encanador", us: "plumber" },
  { label: "Construção", br: "empresa de construcao civil", us: "construction company" },
  { label: "Marcenarias", br: "marcenaria", us: "carpenter woodworking" },
  { label: "Vidraçarias", br: "vidracaria", us: "glass company" },
  { label: "Clínicas", br: "clinica", us: "clinic" },
  { label: "Salões de beleza", br: "salao de beleza", us: "hair salon" },
  { label: "Restaurantes", br: "restaurante", us: "restaurant" },
  { label: "Imobiliárias", br: "imobiliaria", us: "real estate agency" },
  { label: "Empresas de limpeza", br: "empresa de limpeza", us: "cleaning company" },
  { label: "Academias", br: "academia", us: "gym" },
  { label: "Fotógrafos", br: "fotografo estudio fotografico", us: "photographer" },
  { label: "Segurança", br: "empresa de seguranca eletronica", us: "security company" },
];
