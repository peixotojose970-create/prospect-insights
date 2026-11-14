import { expect,it } from "vitest";
import { parseBrazilCursor } from "./brazil-cursor";
it("reproduz continuação por consulta e página sem misturar pesquisas",()=>{
 const cursor={fingerprint:"same",query:1,page:2,token:"google-token"};
 expect(parseBrazilCursor(JSON.stringify(cursor),"same")).toEqual(cursor);
 expect(()=>parseBrazilCursor(JSON.stringify(cursor),"other")).toThrow("mudou");
});