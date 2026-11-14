export async function operationSubjects(userId: string | undefined, origin: string | null) {
  let source = "missing";
  if (origin && origin.length <= 500) {
    try { source = new URL(origin).origin; } catch { source = "invalid"; }
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { user: userId ? `user:${userId}` : "anonymous", origin: `origin:${hex}` };
}