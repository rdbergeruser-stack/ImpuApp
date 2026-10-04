// Profile View - Athlete Profile, Biometrics, Achievements and Global Stats

import { storage } from '../store/storage.js';
import { formatTime, formatKg } from '../utils/formatters.js';
import { hapticTap } from '../utils/haptics.js';
import { renderBottomNav } from '../components/BottomNav.js';
import { setHtmlPreservingScroll } from '../utils/dom.js';

export function renderProfile(container, navigate) {
  let settings = storage.getSettings();
  let history = storage.getHistory();

  let activeSubTab = 'metrics'; // 'metrics' | 'biometrics'

  function calculateStats() {
    const totalSecs = history.reduce((acc, h) => acc + (h.durationSeconds || 0), 0);
    const totalVolume = history.reduce((acc, h) => acc + (h.totalVolumeKg || 0), 0);
    const tabataCount = history.filter(h => h.type === 'tabata').length;
    const gymCount = history.filter(h => h.type === 'gym').length;
    const runnerCount = history.filter(h => h.type === 'runner').length;

    // BMI Calculation with realistic biometrics bounds
    const weight = settings.athleteWeight || 70;
    const height = settings.athleteHeight || 175;
    let bmi = '--';
    if (weight >= 30 && weight <= 300 && height >= 80 && height <= 250) {
      const heightM = height / 100;
      bmi = (weight / (heightM * heightM)).toFixed(1);
    }

    return { totalSecs, totalVolume, tabataCount, gymCount, runnerCount, bmi };
  }

  function render() {
    settings = storage.getSettings();
    history = storage.getHistory();
    const stats = calculateStats();
    const initials = (settings.athleteName || 'Atleta')
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const html = `
      <div class="w-full h-full flex flex-col overflow-hidden bg-background select-none">
        
        <!-- Header -->
        <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
          <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
            <div class="flex items-center gap-3">
              <button id="btn-back-hub" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
                <span class="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div>
                <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</h1>
                <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">PERFIL DE ATLETA</span>
              </div>
            </div>

            <button id="btn-profile-settings" class="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-all" title="Ajustes y Colores">
              <span class="material-symbols-outlined text-[20px]">palette</span>
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 min-h-0 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-4 pb-32">
          
          <!-- Athlete Header Card (shrink-0 ensures it never squashes in Biometrics) -->
          <section class="rounded-3xl bg-surface-container border border-outline-variant p-4 flex items-center gap-4 shadow-sm relative overflow-hidden shrink-0 w-full">
            <div id="ui-athlete-initials" class="relative w-16 h-16 rounded-2xl bg-surface-container-high border-2 border-primary-container flex items-center justify-center text-primary-container font-headline text-2xl font-black shrink-0 glow-work">
              ${initials}
            </div>

            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h2 id="ui-athlete-name" class="font-headline text-lg font-black uppercase text-on-surface tracking-tight">
                  ${settings.athleteName || 'ATLETA PRO'}
                </h2>
                <span id="ui-athlete-level" class="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-headline text-[9px] font-black uppercase tracking-wider">
                  ${settings.athleteLevel || 'INTERMEDIO'}
                </span>
              </div>
              <p class="text-xs text-on-surface-variant font-bold uppercase mt-0.5">
                Racha activa: <span class="text-primary-container font-headline font-black">${settings.athleteStreakDays ?? 0} días</span>
              </p>
              <button id="btn-goto-colors" class="mt-2 text-[11px] text-primary-container font-headline font-bold uppercase flex items-center gap-1 hover:underline">
                <span class="material-symbols-outlined text-sm">palette</span>
                <span>CAMBIAR TEMA DE COLOR</span>
              </button>
            </div>
          </section>

          <!-- Sub-tabs Selector: Métricas vs Biometría -->
          <div class="grid grid-cols-2 p-1 bg-surface-container rounded-2xl border border-outline-variant gap-1.5 shadow-sm shrink-0 w-full">
            <button id="tab-metrics" class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-headline text-xs font-black uppercase tracking-wider transition-all ${
              activeSubTab === 'metrics'
                ? 'bg-primary-container text-on-primary-container shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }">
              <span class="material-symbols-outlined text-base">monitoring</span>
              <span>LOGROS & STATS</span>
            </button>

            <button id="tab-biometrics" class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-headline text-xs font-black uppercase tracking-wider transition-all ${
              activeSubTab === 'biometrics'
                ? 'bg-primary-container text-on-primary-container shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }">
              <span class="material-symbols-outlined text-base">health_and_safety</span>
              <span>BIOMETRÍA</span>
            </button>
          </div>

          <!-- TAB 1: LOGROS & STATS -->
          ${activeSubTab === 'metrics' ? `
            <div class="flex flex-col gap-3.5 animate-fade-in">
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-surface-container p-3 rounded-2xl border border-outline-variant shadow-sm">
                  <span class="material-symbols-outlined text-primary-container text-xl block mb-1">timer</span>
                  <span class="font-headline text-xl font-black text-on-surface block">${Math.round(stats.totalSecs / 60)}m</span>
                  <span class="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Tiempo</span>
                </div>
                <div class="bg-surface-container p-3 rounded-2xl border border-primary-container/40 shadow-sm glow-primary">
                  <span class="material-symbols-outlined text-primary-container text-xl block mb-1">fitness_center</span>
                  <span class="font-headline text-xl font-black text-primary-container block">${formatKg(stats.totalVolume)}</span>
                  <span class="text-[9px] uppercase tracking-wider text-primary-dim font-bold">Volumen</span>
                </div>
                <div class="bg-surface-container p-3 rounded-2xl border border-outline-variant shadow-sm">
                  <span class="material-symbols-outlined text-tertiary text-xl block mb-1">local_fire_department</span>
                  <span class="font-headline text-xl font-black text-on-surface block">${history.length}</span>
                  <span class="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Sesiones</span>
                </div>
              </div>

              <!-- Disciplines Breakdown -->
              <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm">
                <span class="text-[10px] text-on-surface-variant font-headline font-bold tracking-widest uppercase">
                  DESGLOSE DE DISCIPLINAS
                </span>

                <div class="flex flex-col gap-2.5">
                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-on-surface flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                      Reloj Tabata / HIIT
                    </span>
                    <span class="text-primary-container font-headline">${stats.tabataCount} entrenamientos</span>
                  </div>

                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-on-surface flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                      Reloj Runner (Cuestas & Fartlek)
                    </span>
                    <span class="text-tertiary font-headline">${stats.runnerCount} series</span>
                  </div>

                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-on-surface flex items-center gap-1.5">
                      <span class="w-2.5 h-2.5 rounded-full bg-secondary-fixed"></span>
                      Rutinas Gym (Fuerza & Cargas)
                    </span>
                    <span class="text-secondary-fixed font-headline">${stats.gymCount} sesiones</span>
                  </div>
                </div>
              </section>

              <!-- Botones de Gestión de Datos -->
              <div class="flex flex-col gap-2 pt-1 pb-2">
                <button id="btn-reset-stats" class="w-full py-3.5 px-4 rounded-2xl bg-surface-container border border-outline-variant hover:border-error/60 text-on-surface-variant hover:text-error font-headline text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                  <span class="material-symbols-outlined text-base">restart_alt</span>
                  <span>REINICIAR LOGROS Y ESTADÍSTICAS</span>
                </button>

                <button id="btn-factory-reset" class="w-full py-2 px-3 rounded-xl text-[11px] text-on-surface-variant/60 hover:text-error font-headline font-bold uppercase tracking-wider text-center active:scale-95 transition-all">
                  Restaurar app de fábrica (borrar todo)
                </button>
              </div>
            </div>
          ` : `
            <!-- TAB 2: BIOMETRÍA & ZONAS -->
            <div class="flex flex-col gap-3.5 animate-fade-in shrink-0 w-full">
              <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm shrink-0 w-full">
                <span class="text-[10px] text-on-surface-variant font-headline font-bold tracking-widest uppercase">
                  DATOS BIOMÉTRICOS DEL ATLETA
                </span>

                <!-- Nombre del Atleta -->
                <div>
                  <label class="text-[9px] uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">NOMBRE DEL ATLETA</label>
                  <div class="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/40">
                    <span class="material-symbols-outlined text-primary-container text-base">person</span>
                    <input id="input-athlete-name" type="text" value="${settings.athleteName || 'Atleta Pro'}" class="w-full bg-transparent font-headline text-sm font-black text-primary focus:outline-none" placeholder="Tu nombre" />
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2">
                  <div class="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40">
                    <label class="text-[9px] uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">PESO (KG)</label>
                    <input id="input-weight" type="number" step="0.5" min="30" max="250" value="${settings.athleteWeight || 70}" class="w-full bg-transparent font-headline text-lg font-black text-primary focus:outline-none" />
                  </div>

                  <div class="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40">
                    <label class="text-[9px] uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">ALTURA (CM)</label>
                    <input id="input-height" type="number" min="80" max="250" value="${settings.athleteHeight || 175}" class="w-full bg-transparent font-headline text-lg font-black text-primary focus:outline-none" />
                  </div>

                  <div class="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40">
                    <label class="text-[9px] uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">IMC CALC.</label>
                    <span id="val-bmi" class="font-headline text-lg font-black text-primary-container block mt-0.5">${stats.bmi}</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40">
                    <label class="text-[9px] uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">EDAD (AÑOS)</label>
                    <input id="input-age" type="number" min="10" max="110" value="${settings.athleteAge || 25}" class="w-full bg-transparent font-headline text-base font-black text-primary focus:outline-none" />
                  </div>

                  <div class="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40">
                    <label class="text-[9px] uppercase tracking-wider text-on-surface-variant block mb-1 font-bold">NIVEL ATLÉTICO</label>
                    <select id="select-level" class="w-full bg-transparent font-headline text-xs font-black text-primary focus:outline-none cursor-pointer mt-1">
                      <option value="Principiante" class="bg-surface-container text-on-surface" ${settings.athleteLevel === 'Principiante' ? 'selected' : ''}>PRINCIPIANTE</option>
                      <option value="Intermedio" class="bg-surface-container text-on-surface" ${settings.athleteLevel === 'Intermedio' || !settings.athleteLevel ? 'selected' : ''}>INTERMEDIO</option>
                      <option value="Avanzado" class="bg-surface-container text-on-surface" ${settings.athleteLevel === 'Avanzado' ? 'selected' : ''}>AVANZADO</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- Heart Rate Zones Reference -->
              <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-2.5 shadow-sm shrink-0 w-full">
                <span class="text-[10px] text-on-surface-variant font-headline font-bold tracking-widest uppercase">
                  ZONAS DE FRECUENCIA CARDÍACA (RUNNER)
                </span>

                <div class="flex flex-col gap-1.5 text-xs">
                  <div class="flex justify-between items-center p-2 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <span class="font-headline font-bold text-[#8da794]">Z1 - Recuperación</span>
                    <span class="font-bold text-on-surface">100 - 120 bpm</span>
                  </div>
                  <div class="flex justify-between items-center p-2 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <span class="font-headline font-bold text-primary-dim">Z2 - Resistencia Aeróbica</span>
                    <span class="font-bold text-on-surface">120 - 140 bpm</span>
                  </div>
                  <div class="flex justify-between items-center p-2 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <span class="font-headline font-bold text-primary-container">Z3 - Ritmo Tempo</span>
                    <span class="font-bold text-on-surface">140 - 160 bpm</span>
                  </div>
                  <div class="flex justify-between items-center p-2 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <span class="font-headline font-bold text-tertiary">Z4 - Umbral Anaeróbico</span>
                    <span class="font-bold text-on-surface">160 - 175 bpm</span>
                  </div>
                  <div class="flex justify-between items-center p-2 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <span class="font-headline font-bold text-error">Z5 - Potencia Máxima</span>
                    <span class="font-bold text-on-surface">175+ bpm</span>
                  </div>
                </div>
              </section>
            </div>
          `}

        </main>

        ${renderBottomNav('profile')}
      </div>
    `;

    setHtmlPreservingScroll(container, html);
    attachEvents();
  }

  function attachEvents() {
    document.getElementById('btn-back-hub')?.addEventListener('click', () => {
      hapticTap();
      navigate('home');
    });

    document.getElementById('btn-profile-settings')?.addEventListener('click', () => {
      hapticTap();
      navigate('settings', { subTab: 'colors' });
    });

    document.getElementById('btn-goto-colors')?.addEventListener('click', () => {
      hapticTap();
      navigate('settings', { subTab: 'colors' });
    });

    document.getElementById('tab-metrics')?.addEventListener('click', () => {
      hapticTap();
      activeSubTab = 'metrics';
      render();
    });

    document.getElementById('tab-biometrics')?.addEventListener('click', () => {
      hapticTap();
      activeSubTab = 'biometrics';
      render();
    });

    document.getElementById('btn-reset-stats')?.addEventListener('click', () => {
      hapticTap();
      if (confirm('¿Deseas reiniciar a 0 todas las estadísticas, tiempo y volumen acumulado?')) {
        storage.clearHistory();
        history = [];
        render();
      }
    });

    document.getElementById('btn-factory-reset')?.addEventListener('click', () => {
      hapticTap();
      if (confirm('¿Restaurar valores de fábrica? Se borrarán todos los datos, rutinas y ajustes, y volverás a la pantalla de bienvenida.')) {
        storage.resetAllData();
        navigate('onboarding');
      }
    });

    // In-place updates for athlete name, weight, and height (zero scroll jump)
    const updateBmiInPlace = () => {
      const weight = settings.athleteWeight;
      const height = settings.athleteHeight;
      const bmiEl = document.getElementById('val-bmi');
      if (!bmiEl) return;
      if (typeof weight === 'number' && weight >= 30 && weight <= 250 && typeof height === 'number' && height >= 80 && height <= 250) {
        const heightM = height / 100;
        bmiEl.textContent = (weight / (heightM * heightM)).toFixed(1);
      } else {
        bmiEl.textContent = '--';
      }
    };

    document.getElementById('input-athlete-name')?.addEventListener('input', (e) => {
      const name = e.target.value.trim() || 'Atleta Pro';
      settings.athleteName = name;
      storage.saveSettings(settings);
      const nameEl = document.getElementById('ui-athlete-name');
      if (nameEl) nameEl.textContent = name;
      const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
      const inEl = document.getElementById('ui-athlete-initials');
      if (inEl) inEl.textContent = initials;
    });

    document.getElementById('input-weight')?.addEventListener('change', (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val < 30) val = 30;
      if (val > 250) val = 250;
      val = Math.round(val * 10) / 10;
      e.target.value = val;
      settings.athleteWeight = val;
      storage.saveSettings(settings);
      updateBmiInPlace();
    });

    document.getElementById('input-weight')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 30 && val <= 250) {
        settings.athleteWeight = Math.round(val * 10) / 10;
        storage.saveSettings(settings);
      }
      updateBmiInPlace();
    });

    document.getElementById('input-height')?.addEventListener('change', (e) => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val < 80) val = 80;
      if (val > 250) val = 250;
      val = Math.round(val);
      e.target.value = val;
      settings.athleteHeight = val;
      storage.saveSettings(settings);
      updateBmiInPlace();
    });

    document.getElementById('input-height')?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 80 && val <= 250) {
        settings.athleteHeight = Math.round(val);
        storage.saveSettings(settings);
      }
      updateBmiInPlace();
    });

    document.getElementById('input-age')?.addEventListener('change', (e) => {
      let val = parseInt(e.target.value);
      if (isNaN(val) || val < 10) val = 10;
      if (val > 110) val = 110;
      e.target.value = val;
      settings.athleteAge = val;
      storage.saveSettings(settings);
    });

    document.getElementById('input-age')?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val >= 10 && val <= 110) {
        settings.athleteAge = val;
        storage.saveSettings(settings);
      }
    });

    document.getElementById('select-level')?.addEventListener('change', (e) => {
      settings.athleteLevel = e.target.value;
      storage.saveSettings(settings);
      const levelEl = document.getElementById('ui-athlete-level');
      if (levelEl) levelEl.textContent = e.target.value.toUpperCase();
    });

    container.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const navTarget = btn.getAttribute('data-nav');
        hapticTap();
        if (navTarget === 'timers') navigate('home');
        if (navTarget === 'routines') navigate('routines-hub');
        if (navTarget === 'history') navigate('history');
        if (navTarget === 'profile') navigate('profile');
      });
    });
  }

  render();
}

