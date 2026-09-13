import type { Business } from "@/types";

export function buildUSOutreachEmail(business: Business) {
  const subject = `A quick website idea for ${business.name}`;
  const body = `Hi ${business.name} team,\n\nI found ${business.name} on Google Maps while researching local businesses in ${business.city ?? "your area"}. I noticed there is no website listed on the Google profile.\n\nI build professional, mobile-friendly websites for local businesses that make it easy for potential customers to learn about the business and get in touch.\n\nI already have an idea of how a simple site for ${business.name} could look. Would you like me to send you a quick preview?\n\nBest,\n[YOUR NAME]\nNextor Studio`;
  return { subject, body };
}

/** Mensagem de prospecção em inglês americano para leads dos EUA com e-mail identificado. */
export function buildUSDirectEmail(
  business: Business,
  sender?: { personalName?: string; companyName?: string },
) {
  const segment = (business.category || "local business").toLowerCase();
  const place = business.city ? `${business.city}${business.state ? `, ${business.state}` : ""}` : "your area";
  const hasSite = !!business.website;
  const subject = hasSite
    ? `Website improvements for ${business.name}`
    : `A website for ${business.name}?`;
  const name = sender?.personalName?.trim() || "[YOUR NAME]";
  const company = sender?.companyName?.trim();
  const opener = hasSite
    ? `I took a look at your current website and saw a few quick wins that could bring in more calls and bookings.`
    : `I noticed ${business.name} doesn't have a website listed, so customers searching for a ${segment} in ${place} may be finding your competitors first.`;
  const body = `Hi ${business.name} team,

My name is ${name}${company ? `, from ${company}` : ""}. I found your ${segment} on Google while looking at businesses in ${place}.

${opener}

I design fast, mobile-friendly websites for ${segment} owners: clear services, photos, reviews and an easy way to contact you. Simple to launch and easy to keep updated.

Would you like me to send over a short preview built for ${business.name}? Happy to share it with no obligation.

Best regards,
${name}${company ? `
${company}` : ""}`;
  return { subject, body };
}

export function usEmailMailto(business: Business, sender?: { personalName?: string; companyName?: string }) {
  if (!business.email) return null;
  const { subject, body } = buildUSDirectEmail(business, sender);
  return `mailto:${business.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
