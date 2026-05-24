import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShieldCheck, Fingerprint, Wind, MapPin, Star, MessageSquare, Activity, Sparkles } from 'lucide-react';
import { Language, getTranslation } from '../i18n';

const triggerHaptic = () => {
  try {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  } catch (e) {}
};

// TargetIcon removed to fix unused warning

export default function WelcomeManifest({ lang, onComplete }: { lang: Language, onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const slides = [
    {
      id: 1,
      title: t('wm1Title'),
      subtitle: t('wm1Sub'),
      icon: <Fingerprint size={64} className="text-primary mb-6 mx-auto drop-shadow-[0_0_20px_rgba(0,255,204,0.6)]" />,
      content: (
        <div className="space-y-4 px-2 text-center">
          <p className="text-[15px] text-gray-300 leading-relaxed font-medium">{t('wm1Desc')}</p>
        </div>
      )
    },
    {
      id: 2,
      title: t('wm2Title'),
      subtitle: t('wm2Sub'),
      icon: <Wind size={64} className="text-blue-400 mb-6 mx-auto drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />,
      content: (
        <div className="space-y-4 px-1">
          <p className="text-[14px] text-gray-300 leading-relaxed font-medium text-center">{t('wm2Desc')}</p>
          <div className="bg-black/40 border border-green-500/30 p-4 rounded-xl mt-6 shadow-[0_0_15px_rgba(34,197,94,0.1)] flex items-start gap-3 text-left">
            <ShieldCheck className="text-green-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-gray-300 font-medium leading-snug">{t('wm2Fear')}</p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: t('wm3Title'),
      subtitle: t('wm3Sub'),
      icon: <MapPin size={64} className="text-purple-400 mb-6 mx-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]" />,
      content: (
        <div className="space-y-4 px-1">
          <p className="text-[14px] text-gray-300 leading-relaxed font-medium text-center">{t('wm3Desc')}</p>
          <div className="bg-black/40 border border-purple-500/30 p-4 rounded-xl mt-6 shadow-[0_0_15px_rgba(168,85,247,0.1)] flex items-start gap-3 text-left">
            <Sparkles className="text-purple-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-gray-300 font-medium leading-snug">{t('wm3Fear')}</p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: t('wm4Title'),
      subtitle: t('wm4Sub'),
      icon: <Star size={64} className="text-yellow-400 mb-6 mx-auto drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />,
      content: (
        <div className="space-y-4 px-1">
          <p className="text-[14px] text-gray-300 leading-relaxed font-medium text-center">{t('wm4Desc')}</p>
          <div className="bg-black/40 border border-yellow-500/30 p-4 rounded-xl mt-6 shadow-[0_0_15px_rgba(250,204,21,0.1)] flex items-start gap-3 text-left">
            <Activity className="text-yellow-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-gray-300 font-medium leading-snug">{t('wm4Fear')}</p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: t('wm5Title'),
      subtitle: t('wm5Sub'),
      icon: <MessageSquare size={64} className="text-orange-400 mb-6 mx-auto drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]" />,
      content: (
        <div className="space-y-4 px-1">
          <div className="bg-black/40 border border-primary/20 p-5 rounded-xl space-y-5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
            
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">1</div>
              <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white block mb-0.5">{t('wm5Step1')}</strong> {t('wm5Step1D')}</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">2</div>
              <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white block mb-0.5">{t('wm5Step2')}</strong> {t('wm5Step2D')}</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary font-black flex items-center justify-center shrink-0">3</div>
              <p className="text-[13px] text-gray-300 font-medium leading-snug"><strong className="text-white block mb-0.5">{t('wm5Step3')}</strong> {t('wm5Step3D')}</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (isTransitioning) return;
    triggerHaptic();
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);

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
