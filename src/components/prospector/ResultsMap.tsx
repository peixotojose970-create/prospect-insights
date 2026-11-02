import { useEffect, useRef, useState } from "react";
import { mapProvider } from "@/features/prospector/repository";
import type { Business } from "@/types";

/** Limite de marcadores renderizados para manter o mapa fluido. */
const MAX_MARKERS = 60;

declare global {
  interface Window {
    google?: typeof google;
    __prospectorMapsReady?: () => void;
  }
}

let loader: Promise<void> | null = null;

/** Carrega a Maps JavaScript API oficial uma única vez, de forma assíncrona. */
function loadMaps(key: string, trackingId?: string) {
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    if (window.google?.maps) return resolve();
    window.__prospectorMapsReady = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: "__prospectorMapsReady",
      language: "pt-BR",
      region: "BR",
    });
    if (trackingId) params.set("channel", trackingId);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Não foi possível carregar o Google Maps."));
    document.head.appendChild(script);
  });
  return loader;
}

export default function ResultsMap({
  businesses,
  onSelect,
}: {
  businesses: Business[];
  onSelect: (business: Business) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guarda o callback mais recente sem recriar os marcadores a cada renderização da página.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const key = mapProvider.browserKey;

  useEffect(() => {
    if (!key) {
      setError("Google Maps não está configurado.");
      return;
    }
    let alive = true;
    loadMaps(key, import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as string | undefined)
      .then(() => alive && setReady(true))
      .catch(() => alive && setError("Não foi possível carregar o mapa do Google."));
    return () => {
      alive = false;
    };
  }, [key]);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.google?.maps) return;
    if (!mapRef.current) {
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        center: { lat: -14.24, lng: -51.93 },
        zoom: 4,
        scrollwheel: false,
        streetViewControl: false,
        mapTypeControl: false,
      });
    }
    const map = mapRef.current;

    for (const marker of markersRef.current) marker.setMap(null);
    markersRef.current = [];

    const shown = businesses.slice(0, MAX_MARKERS);
    if (shown.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    for (const business of shown) {
      const position = { lat: business.latitude, lng: business.longitude };
      const marker = new window.google.maps.Marker({ position, map, title: business.name });
      marker.addListener("click", () => onSelectRef.current(business));
      markersRef.current.push(marker);
      bounds.extend(position);
    }
    map.fitBounds(bounds, 32);
  }, [ready, businesses]);

  // Ao recolher/sair da tela, remove marcadores e listeners para liberar memória.
  useEffect(() => {
    return () => {
      for (const marker of markersRef.current) {
        window.google?.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      }
      markersRef.current = [];
      if (mapRef.current) window.google?.maps.event.clearInstanceListeners(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
        {error} O mapa usa a Maps JavaScript API do Google, que exige billing ativo no Google Cloud.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3"><div><p className="text-sm font-semibold text-foreground">Distribuição geográfica</p><p className="text-xs text-muted-foreground">Empresas localizadas nos resultados atuais</p></div><span className="rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary">Mapa</span></div>
      <div ref={containerRef} className="h-[320px] w-full" role="application" aria-label="Mapa dos resultados" />
      <p className="border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
        Mapa © Google · Maps JavaScript API · exibindo até {MAX_MARKERS} marcadores
      </p>
    </div>
  );
}
