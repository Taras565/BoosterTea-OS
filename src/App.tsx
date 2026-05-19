import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Droplet, Thermometer, Wind, CheckCircle2, ChevronRight, FlaskConical, Target, Zap, Coffee, MessageCircle, Leaf } from 'lucide-react'

import BreathworkTimer from './components/BreathworkTimer'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// --- Types ---
type UserProfile = {
  name: string;
  gender: string;
  weight: number;
  birthDate: string;
  profession: string;
  sub_profession: string;
  taste_acid: number;
  taste_bitter: number;
  taste_sweet: number;
};

type Recipe = {
  base: string;
  activator: string;
  tea_ml: number;
  juice_ml: number;
  water_ml: number;
  ice_cubes: number;
  cocktail_status: string;
  breathwork_protocol: string;
  instructions: string;
  avatar_id: string;
  avatar_name: string;
  avatar_slogan: string;
  avatar_image: string;
  stats: { focus: number, energy: number, calm: number };
  explanation?: string;
};

// --- Constants ---
const META_TILES = [
  { id: 'COGNITIVE', label: 'Аналітика / Код', icon: '🧠', subs: ['Студент', 'Розробник / QA / DS', 'Трейдер / Фінансист'] },
  { id: 'CREATIVE', label: 'Творчість', icon: '🎨', subs: ['Креатор / Дизайнер', 'Письменник / Копірайтер'] },
  { id: 'COMMUNICATION', label: 'Комунікація', icon: '🗣', subs: ['Спікер / Лектор', 'Sales / Менеджер'] },
  { id: 'PHYSICAL', label: 'Спорт & Активність', icon: '⚡', subs: ['Кардіо / Вода', 'Силовий тренінг'] },
  { id: 'ROUTINE', label: 'Життєвий тонус', icon: '🔄', subs: ['Навчання', 'Побутові задачі', 'Пенсіонер / Відновлення'] }
];

const triggerHaptic = () => { 
  try { 
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light'); 
    } 
    if (navigator.vibrate) navigator.vibrate(15);
  } catch (e) {} 
};

function Onboarding({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ 
    name: initData?.user?.firstName || '', 
    gender: 'male', 
    weight: 70, 
    birthDate: '1995-05-15', 
    profession: '', 
    sub_profession: '', 
    taste_acid: 5, 
    taste_bitter: 5, 
    taste_sweet: 5 
  });

  const handleNext = async () => {
    triggerHaptic();
    if (step === 2 && !data.sub_profession) { alert("Будь ласка, оберіть вашу точну діяльність."); return; }
    if (step < 3) setStep(step + 1);
    else {
      setLoading(true);
      try {
        const telegramId = initData?.user?.id || 123456789; // fallback for testing
        const username = initData?.user?.username || '';
        
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: telegramId,
            username: username,
            weight: data.weight,
            gender: data.gender,
            birth_date: data.birthDate,
            profession_type: data.profession,
            taste_acid_pref: data.taste_acid,
            taste_bitter_pref: data.taste_bitter,
            taste_sweet_pref: data.taste_sweet
          })
        });
        
        if (!res.ok) throw new Error("Registration failed");
        
        const profile: UserProfile = { ...data };
        localStorage.setItem('bio_profile', JSON.stringify(profile));
        onComplete(profile);
      } catch (err) {
        console.error(err);
        alert("Помилка реєстрації. Спробуйте пізніше.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-6 h-full flex flex-col justify-center">
      <h2 className="text-2xl font-bold text-primary text-center mb-2">Liquid OS Ініціалізація</h2>
      <div className="flex justify-center space-x-2 mb-8">
        {[1,2,3].map(i => <div key={i} className={`h-1 w-10 rounded ${step >= i ? 'bg-primary' : 'bg-gray-700'}`} />)}
      </div>

      {step === 1 && (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Біометрія</h3>
          
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Ім'я (Псевдонім)</label>
            <input type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600" placeholder="Neo..." />
          </div>

          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-1">Стать (Гормональний фон)</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setData({...data, gender: 'male'}); triggerHaptic(); }} className={`p-3 rounded-lg border text-sm font-bold transition-all ${data.gender === 'male' ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-gray-700 bg-black/30 text-gray-400'}`}>Чоловіча</button>
              <button onClick={() => { setData({...data, gender: 'female'}); triggerHaptic(); }} className={`p-3 rounded-lg border text-sm font-bold transition-all ${data.gender === 'female' ? 'border-pink-500 bg-pink-500/20 text-pink-400' : 'border-gray-700 bg-black/30 text-gray-400'}`}>Жіноча</button>
            </div>
          </div>

          <div><label className="block text-gray-400 text-sm mb-1">Вага (кг)</label>
            <input type="number" value={data.weight} onChange={e => setData({...data, weight: parseInt(e.target.value)||0})} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white text-center text-xl" />
          </div>
          <div><label className="block text-gray-400 text-sm mb-1">Дата народження</label>
            <input type="date" value={data.birthDate} onChange={e => setData({...data, birthDate: e.target.value})} className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white" />
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4 flex flex-col h-full">
          <h3 className="text-lg font-bold text-white mb-2">Мета-профіль Діяльності</h3>
          <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto">
            {META_TILES.map(tile => (
              <div key={tile.id} className="space-y-2">
                <button 
                  onClick={() => { setData({...data, profession: tile.id, sub_profession: ''}); triggerHaptic(); }} 
                  className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-all ${data.profession === tile.id ? 'border-primary bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,255,204,0.3)]' : 'border-gray-700 bg-black/30 text-gray-300'}`}
                >
                  <span className="text-2xl">{tile.icon}</span>
                  <span className="font-bold">{tile.label}</span>
                </button>
                
                <AnimatePresence>
                  {data.profession === tile.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-4 pr-2 overflow-hidden">
                      <div className="bg-black/50 border border-primary/30 p-3 rounded-lg mt-1">
                        <label className="block text-xs text-primary mb-2 uppercase tracking-widest">Я займаюся:</label>
                        <select 
                          value={data.sub_profession} 
                          onChange={e => { setData({...data, sub_profession: e.target.value}); triggerHaptic(); }} 
                          className="w-full bg-transparent text-white border-b border-gray-600 pb-1 outline-none text-sm"
                        >
                          <option value="" disabled>Оберіть напрямок...</option>
                          {tile.subs.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Смакова карта</h3>
          {[
            {k:'taste_acid', label:'Кисле'}, {k:'taste_bitter', label:'Гірке'}, {k:'taste_sweet', label:'Солодке'}
          ].map(t => (
            <div key={t.k}>
              <label className="block text-gray-400 text-sm mb-1">{t.label}: {(data as any)[t.k]}/10</label>
              <input type="range" min="1" max="10" value={(data as any)[t.k]} onChange={e => setData({...data, [t.k]: parseInt(e.target.value)})} className="w-full accent-primary" />
            </div>
          ))}
        </motion.div>
      )}

      {loading ? (
        <div className="w-full mt-4 flex justify-center py-4"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <button onClick={handleNext} className="w-full mt-4 premium-btn font-bold py-4 rounded-xl flex justify-center items-center gap-2 active:scale-95 transition-all uppercase tracking-wider text-sm">
          {step === 3 ? 'Створити Профіль' : 'Далі'} <ChevronRight size={20} />
        </button>
      )}
    </motion.div>
  );
}

const STRESS_LEVELS = [
  { label: 'Дзен', value: 2, active: 'bg-green-500 text-black border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]', idle: 'text-green-400 border-green-900/50 bg-black/40' },
  { label: 'Норма', value: 5, active: 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]', idle: 'text-yellow-400 border-yellow-900/50 bg-black/40' },
  { label: 'Напруга', value: 8, active: 'bg-orange-500 text-black border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]', idle: 'text-orange-400 border-orange-900/50 bg-black/40' },
  { label: 'Перегорів', value: 10, active: 'bg-red-500 text-black border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]', idle: 'text-red-400 border-red-900/50 bg-black/40' }
];

const ENERGY_LEVELS = [
  { label: 'Сів', value: 2, active: 'bg-red-500 text-black border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]', idle: 'text-red-400 border-red-900/50 bg-black/40' },
  { label: 'Мало', value: 5, active: 'bg-orange-500 text-black border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]', idle: 'text-orange-400 border-orange-900/50 bg-black/40' },
  { label: 'Норма', value: 8, active: 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]', idle: 'text-yellow-400 border-yellow-900/50 bg-black/40' },
  { label: 'Заряд', value: 10, active: 'bg-green-500 text-black border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]', idle: 'text-green-400 border-green-900/50 bg-black/40' }
];

const MENTAL_LEVELS = [
  { label: 'Туман', value: 2, active: 'bg-gray-400 text-black border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.5)]', idle: 'text-gray-400 border-gray-800 bg-black/40' },
  { label: 'Блукає', value: 5, active: 'bg-blue-400 text-black border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]', idle: 'text-blue-400 border-blue-900/50 bg-black/40' },
  { label: 'Чіткий', value: 8, active: 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]', idle: 'text-cyan-400 border-cyan-900/50 bg-black/40' },
  { label: 'Лазер', value: 10, active: 'bg-primary text-black border-primary shadow-[0_0_10px_rgba(0,255,204,0.5)]', idle: 'text-primary border-primary/50 bg-black/40' }
];

function DailyCheckIn({ profile, onResult, onReset }: { profile: UserProfile, onResult: (r: Recipe, t: number, c: string) => void, onReset: () => void }) {
  const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
  const [scaleCns, setScaleCns] = useState(5);
  const [scaleEnergy, setScaleEnergy] = useState(5);
  const [scaleMental, setScaleMental] = useState(5);
  const [hadCaffeine, setHadCaffeine] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setLat(latitude);
            setLon(longitude);
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const data = await res.json();
            setCurrentTemp(Math.round(data.current_weather.temperature));
          } catch (e) {
            setCurrentTemp(22); // Fallback
          }
        },
        () => setCurrentTemp(22) // Fallback on deny
      );
    } else {
      setCurrentTemp(22);
    }
  }, []);

  const handleCalculate = async () => {
    triggerHaptic(); 
    setLoading(true);
    setErrorMsg(null);
    try {
      const telegramId = initData?.user?.id || 123456789;
      
      const res = await fetch(`${API_URL}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          specific_activity_id: profile.sub_profession,
          scale_cns: scaleCns,
          scale_energy: scaleEnergy,
          scale_mental: scaleMental,
          had_caffeine_recently: hadCaffeine,
          latitude: lat,
          longitude: lon
        })
      });

      if (res.status === 404) {
        localStorage.removeItem('bio_profile');
        onReset();
        return;
      }

      if (!res.ok) throw new Error("Calculation failed");
      const data = await res.json();
      
      onResult(data.recipe, data.weather.temp, data.weather.condition);
    } catch (err) {
      console.error(err);
      setErrorMsg("Втрачено зв'язок із сервером. Перевірте інтернет.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 flex flex-col h-full overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Стан на сьогодні</h2>
        <button onClick={() => { triggerHaptic(); localStorage.removeItem('bio_profile'); onReset(); }} className="text-xs text-red-400 border border-red-900/50 bg-red-900/20 px-2 py-1 rounded hover:bg-red-900/40 transition-colors">Скинути</button>
      </div>
      
      <div className="bg-black/40 p-3 rounded-xl border border-primary/20 mb-6 flex justify-between items-center">
        <div><p className="text-xs text-gray-500 uppercase">Активність</p><p className="text-sm font-bold text-primary">{profile.sub_profession}</p></div>
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-3"><label className="text-sm font-bold text-white">Рівень стресу (ЦНС)</label></div>
          <div className="grid grid-cols-4 gap-2">
            {STRESS_LEVELS.map(lvl => (
              <button key={lvl.label} onClick={() => { setScaleCns(lvl.value); triggerHaptic(); }} className={`py-2 px-1 text-[10px] sm:text-xs font-bold uppercase rounded-lg border transition-all duration-300 ${scaleCns === lvl.value ? lvl.active : lvl.idle}`}>{lvl.label}</button>
            ))}
          </div>
        </div>

        <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-3"><label className="text-sm font-bold text-white">Рівень енергії</label></div>
          <div className="grid grid-cols-4 gap-2">
            {ENERGY_LEVELS.map(lvl => (
              <button key={lvl.label} onClick={() => { setScaleEnergy(lvl.value); triggerHaptic(); }} className={`py-2 px-1 text-[10px] sm:text-xs font-bold uppercase rounded-lg border transition-all duration-300 ${scaleEnergy === lvl.value ? lvl.active : lvl.idle}`}>{lvl.label}</button>
            ))}
          </div>
        </div>

        <div className="bg-black/30 p-4 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-3"><label className="text-sm font-bold text-white">Ментальний фокус</label></div>
          <div className="grid grid-cols-4 gap-2">
            {MENTAL_LEVELS.map(lvl => (
              <button key={lvl.label} onClick={() => { setScaleMental(lvl.value); triggerHaptic(); }} className={`py-2 px-1 text-[10px] sm:text-xs font-bold uppercase rounded-lg border transition-all duration-300 ${scaleMental === lvl.value ? lvl.active : lvl.idle}`}>{lvl.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 bg-black/30 p-4 rounded-xl border border-gray-800 flex items-center justify-between cursor-pointer" onClick={() => { setHadCaffeine(!hadCaffeine); triggerHaptic(); }}>
        <div className="flex items-center gap-3">
          <Coffee className={hadCaffeine ? "text-primary" : "text-gray-500"} size={20} />
          <span className="text-sm text-white font-medium">Пив каву / енергетик сьогодні?</span>
        </div>
        <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${hadCaffeine ? 'bg-primary border-primary text-black' : 'border-gray-600'}`}>
          {hadCaffeine && <CheckCircle2 size={16} />}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-center">
          <p className="text-xs text-red-400 leading-tight">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="w-full py-4 flex justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <button onClick={handleCalculate} className="w-full mt-auto premium-btn font-bold py-4 rounded-xl flex justify-center items-center gap-2 uppercase tracking-wider text-sm">
          <Activity size={20} /> Біо-буст
        </button>
      )}
    </motion.div>
  );
}

function ResultScreen({ recipe, weatherTemp, weatherCond, onDone }: { recipe: Recipe, weatherTemp: number, weatherCond: string, onDone: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="glass-panel flex flex-col h-full overflow-y-auto max-h-[95vh] p-0 border-primary/30">
      
      {/* Premium Avatar Header */}
      <div className="relative pt-6 pb-6 px-4 bg-gradient-to-br from-gray-900 to-black border-b border-primary/20 flex flex-col items-center text-center">
        <div className="w-24 h-24 mb-3 rounded-full border border-primary/50 shadow-[0_0_20px_rgba(0,255,204,0.3)] overflow-hidden bg-black flex items-center justify-center p-0.5">
          <img src={recipe.avatar_image} alt="Avatar" className="w-full h-full object-cover rounded-full mix-blend-screen" />
        </div>
        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,255,204,0.5)] z-10 leading-none">{recipe.avatar_name}</h2>
        <p className="text-[10px] text-gray-300 mt-2 italic leading-tight z-10 opacity-80 px-4">"{recipe.avatar_slogan}"</p>
      </div>

      <div className="px-6 py-4 grid grid-cols-3 gap-2 bg-black/60 border-b border-gray-800">
        <div className="text-center"><p className="text-xs text-gray-500 mb-1">Фокус</p><div className="h-1.5 bg-gray-800 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width: `${recipe.stats.focus}%`}}></div></div><p className="text-xs font-bold mt-1">+{recipe.stats.focus}%</p></div>
        <div className="text-center"><p className="text-xs text-gray-500 mb-1">Енергія</p><div className="h-1.5 bg-gray-800 rounded-full"><div className="h-full bg-yellow-500 rounded-full" style={{width: `${recipe.stats.energy}%`}}></div></div><p className="text-xs font-bold mt-1">+{recipe.stats.energy}%</p></div>
        <div className="text-center"><p className="text-xs text-gray-500 mb-1">Спокій</p><div className="h-1.5 bg-gray-800 rounded-full"><div className="h-full bg-primary rounded-full" style={{width: `${recipe.stats.calm}%`}}></div></div><p className="text-xs font-bold mt-1">+{recipe.stats.calm}%</p></div>
      </div>

      <div className="p-6 space-y-6 flex-1">
        
        {/* Explanation Block */}
        {recipe.explanation && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2"><Target size={14}/> Аналіз Системи</h3>
            <p className="text-xs text-gray-300 leading-relaxed italic">{recipe.explanation}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Формула Змішування</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20"><FlaskConical size={14} className="text-primary"/></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">База</span>
                  <span className="text-sm font-bold text-white leading-tight">{recipe.base}</span>
                </div>
              </div>
              <span className="font-bold text-primary shrink-0 text-right text-lg">{recipe.tea_ml} <span className="text-xs text-gray-400">мл</span></span>
            </div>

            <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20"><Droplet size={14} className="text-blue-400"/></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Активатор</span>
                  <span className="text-sm font-bold text-white leading-tight">{recipe.activator}</span>
                </div>
              </div>
              <span className="font-bold text-blue-400 shrink-0 text-right text-lg">{recipe.juice_ml} <span className="text-xs text-gray-400">мл</span></span>
            </div>

            <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20"><Thermometer size={14} className="text-red-400"/></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Температура</span>
                  <span className="text-sm font-bold text-white leading-tight">{recipe.cocktail_status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20"><Wind size={14} className="text-cyan-400"/></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Охолодження</span>
                  <span className="text-sm font-bold text-white leading-tight">{recipe.ice_cubes > 0 ? `${recipe.ice_cubes} куб.` : 'Без льоду'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3 mt-auto">
        <button onClick={() => { triggerHaptic(); alert("Відкриття Telegram Stories Share..."); }} className="py-3 rounded-xl border border-primary/50 text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors uppercase tracking-wider">Поділитися</button>
        <button onClick={() => { triggerHaptic(); onDone(); }} className="premium-btn font-bold py-3 rounded-xl text-sm uppercase tracking-wider">Заварив!</button>
      </div>
    </motion.div>
  );
}

function AppContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recipeResult, setRecipeResult] = useState<{ recipe: Recipe, temp: number, cond: string } | null>(null);
  const [showBreathwork, setShowBreathwork] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bio_profile');
    if (saved) setProfile(JSON.parse(saved));
  }, []);

  return (
    <div className="app-container p-4">
      <div className="bg-orb-1" />
      <div className="bg-orb-2" />
      <div className="z-10 relative flex-1 flex flex-col justify-center h-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {!profile && <Onboarding key="onboarding" onComplete={setProfile} />}
          {profile && !recipeResult && <DailyCheckIn key="checkin" profile={profile} onResult={(r,t,c) => setRecipeResult({recipe: r, temp: t, cond: c})} onReset={() => setProfile(null)} />}
          {profile && recipeResult && !showBreathwork && <ResultScreen key="result" recipe={recipeResult.recipe} weatherTemp={recipeResult.temp} weatherCond={recipeResult.cond} onDone={() => setShowBreathwork(true)} />}
          {showBreathwork && recipeResult && <BreathworkTimer key="breathwork" protocol={recipeResult.recipe.breathwork_protocol} onDone={() => { setShowBreathwork(false); setRecipeResult(null); }} />}
        </AnimatePresence>
      </div>
    </div>
  )
}

function App() { return <AppContent /> }
export default App
