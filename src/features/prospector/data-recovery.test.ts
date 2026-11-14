import { expect,it } from "vitest";
import { createCompleteBackup,parseBackup,restoreCompleteBackup,RECOVERY_KEY } from "./backup";
import { exportLeadsCsv,importLeadsCsv } from "./csv";
import { isEstablishmentContacted } from "./establishment-identity";
function storage():Storage {
 const values=new Map<string,string>();
 return {get length(){return values.size;},key:i=>[...values.keys()][i]??null,getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);},removeItem:k=>{values.delete(k);},clear:()=>values.clear()};
}
it("reproduz e corrige CSV com vazios e endereço em várias linhas",()=>{
 const leads=importLeadsCsv('empresa,categoria,endereco,cidade\n"Alpha",,"Primeira linha\nSegunda linha",Boston');
 expect(leads).toHaveLength(1); expect(leads[0]?.city).toBe("Boston"); expect(leads[0]?.address).toBe("Primeira linha\nSegunda linha");
});
it("CSV preserva status, contato, email, tags e histórico na ida e volta",()=>{
 const leads=importLeadsCsv('empresa,categoria,status,email,ultimo_contato,notas\nAlpha,Cafe,negociacao,info@alpha.org,2026-11-14,"Nota, com vírgula"');
 const round=importLeadsCsv(exportLeadsCsv(leads));
 expect(round[0]?.status).toBe("negociacao");expect(round[0]?.notes).toBe("Nota, com vírgula");expect(round[0]?.email).toBe("info@alpha.org");expect(round[0]?.lastContact).toBe("2026-11-14");expect(round[0]?.id).toBe(leads[0]?.id);
});
it("identidades importadas são únicas e repetíveis sem external id falso",()=>{
 const text='empresa,cidade\nAlpha,Boston\nBeta,Boston';
 const leads=importLeadsCsv(text); expect(leads[0]?.externalId).not.toBe(leads[1]?.externalId); expect(importLeadsCsv(text)[0]?.id).toBe(leads[0]?.id);
});
it("CSV rejeita aspas incompletas antes de salvar",()=>expect(()=>importLeadsCsv('empresa,categoria\n"Alpha,Cafe')).toThrow());
it("backup inclui modelos, países, abordados e exclui sessão",()=>{
 const s=storage();s.setItem("prospector:templates:v1",JSON.stringify({overrides:{},custom:[{id:"one",title:"Um",first:"Oi",second:"Proposta"}]}));
 s.setItem("prospector:country-preferences:v1",JSON.stringify({country:"PT",countries:{PT:{style:"custom:one",language:"pt-PT"}}}));
 s.setItem("prospector:contacted:v1",'["id:one"]');s.setItem("sb-private-auth-token","secret");
 const backup=createCompleteBackup(s);expect(Object.keys(backup.entries)).toHaveLength(3);expect(JSON.stringify(backup)).not.toContain("secret");
 const target=storage();target.setItem("prospector:contacted:v1",'["id:existing"]');restoreCompleteBackup(target,parseBackup(JSON.stringify(backup)));
 expect(JSON.parse(target.getItem("prospector:contacted:v1")??"[]")).toEqual(["id:existing","id:one"]);expect(target.getItem(RECOVERY_KEY)).not.toBeNull();expect(target.getItem("prospector:templates:v1")).toBe(s.getItem("prospector:templates:v1"));
});
it("backup com lead nulo é rejeitado sem alterar armazenamento",()=>expect(()=>parseBackup(JSON.stringify({format:"prospector-backup-v1",data:{leads:[null]}}))).toThrow());
it("filiais com domínio compartilhado não são ocultadas indevidamente",()=>{
 const branch={id:"branch-two",externalId:"branch-two",placeId:"branch-two",name:"Franquia",address:"Rua Dois",phone:"+1 2125551234",website:"https://franchise.org"};
 expect(isEstablishmentContacted(branch,new Set(["id:branch-one","site:franchise.org","tel:2125551234"]))).toBe(false);
 expect(isEstablishmentContacted(branch,new Set(["id:branch-two"]))).toBe(true);
});
it("falha de gravação restaura chaves anteriores",()=>{
 const s=storage();s.setItem("prospector:contacted:v1",'["id:original"]');
 const write=s.setItem;let failed=false;
 s.setItem=(key,value)=>{if(key==="prospector:country:v1"&&!failed){failed=true;throw new Error("quota");}write(key,value);};
 expect(()=>restoreCompleteBackup(s,{format:"prospector-backup-v2",createdAt:"",entries:{"prospector:contacted:v1":'["id:new"]',"prospector:country:v1":"PT"}})).toThrow("mantidos");
 expect(s.getItem("prospector:contacted:v1")).toBe('["id:original"]');expect(s.getItem("prospector:country:v1")).toBeNull();
});