import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Sparkles, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Activity, 
  Zap, 
  Layers, 
  Fingerprint
} from 'lucide-react';
import { AdminUser } from '../types';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser, remember: boolean) => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToHome
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live WIT (Eastern Indonesia Time) Clock
  const [witTime, setWitTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to WIT (UTC+9)
      const optionsTime: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jayapura',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setWitTime(new Intl.DateTimeFormat('id-ID', optionsTime).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFillDefaultAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setErrorMessage('Silakan lengkapi username dan kata sandi admin.');
      return;
    }

    setIsLoading(true);

    // Simulate authentication process
    setTimeout(() => {
      const validUsers = ['admin', 'admin@shoecaremanokwari.com', 'owner'];
      const validPasswords = ['admin123', 'admin', 'shoecare123', 'password'];

      if (validUsers.includes(trimmedUser) && validPasswords.includes(trimmedPass)) {
        const loggedUser: AdminUser = {
          username: trimmedUser,
          name: 'Administrator Shoecare Manokwari',
          role: 'Super Admin',
          lastLogin: new Date().toISOString()
        };
        setIsLoading(false);
        onLoginSuccess(loggedUser, rememberMe);
      } else {
        setIsLoading(false);
        setErrorMessage('Username atau kata sandi admin salah. Silakan klik tombol "Isi Kredensial Demo" untuk masuk dengan akun demo admin.');
      }
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
       

        {/* Live WIT Status Badge */}
        <div className="hidden sm:flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl bg-slate-900 text-white text-xs font-mono shadow-xs border border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-sans text-[11px] font-medium">Manokwari (WIT):</span>
          <span className="text-emerald-400 font-bold">{witTime || '--:--:--'}</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        
        {/* Left Side: Atelier Showcase & System Info (Dark Futuristic Atelier) */}
        <div className="lg:col-span-5 relative overflow-hidden flex flex-col justify-between">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/src/assets/images/shoe_washing_service_1788628912637.jpg" 
              alt="Shoe Washing Service" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/80 to-slate-950/90" />
          </div>

          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none z-10" />
          
          {/* Decorative Grid Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.04] pointer-events-none z-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          <div className="relative z-20 p-6 sm:p-8 space-y-6 flex flex-col h-full justify-between">
            <div className="space-y-6">
              {/* Brand Header */}
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold tracking-wider uppercase mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Premium Shoecare Terminal</span>
                </div>
                
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-white overflow-hidden flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/10">
                    <img 
                      src="/src/assets/images/shoecare_manokwari_logo_1788629081132.jpg" 
                      alt="Logo Shoecare Manokwari" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      Shoecare <span className="text-emerald-400">Manokwari</span>
                    </h1>
                    <p className="text-xs text-slate-400 font-medium">Sistem Manajemen & Kasir Terpadu</p>
                  </div>
                </div>
              </div>

              {/* Atelier Highlights */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 transition-all flex items-start space-x-3 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">Monitoring Pesanan Realtime</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      Pantau status cuci sepatu, antrean pengerjaan, hingga siap diambil pelanggan.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 transition-all flex items-start space-x-3 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">Notifikasi Otomatis & Suara</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      Pemberitahuan suara lonceng instan saat order baru masuk dan integrasi WhatsApp admin.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 transition-all flex items-start space-x-3 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-200">Laporan Keuangan & Cetak Nota</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">
                      Rekapitulasi omzet periodik, ekspor file PDF/Excel, dan cetak invoice digital.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Outlet Info */}
            <div className="pt-6 mt-6 border-t border-white/[0.1] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Manokwari, Papua Barat</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>09.00 - 21.00 WIT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Administrator Authentication Terminal */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between bg-slate-50/40">
          <div>
            {/* Header Title */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Otoritas Administrator</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Silahkan Login 
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan masukkan akun admin untuk mengelola operasional Shoecare Manokwari.
                  </p>
                </div>
                
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div 
                id="login-error-alert"
                className="mb-5 flex items-start space-x-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Gagal Masuk</p>
                  <p className="text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label 
                  htmlFor="admin-username-input"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Username Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-username-input"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: admin"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium shadow-xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="admin-password-input"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Kata Sandi
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                    
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-300 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium shadow-xs"
                  />
                  <button
                    type="button"
                    id="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Quick Demo Fill */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-600 hover:text-slate-800">
                  <input
                    id="admin-remember-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Ingat sesi admin di perangkat ini</span>
                </label>

                <button
                  type="button"
                  onClick={handleFillDefaultAdmin}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline cursor-pointer"
                >
                  Reset Form
                </button>
              </div>

              {/* Submit Button */}
              <button
                id="btn-admin-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-emerald-900/20 transition-all flex items-center justify-center space-x-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akses Admin...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Demo Credentials Card */}
          <div className="pt-6 mt-6 border-t border-slate-200/80">
            <div className="p-3.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistem Terproteksi • Shoecare Manokwari Administrator Terminal</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

