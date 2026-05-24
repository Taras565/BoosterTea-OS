import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, ShoppingCart, Share, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { Language, getTranslation } from '../i18n';
import { openExternalLink } from '../utils';

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
  scale_cns?: number;
  clinical_override?: boolean;
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
  
  const getInitialTime = (cns: number) => {
    if (cns <= 4) return 120; // 2 mins
    if (cns <= 7) return 180; // 3 mins
    return 300; // 5 mins
  };
  
  const [totalTime, setTotalTime] = useState(getInitialTime(recipe.scale_cns || 5));
  const [isFinished, setIsFinished] = useState(false);
  const [scale, setScale] = useState(1);
  const [audioEnabled, setAudioEnabled] = useState(true);

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
        setPhase(t('bExhale'));
        
        cleanup = setInterval(() => {
          secondsPassed++;
          if (secondsPassed < 60) {
            setPhase(prev => prev === t('bExhale') ? t('bInhale') : t('bExhale'));
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

  // Audio Context for Neuromodulation
  useEffect(() => {
    if (!audioEnabled || isFinished) return;
    
    // Using standard audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);

    let oscillators: any[] = [];
    let noiseNode: any;

    if (protocol === 'square') {
      // 432 Hz Relaxation
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 432;
      
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; // slow modulation
      
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.2;
      
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      
      osc.connect(masterGain);
      osc.start();
      lfo.start();
      oscillators.push(osc, lfo);

    } else if (protocol === 'fire') {
      // 40 Hz Binaural Beats (Gamma) + Brown Noise
      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.value = 200;
      
      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.value = 240;
      
      const merger = ctx.createChannelMerger(2);
      oscL.connect(merger, 0, 0); // left
      oscR.connect(merger, 0, 1); // right
      
      const beatGain = ctx.createGain();
      beatGain.gain.value = 0.4;
      merger.connect(beatGain);
      beatGain.connect(masterGain);
      
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
          let white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
      }
      noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.2;
      noiseNode.connect(noiseGain);
      noiseGain.connect(masterGain);

      oscL.start();
      oscR.start();
      noiseNode.start();
      oscillators.push(oscL, oscR);
    }

    // Fade in
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2);

    return () => {
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      setTimeout(() => {
        try {
          oscillators.forEach(o => o.stop());
          if (noiseNode) noiseNode.stop();
          ctx.close();
        } catch(e) {}
      }, 1000);
    };
  }, [audioEnabled, isFinished, protocol]);

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
            openExternalLink("https://www.boostertea.com.ua/");
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
      <div className="absolute top-4 right-4 z-[60]">
        <button 
          onClick={() => { triggerHaptic(); setAudioEnabled(!audioEnabled); }}
          className="w-10 h-10 bg-black/50 border border-gray-800 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      <div className="absolute top-12 text-center w-full">
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">{protocol === 'square' ? t('timerSquare') : t('timerFire')}</p>
        <p className="text-primary font-bold text-xl">
          {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
        </p>
      </div>

      {recipe.clinical_override && (
        <div className="absolute top-28 w-full max-w-sm px-4 z-[55]">
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 flex items-start gap-3 text-red-400">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p className="text-left text-[11px] leading-relaxed">
              <strong className="block mb-1 text-red-300">Клінічний запобіжник</strong>
              Високий рівень стресу. Агресивні практики заблоковано. Активовано протокол релаксації.
            </p>
          </div>
        </div>
      )}

      <div className="relative w-48 h-48 flex items-center justify-center mb-8 mt-12">
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
      
      <div className="text-center px-6 mb-8 min-h-[8rem]">
        <p className="text-gray-300 text-sm leading-relaxed mb-3 whitespace-pre-line text-left bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          {protocol === 'square' ? t('instSquare') : t('instFire')}
        </p>
        <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
          {audioEnabled && (protocol === 'square' ? '🔊 432 Hz Парасимпатична Релаксація' : '🔊 40 Hz Гамма-ритм (Нейромодуляція)')}
          {!audioEnabled && '🔇 Аудіо-стимуляцію вимкнено'}
        </p>
      </div>
      
      <button onClick={() => { triggerHaptic(); onDone(); }} className="absolute bottom-12 text-xs text-gray-500 uppercase tracking-widest border border-gray-800 rounded-lg px-4 py-2 bg-black/50 hover:bg-gray-900 transition-colors">
        {t('btnAbort')}
      </button>
    </motion.div>
  );
}
