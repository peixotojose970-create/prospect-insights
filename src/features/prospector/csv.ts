import Papa from "papaparse";
import { isProspectCountry } from "@/data/countries";
import { LEAD_STATUSES, type Lead } from "@/types";

const columns = ["id","place_id","external_id","empresa","categoria","endereco","bairro","cidade","estado","cep","telefone","site","instagram","horario","latitude","longitude","score","status","fonte","source_url","salvo_em","pais","email","nota","avaliacoes","maps_url","notas","ultimo_contato","proximo_followup","tags","favorito","proxima_acao","history_json"];
const number = (value: string, fallback=0) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : fallback;
function csvIdentity(fields: string[]) {
  let hash=2166136261;
  for (const char of fields.join("|")) hash=Math.imul(hash ^ char.charCodeAt(0),16777619);
  return `csv-${(hash>>>0).toString(36)}`;
}
export function exportLeadsCsv(leads: Lead[]) {
  const data = leads.map(l=>[l.id,l.placeId,l.externalId,l.name,l.category,l.address,l.neighborhood,l.city,l.state,l.postalCode,l.phone,l.website,l.instagram,l.openingHours,l.latitude,l.longitude,l.score,l.status,l.source,l.sourceUrl,l.savedAt,l.country,l.email,l.rating,l.reviews,l.mapsUrl,l.notes,l.lastContact,l.nextFollowUp,JSON.stringify(l.tags??[]),String(l.favorite??false),l.nextAction,JSON.stringify(l.history)]);
  return Papa.unparse({ fields: columns, data }, { quotes: true, escapeFormulae: true });
}
export function importLeadsCsv(text: string): Lead[] {
  if(text.length>20_000_000) throw new Error("Arquivo CSV excede 20 MB.");
  const parsed=Papa.parse<Record<string,string>>(text.replace(/^\uFEFF/,""),{header:true,skipEmptyLines:"greedy",transformHeader:h=>h.trim().toLowerCase()});
  if(parsed.errors.length || !parsed.meta.fields?.includes("empresa")) throw new Error("CSV inválido: confira cabeçalhos, aspas e quantidade de colunas.");
  return parsed.data.filter(row=>row["empresa"]?.trim()).map(row=> {
    const get=(key:string)=>row[key]??"";
    const nullable=(key:string)=>get(key).trim()||null;
    const id=get("id")||get("place_id")||get("external_id")||csvIdentity([get("empresa"),get("endereco"),get("cidade"),get("telefone"),get("pais")]);
    const status=LEAD_STATUSES.find(s=>s.value===get("status"))?.value??"novo";
    let history: Lead["history"]=[],tags:string[]=[];
    if(get("history_json")) { const value=JSON.parse(get("history_json")); if(!Array.isArray(value)||value.some(v=>!v||typeof v.id!=="string"||typeof v.date!=="string"||typeof v.label!=="string")) throw new Error("Histórico inválido no CSV."); history=value; }
    if(get("tags")) { const value=JSON.parse(get("tags")); if(!Array.isArray(value)||value.some(v=>typeof v!=="string")) throw new Error("Tags inválidas no CSV."); tags=value; }
    const country=get("pais");
    return { id,placeId:get("place_id"),externalId:get("external_id")||id,source:get("fonte")||"Importado (CSV)",sourceUrl:nullable("source_url"),mapsUrl:nullable("maps_url"),name:get("empresa").trim(),category:get("categoria")||"Não informado",address:nullable("endereco"),street:null,houseNumber:null,neighborhood:nullable("bairro"),city:nullable("cidade"),state:nullable("estado"),postalCode:nullable("cep"),phone:nullable("telefone"),website:nullable("site"),instagram:nullable("instagram"),openingHours:nullable("horario"),country:isProspectCountry(country)?country:"BR",email:nullable("email"),latitude:number(get("latitude")),longitude:number(get("longitude")),score:number(get("score")),rating:get("nota").trim()?number(get("nota")):null,reviews:get("avaliacoes").trim()?number(get("avaliacoes")):null,scoreFactors:[],photoRefs:[],photoAttributions:[],status,savedAt:get("salvo_em")||new Date().toISOString(),notes:get("notas"),lastContact:nullable("ultimo_contato"),nextFollowUp:nullable("proximo_followup"),nextAction:nullable("proxima_acao"),tags,favorite:get("favorito")==="true",history };
  });
}