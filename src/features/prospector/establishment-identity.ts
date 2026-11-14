import type { Business } from "@/types";
import type { fingerprints } from "./contacted";
type Identity = Parameters<typeof fingerprints>[0];
const norm=(value:string|null|undefined)=>(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
export function establishmentKeys(b: Identity) {
  const id=b.placeId||b.externalId||b.id;
  const keys=id?[`id:${id}`]:[];
  const name=norm(b.name),address=norm(b.address);
  if(name&&address) keys.push(`na:${name}|${address}`);
  return keys;
}
export function isEstablishmentContacted(b: Identity, marks:Set<string>) { return establishmentKeys(b).some(key=>marks.has(key)); }
export function sameEstablishment(a: Business,b: Business) { return establishmentKeys(a).some(key=>establishmentKeys(b).includes(key)); }