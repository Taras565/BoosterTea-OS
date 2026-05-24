import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, CheckSquare, QrCode, BookOpen, AlertTriangle } from 'lucide-react';
import { getTranslation, Language } from '../i18n';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname.includes('localhost') ? 'http://localhost:8000/api' : 'https://boostertea-os-backend.onrender.com/api');

export default function B2BPortal({ onClose, lang }: { onClose: () => void, lang: Language }) {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'haccp' | 'scanner' | 'menu' | 'operations'>('onboarding');
  const [certified, setCertified] = useState(false);
  
  const triggerHaptic = () => {
    if ((window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleCertify = async () => {
    triggerHaptic();
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
      const tgId = initData?.user?.id || 123456789;
      
      const res = await fetch(`${API_URL}/b2b/certify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgId,
          point_id: 'test-point-1',
          score: 100,
          passed: true
        })
      });
      if (res.ok) setCertified(true);
    } catch (e) {
      console.error(e);
      setCertified(true); // mock success
    }
  };

  const handleHACCP = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic();
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
      const tgId = initData?.user?.id || 123456789;
      await fetch(`${API_URL}/b2b/haccp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgId,
          point_id: 'test-point-1',
          shift_type: 'OPENING',
          fridge_temp_ok: true,
          pumps_washed: true,
          expiry_checked: true,
          notes: ''
        })
      });
      alert('HACCP лог збережено!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleScan = async () => {
    triggerHaptic();
    const clientId = prompt("Введіть ID клієнта (mock сканера):");
    if (!clientId) return;
    
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
      const tgId = initData?.user?.id || 123456789;
      const res = await fetch(`${API_URL}/b2b/scan_qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barista_id: tgId,
          client_id: parseInt(clientId),
          point_id: 'test-point-1'
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Успіх! Клієнт: ${data.client_name}, День челенджу: ${data.challenge_day}`);
      } else {
        alert("Помилка: клієнта не знайдено.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    triggerHaptic();
    try {
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
      const tgId = initData?.user?.id || 123456789;
      const res = await fetch(`${API_URL}/b2b/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: tgId,
          point_id: 'test-point-1', // Mock point ID
          status: status
        })
      });
      if (res.ok) {
        alert(`Статус успішно змінено на ${status}`);
      } else {
        alert("Помилка зміни статусу (немає прав)");
      }
    } catch (e) {
      console.error(e);
      alert("Мережева помилка");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute inset-0 z-[100] bg-black flex flex-col p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2"><ShieldCheck /> B2B Portal</h2>
        <button onClick={onClose} className="p-2 bg-gray-900 rounded-full text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('onboarding')} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'onboarding' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'}`}>Сертифікація</button>
        <button onClick={() => { if(certified) setActiveTab('haccp'); }} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'haccp' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'} ${!certified && 'opacity-50'}`}>HACCP</button>
        <button onClick={() => { if(certified) setActiveTab('scanner'); }} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'scanner' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'} ${!certified && 'opacity-50'}`}>O2O Сканер</button>
        <button onClick={() => { if(certified) setActiveTab('menu'); }} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'menu' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'} ${!certified && 'opacity-50'}`}>Динамічне Меню</button>
        <button onClick={() => { if(certified) setActiveTab('operations'); }} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${activeTab === 'operations' ? 'bg-primary text-black' : 'bg-gray-800 text-gray-400'} ${!certified && 'opacity-50'}`}>Управління Точкою</button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'onboarding' && (
          <motion.div key="onboarding" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
            <div className="glass-panel p-4">
              <h3 className="font-bold text-lg mb-2">Навчання Баристи</h3>
              <div className="w-full h-48 bg-gray-900 rounded-lg flex items-center justify-center mb-4 border border-gray-800">
                <span className="text-gray-500">Video Player (Mock)</span>
              </div>
              {!certified ? (
                <button onClick={handleCertify} className="w-full premium-btn font-bold py-3 rounded-xl uppercase">Пройти Тест (Отримати Сертифікат)</button>
              ) : (
                <div className="w-full bg-green-900/30 border border-green-500/50 p-3 rounded-xl text-green-400 text-center font-bold">Ви сертифіковані! 🎉</div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'haccp' && (
          <motion.form key="haccp" onSubmit={handleHACCP} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
            <div className="glass-panel p-4">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CheckSquare className="text-primary"/> Чек-лист Відкриття</h3>
              <label className="flex items-center gap-3 mb-4 p-3 bg-black/40 rounded-lg border border-gray-700">
                <input type="checkbox" required className="w-5 h-5 accent-primary" />
                <span className="text-sm">Температура в холодильнику в нормі (2-6°C)</span>
              </label>
              <label className="flex items-center gap-3 mb-4 p-3 bg-black/40 rounded-lg border border-gray-700">
                <input type="checkbox" required className="w-5 h-5 accent-primary" />
                <span className="text-sm">Помпи-дозатори промиті та продезінфіковані</span>
              </label>
              <label className="flex items-center gap-3 mb-4 p-3 bg-black/40 rounded-lg border border-gray-700">
                <input type="checkbox" required className="w-5 h-5 accent-primary" />
                <span className="text-sm">Терміни придатності відкритих бустів перевірені</span>
              </label>
              <button type="submit" className="w-full premium-btn font-bold py-3 rounded-xl uppercase">Зберегти Лог</button>
            </div>
          </motion.form>
        )}

        {activeTab === 'scanner' && (
          <motion.div key="scanner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
            <div className="glass-panel p-6 flex flex-col items-center justify-center text-center">
              <QrCode size={64} className="text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Сканер Клієнта</h3>
              <p className="text-sm text-gray-400 mb-6">Відскануйте QR-код з екрану клієнта, щоб зарахувати йому день челенджу за покупку в офлайні.</p>
              <button onClick={handleScan} className="w-full premium-btn font-bold py-3 rounded-xl uppercase">Симулювати Скан</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
            <div className="bg-white rounded-xl p-4 text-black">
              <h3 className="font-bold text-xl mb-4 border-b pb-2">BoosterTea Menu</h3>
              
              <div className="mb-4">
                <div className="font-bold text-lg">Focus Boost Cocktail</div>
                <div className="text-sm text-gray-600 mb-1">Еспресо, Буст Фокус, Вівсяне молоко.</div>
                <div className="text-xs font-bold text-red-600 bg-red-100 p-1 inline-block rounded"><AlertTriangle size={12} className="inline mr-1" /> Алергени: ГЛЮТЕН (ВІВСЯНЕ МОЛОКО)</div>
              </div>

              <div className="mb-4">
                <div className="font-bold text-lg">Relax Matcha</div>
                <div className="text-sm text-gray-600 mb-1">Матча, Буст Релакс (ГАМК), Мигдальне молоко.</div>
                <div className="text-xs font-bold text-red-600 bg-red-100 p-1 inline-block rounded"><AlertTriangle size={12} className="inline mr-1" /> Алергени: ГОРІХИ (МИГДАЛЬ)</div>
              </div>

              <div className="text-xs text-gray-400 mt-6 pt-4 border-t text-center">Згенеровано BoosterTea Liquid OS відповідно до Закону № 2639-VIII</div>
            </div>
          </motion.div>
        )}

        {activeTab === 'operations' && (
          <motion.div key="operations" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
            <div className="glass-panel p-4">
              <h3 className="font-bold text-lg mb-2 text-white">Операційний Статус</h3>
              <p className="text-xs text-gray-400 mb-6">Оновіть статус вашої точки. Зміни миттєво синхронізуються на картах клієнтів (SSOT).</p>
              
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 mb-6 flex flex-col items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Поточний EMA Рейтинг</span>
                <div className="text-3xl font-black text-orange-400 mb-2 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]">
                  4.2 <Star size={20} className="inline mb-1" fill="currentColor"/>
                </div>
                <div className="w-full bg-red-900/30 border border-red-500/50 p-3 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-red-200">
                    <strong className="block mb-1">Увага! Критичне падіння EMA-рейтингу.</strong>
                    Останні відгуки сигналізують про проблему "Довго чекав". Якщо рейтинг впаде нижче 4.0, ваш заклад буде знижено в ранжуванні.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button onClick={() => handleStatusUpdate('OPEN')} className="w-full py-3 bg-green-900/30 text-green-400 border border-green-500/50 rounded-xl font-bold uppercase tracking-wider hover:bg-green-900/50 transition-colors">
                  Відчинено
                </button>
                <button onClick={() => handleStatusUpdate('TEMPORARY_CLOSED')} className="w-full py-3 bg-orange-900/30 text-orange-400 border border-orange-500/50 rounded-xl font-bold uppercase tracking-wider hover:bg-orange-900/50 transition-colors">
                  Тимчасово Зачинено (Форс-мажор)
                </button>
                <button onClick={() => handleStatusUpdate('CLOSED')} className="w-full py-3 bg-red-900/30 text-red-400 border border-red-500/50 rounded-xl font-bold uppercase tracking-wider hover:bg-red-900/50 transition-colors">
                  Зачинено (Кінець зміни)
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
