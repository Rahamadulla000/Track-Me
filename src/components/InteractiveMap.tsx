import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Palette } from "lucide-react";

interface MapMarker {
  userId: number;
  userName: string;
  userEmail: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  updatedAt: string;
}

interface InteractiveMapProps {
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  path?: [number, number][]; // Line coordinates for path history
  markers?: MapMarker[]; // For admin dashboard with multiple users
  isDarkMode?: boolean;
}

interface MapTheme {
  id: string;
  name: string;
  url: string;
  attribution: string;
}

const MAP_THEMES: MapTheme[] = [
  {
    id: "voyager",
    name: "Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; CARTO',
  },
  {
    id: "dark",
    name: "Dark Matter",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; CARTO',
  },
  {
    id: "positron",
    name: "Positron",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; CARTO',
  },
  {
    id: "osm",
    name: "Classic",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OSM',
  },
];

interface AccentColor {
  id: string;
  name: string;
  color: string; // hex
  twColor: string; // tailwind bg color
}

const ACCENT_COLORS: AccentColor[] = [
  { id: "blue", name: "Ocean Blue", color: "#3b82f6", twColor: "bg-blue-500" },
  { id: "emerald", name: "Emerald Trail", color: "#10b981", twColor: "bg-emerald-500" },
  { id: "rose", name: "Neon Rose", color: "#f43f5e", twColor: "bg-rose-500" },
  { id: "amber", name: "Sunset Amber", color: "#f59e0b", twColor: "bg-amber-500" },
  { id: "purple", name: "Cosmic Purple", color: "#8b5cf6", twColor: "bg-purple-500" },
];

export default function InteractiveMap({
  latitude,
  longitude,
  accuracy,
  path = [],
  markers = [],
  isDarkMode = false,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);
  const multiMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Map theme and path colors customization
  const [selectedTheme, setSelectedTheme] = useState<string>(isDarkMode ? "dark" : "voyager");
  const [selectedAccent, setSelectedAccent] = useState<string>("blue");
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Sync isDarkMode with selectedTheme when theme changes externally
  useEffect(() => {
    setSelectedTheme(isDarkMode ? "dark" : "voyager");
  }, [isDarkMode]);

  // Helper for dynamic customized SVG marker icon
  const createMarkerIcon = (color: string = "#3b82f6", label: string = "", pulse: boolean = true) => {
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div class="flex flex-col items-center justify-center">
          <div class="relative flex items-center justify-center">
            ${pulse ? `<span class="animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-60" style="background-color: ${color}"></span>` : ""}
            <div class="relative flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md border-2" style="border-color: ${color}">
              <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></div>
            </div>
          </div>
          ${label ? `
            <div class="mt-1 bg-slate-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-slate-700">
              ${label}
            </div>
          ` : ""}
        </div>
      `,
      iconSize: [24, 40],
      iconAnchor: [12, 12],
    });
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // will add standard clean zoom controls on top-right
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    // Initial positioning
    const initialLat = latitude || (markers.length > 0 ? markers[0].latitude : 37.7749);
    const initialLng = longitude || (markers.length > 0 ? markers[0].longitude : -122.4194);
    map.setView([initialLat, initialLng], 14);

    mapRef.current = map;

    // Create layers groups
    multiMarkersGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Handle Map Tile Layer Style (Voyager, Dark, Positron, OSM)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const theme = MAP_THEMES.find((t) => t.id === selectedTheme) || MAP_THEMES[0];

    tileLayerRef.current = L.tileLayer(theme.url, {
      attribution: theme.attribution,
      maxZoom: 20,
    }).addTo(map);
  }, [selectedTheme]);

  // 3. Handle single tracking view (Current Location + Accuracy circle)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old single tracker elements if latitude/longitude is not present
    if (latitude === undefined || longitude === undefined) {
      if (centerMarkerRef.current) {
        map.removeLayer(centerMarkerRef.current);
        centerMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        map.removeLayer(accuracyCircleRef.current);
        accuracyCircleRef.current = null;
      }
      return;
    }

    const currentPos: L.LatLngExpression = [latitude, longitude];
    const accent = ACCENT_COLORS.find((a) => a.id === selectedAccent) || ACCENT_COLORS[0];

    // Handle center marker
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng(currentPos);
      centerMarkerRef.current.setIcon(createMarkerIcon(accent.color, "My Location", true));
    } else {
      centerMarkerRef.current = L.marker(currentPos, {
        icon: createMarkerIcon(accent.color, "My Location", true),
      }).addTo(map);
    }

    // Handle accuracy circle
    if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
    }
    if (accuracy) {
      accuracyCircleRef.current = L.circle(currentPos, {
        radius: accuracy,
        color: accent.color,
        fillColor: accent.color,
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
    }

    // Recenter map on user movement
    map.panTo(currentPos);
  }, [latitude, longitude, accuracy, selectedAccent]);

  // 4. Handle Path History rendering
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (pathLineRef.current) {
      map.removeLayer(pathLineRef.current);
      pathLineRef.current = null;
    }

    if (path && path.length > 1) {
      const accent = ACCENT_COLORS.find((a) => a.id === selectedAccent) || ACCENT_COLORS[0];
      pathLineRef.current = L.polyline(path, {
        color: accent.color,
        weight: 4,
        opacity: 0.8,
        dashArray: "5, 10",
        lineJoin: "round",
      }).addTo(map);

      // Fit map to show full path if available and we aren't live tracking
      if (latitude === undefined && longitude === undefined) {
        map.fitBounds(pathLineRef.current.getBounds(), { padding: [40, 40] });
      }
    }
  }, [path, latitude, longitude, selectedAccent]);

  // 5. Handle admin / multi-user markers
  useEffect(() => {
    const map = mapRef.current;
    const group = multiMarkersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!markers || markers.length === 0) return;

    const bounds: L.LatLngExpression[] = [];

    markers.forEach((marker) => {
      const pos: L.LatLngExpression = [marker.latitude, marker.longitude];
      bounds.push(pos);

      // Alternate color style based on userId or chosen accent color highlight
      const baseAccent = ACCENT_COLORS.find((a) => a.id === selectedAccent) || ACCENT_COLORS[0];
      const color = marker.userId % 2 === 0 ? baseAccent.color : "#10b981"; // combination of current selected color accent and emerald green

      const formattedTime = new Date(marker.updatedAt).toLocaleTimeString();

      const leafletMarker = L.marker(pos, {
        icon: createMarkerIcon(color, marker.userName, false),
      });

      const popupContent = `
        <div class="p-2 font-sans" style="min-width: 150px;">
          <h4 class="font-semibold text-sm text-slate-900 border-b pb-1 mb-1">${marker.userName}</h4>
          <p class="text-[11px] text-slate-500 mb-1">${marker.userEmail}</p>
          <div class="flex flex-col gap-0.5 text-[10px] text-slate-600">
            <div><strong>Lat/Lng:</strong> ${marker.latitude.toFixed(5)}, ${marker.longitude.toFixed(5)}</div>
            ${marker.accuracy ? `<div><strong>Accuracy:</strong> ${marker.accuracy}m</div>` : ""}
            <div class="mt-1 text-slate-400"><strong>Updated:</strong> ${formattedTime}</div>
          </div>
        </div>
      `;

      leafletMarker.bindPopup(popupContent);
      group.addLayer(leafletMarker);
    });

    // Auto fit map bounds if we are monitoring multiple users on Admin view
    if (markers.length > 0 && latitude === undefined && longitude === undefined) {
      const boundsGroup = L.latLngBounds(bounds);
      map.fitBounds(boundsGroup, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers, latitude, longitude, selectedAccent]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Embedded Compass / Coordinates overlay */}
      {latitude !== undefined && longitude !== undefined && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-slate-900/95 shadow-md px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-850 flex items-center gap-3 backdrop-blur-sm text-xs text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-1.5 text-blue-500">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span>GPS Live</span>
          </div>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>Lat: {latitude.toFixed(5)}</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>Lng: {longitude.toFixed(5)}</span>
        </div>
      )}

      {/* Floating Map Customizer Palette Panel */}
      <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-2 rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white cursor-pointer backdrop-blur-sm"
          title="Map Color Theme Settings"
        >
          <Palette className={`w-4 h-4 text-blue-500 transition-transform ${showConfig ? "rotate-45" : ""}`} />
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider hidden sm:inline">Map Customizer</span>
        </button>

        {showConfig && (
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-3 rounded shadow-lg flex flex-col gap-3 min-w-[200px] backdrop-blur-sm">
            {/* Map Theme Selection */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-slate-400 block">Map Background</span>
              <div className="grid grid-cols-2 gap-1.5">
                {MAP_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded border transition-all text-center cursor-pointer ${
                      selectedTheme === theme.id
                        ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
                        : "bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    {theme.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Path Selection */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-slate-400 block">Accent & Path Color</span>
              <div className="flex items-center gap-2">
                {ACCENT_COLORS.map((accent) => (
                  <button
                    key={accent.id}
                    onClick={() => setSelectedAccent(accent.id)}
                    className={`w-6 h-6 rounded-full ${accent.twColor} transition-all relative cursor-pointer border flex items-center justify-center ${
                      selectedAccent === accent.id
                        ? "scale-115 ring-2 ring-white dark:ring-slate-950 border-slate-900 dark:border-white"
                        : "border-transparent opacity-75 hover:opacity-100 hover:scale-105"
                    }`}
                    title={accent.name}
                  >
                    {selectedAccent === accent.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
