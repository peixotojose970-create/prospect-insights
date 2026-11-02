import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LANG_NAMES = { es: "Spanish (Español neutro)", en: "American English" } as const;

/**
 * Traduz mensagens de abordagem mantendo a mesma estratégia: só muda o idioma.
 * Recebe um lote e devolve as traduções na mesma ordem.
 */
export const translateMessages = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        lang: z.enum(["es", "en"]),
        texts: z.array(z.string().max(4000)).min(1).max(40),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { generateChatCompletion, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
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
              'Reply with JSON only: {"translations": ["..."]} with one entry per input, same order.',
          },
          { role: "user", content: JSON.stringify({ texts: data.texts }) },
        ],
        response_format: { type: "json_object" },
      });
      const content = res.choices[0]?.message?.content;
      const raw = typeof content === "string" ? content : "";
      const parsed = z.object({ translations: z.array(z.string()) }).parse(JSON.parse(raw));
      if (parsed.translations.length !== data.texts.length) throw new Error("count mismatch");
      return { translations: parsed.translations, error: null as string | null };
    } catch (e) {
      console.error("translateMessages failed", e instanceof GatewayError ? e.code : e);
      return { translations: null, error: "Não foi possível traduzir agora. Mostrando em português." };
    }
  });
