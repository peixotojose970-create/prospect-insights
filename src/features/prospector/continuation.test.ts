import { expect,it } from "vitest";
import { nextCriteria,updateContinuations } from "./continuation";
import type { SearchCriteria,SearchOutcome } from "@/types";
const a:SearchCriteria={category:"eletricista",city:"Campinas",state:"SP"};
const outcome=(token:string|null):SearchOutcome=>({businesses:[],total:0,truncated:!!token,cached:false,areaLabel:"Campinas",nextPageToken:token});
it("continuação de A permanece quando B esgota",()=>{
 const queue=updateContinuations([],a,outcome("token-a"));
 expect(updateContinuations(queue,{...a,category:"encanador"},outcome(null))).toEqual([{...a,pageToken:"token-a"}]);
});
it("troca de lote remove token antigo e avança somente após sucesso",()=>{
 const result=nextCriteria({...a,pageToken:"old",discoveryOffset:3},{...outcome(null),coverage:{hasMoreAreas:true,queries:1,requests:1,rawResults:0,duplicatesRemoved:0,notes:[]}});
 expect(result).toEqual({...a,discoveryOffset:6});
});