import { z } from "zod";
const schema=z.object({ fingerprint:z.string().max(5000),query:z.number().int().min(0).max(6),page:z.number().int().min(0).max(2),token:z.string().max(2000).optional() });
export function parseBrazilCursor(raw:string|undefined,fingerprint:string) {
  const cursor=raw?schema.parse(JSON.parse(raw)):{fingerprint,query:0,page:0,token:undefined};
  if(cursor.fingerprint!==fingerprint) throw new Error("A pesquisa mudou. Inicie uma nova busca.");
  return cursor;
}