import React, { useState } from 'react';
import { AlarmSoundType } from '../types';
import { SOUND_OPTIONS, SoundOption, playNotificationChime } from '../utils/audio';
import { Volume2, Music, Check, Play, X, Sparkles, BellRing } from 'lucide-react';

interface SoundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSound: AlarmSoundType;
  onSelectSound: (sound: AlarmSoundType) => void;
}

export const SoundPickerModal: React.FC<SoundPickerModalProps> = ({
  isOpen,
  onClose,
  currentSound,
  onSelectSound
}) => {
  const [selectedSound, setSelectedSound] = useState<AlarmSoundType>(currentSound || 'melodi');
  const [playingSoundId, setPlayingSoundId] = useState<AlarmSoundType | null>(null);

  if (!isOpen) return null;

  const handlePreviewSound = (e: React.MouseEvent, soundId: AlarmSoundType) => {
    e.stopPropagation();
    setPlayingSoundId(soundId);
    playNotificationChime(soundId);
    setTimeout(() => {
      setPlayingSoundId((prev) => (prev === soundId ? null : prev));
    }, 1100);
  };

  const handleApply = () => {
    onSelectSound(selectedSound);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-slate-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-xs">
              <BellRing className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-2">
                <span>Pilihan Suara Alarm Notifikasi</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih jenis nada dering lonceng saat ada pesanan pelanggan baru masuk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sound Presets List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {SOUND_OPTIONS.map((opt) => {
            const isSelected = selectedSound === opt.id;
            const isPlayingThis = playingSoundId === opt.id;

            return (
              <div
                key={opt.id}
                onClick={() => {
                  setSelectedSound(opt.id);
                  // Also play a quick preview when selected
                  handlePreviewSound({ stopPropagation: () => {} } as React.MouseEvent, opt.id);
                }}
                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Radio Indicator */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white group-hover:border-slate-400'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`font-black text-xs sm:text-sm tracking-tight ${
                        isSelected ? 'text-emerald-950 font-extrabold' : 'text-slate-900'
                      }`}>
                        {opt.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSelected 
                          ? 'bg-emerald-200 text-emerald-900' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {opt.description}
                    </p>
                  </div>
                </div>

                {/* Preview / Test Button for this sound */}
                <button
                  type="button"
                  onClick={(e) => handlePreviewSound(e, opt.id)}
                  title={`Uji Suara ${opt.name}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-xs ${
                    isPlayingThis
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200'
                  }`}
                >
                  {isPlayingThis ? (
                    <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>{isPlayingThis ? 'Memutar...' : 'Tes'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <Music className="w-3.5 h-3.5 text-emerald-600" />
            <span>Suara otomatis tersimpan ke cloud & semua perangkat.</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Terapkan Nada Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
