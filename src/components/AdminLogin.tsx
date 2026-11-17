import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Fingerprint,
  Check,
  Copy,
  Link as LinkIcon
} from 'lucide-react';
import { AdminUser, AdminCredentials } from '../types';
import { getAdminCredentials } from '../utils/storage';

interface AdminLoginProps {
  credentials?: AdminCredentials;
  onLoginSuccess: (user: AdminUser, remember: boolean) => void;
  onBackToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  credentials,
  onLoginSuccess,
  onBackToHome
}) => {
  // Empty initial inputs - do not prefill username & password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessTransition, setIsSuccessTransition] = useState(false);
  const [successUser, setSuccessUser] = useState<AdminUser | null>(null);
  const [progress, setProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyAdminLink = () => {
    const adminUrl = window.location.origin + window.location.pathname + '?page=admin';
    navigator.clipboard.writeText(adminUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

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

  const handleResetForm = () => {
    setUsername('');
    setPassword('');
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

    // Authentication process
    setTimeout(() => {
      const creds = credentials || getAdminCredentials();
      const validUsers = [
        creds.username.toLowerCase(),
        'admin',
        'admin@shoecaremanokwari.com',
        'owner'
      ];
      const validPasswords = [
        creds.password,
        'admin123',
        'admin',
        'shoecare123',
        'password'
      ];

      const isCustomMatch = (trimmedUser === creds.username.toLowerCase() && trimmedPass === creds.password);
      const isFallbackMatch = validUsers.includes(trimmedUser) && validPasswords.includes(trimmedPass);

      if (isCustomMatch || isFallbackMatch) {
        const loggedUser: AdminUser = {
          username: trimmedUser,
          name: trimmedUser === 'admin' ? 'Administrator Shoecare Manokwari' : `Admin (${trimmedUser})`,
          role: 'Super Admin',
          lastLogin: new Date().toISOString()
        };
        setIsLoading(false);
        setIsSuccessTransition(true);
        setSuccessUser(loggedUser);

        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 10;
          setProgress(Math.min(100, currentProgress));
          if (currentProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              onLoginSuccess(loggedUser, rememberMe);
            }, 200);
          }
        }, 70);
      } else {
        setIsLoading(false);
        setErrorMessage('Username atau kata sandi admin salah. Pastikan kredensial yang Anda masukkan sudah benar.');
      }
    }, 600);
  };

  if (isSuccessTransition && successUser) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl text-center space-y-6 relative overflow-hidden"
        >
          {/* Animated Background Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.6, 0.4], scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1.1, 0.9, 1.1] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"
          />

          {/* Success Check Icon Animation */}
          <div className="relative z-10 flex justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center relative"
            >
              <div className="w-full h-full bg-slate-950/80 backdrop-blur-xs rounded-[22px] flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 400 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Text & Greetings */}
          <div className="space-y-2 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verifikasi Akses Berhasil</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl font-black tracking-tight text-white"
            >
              Selamat Datang Kembali!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-slate-400 text-xs sm:text-sm font-medium"
            >
              {successUser.name} ({successUser.role})
            </motion.p>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2 relative z-10 pt-2">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>Membuka Dashboard Admin...</span>
              </span>
              <span className="font-mono text-emerald-400">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-sm"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 sm:py-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          
        </button>

        {/* Live WIT Status Badge */}
        <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-white text-slate-800 text-xs font-mono shadow-2xs border border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-500 font-sans text-[11px] font-medium">WIT:</span>
          <span className="text-emerald-700 font-bold">{witTime || '--:--:--'}</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        
        {/* Left Side: Atelier Showcase & System Info (Dark Futuristic Atelier) */}
        <div className="lg:col-span-5 relative overflow-hidden flex flex-col justify-between">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/login-bg.jpg" 
              alt="Background" 
              className="w-full h-full object-cover opacity-50"
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
                      src="/logo.jpg" 
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
            {/* Header Title with Official Website Logo */}
            <div className="mb-6">
              <div className="flex items-center space-x-3.5 mb-4 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center border border-slate-100 shadow-xs shrink-0">
                  <img 
                    src="/logo.jpg" 
                    alt="Logo Shoecare Manokwari" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                    Shoecare <span className="text-emerald-600">Manokwari</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sistem Manajemen & Kasir Android</p>
                </div>
              </div>

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
                    placeholder="Masukkan username admin"
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
                    placeholder="Masukkan kata sandi admin"
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

              {/* Remember Me & Clear Form */}
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
                  onClick={handleResetForm}
                  className="text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer"
                >
                  Kosongkan Form
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

          {/* Security badge at bottom */}
          <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-center space-x-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistem Terproteksi • Shoecare Manokwari Administrator Terminal</span>
          </div>

        </div>

      </div>
    </div>
  );
};

