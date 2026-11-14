import { expect,it } from "vitest";
import { googlePermissionMessage } from "./google-errors";
it("erro 403 não JSON mantém a recusa sem quebrar leitura",()=>expect(googlePermissionMessage(403,"Forbidden")).toContain("403"));
it("restrição de servidor informa correção exata",()=>expect(googlePermissionMessage(403,JSON.stringify({error:{details:[{reason:"API_KEY_HTTP_REFERRER_BLOCKED"}]}}))).toContain("IP"));