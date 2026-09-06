import { searchBusinesses, type SearchResult } from "@/lib/business-search.functions";
import type { Business, SearchCriteria, SearchOutcome } from "@/types";

/** Contratos de fonte de dados — permitem trocar o provider sem tocar na UI. */
export interface BusinessSearchRepository {
  readonly sourceName: string;
  search: (criteria: SearchCriteria) => Promise<SearchResult>;
}

export interface PhotoProvider {
  readonly sourceName: string;
  photosFor: (business: Business) => Promise<{ url: string; alt: string }[]>;
}

export interface GeocodingProvider {
  readonly sourceName: string;
  resolveCity: (city: string, state: string) => Promise<{ latitude: number; longitude: number } | null>;
}

/** Implementação atual: OpenStreetMap via Overpass (executada no servidor). */
export const OverpassBusinessSearchRepository: BusinessSearchRepository = {
  sourceName: "OpenStreetMap",
  search: (criteria) =>
    searchBusinesses({
      data: {
        category: criteria.category,
        city: criteria.city,
        state: criteria.state,
        ...(criteria.limit !== undefined ? { limit: criteria.limit } : {}),
      },
    }),
};

/** Sem provedor de fotos gratuito adequado hoje — a arquitetura já está pronta. */
export const UnavailablePhotoProvider: PhotoProvider = {
  sourceName: "Nenhum",
  photosFor: async () => [],
};

export const businessSearchRepository = OverpassBusinessSearchRepository;
export const photoProvider = UnavailablePhotoProvider;

export type { SearchOutcome, SearchResult };
