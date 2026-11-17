import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, Share2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs shadow-lg shadow-emerald-600/20 active:scale-95"
      >
        <Download className="w-4 h-4" />
        <span>Install Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl transition-all font-bold text-xs hover:bg-slate-50"
        >
          <Smartphone className="w-4 h-4" />
          <span>Pasang di iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-black text-slate-900 leading-tight">Install di iPhone / iPad</h3>
                <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-full hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. Klik ikon <span className="font-bold text-slate-900">Bagikan (Share)</span> di bagian bawah Safari.
                  </p>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <Download className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    2. Gulir ke bawah dan klik <span className="font-bold text-slate-900">Tambahkan ke Layar Utama (Add to Home Screen)</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
