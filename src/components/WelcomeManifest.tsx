import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShieldCheck, Droplet, Sparkles, Activity } from 'lucide-react';

const triggerHaptic = () => {
  try {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  } catch (e) {}
};

const slides = [
  {
    id: 1,
    title: "BoosterTea OS",
    subtitle: "Рідка Операційна Система",
    icon: <Droplet size={64} className="text-primary mb-6 mx-auto drop-shadow-[0_0_15px_rgba(0,255,204,0.5)]" />,
    content: (
      <div className="space-y-4 px-2">
        <p className="text-[15px] text-gray-300 leading-relaxed font-medium">
          Це перший у світі <span className="text-white font-bold">Health-Tech помічник</span>, який розраховує персональний біо-коктейль під поточний стан твоєї нервової системи. 
        </p>
        <p className="text-[15px] text-gray-300 leading-relaxed font-medium">
          Ми оптимізуємо роботу твоїх клітин через природну біохімію без цукру та хімії.
        </p>
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl mt-6 shadow-[0_0_15px_rgba(0,255,204,0.1)]">
          <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center justify-center gap-2"><TargetIcon /> Наша Місія</h4>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">Повернути контроль над твоїм фокусом, ресурсом та рівнем стресу без відкатів.</p>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "Органічна витяжка",
    subtitle: "Нуль хімії. 100% користі",
    icon: <Sparkles size={64} className="text-blue-400 mb-6 mx-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />,
    content: (
      <div className="space-y-4 px-1">
        <p className="text-sm text-gray-300 leading-relaxed font-medium mb-6">
          Високотехнологічний концентрат чистого чайного екстракту та натуральних соків-провідників.
        </p>
        <div className="space-y-3 text-left">
          <div className="bg-black/40 border border-green-500/30 p-3 rounded-xl flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <div>
              <p className="text-[13px] font-black text-green-400 uppercase tracking-wider mb-1">GABA-екстракт</p>
              <p className="text-[11px] text-gray-400 font-medium leading-snug">Природне заземлення, фокус без тривоги, насичення мозку киснем.</p>
            </div>
          </div>
          <div className="bg-black/40 border border-red-500/30 p-3 rounded-xl flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <div>
              <p className="text-[13px] font-black text-red-400 uppercase tracking-wider mb-1">Шу Пуер</p>
              <p className="text-[11px] text-gray-400 font-medium leading-snug">М'який драйв для тіла та спорту, прискорення метаболізму.</p>
            </div>
          </div>
          <div className="bg-black/40 border border-blue-500/30 p-3 rounded-xl flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <div>
              <p className="text-[13px] font-black text-blue-400 uppercase tracking-wider mb-1">Да Хун Пао</p>
              <p className="text-[11px] text-gray-400 font-medium leading-snug">Когнітивний буст для творчості, бізнесу та довгих переговорів.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Стандарти майбутнього",
    subtitle: "Безпека та Сертифікація",
    icon: <ShieldCheck size={64} className="text-green-400 mb-6 mx-auto drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />,
    content: (
      <div className="space-y-4 px-1">
        <ul className="space-y-3 text-left">
          <li className="bg-black/40 border border-gray-800 p-4 rounded-xl flex flex-col gap-1">
            <h4 className="text-[13px] font-black text-white flex items-center gap-2"><span className="text-green-400">🌿</span> Лише натуральна сировина</h4>
            <p className="text-[11px] text-gray-400 font-medium">Без цукру, штучних барвників чи синтетичного кофеїну. Тільки цільні листи.</p>
          </li>
          <li className="bg-black/40 border border-gray-800 p-4 rounded-xl flex flex-col gap-1">
            <h4 className="text-[13px] font-black text-white flex items-center gap-2"><span className="text-blue-400">🛡️</span> Контроль якості</h4>
            <p className="text-[11px] text-gray-400 font-medium">Сертифіковане виробництво та офіційна сертифікація безпеки в Україні.</p>
          </li>
          <li className="bg-black/40 border border-gray-800 p-4 rounded-xl flex flex-col gap-1">
            <h4 className="text-[13px] font-black text-white flex items-center gap-2"><span className="text-red-400">❤️</span> Захист серця</h4>
            <p className="text-[11px] text-gray-400 font-medium">Алгоритм прораховує безпечне дозування під твою вагу, виключаючи ризик тахікардії.</p>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 4,
    title: "Твій щоденний ритуал",
    subtitle: "Як це працює?",
    icon: <Activity size={64} className="text-yellow-400 mb-6 mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />,
    content: (
      <div className="space-y-4 px-1">
        <div className="bg-black/40 border border-primary/20 p-5 rounded-xl space-y-5 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">1</div>
            <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white">Забий свій стан:</strong> Розкажи додатку, як ти почуваєшся прямо зараз.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">2</div>
            <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white">Отримай формулу:</strong> Алгоритм видасть точні мілілітри бази.</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">3</div>
            <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white">Дихай:</strong> Натисни «Заварив!» та пройди Liquid-тренажер для засвоєння.</p>
          </div>
        </div>
      </div>
    )
  }
];

function TargetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  )
}

export default function WelcomeManifest({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    triggerHaptic();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const slide = slides[currentSlide];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel flex flex-col h-full max-h-[95vh] overflow-hidden p-0 border-primary/30 relative"
    >
      
      {/* Progress Indicators */}
      <div className="flex gap-2 p-6 pb-2 z-20">
        {slides.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 rounded-full bg-gray-800 overflow-hidden relative">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_8px_rgba(0,255,204,0.8)]"
              initial={{ width: i < currentSlide ? "100%" : "0%" }}
              animate={{ width: i <= currentSlide ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 p-6 flex flex-col justify-center text-center overflow-y-auto"
          >
            {slide.icon}
            <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-1 drop-shadow-md">{slide.title}</h1>
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-8 opacity-80">{slide.subtitle}</h2>
            
            <div className="w-full max-w-sm mx-auto">
              {slide.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 pt-4 z-20 border-t border-gray-800/50 bg-black/40 backdrop-blur-md">
        <button 
          onClick={nextSlide} 
          className="premium-btn w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
        >
          {currentSlide === slides.length - 1 ? 'Розпочати ініціалізацію OS' : 'Далі'}
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
