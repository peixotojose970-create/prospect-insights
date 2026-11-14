import ipaddr from "ipaddr.js";

export function isPublicAddress(address: string) {
  try {
    const parsed = ipaddr.process(address.replace(/^\[|\]$/g, ""));
    return parsed.range() === "unicast";
  } catch { return false; }
}

export function validateSiteUrl(raw: string) {
  const target = new URL(raw.includes("://") ? raw : `https://${raw}`);
  const host = target.hostname.toLowerCase().replace(/\.$/, "");
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.port || host === "localhost" || !host.includes(".") || /\.(localhost|local|internal|test|invalid|example)$/.test(host)) throw new Error("O destino do site não é permitido.");
  if (ipaddr.isValid(host.replace(/^\[|\]$/g, "")) && !isPublicAddress(host)) throw new Error("O destino do site não é público.");
  return target;
}

export async function verifyPublicDns(target: URL, signal: AbortSignal) {
  const host = target.hostname.replace(/^\[|\]$/g, "");
  if (ipaddr.isValid(host)) {
    if (!isPublicAddress(host)) throw new Error("O destino do site não é público.");
    return;
  }
  const records = await Promise.all(["A", "AAAA"].map(async (type) => {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, { headers: { accept: "application/dns-json" }, signal, redirect: "error" });
    if (!response.ok) throw new Error("Não foi possível validar o endereço do site.");
    const body = await response.json() as { Status?: number; Answer?: { type: number; data: string }[] };
    if (body.Status !== 0) throw new Error("Não foi possível validar o endereço do site.");
    return (body.Answer ?? []).filter((item) => item.type === 1 || item.type === 28).map((item) => item.data);
  }));
  const addresses = records.flat();
  if (!addresses.length || addresses.some((address) => !isPublicAddress(address))) throw new Error("O endereço do site não possui apenas destinos públicos.");
  // DNS preflight is defense in depth, not a connection-time rebinding guarantee.
}

export async function readLimitedHtml(response: Response, maxBytes: number) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (bytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      const part = value.subarray(0, maxBytes - bytes);
      chunks.push(part); bytes += part.length;
    }
  } finally { await reader.cancel(); }
  const result = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(result);
}

export async function fetchPublicSite(raw: string, signal: AbortSignal) {
  let target = validateSiteUrl(raw);
  const seen = new Set<string>();
  for (let hop = 0; hop <= 5; hop++) {
    if (seen.has(target.href)) throw new Error("O site possui redirecionamentos repetidos.");
    seen.add(target.href);
    await verifyPublicDns(target, signal);
    const response = await fetch(target.href, { redirect: "manual", signal, headers: { "user-agent": "ProspectorBot/1.0 (+analise-publica-de-pagina-inicial)", accept: "text/html,application/xhtml+xml", "accept-language": "pt-BR,pt;q=0.9" } });
    if (![301,302,303,307,308].includes(response.status)) return { response, finalUrl: target.href };
    await response.body?.cancel();
    const location = response.headers.get("location");
    if (!location || hop === 5) throw new Error("O site excedeu o limite de redirecionamentos.");
    target = validateSiteUrl(new URL(location, target).href);
  }
  throw new Error("Não foi possível acessar o site.");
}