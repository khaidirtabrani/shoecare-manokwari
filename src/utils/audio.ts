import { AlarmSoundType } from '../types';

export interface SoundOption {
  id: AlarmSoundType;
  name: string;
  description: string;
  tag: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  { 
    id: 'melodi', 
    name: 'Lonceng Melodi', 
    description: 'Harmoni 3 nada ceria & elegan (E5, G#5, B5)', 
    tag: 'Default' 
  },
  { 
    id: 'dingdong', 
    name: 'Ding-Dong Toko', 
    description: 'Dentang genta pintu toko dua nada (G5, E5)', 
    tag: 'Klasik' 
  },
  { 
    id: 'digital', 
    name: 'Beep Kasir Digital', 
    description: 'Tri-tone register digital cepat & modern', 
    tag: 'Modern' 
  },
  { 
    id: 'radar', 
    name: 'Radar Ping (Sonar)', 
    description: 'Sinyal pulsa sonar futuristik beresonansi', 
    tag: 'Elektronik' 
  },
  { 
    id: 'fanfare', 
    name: 'Fanfare Kemenangan', 
    description: 'Arpeggio riang 4 tangga nada bersemangat', 
    tag: 'Semangat' 
  },
  { 
    id: 'marimba', 
    name: 'Marimba Kayu', 
    description: 'Ketukan instrumen kayu akustik hangat & lembut', 
    tag: 'Akustik' 
  },
  { 
    id: 'double_ring', 
    name: 'Bel Kring Ganda', 
    description: 'Dua dering tajam tegas langsung terdengar', 
    tag: 'Tegas' 
  },
];

// Helper to get audio context safely
function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    return new AudioCtx();
  } catch {
    return null;
  }
}

/**
 * Web Audio API chime synthesizer for admin order notification
 * Supports multiple customizable sound styles
 */
export function playNotificationChime(soundType: AlarmSoundType = 'melodi') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    switch (soundType) {
      case 'dingdong': {
        // High note Ding (G5 = 783.99 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(783.99, now);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.45);

        // Low note Dong (E5 = 659.25 Hz)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.28);
        gain2.gain.setValueAtTime(0.4, now + 0.28);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.28);
        osc2.stop(now + 0.95);
        break;
      }

      case 'digital': {
        // Fast electronic cashier register beep: C6, E6, G6
        const notes = [1046.50, 1318.51, 1567.98];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const startTime = now + idx * 0.08;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.25, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.12);
        });
        break;
      }

      case 'radar': {
        // Sonar sweep ping with echo pulse
        [0, 0.22].forEach((offset, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const startTime = now + offset;
          const vol = idx === 0 ? 0.35 : 0.18;
          osc.frequency.setValueAtTime(1150, startTime);
          osc.frequency.exponentialRampToValueAtTime(750, startTime + 0.25);
          gain.gain.setValueAtTime(vol, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
        break;
      }

      case 'fanfare': {
        // Cheerful victory fanfare: C5, E5, G5, C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 3 ? 'triangle' : 'sine';
          const startTime = now + idx * 0.1;
          const duration = idx === 3 ? 0.65 : 0.2;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.28, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration);
        });
        break;
      }

      case 'marimba': {
        // Warm wooden percussive marimba: A4, C#5, E5, A5
        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          const startTime = now + idx * 0.09;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.22);
        });
        break;
      }

      case 'double_ring': {
        // Sharp double alert bell
        [0, 0.16].forEach((offset) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + offset;
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(950, startTime);
          osc2.frequency.setValueAtTime(1260, startTime);
          gain.gain.setValueAtTime(0.25, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(startTime);
          osc2.start(startTime);
          osc1.stop(startTime + 0.18);
          osc2.stop(startTime + 0.18);
        });
        break;
      }

      case 'melodi':
      default: {
        // First note (E5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.22, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Second note (G#5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(830.61, now + 0.12);
        gain2.gain.setValueAtTime(0.26, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.55);

        // Third note (B5)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(987.77, now + 0.25);
        gain3.gain.setValueAtTime(0.3, now + 0.25);
        gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now + 0.25);
        osc3.stop(now + 0.85);
        break;
      }
    }
  } catch (err) {
    console.debug('Web Audio not allowed or failed:', err);
  }
}
