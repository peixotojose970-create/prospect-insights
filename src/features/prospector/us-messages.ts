import type { Business } from "@/types";

export function buildUSOutreachEmail(business: Business) {
  const subject = `A quick website idea for ${business.name}`;
  const body = `Hi ${business.name} team,\n\nI found ${business.name} on Google Maps while researching local businesses in ${business.city ?? "your area"}. I noticed there is no website listed on the Google profile.\n\nI build professional, mobile-friendly websites for local businesses that make it easy for potential customers to learn about the business and get in touch.\n\nI already have an idea of how a simple site for ${business.name} could look. Would you like me to send you a quick preview?\n\nBest,\n[YOUR NAME]\nNextor Studio`;
  return { subject, body };
}
