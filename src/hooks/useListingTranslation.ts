import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { translateListing } from "@/lib/translate.functions";
import { useI18n } from "@/lib/i18n";

/**
 * Liefert Titel/Beschreibung einer Anzeige in der aktuellen App-Sprache.
 * Fällt still auf das Original zurück, wenn keine Übersetzung möglich ist.
 */
export function useListingTranslation(
  listingId: string,
  sourceLang: string | null | undefined,
  fallback: { title: string; description: string | null },
) {
  const { lang } = useI18n();
  const run = useServerFn(translateListing);
  const needed = Boolean(listingId) && sourceLang !== lang;

  const q = useQuery({
    queryKey: ["listing-translation", listingId, lang],
    enabled: needed,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
    queryFn: () => run({ data: { listingId, lang } }),
  });

  return {
    title: q.data?.title ?? fallback.title,
    description: q.data?.description ?? fallback.description,
    translating: needed && q.isPending,
    translated: Boolean(q.data),
  };
}
