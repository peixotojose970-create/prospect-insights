export async function withRequestTimeout<T>(request: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([request, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("A tradução demorou mais que o esperado. Tente novamente.")), milliseconds); })]);
  } finally { if (timer !== undefined) clearTimeout(timer); }
}