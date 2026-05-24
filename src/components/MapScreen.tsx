import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin } from 'lucide-react';

// Fix Leaflet icons issue in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname.includes('localhost') ? 'http://localhost:8000/api' : 'https://boostertea-os-backend.onrender.com/api');

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

export default function MapScreen({ onClose }: { onClose: () => void }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`${API_URL}/locations`);
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations || []);
        }
      } catch (err) {
        console.error('Failed to fetch locations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const triggerHaptic = () => {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black to-black/80 shadow-lg relative z-[60]">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <MapPin className="text-primary" />
          Booster Points
        </h2>
        <button onClick={() => { triggerHaptic(); onClose(); }} className="p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-[55]">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MapContainer center={[50.4501, 30.5234]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {locations.map(loc => (
              <Marker key={loc.id} position={[loc.lat, loc.lon]}>
                <Popup className="booster-popup">
                  <div className="font-bold text-sm text-black mb-1">{loc.name}</div>
                  <div className="text-xs text-gray-600">{loc.address}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
      
      {!loading && locations.length > 0 && (
        <div className="p-4 bg-black border-t border-gray-800 z-[60]">
          <p className="text-xs text-gray-400 text-center mb-2">Знайдено партнерських закладів: {locations.length}</p>
          <button className="w-full premium-btn font-bold py-3 rounded-xl uppercase tracking-wider text-sm flex items-center justify-center gap-2">
            Прокласти маршрут
          </button>
        </div>
      )}
    </motion.div>
  );
}
