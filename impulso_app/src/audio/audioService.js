// Audio Service - Hybrid Web Audio API + Native Expo Speech Bridge

class AudioService {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.voiceEnabled = true;
    this.volume = 1.0;
    this.voiceGender = typeof localStorage !== 'undefined' ? (localStorage.getItem('impulso_voice_gender') || 'female') : 'female';
    this.spanishVoices = [];
    this.femaleVoice = null;
    this.maleVoice = null;
    this.initAudioContext();
    this.initVoice();
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn('AudioContext not available:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.initAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initVoice() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          this.spanishVoices = voices.filter(v => v.lang.startsWith('es-') || v.lang.includes('es'));
          
          const femaleKeywords = ['female', 'mujer', 'sabina', 'helena', 'monica', 'paulina', 'lucia', 'victoria', 'francisca', 'laura', 'sofia', 'elvira', 'mia', 'zira', 'alva'];
          const maleKeywords = ['male', 'hombre', 'varon', 'varón', 'raul', 'raúl', 'pablo', 'jorge', 'diego', 'carlos', 'enrique', 'alvaro', 'álvaro', 'mateo', 'david'];

          this.femaleVoice = this.spanishVoices.find(v => femaleKeywords.some(kw => v.name.toLowerCase().includes(kw))) || null;
          this.maleVoice = this.spanishVoices.find(v => maleKeywords.some(kw => v.name.toLowerCase().includes(kw))) || null;

          if (!this.femaleVoice && this.spanishVoices.length > 0) {
            this.femaleVoice = this.spanishVoices[0];
          }
          if (!this.maleVoice && this.spanishVoices.length > 0) {
            this.maleVoice = this.spanishVoices[this.spanishVoices.length > 1 ? 1 : 0];
          }
        } catch (e) {}
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }

  setVoiceGender(gender) {
    this.voiceGender = (gender === 'male') ? 'male' : 'female';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('impulso_voice_gender', this.voiceGender);
    }
  }

  getVoiceGender() {
    return this.voiceGender || 'female';
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = !!enabled;
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = !!enabled;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  playTone(frequency, durationMs, type = 'sine', gainMultiplier = 1.0) {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      const targetGain = this.volume * 0.4 * gainMultiplier;
      gain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (durationMs / 1000));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + (durationMs / 1000));
    } catch (e) {}
  }

  playCountdown() {
    this.playTone(880, 120, 'sine', 1.2);
  }

  playGo() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      this.playTone(1320, 150, 'triangle', 1.5);
      setTimeout(() => {
        this.playTone(1760, 350, 'sine', 1.8);
      }, 100);
    } catch (e) {}
  }

  playRest() {
    if (!this.soundEnabled) return;
    this.playTone(440, 300, 'sine', 1.2);
  }

  playSetLogged() {
    if (!this.soundEnabled) return;
    this.playTone(987.77, 100, 'triangle', 1.0);
    setTimeout(() => {
      this.playTone(1318.51, 180, 'sine', 1.2);
    }, 80);
  }

  playRestComplete() {
    if (!this.soundEnabled) return;
    this.playTone(880, 150, 'square', 0.8);
    setTimeout(() => {
      this.playTone(1174, 250, 'triangle', 1.2);
    }, 160);
  }

  playFanfare() {
    if (!this.soundEnabled) return;
    const chords = [523.25, 659.25, 783.99, 1046.50];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 280, 'triangle', 1.3);
      }, idx * 140);
    });
  }

  prewarm() {
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SPEECH_PREWARM'
        }));
      } catch (err) {}
    }
  }

  speak(text, options = {}) {
    if (!this.voiceEnabled || !text) return;
    const gender = options.gender || this.voiceGender || 'female';
    const isFemale = (gender === 'female' || gender === 'sofia');
    const isCountdown = (text === 'Tres' || text === 'Dos' || text === 'Uno' || text === '3' || text === '2' || text === '1');
    
    // Valores por defecto calibrados para máxima naturalidad y distinción acústica:
    // Conteo 3-2-1: 1.25 para sincronía exacta con el segundo del reloj
    // Sofía: 1.15 (tono femenino enérgico) y velocidad 1.02
    // Mateo: 0.80 (tono masculino profundo y firme) y velocidad 0.96
    let defaultPitch = isFemale ? 1.15 : 0.80;
    let defaultRate = isCountdown ? 1.25 : (isFemale ? 1.02 : 0.96);
    
    if (typeof localStorage !== 'undefined' && !isCountdown) {
      try {
        const stored = localStorage.getItem('impulso_settings');
        if (stored) {
          const s = JSON.parse(stored);
          if (isFemale) {
            if (typeof s.sofiaPitch === 'number') defaultPitch = s.sofiaPitch;
            if (typeof s.sofiaRate === 'number') defaultRate = s.sofiaRate;
          } else {
            if (typeof s.mateoPitch === 'number') defaultPitch = s.mateoPitch;
            if (typeof s.mateoRate === 'number') defaultRate = s.mateoRate;
          }
        }
      } catch (e) {}
    }
    
    let pitch = typeof options.pitch === 'number' ? options.pitch : defaultPitch;
    let rate = isCountdown ? 1.25 : (typeof options.rate === 'number' ? options.rate : defaultRate);

    pitch = Math.max(0.6, Math.min(1.5, pitch));
    rate = Math.max(0.7, Math.min(1.5, rate));

    let voiceId = options.voiceId;
    if (!voiceId && typeof localStorage !== 'undefined') {
      voiceId = isFemale ? localStorage.getItem('impulso_sofia_voice_id') : localStorage.getItem('impulso_mateo_voice_id');
      if (!voiceId) {
        try {
          const s = JSON.parse(localStorage.getItem('impulso_settings') || '{}');
          voiceId = isFemale ? s.sofiaVoiceId : s.mateoVoiceId;
        } catch(e) {}
      }
    }

    // Si aún no hay voiceId asignado explícitamente, usar el índice 0 para Sofía y 5 para Mateo
    if (!voiceId && typeof window !== 'undefined' && window.__NATIVE_VOICES__ && window.__NATIVE_VOICES__.length > 0) {
      if (isFemale) {
        voiceId = window.__NATIVE_VOICES__[0]?.identifier;
      } else {
        voiceId = (window.__NATIVE_VOICES__.length >= 6)
          ? window.__NATIVE_VOICES__[5]?.identifier
          : (window.__NATIVE_VOICES__.find(v => v.gender === 'male')?.identifier || window.__NATIVE_VOICES__[window.__NATIVE_VOICES__.length - 1]?.identifier);
      }
    }

    // 1. Enviar al motor nativo Expo Speech vía postMessage
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SPEECH_SPEAK',
          text: text,
          gender: isFemale ? 'female' : 'male',
          pitch: pitch,
          rate: rate,
          voiceId: voiceId
        }));
      } catch (err) {}
      return;
    }

    // 2. Fallback SpeechSynthesis en navegador web estándar
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es';
        utterance.pitch = pitch;
        utterance.rate = rate;
        if (gender === 'female' && this.femaleVoice) {
          utterance.voice = this.femaleVoice;
        } else if (gender === 'male' && this.maleVoice) {
          utterance.voice = this.maleVoice;
        } else if (this.spanishVoices.length > 0) {
          utterance.voice = this.spanishVoices[0];
        }
        utterance.volume = this.volume;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  }

  testVoice(gender = this.voiceGender) {
    this.ensureContext();
    this.playCountdown();
    setTimeout(() => {
      this.playGo();
      if (gender === 'female') {
        this.speak('¡Hola! Soy Sofía, tu entrenadora de ImpuApp. ¡Vamos con toda la energía!', { gender: 'female', pitch: 1.15, rate: 1.02 });
      } else {
        this.speak('¡Hola! Soy Mateo, tu entrenador de ImpuApp. ¡A darlo todo con fuerza!', { gender: 'male', pitch: 0.80, rate: 0.96 });
      }
    }, 250);
  }
}

export const audio = new AudioService();

