/**
 * Regra única de "site próprio".
 *
 * Muitas empresas colocam no Google Maps apenas um link de rede social ou
 * agregador (Instagram, WhatsApp, Linktree, Facebook, TikTok, etc.).
 * Para a prospecção isso conta como SEM SITE — é justamente o cliente ideal.
 */
const THIRD_PARTY_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "fb.me",
  "m.me",
  "messenger.com",
  "wa.me",
  "whatsapp.com",
  "api.whatsapp.com",
  "linktr.ee",
  "linktree.com",
  "beacons.ai",
  "bio.link",
  "biolink.info",
  "linkr.bio",
  "many.link",
  "campsite.bio",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "pinterest.com",
  "threads.net",
  "threads.com",
  "t.me",
  "telegram.me",
  "google.com",
  "goo.gl",
  "maps.app.goo.gl",
  "business.site",
  "negocio.site",
  "sites.google.com",
  "yelp.com",
  "tripadvisor.com",
  "tripadvisor.com.br",
  "ifood.com.br",
  "doordash.com",
  "ubereats.com",
  "grubhub.com",
  "opentable.com",
  "booksy.com",
  "fresha.com",
  "trinks.com",
  "getninjas.com.br",
  "olx.com.br",
  "mercadolivre.com.br",
  "shopee.com.br",
  "wa.link",
  "beacons.page",
  "solo.to",
  "carrd.co",
  "about.me",
  "notion.site",
  "canva.site",
  "linktree.ee",
] as const;

function hostOf(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** true quando o link é de terceiros (rede social, agregador, marketplace). */
export function isThirdPartyLink(url: string | null | undefined): boolean {
  const host = hostOf(url ?? "");
  if (!host) return false;
  return THIRD_PARTY_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/** true somente quando a empresa tem domínio/site próprio. */
export function isOwnWebsite(url: string | null | undefined): boolean {
  const host = hostOf(url ?? "");
  if (!host) return false;
  return !isThirdPartyLink(url);
}

/**
 * Normaliza o link vindo do Google: mantém em `website` apenas site próprio e
 * joga links de terceiros para `socialUrl` (com Instagram detectado à parte).
 */
export function classifyWebsite(url: string | null | undefined): {
  website: string | null;
  socialUrl: string | null;
  instagram: string | null;
} {
  const value = (url ?? "").trim();
  if (!value) return { website: null, socialUrl: null, instagram: null };
  if (isThirdPartyLink(value)) {
    const host = hostOf(value) ?? "";
    return {
      website: null,
      socialUrl: value,
      instagram: host === "instagram.com" || host.endsWith(".instagram.com") ? value : null,
    };
  }
  return { website: value, socialUrl: null, instagram: null };
}
