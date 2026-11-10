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
            <div class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center shadow-sm overflow-hidden p-1.5 shrink-0">
              <svg class="w-full h-full text-primary-container" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill="currentColor" />
              </svg>
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
