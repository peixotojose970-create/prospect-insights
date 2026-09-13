/** Descoberta de e-mail comercial a partir do site da empresa (somente leads dos EUA). */

const TIMEOUT_MS = 5_000;
const MAX_LOOKUPS = 12;
const CONCURRENCY = 4;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const BAD_PARTS = ["example.com", "sentry", "wixpress", "domain.com", "email.com", "yourdomain", ".png", ".jpg", ".webp", ".gif", "no-reply", "noreply"];

function pickEmail(html: string): string | null {
  const matches = html.match(EMAIL_RE) ?? [];
  const clean = matches
    .map((m) => m.toLowerCase())
    .filter((m) => m.length < 80 && !BAD_PARTS.some((bad) => m.includes(bad)));
  if (!clean.length) return null;
  const preferred = clean.find((m) => /^(info|contact|hello|hi|sales|office|booking|admin)@/.test(m));
  return preferred ?? clean[0]!;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ProspectorBot/1.0)", Accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (type && !type.includes("html") && !type.includes("text")) return null;
    return (await response.text()).slice(0, 300_000);
  } catch {
    return null;
  }
}

async function emailForSite(website: string): Promise<string | null> {
  const base = website.startsWith("http") ? website : `https://${website}`;
  let origin: string;
  try {
    origin = new URL(base).origin;
  } catch {
    return null;
  }
  for (const url of [base, `${origin}/contact`, `${origin}/contact-us`, `${origin}/about`]) {
    const html = await fetchText(url);
    const email = html ? pickEmail(html) : null;
    if (email) return email;
  }
  return null;
}

/** Preenche `email` nos leads que possuem site próprio, com limite de requisições. */
export async function attachEmails<T extends { website: string | null; email?: string | null }>(items: T[]): Promise<T[]> {
  const targets = items.filter((item) => !!item.website && !item.email).slice(0, MAX_LOOKUPS);
  const found = new Map<string, string>();
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
      while (cursor < targets.length) {
        const current = targets[cursor++];
        if (!current?.website) continue;
        const email = await emailForSite(current.website);
        if (email) found.set(current.website, email);
      }
    }),
  );
  return items.map((item) => (item.website && found.has(item.website) ? { ...item, email: found.get(item.website)! } : item));
}
