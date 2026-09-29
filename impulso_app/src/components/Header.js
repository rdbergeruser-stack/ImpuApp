import { APP_ICON_BASE64 } from '../utils/appIcon.js';

export function renderHeader({ title = 'ImpuApp', subtitle = 'HOLA, ATLETA', showBack = false, onBack = null, showSettings = true }) {

  return `
    <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
      <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
        <div class="flex items-center gap-3">
          ${showBack ? `
            <button id="header-btn-back" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
              <span class="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          ` : `
            <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center shadow-sm overflow-hidden p-0.5 shrink-0">
              <img src="${APP_ICON_BASE64}" class="w-full h-full object-contain rounded-lg" alt="ImpuApp" />
            </div>
          `}
          <div>
            <span class="block font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</span>
            <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">${subtitle}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          ${showSettings ? `
            <button id="header-btn-settings" class="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary-container active:scale-95 transition-all" aria-label="Ajustes">
              <span class="material-symbols-outlined text-[20px]">settings</span>
            </button>
          ` : ''}
        </div>
      </div>
    </header>
  `;
}
