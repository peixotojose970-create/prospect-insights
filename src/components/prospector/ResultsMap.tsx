import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Business } from "@/types";

/** Limite de marcadores renderizados para manter o mapa fluido. */
const MAX_MARKERS = 80;

export default function ResultsMap({
  businesses,
  onSelect,
}: {
  businesses: Business[];
  onSelect: (business: Business) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([-14.24, -51.93], 4);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const shown = businesses.slice(0, MAX_MARKERS);
    if (shown.length === 0) return;

    for (const business of shown) {
      const marker = L.circleMarker([business.latitude, business.longitude], {
        radius: 7,
        weight: 2,
        color: business.website ? "#2563eb" : "#dc2626",
        fillColor: business.website ? "#2563eb" : "#dc2626",
        fillOpacity: 0.65,
      });
      marker.bindTooltip(business.name, { direction: "top" });
      marker.on("click", () => onSelect(business));
      marker.addTo(layer);
    }

    map.fitBounds(L.latLngBounds(shown.map((b) => [b.latitude, b.longitude] as [number, number])), {
      padding: [24, 24],
      maxZoom: 15,
    });
  }, [businesses, onSelect]);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div ref={containerRef} className="h-[320px] w-full" role="application" aria-label="Mapa dos resultados" />
      <p className="border-t border-border bg-muted/40 px-3 py-1.5 text-[11px] text-muted-foreground">
        Mapa © OpenStreetMap contributors · exibindo até {MAX_MARKERS} marcadores
      </p>
    </div>
  );
}
