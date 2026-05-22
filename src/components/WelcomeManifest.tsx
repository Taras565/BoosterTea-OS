import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShieldCheck, Droplet, Sparkles, Activity } from 'lucide-react';
import { Language, getTranslation } from '../i18n';

const triggerHaptic = () => {
  try {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  } catch (e) {}
};

function TargetIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  )
}

export default function WelcomeManifest({ lang, onComplete }: { lang: Language, onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const slides = [
    {
      id: 1,
      title: "BoosterTea OS",
      subtitle: t('osSubtitle'),
      icon: <Droplet size={64} className="text-primary mb-6 mx-auto drop-shadow-[0_0_15px_rgba(0,255,204,0.5)]" />,
      content: (
        <div className="space-y-4 px-2">
          <p className="text-[15px] text-gray-300 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: t('osDesc1').replace('Health-Tech помічник', '<span class="text-white font-bold">Health-Tech помічник</span>').replace('Health-Tech assistant', '<span class="text-white font-bold">Health-Tech assistant</span>').replace('Health-Tech ассистент', '<span class="text-white font-bold">Health-Tech ассистент</span>') }} />
          <p className="text-[15px] text-gray-300 leading-relaxed font-medium">{t('osDesc2')}</p>
          <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl mt-6 shadow-[0_0_15px_rgba(0,255,204,0.1)]">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center justify-center gap-2"><TargetIcon /> {t('mission')}</h4>
            <p className="text-xs text-gray-300 leading-relaxed font-medium">{t('missionDesc')}</p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: t('orgTitle'),
      subtitle: t('orgSubtitle'),
      icon: <Sparkles size={64} className="text-blue-400 mb-6 mx-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />,
      content: (
        <div className="space-y-4 px-1">
          <p className="text-sm text-gray-300 leading-relaxed font-medium mb-6">{t('orgDesc')}</p>
          <div className="space-y-3 text-left">
            <div className="bg-black/40 border border-green-500/30 p-3 rounded-xl flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <div>
                <p className="text-[13px] font-black text-green-400 uppercase tracking-wider mb-1">GABA</p>
                <p className="text-[11px] text-gray-400 font-medium leading-snug">{t('gabaDesc')}</p>
              </div>
            </div>
            <div className="bg-black/40 border border-red-500/30 p-3 rounded-xl flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <div>
                <p className="text-[13px] font-black text-red-400 uppercase tracking-wider mb-1">Puer</p>
                <p className="text-[11px] text-gray-400 font-medium leading-snug">{t('puerDesc')}</p>
              </div>
            </div>
            <div className="bg-black/40 border border-blue-500/30 p-3 rounded-xl flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <div>
                <p className="text-[13px] font-black text-blue-400 uppercase tracking-wider mb-1">Da Hong Pao</p>
                <p className="text-[11px] text-gray-400 font-medium leading-snug">{t('dahongDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: t('stdTitle'),
      subtitle: t('stdSubtitle'),
      icon: <ShieldCheck size={64} className="text-green-400 mb-6 mx-auto drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />,
      content: (
        <div className="space-y-4 px-1">
          <ul className="space-y-3 text-left">
            <li className="bg-black/40 border border-gray-800 p-4 rounded-xl flex flex-col gap-1">
              <h4 className="text-[13px] font-black text-white flex items-center gap-2"><span className="text-green-400">🌿</span> {t('std1')}</h4>
              <p className="text-[11px] text-gray-400 font-medium">{t('std1Desc')}</p>
            </li>
            <li className="bg-black/40 border border-gray-800 p-4 rounded-xl flex flex-col gap-1">
              <h4 className="text-[13px] font-black text-white flex items-center gap-2"><span className="text-blue-400">🛡️</span> {t('std2')}</h4>
              <p className="text-[11px] text-gray-400 font-medium">{t('std2Desc')}</p>
            </li>
            <li className="bg-black/40 border border-gray-800 p-4 rounded-xl flex flex-col gap-1">
              <h4 className="text-[13px] font-black text-white flex items-center gap-2"><span className="text-red-400">❤️</span> {t('std3')}</h4>
              <p className="text-[11px] text-gray-400 font-medium">{t('std3Desc')}</p>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      title: t('ritTitle'),
      subtitle: t('ritSubtitle'),
      icon: <Activity size={64} className="text-yellow-400 mb-6 mx-auto drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />,
      content: (
        <div className="space-y-4 px-1">
          <div className="bg-black/40 border border-primary/20 p-5 rounded-xl space-y-5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
            
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">1</div>
              <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white">{t('rit1')}</strong> {t('rit1Desc')}</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">2</div>
              <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white">{t('rit2')}</strong> {t('rit2Desc')}</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">3</div>
              <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white">{t('rit3')}</strong> {t('rit3Desc')}</p>
            </div>
          </div>
        </div>
      )
    }
  ];

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
      <div className="flex gap-2 p-6 pb-2 z-20 mt-4">
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
            className="w-full h-full p-6 flex flex-col justify-center text-center overflow-y-auto"
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
          {currentSlide === slides.length - 1 ? t('btnStart') : t('btnNext')}
          <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
