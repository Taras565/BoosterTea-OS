import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

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

export default function BreathworkTimer({ protocol, onDone }: { protocol: string, onDone: () => void }) {
  const [phase, setPhase] = useState('Підготовка');
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
        { name: 'Вдих', duration: 4000, scale: 1.5 },
        { name: 'Затримка', duration: 4000, scale: 1.5 },
        { name: 'Видих', duration: 4000, scale: 1 },
        { name: 'Затримка', duration: 4000, scale: 1 }
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
        setPhase('Видих (Вогню)');
        
        cleanup = setInterval(() => {
          secondsPassed++;
          if (secondsPassed < 60) {
            setScale(prev => prev === 1 ? 1.3 : 1);
            triggerHaptic();
          } else if (secondsPassed === 60) {
            setPhase('Затримка на вдиху');
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
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center">
        <Target size={48} className="text-primary mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Систему активовану на 100%</h2>
        <p className="text-gray-400 mb-8">Твій стан завантажено.</p>
        <button onClick={() => { triggerHaptic(); onDone(); }} className="premium-btn w-full py-4 rounded-xl font-bold uppercase text-sm tracking-widest">
          Завершити
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-12 text-center w-full">
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-1">{protocol === 'square' ? 'Квадратне Дихання' : 'Дихання Вогню'}</p>
        <p className="text-primary font-bold text-xl">0:{totalTime < 10 ? `0${totalTime}` : totalTime}</p>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center">
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
        <h2 className="relative z-10 text-2xl font-bold text-white uppercase tracking-widest drop-shadow-md">{phase}</h2>
      </div>
      
      <button onClick={() => { triggerHaptic(); onDone(); }} className="absolute bottom-12 text-xs text-gray-500 uppercase tracking-widest border border-gray-800 rounded-lg px-4 py-2 bg-black/50">
        Перервати
      </button>
    </motion.div>
  );
}
