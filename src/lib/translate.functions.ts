import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { validMessageLanguage } from "@/features/prospector/message-validation";
import { TRANSLATION_TIMEOUT_MS, translationAttemptLimit } from "./translation-budget";

const LANG_NAMES = { "pt-PT": "European Portuguese (português de Portugal, natural for Portugal, e.g. 'telemóvel', 'está a', formal 'você'/3rd person)", es: "Spanish from Spain (español de España)", fr: "French from France", it: "Italian from Italy", en: "American English" } as const;

/**
 * Traduz mensagens de abordagem mantendo a mesma estratégia: só muda o idioma.
 * Recebe um lote e devolve as traduções na mesma ordem.
 */
export const translateMessages = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        lang: z.enum(["pt-PT", "es", "fr", "it", "en"]),
        texts: z.array(z.string().max(4000)).min(1).max(40),
        country: z.enum(["BR", "US", "PT", "ES", "FR", "IT"]).optional(),
        legacy: z.boolean().optional(),
        context: z.object({ company: z.string().max(300), category: z.string().max(300), city: z.string().max(300).nullable(), style: z.string().max(100) }).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { generateChatCompletion, GatewayError } = await import("@lovable.dev/ai-gateway");
    const signal = data.legacy ? undefined : AbortSignal.timeout(TRANSLATION_TIMEOUT_MS);
    try {
      for (let attempt = 0; attempt < translationAttemptLimit(data.legacy); attempt++) {
      const res = await generateChatCompletion({
        model: "openai/gpt-6-astra",
        messages: [
          {
            role: "system",
            content:
              `You translate sales outreach messages from Brazilian Portuguese into ${LANG_NAMES[data.lang]}. ` +
              "Translate ONLY the language. Keep exactly the same meaning, structure, sentence order, tone, questions, arguments, offer and call to action. " +
              "Do not add, remove or rephrase ideas. Keep line breaks. Keep proper names (people, companies, cities, streets, brands) unchanged. " +
              "Keep any {placeholders} untouched. " +
              (attempt ? "Previous output failed language validation. All prose MUST use the requested language, with no Brazilian expressions in European Portuguese. " : "") +
              'Reply with JSON only: {"translations": ["..."]} with one entry per input, same order.',
          },
          { role: "user", content: JSON.stringify({ texts: data.texts, context: data.context }) },
        ],
        response_format: { type: "json_object" },
      }, signal ? { signal } : undefined);
      const content = res.choices[0]?.message?.content;
      const raw = typeof content === "string" ? content : "";
      const parsed = z.object({ translations: z.array(z.string()) }).parse(JSON.parse(raw));
      if (parsed.translations.length !== data.texts.length) throw new Error("count mismatch");
      const prose = parsed.translations.map((text) => data.context ? [data.context.company, data.context.category, data.context.city].filter((value): value is string => !!value).reduce((result, value) => result.replaceAll(value, ""), text) : text);
      if (!data.legacy && !validMessageLanguage(prose, data.lang)) throw new Error("Idioma incorreto na resposta gerada.");
      return { translations: parsed.translations, error: null as string | null };
      }
      throw new Error("Não foi possível validar o idioma.");
    } catch (e) {
      console.error("translateMessages failed", e instanceof GatewayError ? e.code : e);
      const timeout = e instanceof Error && ["TimeoutError", "AbortError", "CancelledError"].includes(e.name);
      const reason = e instanceof GatewayError ? ` (${e.code})` : "";
      return { translations: null, error: data.legacy ? "Não foi possível traduzir agora. Mostrando em português." : timeout ? "A tradução demorou mais que o esperado. Tente novamente." : `Não foi possível traduzir a abordagem${reason}. Tente novamente; nenhuma mensagem em português foi usada como substituição.` };
    }
  });
