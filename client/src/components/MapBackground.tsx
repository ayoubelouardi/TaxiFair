import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from 'leaflet';
import { Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

// Fix for default Leaflet marker icons not loading in React
const originIcon = new Icon({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIcon2xPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create a red icon for the destination
const destinationIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapBackgroundProps {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  onMapClick?: (lat: number, lng: number) => void;
  onContextMenuSelect?: (lat: number, lng: number, type: 'origin' | 'destination') => void;
  selectionMode?: 'origin' | 'destination' | null;
}

// Helper to center map when points change
function MapController({ origin, destination }: MapBackgroundProps) {
  const map = useMap();

  useEffect(() => {
    if (origin && destination) {
      const bounds = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ];
      // @ts-ignore - Leaflet types sometimes finicky with bounds array
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin) {
      map.flyTo([origin.lat, origin.lng], 13);
    }
  }, [origin, destination, map]);

  return null;
}

function ZoomControls() {
  const map = useMap();
  const { t } = useTranslation();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="absolute bottom-6 end-6 z-[1000] flex flex-col gap-2">
      <button
        onClick={handleZoomIn}
        className="w-10 h-10 bg-card rounded-lg shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        title={t('home.zoomIn', { defaultValue: 'Zoom in' })}
      >
        <Plus className="w-5 h-5 text-primary" />
      </button>
      <button
        onClick={handleZoomOut}
        className="w-10 h-10 bg-card rounded-lg shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
        title={t('home.zoomOut', { defaultValue: 'Zoom out' })}
      >
        <Minus className="w-5 h-5 text-primary" />
      </button>
    </div>
  );
}

function MapEventsHandler({ 
  onMapClick, 
  onContextMenuSelect,
  portalTarget
}: { 
  onMapClick?: (lat: number, lng: number) => void;
  onContextMenuSelect?: (lat: number, lng: number, type: 'origin' | 'destination') => void;
  portalTarget: HTMLElement | null;
}) {
  const [contextMenu, setContextMenu] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null);
  const map = useMap();
  const { t } = useTranslation();

  useMapEvents({
    click: (e) => {
      setContextMenu(null);
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
    contextmenu: (e) => {
      e.originalEvent.preventDefault();
      const { x, y } = e.containerPoint;
      setContextMenu({ lat: e.latlng.lat, lng: e.latlng.lng, x, y });
    },
  });

  if (!contextMenu || !portalTarget) return null;

  return createPortal(
    <div 
      className="absolute z-[2000] bg-card rounded-lg shadow-xl border border-border p-1 flex flex-col gap-1 min-w-[160px]"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        pointerEvents: 'auto'
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenuSelect?.(contextMenu.lat, contextMenu.lng, 'origin');
          setContextMenu(null);
        }}
        className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors text-start"
      >
        <div className="w-2 h-2 rounded-full bg-primary" />
        {t('home.selectAsOrigin')}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenuSelect?.(contextMenu.lat, contextMenu.lng, 'destination');
          setContextMenu(null);
        }}
        className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors text-start"
      >
        <div className="w-2 h-2 rounded-full bg-accent" />
        {t('home.selectAsDestination')}
      </button>
      <div className="h-px bg-border/60 my-1" />
      <button
        onClick={() => setContextMenu(null)}
        className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground text-center"
      >
        {t('home.cancel')}
      </button>
    </div>,
    portalTarget
  );
}

function SelectionModeOverlay({ selectionMode }: { selectionMode?: 'origin' | 'destination' | null }) {
  const { t } = useTranslation();
  
  if (!selectionMode) return null;
  
  return (
    <div className="absolute top-4 start-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
      <div className="bg-primary text-white px-4 py-2 rounded-full shadow-lg font-medium animate-pulse">
        {selectionMode === 'origin' 
          ? t('home.clickToSelectOrigin', { defaultValue: 'Click on map to select origin' })
          : t('home.clickToSelectDestination', { defaultValue: 'Click on map to select destination' })
        }
      </div>
    </div>
  );
}

export function MapBackground({ origin, destination, onMapClick, onContextMenuSelect, selectionMode }: MapBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultCenter = { lat: 33.5731, lng: -7.5898 };
  const { t } = useTranslation();

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 bg-muted/40">
      <MapContainer 
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={13} 
        scrollWheelZoom={true}
        zoomControl={false} 
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>{t('home.origin')}</Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>{t('home.destination')}</Popup>
          </Marker>
        )}

        <MapController origin={origin} destination={destination} />
        <MapEventsHandler 
          onMapClick={onMapClick} 
          onContextMenuSelect={onContextMenuSelect} 
          portalTarget={containerRef.current}
        />
        <ZoomControls />
      </MapContainer>
      
      <SelectionModeOverlay selectionMode={selectionMode} />

      {/* Subtle overlay gradient to make text legible if placed on top */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/25 to-transparent z-[11]" />
    </div>
  );
}
