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
    subtitle: "Рідка Операційна Система твого тіла",
    icon: <Droplet size={48} className="text-primary mb-4 mx-auto" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          Це перший у світі інтелектуальний Health-Tech помічник, який розраховує персональний біо-коктейль під поточний стан твоєї нервової системи. 
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          Ми не продаємо енергію «в кредит», як кава чи хімічні енергетики. Ми оптимізуємо роботу твоїх клітин через природну біохімію.
        </p>
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mt-4">
          <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Наша Місія</h4>
          <p className="text-xs text-gray-400">Повернути людині повний контроль над своїм фокусом, ресурсом та рівнем стресу без відкатів і шкоди для здоров'я.</p>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "100% Органічна витяжка",
    subtitle: "Нуль хімії",
    icon: <Sparkles size={48} className="text-blue-400 mb-4 mx-auto" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          Наш продукт — це високотехнологічний концентрат чистого чайного екстракту та натуральних соків-провідників. Метод ультразвукової екстракції зберігає 100% природних речовин у живому, рідкому вигляді.
        </p>
        <div className="space-y-3 mt-4 text-left">
          <div className="bg-black/40 border border-green-500/20 p-3 rounded-lg flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-green-400 uppercase">GABA-екстракт</p>
              <p className="text-xs text-gray-400">Природне заземлення, фокус без тривоги, глибоке насичення мозку киснем.</p>
            </div>
          </div>
          <div className="bg-black/40 border border-red-500/20 p-3 rounded-lg flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-400 uppercase">Шу Пуер концентрат</p>
              <p className="text-xs text-gray-400">Чистий, м'який драйв для тіла та спорту, покращення метаболізму.</p>
            </div>
          </div>
          <div className="bg-black/40 border border-blue-500/20 p-3 rounded-lg flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase">Да Хун Пао екстракт</p>
              <p className="text-xs text-gray-400">Когнітивний буст для творчості, бізнесу та довгих переговорів.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Стандарти майбутнього",
    subtitle: "Сертифіковано в Україні",
    icon: <ShieldCheck size={48} className="text-green-400 mb-4 mx-auto" />,
    content: (
      <div className="space-y-4">
        <ul className="space-y-4 text-left">
          <li className="bg-black/40 border border-gray-800 p-3 rounded-xl">
            <h4 className="text-xs font-bold text-white mb-1">🌿 Лише натуральна сировина</h4>
            <p className="text-xs text-gray-400">Цільні чайні листи та органічні соки. Без цукру, штучних барвників, таурину чи синтетичного кофеїну.</p>
          </li>
          <li className="bg-black/40 border border-gray-800 p-3 rounded-xl">
            <h4 className="text-xs font-bold text-white mb-1">🛡️ Повний контроль якості</h4>
            <p className="text-xs text-gray-400">Виготовляється на сертифікованому виробництві, пройшов суворі тести та має сертифікацію безпеки харчових продуктів України.</p>
          </li>
          <li className="bg-black/40 border border-gray-800 p-3 rounded-xl">
            <h4 className="text-xs font-bold text-white mb-1">❤️ Захист серця</h4>
            <p className="text-xs text-gray-400">Алгоритм автоматично прораховує безпечне дозування під твою вагу, виключаючи ризик тахікардії.</p>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 4,
    title: "Твій щоденний біо-ритуал",
    subtitle: "Як це працює?",
    icon: <Activity size={48} className="text-yellow-400 mb-4 mx-auto" />,
    content: (
      <div className="space-y-4">
        <div className="bg-black/40 border border-gray-800 p-5 rounded-xl space-y-4 text-left">
          <div className="flex gap-3">
            <span className="text-primary font-bold">1.</span>
            <p className="text-sm text-gray-300"><strong className="text-white">Забий свій стан:</strong> Розкажи додатку, як ти почуваєшся прямо зараз.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">2.</span>
            <p className="text-sm text-gray-300"><strong className="text-white">Отримай формулу:</strong> Алгоритм видасть точні мілілітри концентрату та соку.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">3.</span>
            <p className="text-sm text-gray-300"><strong className="text-white">Активуй диханням:</strong> Натисни «Заварив!» та пройди 90-секундний Liquid-тренажер для засвоєння.</p>
          </div>
        </div>
      </div>
    )
  }
];

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
    <div className="flex flex-col h-full bg-black">
      
      {/* Progress Indicators */}
      <div className="flex gap-2 p-6 pb-2">
        {slides.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 rounded-full bg-gray-800 overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: i < currentSlide ? "100%" : "0%" }}
              animate={{ width: i <= currentSlide ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center">
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
            <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-2">{slide.title}</h1>
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">{slide.subtitle}</h2>
            {slide.content}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 pt-2">
        <button 
          onClick={nextSlide} 
          className="premium-btn w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
        >
          {currentSlide === slides.length - 1 ? 'Розпочати ініціалізацію OS' : 'Далі'}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
