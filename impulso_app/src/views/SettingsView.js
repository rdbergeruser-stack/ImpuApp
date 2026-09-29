// Settings View - Configuration screen with Voice Coach Selector (Sofía / Mateo), Custom Voice Calibration, Full Color Customization, and System Preferences

import { storage } from '../store/storage.js';
import { audio } from '../audio/audioService.js';
import { hapticTap, setHapticsEnabled } from '../utils/haptics.js';
import { setWakeLockEnabled } from '../utils/wakeLock.js';
import { COLOR_THEMES } from '../store/defaultData.js';

export function renderSettings(container, navigate, params = {}) {
  let settings = storage.getSettings();
  let currentSubTab = params.subTab || 'voice'; // 'voice' | 'colors' | 'prefs'

  const handleNativeVoices = () => {
    render();
  };
  window.addEventListener('nativeVoicesLoaded', handleNativeVoices, { once: true });

  function render() {
    const activeColor = COLOR_THEMES[settings.accentColor] || COLOR_THEMES.green;
    const isSofia = (settings.voiceGender === 'female' || !settings.voiceGender);

    const html = `
      <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
        
        <!-- Header -->
        <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
          <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
            <div class="flex items-center gap-3">
              <button id="btn-back-hub" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
                <span class="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div>
                <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</h1>
                <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">AJUSTES & PERSONALIZACIÓN</span>
              </div>
            </div>

            <div class="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary-container">
              <span class="material-symbols-outlined text-[20px]">settings</span>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-4 pb-20">
          
          <!-- Segmented 3-Tab Selector: VOZ COACH | COLORES | SISTEMA -->
          <div class="grid grid-cols-3 gap-1.5 p-1 bg-surface-container rounded-2xl border border-outline-variant shadow-sm shrink-0">
            
            <button data-subtab="voice" class="btn-subtab py-2.5 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              currentSubTab === 'voice'
                ? 'bg-primary-container text-on-primary-container font-black shadow-md'
                : 'text-on-surface-variant hover:text-on-surface font-bold'
            }">
              <span class="material-symbols-outlined text-[18px]">record_voice_over</span>
              <span class="text-[11px] font-headline uppercase tracking-wider font-bold">VOZ & COACH</span>
            </button>

            <button data-subtab="colors" class="btn-subtab py-2.5 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              currentSubTab === 'colors'
                ? 'bg-primary-container text-on-primary-container font-black shadow-md'
                : 'text-on-surface-variant hover:text-on-surface font-bold'
            }">
              <span class="material-symbols-outlined text-[18px]">palette</span>
              <span class="text-[11px] font-headline uppercase tracking-wider font-bold">COLORES</span>
            </button>

            <button data-subtab="prefs" class="btn-subtab py-2.5 px-1 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              currentSubTab === 'prefs'
                ? 'bg-primary-container text-on-primary-container font-black shadow-md'
                : 'text-on-surface-variant hover:text-on-surface font-bold'
            }">
              <span class="material-symbols-outlined text-[18px]">tune</span>
              <span class="text-[11px] font-headline uppercase tracking-wider font-bold">SISTEMA</span>
            </button>
          </div>

          <!-- TAB 1: VOZ & COACH -->
          ${currentSubTab === 'voice' ? `
            <div class="flex flex-col gap-4 animate-fade-in">
              
              <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm">
                <div>
                  <span class="text-[10px] text-on-surface-variant font-headline font-black tracking-widest uppercase block">
                    ENTRENADOR PERSONAL
                  </span>
                  <h2 class="font-headline text-base font-black text-primary uppercase mt-0.5">
                    SELECTOR DE VOZ DEL COACH
                  </h2>
                  <p class="text-xs text-on-surface-variant font-medium mt-0.5">
                    Elige la voz en español que te anunciará los ejercicios, descansos y series en todos los relojes.
                  </p>
                </div>

                <div class="grid grid-cols-1 gap-3 pt-1">
                  
                  <!-- Tarjeta SOFÍA -->
                  <div class="rounded-2xl border-2 p-3.5 flex flex-col gap-2.5 transition-all ${
                    isSofia
                      ? 'border-primary-container bg-surface-container-high/90 shadow-md'
                      : 'border-outline-variant bg-surface-container-high/40 hover:border-outline-variant/80'
                  }">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-xl bg-primary-container/20 border border-primary-container flex items-center justify-center text-2xl">
                          👩
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <h3 class="font-headline text-base font-black uppercase ${isSofia ? 'text-primary-container' : 'text-on-surface'}">
                              SOFÍA
                            </h3>
                            <span class="px-2 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-[9px] font-headline font-black uppercase text-primary-container">
                              MUJER
                            </span>
                          </div>
                          <span class="text-[11px] text-on-surface-variant font-medium block">
                            Tono ágil, dinámico y motivador
                          </span>
                        </div>
                      </div>

                      <button id="btn-select-sofia" class="px-3.5 py-1.5 rounded-xl font-headline text-xs font-black uppercase transition-all ${
                        isSofia
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface active:scale-95'
                      }">
                        ${isSofia ? 'ACTIVA ✓' : 'ELEGIR'}
                      </button>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                      <span class="text-[11px] text-on-surface-variant italic">“¡A dar tu máximo esfuerzo hoy!”</span>
                      <button id="btn-test-sofia" class="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant hover:border-primary-container text-primary text-[11px] font-headline font-bold flex items-center gap-1 active:scale-95">
                        <span class="material-symbols-outlined text-sm">volume_up</span>
                        <span>PROBAR</span>
                      </button>
                    </div>
                  </div>

                  <!-- Tarjeta MATEO -->
                  <div class="rounded-2xl border-2 p-3.5 flex flex-col gap-2.5 transition-all ${
                    !isSofia
                      ? 'border-[#ffa276] bg-surface-container-high/90 shadow-md'
                      : 'border-outline-variant bg-surface-container-high/40 hover:border-outline-variant/80'
                  }">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-11 h-11 rounded-xl bg-[#ffa276]/20 border border-[#ffa276] flex items-center justify-center text-2xl">
                          👨
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <h3 class="font-headline text-base font-black uppercase ${!isSofia ? 'text-[#ffa276]' : 'text-on-surface'}">
                              MATEO
                            </h3>
                            <span class="px-2 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-[9px] font-headline font-black uppercase text-[#ffa276]">
                              VARÓN
                            </span>
                          </div>
                          <span class="text-[11px] text-on-surface-variant font-medium block">
                            Tono masculino, firme y atlético
                          </span>
                        </div>
                      </div>

                      <button id="btn-select-mateo" class="px-3.5 py-1.5 rounded-xl font-headline text-xs font-black uppercase transition-all ${
                        !isSofia
                          ? 'bg-[#ffa276] text-[#3d1300] shadow-sm font-black'
                          : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface active:scale-95'
                      }">
                        ${!isSofia ? 'ACTIVO ✓' : 'ELEGIR'}
                      </button>
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                      <span class="text-[11px] text-on-surface-variant italic">“Mantén el ritmo y no te detengas.”</span>
                      <button id="btn-test-mateo" class="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant hover:border-[#ffa276] text-[#ffa276] text-[11px] font-headline font-bold flex items-center gap-1 active:scale-95">
                        <span class="material-symbols-outlined text-sm">volume_up</span>
                        <span>PROBAR</span>
                      </button>
                    </div>
                  </div>

                </div>
              </section>

              <!-- Opciones de Audio -->
              <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm">
                <span class="text-[10px] text-on-surface-variant font-headline font-bold tracking-widest uppercase">
                  SEÑALES Y VOLUMEN
                </span>

                <div class="flex items-center justify-between py-1">
                  <div>
                    <h4 class="font-headline text-xs font-bold text-on-surface uppercase">Guía de Voz Activa</h4>
                    <p class="text-[10px] text-on-surface-variant mt-0.5">Anuncia ejercicios, transiciones y descanso</p>
                  </div>
                  <input id="check-voice" type="checkbox" ${settings.voiceEnabled ? 'checked' : ''} class="w-5 h-5 accent-primary-container cursor-pointer" />
                </div>

                <div class="h-px bg-outline-variant/30 w-full"></div>

                <div class="flex items-center justify-between py-1">
                  <div>
                    <h4 class="font-headline text-xs font-bold text-on-surface uppercase">Beeps Sonoros (3-2-1)</h4>
                    <p class="text-[10px] text-on-surface-variant mt-0.5">Pitidos sintetizados de alta frecuencia</p>
                  </div>
                  <input id="check-sound" type="checkbox" ${settings.soundEnabled ? 'checked' : ''} class="w-5 h-5 accent-primary-container cursor-pointer" />
                </div>
              </section>

            </div>
          ` : currentSubTab === 'colors' ? `
            <!-- TAB 2: PERSONALIZACIÓN DE COLOR (Stitch Exacto Completo) -->
            <div class="flex flex-col gap-4 animate-fade-in">
              
              <div class="space-y-1.5">
                <span class="text-[10px] text-on-surface-variant font-headline font-bold tracking-widest uppercase px-1">
                  PERSONALIZACIÓN DE COLOR
                </span>
                
                <div class="rounded-2xl bg-surface-container border border-outline-variant p-4 space-y-4 shadow-sm">
                  
                  <!-- Color de Acento Neón -->
                  <div class="space-y-2.5">
                    <div>
                      <h3 class="font-headline text-xs font-bold text-on-surface tracking-wide uppercase">Color de Acento Neón</h3>
                      <p class="text-[10px] text-on-surface-variant mt-0.5 font-medium">Tono visual para cronómetros, métricas y botones de acción</p>
                    </div>

                    <!-- Swatches Row -->
                    <div class="flex items-center justify-between pt-1">
                      ${Object.values(COLOR_THEMES).map(c => {
                        const isSelected = settings.accentColor === c.id;
                        return `
                          <button data-color-id="${c.id}" class="btn-swatch w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                            isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg' : 'hover:scale-105'
                          }" style="background-color: ${c.hex};" title="${c.name}">
                            ${isSelected ? '<span class="material-symbols-outlined text-black text-sm font-black">check</span>' : ''}
                          </button>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  <div class="h-px bg-outline-variant/40 w-full"></div>

                  <!-- Tema de Fondo -->
                  <div class="flex items-center justify-between">
                    <div class="pr-2">
                      <h3 class="font-headline text-xs font-bold text-on-surface tracking-wide uppercase">Tema de Fondo</h3>
                      <p class="text-[10px] text-on-surface-variant mt-0.5 font-medium">Optimización para paneles OLED y contraste en sala</p>
                    </div>

                    <div class="flex items-center gap-1.5">
                      <button id="btn-theme-oled" class="px-2.5 py-1.5 rounded-lg border text-[10px] font-headline font-black tracking-wider uppercase transition-all ${
                        settings.bgTheme === 'oled' && settings.theme !== 'light'
                          ? 'bg-surface-bright border-primary-container text-primary-container'
                          : 'bg-surface-container-high border-outline-variant text-on-surface-variant'
                      }">
                        OLED NEGRO
                      </button>

                      <button id="btn-theme-slate" class="px-2.5 py-1.5 rounded-lg border text-[10px] font-headline font-black tracking-wider uppercase transition-all ${
                        settings.bgTheme === 'slate' && settings.theme !== 'light'
                          ? 'bg-surface-bright border-primary-container text-primary-container'
                          : 'bg-surface-container-high border-outline-variant text-on-surface-variant'
                      }">
                        SLATE
                      </button>

                      <button id="btn-theme-light" class="px-2.5 py-1.5 rounded-lg border text-[10px] font-headline font-black tracking-wider uppercase transition-all ${
                        settings.theme === 'light'
                          ? 'bg-surface-bright border-primary-container text-primary-container'
                          : 'bg-surface-container-high border-outline-variant text-on-surface-variant'
                      }">
                        CLARO
                      </button>
                    </div>
                  </div>

                  <div class="h-px bg-outline-variant/40 w-full"></div>

                  <!-- Contraste Dinámico Toggle -->
                  <div class="flex items-center justify-between">
                    <div class="pr-2">
                      <h3 class="font-headline text-xs font-bold text-on-surface tracking-wide uppercase">Contraste Dinámico</h3>
                      <p class="text-[10px] text-on-surface-variant mt-0.5 font-medium">Resplandor reactivo en intervalos intensos</p>
                    </div>
                    
                    <input id="check-dynamic-contrast" type="checkbox" ${settings.dynamicContrast ? 'checked' : ''} class="w-5 h-5 accent-primary-container cursor-pointer" />
                  </div>

                </div>
              </div>

              <!-- Codificación Visual de Fases -->
              <div class="space-y-1.5">
                <span class="text-[10px] text-on-surface-variant font-headline font-bold tracking-widest uppercase px-1">
                  CODIFICACIÓN VISUAL DE FASES
                </span>

                <div class="rounded-2xl bg-surface-container border border-outline-variant p-3.5 space-y-2.5 shadow-sm">
                  
                  <div class="flex items-center justify-between py-1">
                    <div class="flex items-center gap-2.5">
                      <div class="w-3 h-3 rounded-full" style="background-color: ${activeColor.hex}; box-shadow: 0 0 8px ${activeColor.hex};"></div>
                      <span class="text-xs font-headline font-bold text-on-surface uppercase">Fase de Trabajo</span>
                    </div>
                    <span class="text-[10px] font-headline font-black uppercase" style="color: ${activeColor.hex};">${activeColor.name}</span>
                  </div>

                  <div class="h-px bg-outline-variant/30 w-full"></div>

                  <div class="flex items-center justify-between py-1">
                    <div class="flex items-center gap-2.5">
                      <div class="w-3 h-3 rounded-full bg-error" style="box-shadow: 0 0 8px #fe7453;"></div>
                      <span class="text-xs font-headline font-bold text-on-surface uppercase">Fase de Descanso</span>
                    </div>
                    <span class="text-[10px] text-error font-headline font-black uppercase">ROJO CORAL</span>
                  </div>

                  <div class="h-px bg-outline-variant/30 w-full"></div>

                  <div class="flex items-center justify-between py-1">
                    <div class="flex items-center gap-2.5">
                      <div class="w-3 h-3 rounded-full bg-tertiary-fixed" style="box-shadow: 0 0 8px #ffa276;"></div>
                      <span class="text-xs font-headline font-bold text-on-surface uppercase">Preparación</span>
                    </div>
                    <span class="text-[10px] text-tertiary-fixed font-headline font-black uppercase">ÁMBAR ALERTA</span>
                  </div>

                </div>
              </div>

            </div>
          ` : `
            <!-- TAB 3: SISTEMA -->
            <div class="flex flex-col gap-4 animate-fade-in">
              <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm">
                <span class="text-[10px] text-on-surface-variant font-headline font-bold tracking-widest uppercase">
                  PREFERENCIAS DE HARDWARE
                </span>

                <div class="flex items-center justify-between py-1">
                  <div>
                    <h4 class="font-headline text-xs font-bold text-on-surface uppercase">Vibración Háptica</h4>
                    <p class="text-[10px] text-on-surface-variant mt-0.5">Pulsos táctiles en cambios de fase y conteo</p>
                  </div>
                  <input id="check-haptics" type="checkbox" ${settings.hapticsEnabled ? 'checked' : ''} class="w-5 h-5 accent-primary-container cursor-pointer" />
                </div>

                <div class="h-px bg-outline-variant/30 w-full"></div>

                <div class="flex items-center justify-between py-1">
                  <div>
                    <h4 class="font-headline text-xs font-bold text-on-surface uppercase">Mantener Pantalla Activa</h4>
                    <p class="text-[10px] text-on-surface-variant mt-0.5">Evita que la pantalla se apague mientras entrenas</p>
                  </div>
                  <input id="check-wakelock" type="checkbox" ${settings.wakeLockEnabled ? 'checked' : ''} class="w-5 h-5 accent-primary-container cursor-pointer" />
                </div>

                <div class="h-px bg-outline-variant/30 w-full"></div>

                <button id="btn-reset-all" class="w-full h-11 rounded-xl bg-surface-container-high border border-error/50 text-error font-headline text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all mt-2">
                  <span class="material-symbols-outlined text-base">restart_alt</span>
                  <span>RESTAURAR VALORES DE FÁBRICA</span>
                </button>
              </section>
            </div>
          `}

        </main>
      </div>
    `;

    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    const isSofia = (settings.voiceGender === 'female' || !settings.voiceGender);

    document.getElementById('btn-back-hub')?.addEventListener('click', () => {
      hapticTap();
      window.removeEventListener('nativeVoicesLoaded', handleNativeVoices);
      navigate('home');
    });

    container.querySelectorAll('.btn-subtab').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        currentSubTab = btn.getAttribute('data-subtab');
        render();
      });
    });

    // Voice Selection (Sofía vs Mateo)
    document.getElementById('btn-select-sofia')?.addEventListener('click', () => {
      hapticTap();
      settings.voiceGender = 'female';
      const sofiaId = (window.__NATIVE_VOICES__ && window.__NATIVE_VOICES__.length > 0)
        ? window.__NATIVE_VOICES__[0].identifier
        : null;
      if (sofiaId) {
        settings.sofiaVoiceId = sofiaId;
        if (typeof localStorage !== 'undefined') localStorage.setItem('impulso_sofia_voice_id', sofiaId);
      }
      storage.saveSettings(settings);
      audio.setVoiceGender('female');
      audio.speak('¡Hola! Soy Sofía, tu entrenadora. Lista para dar tu máximo esfuerzo hoy.', { 
        gender: 'female', 
        voiceId: sofiaId, 
        pitch: 1.15, 
        rate: 1.02 
      });
      render();
    });

    document.getElementById('btn-select-mateo')?.addEventListener('click', () => {
      hapticTap();
      settings.voiceGender = 'male';
      let mateoId = null;
      if (window.__NATIVE_VOICES__ && window.__NATIVE_VOICES__.length >= 6) {
        mateoId = window.__NATIVE_VOICES__[5].identifier; // 6ta voz seleccionada por el usuario
      } else if (window.__NATIVE_VOICES__ && window.__NATIVE_VOICES__.length > 0) {
        const male = window.__NATIVE_VOICES__.find(v => v.gender === 'male');
        mateoId = male ? male.identifier : window.__NATIVE_VOICES__[window.__NATIVE_VOICES__.length - 1].identifier;
      }
      if (mateoId) {
        settings.mateoVoiceId = mateoId;
        if (typeof localStorage !== 'undefined') localStorage.setItem('impulso_mateo_voice_id', mateoId);
      }
      storage.saveSettings(settings);
      audio.setVoiceGender('male');
      audio.speak('¡Hola! Soy Mateo, tu entrenador. Mantén el ritmo y no te detengas.', { 
        gender: 'male', 
        voiceId: mateoId, 
        pitch: 0.80, 
        rate: 0.96 
      });
      render();
    });

    document.getElementById('btn-test-sofia')?.addEventListener('click', () => {
      hapticTap();
      const sofiaId = settings.sofiaVoiceId || (window.__NATIVE_VOICES__ && window.__NATIVE_VOICES__.length > 0 ? window.__NATIVE_VOICES__[0].identifier : null);
      audio.speak('¡Hola! Soy Sofía. Lista para dar tu máximo esfuerzo hoy.', { 
        gender: 'female', 
        voiceId: sofiaId, 
        pitch: 1.15, 
        rate: 1.02 
      });
    });

    document.getElementById('btn-test-mateo')?.addEventListener('click', () => {
      hapticTap();
      let mateoId = settings.mateoVoiceId;
      if (!mateoId && window.__NATIVE_VOICES__) {
        if (window.__NATIVE_VOICES__.length >= 6) {
          mateoId = window.__NATIVE_VOICES__[5].identifier; // 6ta voz
        } else if (window.__NATIVE_VOICES__.length > 0) {
          const male = window.__NATIVE_VOICES__.find(v => v.gender === 'male');
          mateoId = male ? male.identifier : window.__NATIVE_VOICES__[window.__NATIVE_VOICES__.length - 1].identifier;
        }
      }
      audio.speak('¡Hola! Soy Mateo. Mantén el ritmo y no te detengas.', { 
        gender: 'male', 
        voiceId: mateoId, 
        pitch: 0.80, 
        rate: 0.96 
      });
    });

    // Toggles
    document.getElementById('check-voice')?.addEventListener('change', (e) => {
      hapticTap();
      settings.voiceEnabled = e.target.checked;
      storage.saveSettings(settings);
      audio.setVoiceEnabled(settings.voiceEnabled);
    });

    document.getElementById('check-sound')?.addEventListener('change', (e) => {
      hapticTap();
      settings.soundEnabled = e.target.checked;
      storage.saveSettings(settings);
      audio.setSoundEnabled(settings.soundEnabled);
    });

    document.getElementById('check-haptics')?.addEventListener('change', (e) => {
      hapticTap();
      settings.hapticsEnabled = e.target.checked;
      storage.saveSettings(settings);
      setHapticsEnabled(settings.hapticsEnabled);
    });

    document.getElementById('check-wakelock')?.addEventListener('change', (e) => {
      hapticTap();
      settings.wakeLockEnabled = e.target.checked;
      storage.saveSettings(settings);
      setWakeLockEnabled(settings.wakeLockEnabled);
    });

    // Colors
    container.querySelectorAll('.btn-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        settings.accentColor = btn.getAttribute('data-color-id');
        storage.saveSettings(settings);
        render();
      });
    });

    document.getElementById('btn-theme-oled')?.addEventListener('click', () => {
      hapticTap();
      settings.theme = 'dark';
      settings.bgTheme = 'oled';
      storage.saveSettings(settings);
      render();
    });

    document.getElementById('btn-theme-slate')?.addEventListener('click', () => {
      hapticTap();
      settings.theme = 'dark';
      settings.bgTheme = 'slate';
      storage.saveSettings(settings);
      render();
    });

    document.getElementById('btn-theme-light')?.addEventListener('click', () => {
      hapticTap();
      settings.theme = 'light';
      settings.bgTheme = 'light';
      storage.saveSettings(settings);
      render();
    });

    document.getElementById('check-dynamic-contrast')?.addEventListener('change', (e) => {
      hapticTap();
      settings.dynamicContrast = e.target.checked;
      storage.saveSettings(settings);
    });

    document.getElementById('btn-reset-all')?.addEventListener('click', () => {
      hapticTap();
      if (confirm('¿Restaurar valores de fábrica? Se reiniciarán todos los ajustes e historial.')) {
        storage.resetAllData();
        settings = storage.getSettings();
        alert('Ajustes reiniciados a valores por defecto.');
        render();
      }
    });
  }

  render();
}
