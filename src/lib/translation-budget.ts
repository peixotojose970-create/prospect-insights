export const TRANSLATION_TIMEOUT_MS = 55_000;
export function translationAttemptLimit(legacy: boolean | undefined) { return legacy ? 2 : 1; }