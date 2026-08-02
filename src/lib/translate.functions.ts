import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  listingId: z.string().uuid(),
  lang: z.enum(["de", "en", "sq"]),
});

export type ListingTranslation = {
  title: string;
  description: string | null;
  cached: boolean;
};

/**
 * Übersetzt Titel + Beschreibung einer Anzeige in die App-Sprache.
 * Ergebnisse werden in `listing_translations` gecacht, damit jede Anzeige
 * nur ein einziges Mal pro Sprache übersetzt wird.
 */
export const translateListing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<ListingTranslation | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cached } = await supabaseAdmin
      .from("listing_translations")
      .select("title,description")
      .eq("listing_id", data.listingId)
      .eq("lang", data.lang)
      .maybeSingle();

    if (cached) return { title: cached.title, description: cached.description, cached: true };

    const { data: listing } = await supabaseAdmin
      .from("listings")
      .select("title,description,source_lang")
      .eq("id", data.listingId)
      .maybeSingle();

    if (!listing) return null;
    if (listing.source_lang === data.lang) {
      return { title: listing.title, description: listing.description, cached: false };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { title: listing.title, description: listing.description, cached: false };

    const target = { de: "German", en: "English", sq: "Albanian" }[data.lang];

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You translate classified-ad listings into ${target}. Keep numbers, units, brand and model names unchanged. Reply with strict JSON: {"title": string, "description": string}.`,
            },
            {
              role: "user",
              content: JSON.stringify({
                title: listing.title,
                description: (listing.description ?? "").slice(0, 4000),
              }),
            },
          ],
        }),
      });

      if (!res.ok) {
        return { title: listing.title, description: listing.description, cached: false };
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = json.choices?.[0]?.message?.content ?? "";
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned) as { title?: string; description?: string };

      const title = parsed.title?.trim() || listing.title;
      const description = parsed.description?.trim() || listing.description;

      await supabaseAdmin.from("listing_translations").upsert(
        {
          listing_id: data.listingId,
          lang: data.lang,
          title,
          description,
        } as never,
        { onConflict: "listing_id,lang" },
      );

      return { title, description, cached: false };
    } catch {
      return { title: listing.title, description: listing.description, cached: false };
    }
  });
