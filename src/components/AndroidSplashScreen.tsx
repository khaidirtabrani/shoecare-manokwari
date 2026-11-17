import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AndroidSplashScreenProps {
  onFinish?: () => void;
}

export const AndroidSplashScreen: React.FC<AndroidSplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only show once per session to maintain quick app navigation
    const hasSeenSplash = sessionStorage.getItem('shoecare_android_splash_shown');
    if (hasSeenSplash) {
      setIsVisible(false);
      onFinish?.();
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('shoecare_android_splash_shown', 'true');
      onFinish?.();
    }, 1400);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="android-entry-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between py-12 px-6 select-none"
        >
          {/* Top subtle spacing */}
          <div className="w-full flex justify-end">
            <button
              onClick={() => {
                setIsVisible(false);
                sessionStorage.setItem('shoecare_android_splash_shown', 'true');
                onFinish?.();
              }}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-3 py-1 rounded-full bg-slate-100 transition-colors"
            >
              Lewati
            </button>
          </div>

          {/* Center Brand Identity with Official Website Logo */}
          <div className="flex flex-col items-center text-center space-y-5 my-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              {/* Soft Ambient Glow */}
              <div className="absolute -inset-2 bg-emerald-500/20 rounded-3xl blur-xl animate-pulse" />

              {/* Logo Card */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-2 shadow-2xl shadow-emerald-700/15 border border-slate-100 flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.jpg"
                  alt="Logo Shoecare Manokwari"
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-1.5"
            >
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Shoecare <span className="text-emerald-600">Manokwari</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs">
                Layanan Cuci & Perawatan Sepatu Profesional
              </p>
            </motion.div>
          </div>

          {/* Bottom Native Android Loading Indicator & Copyright */}
          <div className="flex flex-col items-center space-y-3 w-full max-w-xs">
            <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  repeat: Infinity,
                  duration: 1.1,
                  ease: 'easeInOut'
                }}
                className="w-1/2 h-full bg-emerald-600 rounded-full"
              />
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <span>Manokwari, Papua Barat</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
