import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DriverLocationMapProps {
  /** Coordenadas REAIS do motorista (vindas exclusivamente do GPS).
   *  Quando ausentes ou `null` o ícone do motorista NÃO é renderizado. */
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  driverName?: string;
  className?: string;
  /** Polyline da rota PLANEJADA (>2 pontos da Routes API).
   *  Linhas retas como fallback NÃO são desenhadas — só rota real. */
  routePolyline?: [number, number][];
  /** Coordenada de origem planejada — usada apenas para marcador e enquadramento. */
  originLatLng?: [number, number];
  originLabel?: string;
  destLatLng?: [number, number];
  destLabel?: string;
  zoomControl?: boolean;
  /** Quando true, NÃO renderiza o pin do motorista mesmo recebendo lat/lng. */
  hideDriverMarker?: boolean;
}

/**
 * Mapa Leaflet 2D usado para visualização das viagens.
 *
 * Regra crítica: o ícone do motorista (🚗) e o círculo de accuracy só
 * aparecem quando recebemos `latitude/longitude` reais E `hideDriverMarker`
 * estiver `false`. Origem/destino são apenas marcadores de referência;
 * NUNCA são usados como posição do motorista. A rota planejada
 * (`routePolyline`) só é desenhada se vier real (>= 3 pontos), para
 * evitar a "linha reta motorista→destino" que mascarava o bug.
 */
export default function DriverLocationMap({
  latitude,
  longitude,
  accuracy,
  speed,
  driverName,
  className,
  routePolyline,
  originLatLng,
  originLabel,
  destLatLng,
  destLabel,
  zoomControl = false,
  hideDriverMarker = false,
}: DriverLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);

  const hasRealDriver = !hideDriverMarker && latitude != null && longitude != null;

  useEffect(() => {
    if (!mapRef.current) return;

    // Centro inicial: motorista real → destino → origem → polyline → fallback (0,0)
    const initialCenter: [number, number] = hasRealDriver
      ? [latitude as number, longitude as number]
      : destLatLng
        ? destLatLng
        : originLatLng
          ? originLatLng
          : routePolyline && routePolyline.length > 0
            ? routePolyline[0]
            : [-27.8708, -54.4814];

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl,
        attributionControl: false,
      }).setView(initialCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 600);
    }

    const map = mapInstanceRef.current;

    // ── Marcador do motorista (apenas com GPS REAL) ──
    if (hasRealDriver) {
      const carIcon = L.divIcon({
        html: `<div style="background:hsl(142,50%,35%);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">🚗</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: '',
      });
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([latitude as number, longitude as number], { icon: carIcon }).addTo(map);
        if (driverName) {
          driverMarkerRef.current.bindTooltip(driverName, { permanent: false, direction: 'top', offset: [0, -16] });
        }
      } else {
        driverMarkerRef.current.setLatLng([latitude as number, longitude as number]);
      }

      if (accuracy && accuracy < 500) {
        if (!accuracyCircleRef.current) {
          accuracyCircleRef.current = L.circle([latitude as number, longitude as number], {
            radius: accuracy,
            color: 'hsl(142,50%,35%)',
            fillColor: 'hsl(142,50%,35%)',
            fillOpacity: 0.08,
            weight: 1,
          }).addTo(map);
        } else {
          accuracyCircleRef.current.setLatLng([latitude as number, longitude as number]);
          accuracyCircleRef.current.setRadius(accuracy);
        }
      }
    } else {
      // GPS ausente → garantir que NÃO há marcador/círculo derivado
      if (driverMarkerRef.current) {
        try { map.removeLayer(driverMarkerRef.current); } catch { /* */ }
        driverMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        try { map.removeLayer(accuracyCircleRef.current); } catch { /* */ }
        accuracyCircleRef.current = null;
      }
    }

    // ── Rota planejada (apenas quando real, >= 3 pontos) ──
    const isRealRoute = routePolyline && routePolyline.length > 2;
    if (isRealRoute) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(routePolyline as [number, number][]);
      } else {
        polylineRef.current = L.polyline(routePolyline as [number, number][], {
          color: 'hsl(142,50%,35%)',
          weight: 4,
          opacity: 0.8,
        }).addTo(map);
      }
    } else if (polylineRef.current) {
      try { map.removeLayer(polylineRef.current); } catch { /* */ }
      polylineRef.current = null;
    }

    // ── Marcador de origem ──
    if (originLatLng) {
      const origIcon = L.divIcon({
        html: `<div style="background:hsl(217,80%,50%);width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:11px;">🅰️</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        className: '',
      });
      if (!originMarkerRef.current) {
        originMarkerRef.current = L.marker(originLatLng, { icon: origIcon }).addTo(map);
        if (originLabel) originMarkerRef.current.bindTooltip(originLabel, { direction: 'top', offset: [0, -12] });
      } else {
        originMarkerRef.current.setLatLng(originLatLng);
      }
    }

    // ── Marcador de destino ──
    if (destLatLng) {
      const destIcon = L.divIcon({
        html: `<div style="background:hsl(0,72%,51%);width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:12px;">📍</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: '',
      });
      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker(destLatLng, { icon: destIcon }).addTo(map);
        if (destLabel) destMarkerRef.current.bindTooltip(destLabel, { direction: 'top', offset: [0, -14] });
      } else {
        destMarkerRef.current.setLatLng(destLatLng);
      }
    }

    // ── Enquadramento ──
    const bounds = L.latLngBounds([] as [number, number][]);
    let added = 0;
    if (hasRealDriver) { bounds.extend([latitude as number, longitude as number]); added++; }
    if (destLatLng) { bounds.extend(destLatLng); added++; }
    if (originLatLng) { bounds.extend(originLatLng); added++; }
    if (isRealRoute) {
      (routePolyline as [number, number][]).forEach((p) => bounds.extend(p));
      added += 2;
    }
    if (added >= 2) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    } else if (hasRealDriver) {
      map.setView([latitude as number, longitude as number], map.getZoom() || 13);
    }
  }, [latitude, longitude, accuracy, driverName, routePolyline, originLatLng, originLabel, destLatLng, destLabel, hasRealDriver]);

  // ResizeObserver + cleanup
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
    observer.observe(container);
    return () => {
      observer.disconnect();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      driverMarkerRef.current = null;
      accuracyCircleRef.current = null;
      polylineRef.current = null;
      destMarkerRef.current = null;
      originMarkerRef.current = null;
    };
  }, []);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: 180 }} />
      {hasRealDriver && speed != null && speed > 0 && (
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] font-medium border shadow-sm">
          {Math.round(speed * 3.6)} km/h
        </div>
      )}
    </div>
  );
}
