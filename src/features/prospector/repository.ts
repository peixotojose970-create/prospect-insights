import { fetchPlaceDetails, fetchPlacePhotos, searchBusinesses, type PlaceDetailsResult, type SearchResult } from "@/lib/business-search.functions";
import { searchUSBusinesses, type USSearchResult } from "@/lib/business-search-us.functions";
import type { Business, SearchCriteria, SearchOutcome } from "@/types";

export interface BusinessSearchRepository { readonly sourceName: string; search: (criteria: SearchCriteria) => Promise<SearchResult | USSearchResult>; }
export interface PlaceDetailsRepository { readonly sourceName: string; detailsFor: (business: Business) => Promise<PlaceDetailsResult>; }
export interface PhotoProvider { readonly sourceName: string; photosFor: (business: Business) => Promise<{ url: string; alt: string }[]>; }
export interface MapProvider { readonly sourceName: string; readonly configured: boolean; readonly browserKey: string | undefined; }

export const GooglePlacesBusinessSearchRepository: BusinessSearchRepository = {
  sourceName: "Google Maps",
  search: (criteria) => criteria.country === "US"
    ? searchUSBusinesses({ data: { category: criteria.category, city: criteria.city, state: criteria.state, ...(criteria.limit !== undefined ? { limit: criteria.limit } : {}), ...(criteria.pageToken ? { pageToken: criteria.pageToken } : {}) } })
    : searchBusinesses({ data: { category: criteria.category, city: criteria.city, state: criteria.state, ...(criteria.limit !== undefined ? { limit: criteria.limit } : {}), ...(criteria.pageToken ? { pageToken: criteria.pageToken } : {}) } }),
};

export const GooglePlacesDetailsRepository: PlaceDetailsRepository = { sourceName: "Google Maps", detailsFor: (business) => fetchPlaceDetails({ data: { placeId: business.placeId } }) };

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
