import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, ShoppingCart, Share } from 'lucide-react';
import { Language, getTranslation } from '../i18n';

// Local copy of Recipe type for prop validation
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

const triggerHaptic = () => {
  try {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    if (navigator.vibrate) navigator.vibrate(15);
  } catch (e) {}
};

const triggerHeavyHaptic = () => {
  try {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    }
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
  } catch (e) {}
};

export default function BreathworkTimer({ recipe, lang, activityType, onDone }: { recipe: Recipe, lang: Language, activityType: string, onDone: () => void }) {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);
  const protocol = recipe.breathwork_protocol;
  const [phase, setPhase] = useState(t('initSystem'));
  const [totalTime, setTotalTime] = useState(90);
  const [isFinished, setIsFinished] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (totalTime <= 0) {
      setIsFinished(true);
      triggerHeavyHaptic();
      return;
    }

    const timer = setInterval(() => {
      setTotalTime(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [totalTime]);

  useEffect(() => {
    if (isFinished) return;

    let cleanup: any;
    
    if (protocol === 'square') {
      let currentPhaseIdx = 0;
      const phases = [
        { name: t('bInhale'), duration: 4000, scale: 1.5 },
        { name: t('bHold'), duration: 4000, scale: 1.5 },
        { name: t('bExhale'), duration: 4000, scale: 1 },
        { name: t('bHold'), duration: 4000, scale: 1 }
      ];

      const runPhase = () => {
        const p = phases[currentPhaseIdx];
        setPhase(p.name);
        setScale(p.scale);
        triggerHaptic();
        
        cleanup = setTimeout(() => {
          currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
          runPhase();
        }, p.duration);
      };
      
      runPhase();

      return () => clearTimeout(cleanup);
      
    } else if (protocol === 'fire') {
      const runFire = () => {
        let secondsPassed = 0;
        setPhase(t('bFireExhale'));
        
        cleanup = setInterval(() => {
          secondsPassed++;
          if (secondsPassed < 60) {
            setScale(prev => prev === 1 ? 1.3 : 1);
            triggerHaptic();
          } else if (secondsPassed === 60) {
            setPhase(t('bHoldIn'));
            setScale(1.5);
            triggerHaptic();
          }
        }, 1000);
      };
      runFire();
      
      return () => clearInterval(cleanup);
    }
  }, [protocol, isFinished]);

  if (isFinished) {
    const handleShare = () => {
      triggerHaptic();
      const webApp = (window as any).Telegram?.WebApp;
      if (webApp && webApp.shareToStory) {
        const host = window.location.origin.includes('localhost') ? 'https://boostertea-app.onrender.com' : window.location.origin;
        const mediaUrl = `${host}${recipe.avatar_image || '/bg-tea.png'}`;
        const getActivityTemplateKey = (act: string) => {
          switch (act) {
            case 'coding': return 'shareTplCoding';
            case 'study': return 'shareTplStudy';
            case 'business': return 'shareTplBusiness';
            case 'creative': return 'shareTplCreative';
            case 'sport': return 'shareTplSport';
            case 'routine': return 'shareTplRoutine';
            default: return 'shareTplCoding';
          }
        };
        const templateKey = getActivityTemplateKey(activityType);
        const rawText = t(templateKey as any);
        const finalText = rawText
          .replace('{STATE}', recipe.avatar_name)
          .replace('{BASE}', recipe.base);

        webApp.shareToStory(mediaUrl, {
          text: finalText,
          widget_link: {
            url: "https://t.me/boostertea_os_bot/app",
            name: t('shareTitle')
          }
        });
      } else {
        if (webApp && webApp.showAlert) webApp.showAlert(t('errNoStory'));
        else alert(t('errNoStory'));
      }
    };

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center">
        <Target size={48} className="text-primary mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('sysActive')}</h2>
        <p className="text-gray-400 mb-8">{t('stateLoaded')}</p>
        
        <div className="w-full max-w-sm space-y-3">
          <button onClick={handleShare} className="w-full py-4 rounded-xl border border-primary/50 bg-primary/10 text-primary font-bold flex items-center justify-center gap-2 uppercase text-sm tracking-widest hover:bg-primary/20 transition-colors">
            <Share size={18} /> {t('sharePromo')}
          </button>
          
          <button onClick={() => {
            triggerHaptic();
            const url = "https://www.boostertea.com.ua/";
            const webApp = (window as any).Telegram?.WebApp;
            if (webApp && webApp.openLink) {
              webApp.openLink(url);
            } else {
              window.open(url, "_blank");
            }
          }} className="w-full py-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center gap-2 uppercase text-sm tracking-widest hover:bg-emerald-500/20 transition-colors">
            <ShoppingCart size={18} /> {t('btnBuy') as string || 'Замовити концентрат'}
          </button>

          <button onClick={() => { triggerHaptic(); onDone(); }} className="w-full py-4 rounded-xl text-gray-500 hover:text-white uppercase text-sm tracking-widest transition-colors font-bold mt-2">
            {t('btnFinish') as string}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-12 text-center w-full">
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">{protocol === 'square' ? t('timerSquare') : t('timerFire')}</p>
        <p className="text-primary font-bold text-xl">
          {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
        </p>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        <motion.div 
          animate={{ scale: scale }} 
          transition={{ duration: protocol === 'square' ? 4 : 0.2, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border-2 border-primary/50 shadow-[0_0_30px_rgba(0,255,204,0.3)] bg-primary/10 backdrop-blur-md"
        />
        <motion.div 
          animate={{ scale: scale }} 
          transition={{ duration: protocol === 'square' ? 4 : 0.2, ease: "easeInOut", delay: 0.1 }}
          className="absolute inset-4 rounded-full border border-primary/30"
        />
        <h2 className="relative z-10 text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md text-center">{phase}</h2>
      </div>
      
      <div className="text-center px-8 mb-4 h-16">
        <p className="text-gray-300 text-sm leading-relaxed">
          {protocol === 'square' ? t('instSquare') : t('instFire')}
        </p>
      </div>
      
      <button onClick={() => { triggerHaptic(); onDone(); }} className="absolute bottom-12 text-xs text-gray-500 uppercase tracking-widest border border-gray-800 rounded-lg px-4 py-2 bg-black/50 hover:bg-gray-900 transition-colors">
        {t('btnAbort')}
      </button>
    </motion.div>
  );
}
