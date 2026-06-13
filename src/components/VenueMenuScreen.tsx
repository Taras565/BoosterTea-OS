import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Navigation, Info } from 'lucide-react';
import { openExternalLink } from '../utils';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname.includes('localhost') ? 'http://localhost:8000/api' : 'https://boostertea-os-backend.onrender.com/api');
const STATIC_URL = API_URL.replace('/api', '');

interface Cocktail {
  id: string;
  name: string;
  base_state: string;
  price: number;
  taste_description: string;
  image_url: string;
}

export default function VenueMenuScreen({ 
  pointId, 
  pointName, 
  pointAddress, 
  onClose,
  onActivatePractice 
}: { 
  pointId: string, 
  pointName: string, 
  pointAddress: string, 
  onClose: () => void,
  onActivatePractice: (cocktail: Cocktail) => void 
}) {
  const [cocktails, setCocktails] = useState<Cocktail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_URL}/venues/${pointId}/cocktails`);
        if (res.ok) {
          const data = await res.json();
          setCocktails(data.cocktails || []);
        }
      } catch (err) {
        console.error("Failed to fetch menu", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [pointId]);

  const triggerHaptic = () => {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const getBaseColor = (state: string) => {
    if (state === 'Energy') return 'bg-red-500/20 text-red-500 border-red-500/50';
    if (state === 'Focus') return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    if (state === 'Relax') return 'bg-green-500/20 text-green-400 border-green-500/50';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };
  
  const getBaseEmoji = (state: string) => {
    if (state === 'Energy') return '🔥 Енергія';
    if (state === 'Focus') return '🧠 Фокус';
    if (state === 'Relax') return '🧘 Релакс';
    return state;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="absolute inset-0 z-[80] bg-black flex flex-col">
      {/* Header */}
      <div className="flex flex-col p-4 bg-gradient-to-b from-black to-black/80 shadow-lg relative z-[90]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="text-primary" />
            {pointName}
          </h2>
          <button onClick={() => { triggerHaptic(); onClose(); }} className="p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{pointAddress}</p>
        <button onClick={() => { triggerHaptic(); openExternalLink(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pointName + " " + pointAddress)}`); }} className="w-full bg-gray-900 border border-primary/50 text-primary font-bold py-2 rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors">
          <Navigation size={16} /> Прокласти Маршрут
        </button>
      </div>

      {/* Menu Feed */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cocktails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
            <Info size={48} className="mb-4 opacity-50" />
            <p>Меню цього закладу поки що порожнє.</p>
          </div>
        ) : (
          cocktails.map(cocktail => (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={cocktail.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
              <div className="h-64 w-full bg-black relative">
                {cocktail.image_url ? (
                  <img src={`${STATIC_URL}${cocktail.image_url}`} alt={cocktail.name} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">No Image</div>
                )}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${getBaseColor(cocktail.base_state)}`}>
                  {getBaseEmoji(cocktail.base_state)}
                </div>
              </div>
              
              <div className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-white">{cocktail.name}</h3>
                  <span className="text-lg font-bold text-primary">{cocktail.price} ₴</span>
                </div>
                
                <p className="text-sm text-gray-400 leading-relaxed mb-2">{cocktail.taste_description}</p>
                
                <button 
                  onClick={() => { triggerHaptic(); onActivatePractice(cocktail); }}
                  className="w-full premium-btn font-bold py-3 rounded-xl uppercase tracking-wider text-sm mt-2"
                >
                  Активувати Практику
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
