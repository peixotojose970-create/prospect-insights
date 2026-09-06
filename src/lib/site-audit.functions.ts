import { createServerFn } from "@tanstack/react-start";

export type SiteAudit = {
  url: string;
  finalUrl: string;
  https: boolean;
  status: number;
  title: string | null;
  description: string | null;
  viewport: boolean;
  favicon: boolean;
  responsiveHints: boolean;
  whatsapp: boolean;
  phone: boolean;
  address: boolean;
  form: boolean;
  cta: boolean;
  /** tempo total da requisição feita pelo servidor, em ms (não é métrica de performance do usuário) */
  responseMs: number;
  tech: string | null;
  quality: "boa" | "media" | "fraca";
  summary: string;
};

export type SiteAuditResult =
  | { ok: true; audit: SiteAudit }
  | { ok: false; message: string; detail?: string };

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 400_000;

function detectTech(html: string): string | null {
  const checks: [RegExp, string][] = [
    [/wp-content|wp-includes/i, "WordPress"],
    [/cdn\.shopify\.com/i, "Shopify"],
    [/wix\.com|wixstatic/i, "Wix"],
    [/squarespace/i, "Squarespace"],
    [/_next\/static/i, "Next.js"],
    [/webflow/i, "Webflow"],
    [/elementor/i, "Elementor"],
  ];
  for (const [re, name] of checks) if (re.test(html)) return name;
  return null;
}

function textOf(re: RegExp, html: string) {
  const m = html.match(re);
  return m?.[1]?.trim().slice(0, 200) ?? null;
}

export const auditWebsite = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => {
    const raw = String(data?.url ?? "").trim();
    if (!raw) throw new Error("URL vazia");
    return { url: raw };
  })
  .handler(async ({ data }): Promise<SiteAuditResult> => {
    let target: URL;
    try {
      target = new URL(data.url.startsWith("http") ? data.url : `https://${data.url}`);
    } catch {
      return { ok: false, message: "O endereço do site não é válido." };
    }
    if (!["http:", "https:"].includes(target.protocol))
      return { ok: false, message: "O endereço do site não é válido." };

    const startedAt = Date.now();
    try {
      const response = await fetch(target.toString(), {
        redirect: "follow",
        headers: {
          "user-agent": "ProspectorBot/1.0 (+analise-publica-de-pagina-inicial)",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "pt-BR,pt;q=0.9",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const responseMs = Date.now() - startedAt;
      const buffer = await response.arrayBuffer();
      const html = new TextDecoder("utf-8").decode(buffer.slice(0, MAX_BYTES));
      const finalUrl = response.url || target.toString();

      const whatsapp = /wa\.me|api\.whatsapp\.com|whatsapp/i.test(html);
      const phone = /tel:\+?\d|\(\d{2}\)\s?\d{4,5}-?\d{4}/i.test(html);
      const address = /rua |av\.|avenida |cep\s?\d|bairro/i.test(html);
      const form = /<form[\s>]|type=["']?email/i.test(html);
      const cta =
        /(fale conosco|entre em contato|solicite|agende|orçamento|peça|compre|saiba mais|chame no whats)/i.test(
          html,
        );
      const viewport = /<meta[^>]+name=["']?viewport/i.test(html);
      const favicon = /rel=["']?(shortcut )?icon/i.test(html);
      const responsiveHints = viewport && /@media|max-w|col-md|container/i.test(html);

      const positives = [
        target.protocol === "https:",
        viewport,
        responsiveHints,
        whatsapp,
        phone,
        address,
        form,
        cta,
      ].filter(Boolean).length;
      const quality: SiteAudit["quality"] = positives >= 6 ? "boa" : positives >= 4 ? "media" : "fraca";

      const audit: SiteAudit = {
        url: target.toString(),
        finalUrl,
        https: new URL(finalUrl).protocol === "https:",
        status: response.status,
        title: textOf(/<title[^>]*>([\s\S]*?)<\/title>/i, html),
        description: textOf(/<meta[^>]+name=["']?description["']?[^>]+content=["']([^"']+)/i, html),
        viewport,
        favicon,
        responsiveHints,
        whatsapp,
        phone,
        address,
        form,
        cta,
        responseMs,
        tech: detectTech(html),
        quality,
        summary:
          quality === "boa"
            ? "O site apresenta uma base adequada."
            : quality === "media"
              ? "Existe espaço para melhorar a apresentação digital."
              : "A página inicial não apresenta elementos básicos de contato e conversão.",
      };

      if (!response.ok)
        return { ok: false, message: `O site respondeu com erro (${response.status}).`, detail: finalUrl };

      return { ok: true, audit };
    } catch (error) {
      const message = (error as Error)?.name === "TimeoutError"
        ? "A análise do site demorou mais que o esperado."
        : "Não foi possível acessar o site informado.";
      return { ok: false, message, detail: (error as Error)?.message };
    }
  });
