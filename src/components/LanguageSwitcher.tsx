import { Language } from '../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';

const triggerHaptic = () => {
  try {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  } catch (e) {}
};

const flags: Record<Language, string> = {
  uk: '🇺🇦',
  en: '🇬🇧',
  ru: '🇷🇺',
  es: '🇪🇸'
};

const langNames: Record<Language, string> = {
  uk: 'Українська',
  en: 'English',
  ru: 'Русский',
  es: 'Español'
};

export default function LanguageSwitcher({ currentLang, onSelect }: { currentLang: Language, onSelect: (lang: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: Language) => {
    triggerHaptic();
    onSelect(lang);
    setIsOpen(false);
  };

  return (
    <div className="absolute top-4 right-4 z-50" ref={ref}>
      <button 
        onClick={() => { triggerHaptic(); setIsOpen(!isOpen); }}
        className="w-10 h-10 rounded-full bg-black/60 border border-gray-700 backdrop-blur-md flex items-center justify-center text-xl shadow-lg hover:border-primary/50 transition-colors"
      >
        {flags[currentLang]}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-12 right-0 bg-black/80 border border-gray-700 backdrop-blur-xl rounded-xl p-2 flex flex-col gap-1 shadow-2xl min-w-[140px]"
          >
            {(Object.keys(flags) as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleSelect(lang)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentLang === lang ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-300 hover:bg-white/10 border border-transparent'}`}
              >
                <span className="text-lg">{flags[lang]}</span>
                {langNames[lang]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
