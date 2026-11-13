import { fetchPlaceDetails, fetchPlacePhotos, searchBusinesses, type PlaceDetailsResult, type SearchResult } from "@/lib/business-search.functions";
import { searchUSBusinesses, type USSearchResult } from "@/lib/business-search-us.functions";
import type { Business, SearchCriteria, SearchOutcome } from "@/types";
import { supabase } from "@/integrations/supabase/client";
async function internationalSearch(criteria: SearchCriteria): Promise<USSearchResult> {
  if (!criteria.country || criteria.country === "BR") return { ok: false, code: "local", message: "Escolha um país internacional." };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { ok: false, code: "permissao", message: "Entre com sua conta para pesquisar no exterior. A busca internacional exige acesso confirmado." };
  try {
    return await searchUSBusinesses({ data: { country: criteria.country, category: criteria.category, city: criteria.city, state: criteria.state, locations: criteria.locations, term: criteria.term, discoveryOffset: criteria.discoveryOffset, ...(criteria.limit !== undefined ? { limit: criteria.limit } : {}), ...(criteria.pageToken ? { pageToken: criteria.pageToken } : {}) } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const authFailure = /unauthorized|authorization|invalid token|jwt|401/i.test(detail);
    return { ok: false, code: authFailure ? "permissao" : "rede", message: authFailure ? "Seu acesso expirou. Entre novamente para pesquisar no exterior." : "Não foi possível iniciar a busca internacional. Tente novamente.", detail };
  }
}

export interface BusinessSearchRepository { readonly sourceName: string; search: (criteria: SearchCriteria) => Promise<SearchResult | USSearchResult>; }
export interface PlaceDetailsRepository { readonly sourceName: string; detailsFor: (business: Business) => Promise<PlaceDetailsResult>; }
export interface PhotoProvider { readonly sourceName: string; photosFor: (business: Business) => Promise<{ url: string; alt: string }[]>; }
export interface MapProvider { readonly sourceName: string; readonly configured: boolean; readonly browserKey: string | undefined; }

export const GooglePlacesBusinessSearchRepository: BusinessSearchRepository = {
  sourceName: "Google Maps",
  search: (criteria) => criteria.country && criteria.country !== "BR"
    ? internationalSearch(criteria)
    : searchBusinesses({ data: { category: criteria.category, city: criteria.city, state: criteria.state, ...(criteria.locations?.length ? { locations: criteria.locations } : {}), ...(criteria.term ? { term: criteria.term } : {}), ...(criteria.limit !== undefined ? { limit: criteria.limit } : {}), ...(criteria.pageToken ? { pageToken: criteria.pageToken } : {}), ...(criteria.discoveryOffset !== undefined ? { discoveryOffset: criteria.discoveryOffset } : {}) } }),
};

export const GooglePlacesDetailsRepository: PlaceDetailsRepository = { sourceName: "Google Maps", detailsFor: (business) => fetchPlaceDetails({ data: { placeId: business.placeId, country: business.country ?? "BR" } }) };

export const GooglePlacesPhotoProvider: PhotoProvider = {
  sourceName: "Google Maps",
  photosFor: async (business) => {
    if (business.photoRefs.length === 0) return [];
    const { urls } = await fetchPlacePhotos({ data: { photoRefs: business.photoRefs.slice(0, 4) } });
    return urls.map((url, i) => ({ url, alt: `Foto ${i + 1} de ${business.name} (Google Maps)` }));
  },
};

export const GoogleMapProvider: MapProvider = {
  sourceName: "Google Maps",
  browserKey: import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined,
  configured: !!import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"],
};

export const businessSearchRepository = GooglePlacesBusinessSearchRepository;
export const placeDetailsRepository = GooglePlacesDetailsRepository;
export const photoProvider = GooglePlacesPhotoProvider;
export const mapProvider = GoogleMapProvider;
export type { SearchOutcome, SearchResult };
