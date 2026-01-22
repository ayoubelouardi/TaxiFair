import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { Icon } from 'leaflet';
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import markerIcon2xPng from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png";

// Fix for default Leaflet marker icons not loading in React
const defaultIcon = new Icon({
  iconUrl: markerIconPng,
  iconRetinaUrl: markerIcon2xPng,
  shadowUrl: markerShadowPng,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapBackgroundProps {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
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

export function MapBackground({ origin, destination }: MapBackgroundProps) {
  // Casablanca default center
  const defaultCenter = { lat: 33.5731, lng: -7.5898 };

  return (
    <div className="absolute inset-0 z-0 bg-slate-100">
      <MapContainer 
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={13} 
        scrollWheelZoom={true}
        zoomControl={false} // We can add custom controls if needed
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={defaultIcon}>
            <Popup>Origin</Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={defaultIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        <MapController origin={origin} destination={destination} />
      </MapContainer>
      
      {/* Subtle overlay gradient to make text legible if placed on top */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/10 to-transparent z-[11]" />
    </div>
  );
}
