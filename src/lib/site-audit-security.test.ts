import { afterEach, expect, it, vi } from "vitest";
import { isPublicAddress, validateSiteUrl, verifyPublicDns, readLimitedHtml, fetchPublicSite } from "./site-audit-security.server";
afterEach(() => vi.unstubAllGlobals());
it("bloqueia redes privadas, locais e reservadas IPv4 e IPv6", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "169.254.169.254", "100.64.0.1", "192.168.1.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"]) expect(isPublicAddress(ip), ip).toBe(false);
  expect(isPublicAddress("8.8.8.8")).toBe(true);
});
it("recusa credenciais, portas e URLs locais antes da saída", () => {
  for (const url of ["http://127.1", "http://2130706433", "http://[::1]", "https://user:pass@public.org", "https://public.org:444", "http://metadata.google.internal", "file:///tmp/a"]) expect(() => validateSiteUrl(url)).toThrow();
});
it("recusa DNS misto com endereço privado", async () => {
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({ Status: 0, Answer: [{ type: 1, data: "8.8.8.8" }, { type: 28, data: "::1" }] }))));
  await expect(verifyPublicDns(new URL("https://public.org"), AbortSignal.timeout(1000))).rejects.toThrow("públicos");
});
it("interrompe leitura e cancela ao atingir 400000 bytes", async () => {
  const cancel = vi.fn();
  const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(500000).fill(65)); }, cancel }));
  expect((await readLimitedHtml(response, 400000)).length).toBe(400000);
  expect(cancel).toHaveBeenCalledOnce();
});
it("não segue redirecionamento para rede privada", async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "http://127.0.0.1" } }));
  vi.stubGlobal("fetch", request);
  await expect(fetchPublicSite("https://8.8.8.8", AbortSignal.timeout(1000))).rejects.toThrow();
  expect(request).toHaveBeenCalledOnce();
  expect(request.mock.calls[0]?.[1]?.redirect).toBe("manual");
});
it("encerra ciclos de redirecionamento", async () => {
  const request = vi.fn().mockImplementation(async () => new Response(null, { status: 302, headers: { location: "https://8.8.8.8" } }));
  vi.stubGlobal("fetch", request);
  await expect(fetchPublicSite("https://8.8.8.8", AbortSignal.timeout(1000))).rejects.toThrow("repetidos");
  expect(request).toHaveBeenCalledOnce();
});
it("propaga o cancelamento total sem nova tentativa", async () => {
  const request = vi.fn().mockImplementation(async (_url, init) => { init.signal.throwIfAborted(); });
  vi.stubGlobal("fetch", request);
  await expect(fetchPublicSite("https://8.8.8.8", AbortSignal.abort())).rejects.toThrow();
  expect(request).toHaveBeenCalledOnce();
});
it("revalida DNS de cada destino antes de seguir redirecionamentos", async () => {
  const siteRequests: string[] = [];
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) => {
    if (url.startsWith("https://cloudflare-dns.com/")) {
      const address = new URL(url).searchParams.get("name") === "public.org" ? "8.8.8.8" : "169.254.169.254";
      return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 1, data: address }] }));
    }
    siteRequests.push(url);
    return new Response(null, { status: 302, headers: { location: "https://other.org" } });
  }));
  await expect(fetchPublicSite("https://public.org", AbortSignal.timeout(1000))).rejects.toThrow("públicos");
  expect(siteRequests).toEqual(["https://public.org/"]);
});