import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Save,
  CloudCheck,
  Check
} from 'lucide-react';
import { AdminCredentials } from '../types';

interface ChangeCredentialsModalProps {
  currentCredentials: AdminCredentials;
  onClose: () => void;
  onSave: (newCredentials: AdminCredentials) => Promise<void> | void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  currentCredentials,
  onClose,
  onSave
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(currentCredentials.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    const cleanCurrentPass = currentPassword.trim();
    const cleanNewUser = newUsername.trim().toLowerCase();
    const cleanNewPass = newPassword.trim();
    const cleanConfirmPass = confirmPassword.trim();

    // Verify current password
    // Allow if matches current credentials, or initial default demo passwords
    const validCurrentPasswords = [
      currentCredentials.password,
      'admin123',
      'admin',
      'shoecare123'
    ];

    if (!validCurrentPasswords.includes(cleanCurrentPass)) {
      setErrorMsg('Password saat ini salah! Masukkan kata sandi admin yang sedang aktif.');
      return;
    }

    if (cleanNewUser.length < 3) {
      setErrorMsg('Username baru minimal 3 karakter.');
      return;
    }

    if (cleanNewPass.length < 5) {
      setErrorMsg('Password baru minimal 5 karakter demi keamanan.');
      return;
    }

    if (cleanNewPass !== cleanConfirmPass) {
      setErrorMsg('Konfirmasi password baru tidak cocok. Mohon periksa kembali.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated: AdminCredentials = {
        username: cleanNewUser,
        password: cleanNewPass,
        updatedAt: new Date().toISOString()
      };

      await onSave(updated);
      setSuccessMsg(`Username dan password berhasil disimpan! Gunakan username "${cleanNewUser}" saat login berikutnya.`);
      
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan perubahan ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                <span>Keamanan Akun Admin</span>
              </span>
              <h3 className="font-black text-lg text-white mt-0.5">
                Ubah Username & Password
              </h3>
            </div>
          </div>
          
          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
            Perbarui kredensial login. Perubahan otomatis tersinkronisasi ke semua perangkat (Laptop & HP) melalui Cloud Firestore.
          </p>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Current Username Info Badge */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Username Aktif Sekarang:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {currentCredentials.username}
            </span>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Peringatan</p>
                <p className="text-rose-700 leading-relaxed mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Berhasil Disimpan!</p>
                <p className="text-emerald-700 leading-relaxed mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* 1. Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Password Saat Ini</span>
              <span className="text-[10px] text-slate-400 font-normal">Wajib untuk verifikasi</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password admin lama..."
                required
                className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            {/* 2. New Username */}
            <div className="mb-3.5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Username Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: admin_shoecare"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Bisa berupa nama panggilan atau email outlet.
              </span>
            </div>

            {/* 3. New Password */}
            <div className="mb-3.5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password Baru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 5 karakter..."
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full">
                    <div className={`h-full flex-1 rounded-full ${strength >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                    <div className={`h-full flex-1 rounded-full ${strength >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Kekuatan sandi: {strength <= 1 ? 'Lemah' : strength === 2 ? 'Cukup' : 'Kuat & Aman'}
                  </span>
                </div>
              )}
            </div>

            {/* 4. Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Konfirmasi Password Baru</span>
                {confirmPassword && (
                  <span className={`text-[10px] font-bold flex items-center space-x-1 ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {newPassword === confirmPassword ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Cocok</span>
                      </>
                    ) : (
                      <span>Belum cocok</span>
                    )}
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru..."
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-900/20 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Kredensial</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
