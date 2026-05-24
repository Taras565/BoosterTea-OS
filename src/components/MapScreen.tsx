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
  status?: string;
}

// Distance calculation using Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export default function MapScreen({ onClose }: { onClose: () => void }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

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

  const handleRequestLocation = () => {
    triggerHaptic();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLocation({ lat, lon });
          setShowLocationPrompt(false);
          
          // Check if any point is within 50km
          if (locations.length > 0) {
            const isNear = locations.some(loc => getDistanceFromLatLonInKm(lat, lon, loc.lat, loc.lon) <= 50);
            setIsOutOfRange(!isNear);
          }
        },
        (error) => {
          console.error("Error getting location", error);
          setShowLocationPrompt(false);
        }
      );
    } else {
      setShowLocationPrompt(false);
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
        ) : isOutOfRange ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black p-6 text-center z-[55]">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800">
              <MapPin size={32} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Поза Зоною Покриття</h3>
            <p className="text-sm text-gray-400 mb-8 max-w-xs">На жаль, у вашому регіоні (в радіусі 50 км) ще немає активних Booster Points. Проте ви можете замовити концентрат з доставкою додому.</p>
            <button onClick={() => window.open('https://www.boostertea.com.ua/', '_blank')} className="w-full premium-btn font-bold py-4 rounded-xl uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,204,0.3)]">
              Замовити поштою
            </button>
            <button onClick={() => setIsOutOfRange(false)} className="mt-4 text-xs text-gray-500 underline">Все одно показати карту</button>
          </div>
        ) : (
          <>
            {showLocationPrompt && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[55] w-[90%] max-w-sm">
                <div className="bg-gray-900/90 backdrop-blur-md border border-primary/30 p-4 rounded-xl shadow-lg flex flex-col items-center text-center">
                  <p className="text-xs text-gray-300 mb-3">Дозвольте доступ до геолокації для пошуку найближчих точок</p>
                  <button onClick={handleRequestLocation} className="w-full py-2 bg-primary/20 text-primary border border-primary/50 rounded-lg text-sm font-bold uppercase hover:bg-primary/30 transition-colors">📍 Використати моє місцезнаходження</button>
                </div>
              </div>
            )}
            <MapContainer center={[50.4501, 30.5234]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {locations.map(loc => {
                const isClosed = loc.status === "CLOSED" || loc.status === "TEMPORARY_CLOSED";
                return (
                  <Marker key={loc.id} position={[loc.lat, loc.lon]} opacity={isClosed ? 0.5 : 1}>
                    <Popup className="booster-popup">
                      <div className="font-bold text-sm text-black mb-1 flex items-center justify-between">
                        {loc.name}
                        {isClosed && <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded uppercase ml-2">Зачинено</span>}
                      </div>
                      <div className="text-xs text-gray-600">{loc.address}</div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </>
        )}
      </div>
      
      {!loading && !isOutOfRange && locations.length > 0 && (
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
