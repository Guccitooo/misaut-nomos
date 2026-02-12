import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MapPin } from "lucide-react";
import L from "leaflet";

// Fix para iconos de leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Coordenadas aproximadas de ciudades españolas
const CITY_COORDS = {
  "Madrid": [40.4168, -3.7038],
  "Barcelona": [41.3851, 2.1734],
  "Valencia": [39.4699, -0.3763],
  "Sevilla": [37.3891, -5.9845],
  "Málaga": [36.7213, -4.4214],
  "Bilbao": [43.2630, -2.9350],
  "Alicante": [38.3452, -0.4810],
  "Zaragoza": [41.6488, -0.8891],
  // Agregar más según necesidad
};

export default function MapView({ profiles, onProfileClick }) {
  const mapRef = useRef(null);

  const profilesWithCoords = profiles
    .filter(p => p.ciudad && CITY_COORDS[p.ciudad])
    .map(p => ({
      ...p,
      coords: CITY_COORDS[p.ciudad]
    }));

  const center = profilesWithCoords.length > 0 
    ? profilesWithCoords[0].coords 
    : [40.4168, -3.7038]; // Madrid por defecto

  return (
    <Card className="h-[500px] overflow-hidden">
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {profilesWithCoords.map((profile) => (
          <Marker key={profile.id} position={profile.coords}>
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-sm mb-1">{profile.business_name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3" />
                  {profile.ciudad}, {profile.provincia}
                </div>
                {profile.average_rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold">{profile.average_rating.toFixed(1)}</span>
                  </div>
                )}
                <Button
                  onClick={() => onProfileClick(profile)}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                >
                  Ver perfil
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Card>
  );
}