import {
  fetchPlaceDetails,
  fetchPlacePhotos,
  searchBusinesses,
  type PlaceDetailsResult,
  type SearchResult,
} from "@/lib/business-search.functions";
import type { Business, SearchCriteria, SearchOutcome } from "@/types";

/** Contratos de fonte de dados — permitem trocar o provider sem tocar na UI. */
export interface BusinessSearchRepository {
  readonly sourceName: string;
  search: (criteria: SearchCriteria) => Promise<SearchResult>;
}

export interface PlaceDetailsRepository {
  readonly sourceName: string;
  detailsFor: (business: Business) => Promise<PlaceDetailsResult>;
}

export interface PhotoProvider {
  readonly sourceName: string;
  photosFor: (business: Business) => Promise<{ url: string; alt: string }[]>;
}

export interface MapProvider {
  readonly sourceName: string;
  readonly configured: boolean;
  readonly browserKey: string | undefined;
}

/** Implementação atual: Google Maps Platform — Places API (New), via servidor. */
export const GooglePlacesBusinessSearchRepository: BusinessSearchRepository = {
  sourceName: "Google Maps",
  search: (criteria) =>
    searchBusinesses({
      data: {
        category: criteria.category,
        city: criteria.city,
        state: criteria.state,
        ...(criteria.limit !== undefined ? { limit: criteria.limit } : {}),
        ...(criteria.pageToken ? { pageToken: criteria.pageToken } : {}),
      },
    }),
};

/** Place Details é consultado somente quando o usuário abre o estabelecimento. */
export const GooglePlacesDetailsRepository: PlaceDetailsRepository = {
  sourceName: "Google Maps",
  detailsFor: (business) => fetchPlaceDetails({ data: { placeId: business.placeId } }),
};

/** Place Photos: URLs temporárias do Google, nunca armazenadas. */
export const GooglePlacesPhotoProvider: PhotoProvider = {
  sourceName: "Google Maps",
  photosFor: async (business) => {
    if (business.photoRefs.length === 0) return [];
    const { urls } = await fetchPlacePhotos({ data: { photoRefs: business.photoRefs.slice(0, 4) } });
    return urls.map((url, i) => ({ url, alt: `Foto ${i + 1} de ${business.name} (Google Maps)` }));
  },
};

/** Mapa: Maps JavaScript API com a chave pública de navegador (requer billing). */
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
