// Onboarding View - First-run welcome and baseline athlete configuration

import { storage } from '../store/storage.js';
import { APP_ICON_BASE64 } from '../utils/appIcon.js';
import { hapticTap } from '../utils/haptics.js';

export function renderOnboarding(container, navigate) {
  const currentSettings = storage.getSettings();
  let selectedLevel = currentSettings.athleteLevel || 'Intermedio';

  function render() {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col justify-between overflow-y-auto no-scrollbar bg-background select-none px-4 py-6 max-w-md mx-auto">
        
        <!-- Header Hero -->
        <div class="flex flex-col items-center text-center mt-2 shrink-0">
          <div class="w-20 h-20 rounded-3xl bg-surface-container border border-primary-container/40 p-2 shadow-xl flex items-center justify-center glow-primary">
            <img src="${APP_ICON_BASE64}" class="w-full h-full object-contain rounded-2xl" alt="ImpuApp" />
          </div>

          <h1 class="font-montserrat text-3xl font-black text-white tracking-wider uppercase mt-4 leading-none">
            ImpuApp
          </h1>
          <span class="text-[11px] text-primary-container font-headline font-bold uppercase tracking-widest mt-1.5">
            CONFIGURACIÓN DE ATLETA
          </span>
          <p class="text-xs text-on-surface-variant font-medium mt-2 max-w-[280px]">
            Personaliza tus entrenamientos, cálculo calórico y métricas de rendimiento.
          </p>
        </div>

        <!-- Form Card -->
        <div class="bg-surface-container rounded-3xl p-5 border border-outline-variant flex flex-col gap-4 shadow-xl my-4 shrink-0">
          
          <!-- Nombre o Apodo -->
          <div>
            <label class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1.5">
              NOMBRE O APODO *
            </label>
            <div class="flex items-center gap-2.5 bg-surface-container-low px-3.5 py-3 rounded-2xl border border-outline-variant/60 focus-within:border-primary-container transition-colors">
              <span class="material-symbols-outlined text-primary-container text-xl">person</span>
              <input id="onboard-name" type="text" value="${currentSettings.athleteName || ''}" placeholder="Ej: Alex, Nico, Sofía..." class="w-full bg-transparent font-headline text-sm font-bold text-on-surface focus:outline-none placeholder:text-on-surface-variant/40" />
            </div>
          </div>

          <!-- Edad y Nivel de Entrenamiento -->
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1.5">
                EDAD (AÑOS)
              </label>
              <div class="flex items-center gap-2.5 bg-surface-container-low px-3.5 py-3 rounded-2xl border border-outline-variant/60 focus-within:border-primary-container transition-colors">
                <span class="material-symbols-outlined text-primary-container text-xl">cake</span>
                <input id="onboard-age" type="number" min="10" max="100" value="${currentSettings.athleteAge || 25}" placeholder="25" class="w-full bg-transparent font-headline text-sm font-bold text-on-surface focus:outline-none" />
              </div>
            </div>

            <!-- Nivel Selector -->
            <div>
              <label class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1.5">
                NIVEL ATLÉTICO
              </label>
              <div class="grid grid-cols-3 gap-2" id="level-chip-group">
                ${['Principiante', 'Intermedio', 'Avanzado'].map(lvl => `
                  <button type="button" data-level="${lvl}" class="btn-level-chip py-2.5 px-1 rounded-xl text-center font-headline text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                    selectedLevel.toLowerCase() === lvl.toLowerCase()
                      ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md'
                      : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:text-on-surface'
                  }">
                    ${lvl}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Altura y Peso -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1.5">
                ALTURA (CM)
              </label>
              <div class="flex items-center gap-2 bg-surface-container-low px-3 py-3 rounded-2xl border border-outline-variant/60 focus-within:border-primary-container transition-colors">
                <span class="material-symbols-outlined text-primary-container text-lg">straighten</span>
                <input id="onboard-height" type="number" min="100" max="250" value="${currentSettings.athleteHeight || 175}" placeholder="175" class="w-full bg-transparent font-headline text-sm font-bold text-on-surface focus:outline-none" />
              </div>
            </div>

            <div>
              <label class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1.5">
                PESO (KG)
              </label>
              <div class="flex items-center gap-2 bg-surface-container-low px-3 py-3 rounded-2xl border border-outline-variant/60 focus-within:border-primary-container transition-colors">
                <span class="material-symbols-outlined text-primary-container text-lg">scale</span>
                <input id="onboard-weight" type="number" step="0.5" min="30" max="250" value="${currentSettings.athleteWeight || 70}" placeholder="70" class="w-full bg-transparent font-headline text-sm font-bold text-on-surface focus:outline-none" />
              </div>
            </div>
          </div>

        </div>

        <!-- Submit Button Footer -->
        <div class="w-full shrink-0 mt-2">
          <button id="btn-onboard-submit" class="w-full py-4 px-6 rounded-2xl bg-primary-container text-on-primary-container font-headline text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all glow-work">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">rocket_launch</span>
            <span>COMENZAR A ENTRENAR</span>
          </button>
          <span class="block text-center text-[10px] text-on-surface-variant font-medium mt-2">
            Podrás modificar estos datos en cualquier momento desde tu Perfil.
          </span>
        </div>

      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Level selection
    const chips = container.querySelectorAll('.btn-level-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        hapticTap();
        selectedLevel = chip.getAttribute('data-level');
        chips.forEach(c => {
          const isSelected = c.getAttribute('data-level') === selectedLevel;
          if (isSelected) {
            c.className = 'btn-level-chip py-2.5 px-1 rounded-xl text-center font-headline text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 bg-primary-container text-on-primary-container border-primary-container shadow-md';
          } else {
            c.className = 'btn-level-chip py-2.5 px-1 rounded-xl text-center font-headline text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:text-on-surface';
          }
        });
      });
    });

    // Submit button
    const submitBtn = document.getElementById('btn-onboard-submit');
    submitBtn?.addEventListener('click', () => {
      hapticTap();
      const nameInput = document.getElementById('onboard-name');
      const ageInput = document.getElementById('onboard-age');
      const heightInput = document.getElementById('onboard-height');
      const weightInput = document.getElementById('onboard-weight');

      const name = nameInput?.value.trim() || 'Atleta';
      let age = parseInt(ageInput?.value);
      if (isNaN(age) || age < 10) age = 10;
      if (age > 110) age = 110;

      let height = parseFloat(heightInput?.value);
      if (isNaN(height) || height < 80) height = 80;
      if (height > 250) height = 250;
      height = Math.round(height);

      let weight = parseFloat(weightInput?.value);
      if (isNaN(weight) || weight < 30) weight = 30;
      if (weight > 250) weight = 250;
      weight = Math.round(weight * 10) / 10;

      const settings = storage.getSettings();
      settings.athleteName = name;
      settings.athleteAge = age;
      settings.athleteHeight = height;
      settings.athleteWeight = weight;
      settings.athleteLevel = selectedLevel;
      settings.athleteStreakDays = 0;
      settings.hasCompletedOnboarding = true;

      storage.saveSettings(settings);
      navigate('home');
    });
  }

  render();
}
