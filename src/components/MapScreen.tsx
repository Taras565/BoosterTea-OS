import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin } from 'lucide-react';
import { openExternalLink } from '../utils';

// Fix Leaflet icons issue in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const customBpIcon = L.divIcon({
  className: 'custom-bp-marker',
  html: '<div style="background-color: #00ffcc; color: black; font-weight: bold; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(0,255,204,0.6); font-size: 12px; border: 2px solid white;">BP</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
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

const ChangeView = ({ coords }: { coords: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      map.fitBounds(coords, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
};

export default function MapScreen({ onClose }: { onClose: () => void }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [showEMAModal, setShowEMAModal] = useState(false);
  const [emaRating, setEmaRating] = useState(0);
  const [emaTags, setEmaTags] = useState<string[]>([]);
  
  const [routeMode, setRouteMode] = useState<'driving' | 'foot'>('driving');
  const [routeData, setRouteData] = useState<{coords: [number, number][], duration: number, distance: number} | null>(null);
  const [routingLoading, setRoutingLoading] = useState(false);

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

  const fetchRoute = async (mode: 'driving' | 'foot') => {
    if (!userLocation || locations.length === 0) return;
    setRoutingLoading(true);
    triggerHaptic();
    setRouteMode(mode);
    const loc = locations[0]; // Route to the first available location
    try {
      const url = `https://router.project-osrm.org/route/v1/${mode}/${userLocation.lon},${userLocation.lat};${loc.lon},${loc.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c: any[]) => [c[1], c[0]]);
        setRouteData({
          coords,
          duration: Math.round(route.duration / 60), // to minutes
          distance: +(route.distance / 1000).toFixed(1) // to km
        });
      }
    } catch(err) {
      console.error(err);
    } finally {
      setRoutingLoading(false);
    }
  };

  const handleEMASubmit = async () => {
    triggerHaptic();
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
      const tgId = initData?.user?.id || 123456789;
      
      const res = await fetch(`${API_URL}/feedback/ema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgId,
          point_id: locations[0]?.id || 'test-point-1',
          rating: emaRating,
          tags: { selected: emaTags }
        })
      });
      if (res.ok) {
        alert("Дякуємо! Ваш відгук враховано. Ви отримали +5 балів!");
        setShowEMAModal(false);
      }
    } catch(e) {
      console.error(e);
      setShowEMAModal(false);
    }
  };

  const EMA_TAGS = ["Дуже смачно", "Швидко", "Привітний персонал", "Довго чекав", "Брудно", "Гучна музика"];

  const toggleEmaTag = (tag: string) => {
    if (emaTags.includes(tag)) {
      setEmaTags(emaTags.filter(t => t !== tag));
    } else {
      setEmaTags([...emaTags, tag]);
    }
    triggerHaptic();
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
            <button onClick={() => openExternalLink('https://www.boostertea.com.ua/')} className="w-full premium-btn font-bold py-4 rounded-xl uppercase tracking-wider shadow-[0_0_15px_rgba(0,255,204,0.3)]">
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
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lon]}>
                  <Popup className="booster-popup">
                    <div className="font-bold text-sm text-black">Ви тут</div>
                  </Popup>
                </Marker>
              )}
              {routeData && (
                <>
                  <Polyline positions={routeData.coords} color="#00ffcc" weight={5} opacity={0.8} />
                  <ChangeView coords={routeData.coords} />
                </>
              )}
              {locations.map(loc => {
                const isClosed = loc.status === "CLOSED" || loc.status === "TEMPORARY_CLOSED";
                return (
                  <Marker key={loc.id} position={[loc.lat, loc.lon]} icon={customBpIcon} opacity={isClosed ? 0.5 : 1}>
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
        <div className="p-4 bg-black border-t border-gray-800 z-[60] flex flex-col gap-3">
          <p className="text-xs text-gray-400 text-center mb-1">Знайдено партнерських закладів: {locations.length}</p>
          
          {!routeData ? (
            <button 
              onClick={() => fetchRoute('driving')}
              className="w-full premium-btn font-bold py-3 rounded-xl uppercase tracking-wider text-sm flex items-center justify-center gap-2"
              disabled={routingLoading || !userLocation}
            >
              {routingLoading ? 'Розрахунок...' : 'Прокласти маршрут'}
            </button>
          ) : (
            <div className="bg-gray-900/50 p-3 rounded-xl border border-primary/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm font-bold">{routeData.distance} км</span>
                <span className="text-primary font-bold">{routeData.duration} хв</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => fetchRoute('driving')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors border ${routeMode === 'driving' ? 'bg-primary text-black border-primary' : 'bg-transparent text-gray-400 border-gray-700'}`}
                >
                  🚗 Авто
                </button>
                <button 
                  onClick={() => fetchRoute('foot')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors border ${routeMode === 'foot' ? 'bg-primary text-black border-primary' : 'bg-transparent text-gray-400 border-gray-700'}`}
                >
                  🚶 Пішки
                </button>
              </div>
            </div>
          )}
          
          <button onClick={() => setShowEMAModal(true)} className="w-full bg-gray-800 border border-primary/50 text-primary font-bold py-3 rounded-xl uppercase tracking-wider text-xs hover:bg-gray-700 transition-colors">
            Імітувати вихід з геозони (EMA)
          </button>
        </div>
      )}

      {showEMAModal && (
        <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl border border-primary/30 w-full max-w-sm text-center">
            <h3 className="text-xl font-bold text-white mb-2">Як вам візит?</h3>
            <p className="text-xs text-gray-400 mb-6">Оцініть заклад, щоб ми стали кращими. Отримайте мікро-нагороду!</p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => { setEmaRating(star); triggerHaptic(); }} className="text-4xl transition-transform hover:scale-110">
                  <span className={star <= emaRating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                </button>
              ))}
            </div>

            {emaRating > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Що саме сподобалось / не сподобалось?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {EMA_TAGS.map(tag => (
                    <button 
                      key={tag}
                      onClick={() => toggleEmaTag(tag)}
                      className={`text-[10px] px-3 py-1.5 rounded-full border transition-colors ${emaTags.includes(tag) ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent border-gray-700 text-gray-400'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowEMAModal(false)} className="flex-1 py-3 bg-gray-800 rounded-xl text-xs font-bold text-gray-400 uppercase">Закрити</button>
              <button onClick={handleEMASubmit} disabled={emaRating === 0} className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${emaRating > 0 ? 'bg-primary text-black' : 'bg-gray-800 text-gray-600'}`}>Надіслати</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
