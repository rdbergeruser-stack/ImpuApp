import { hapticTap } from './haptics.js';

/**
 * Muestra un modal de confirmación con diseño atlético oscuro integrado a ImpuApp.
 * Reemplaza de forma nativa y elegante el window.confirm().
 * 
 * @param {Object} options
 * @param {string} options.title Título del diálogo
 * @param {string} options.message Mensaje explicativo
 * @param {string} [options.confirmText='Confirmar'] Texto del botón de confirmación
 * @param {string} [options.cancelText='Cancelar'] Texto del botón de cancelación
 * @param {boolean} [options.confirmDanger=false] Si es true, el botón de confirmar usa estilo rojo/alerta
 * @param {string} [options.icon='help'] Icono de Material Symbols Outlined
 * @returns {Promise<boolean>} Resuelve true si el usuario confirma, false si cancela o cierra
 */
export function showConfirmModal({
  title = '¿Confirmar acción?',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmDanger = false,
  icon = 'help'
} = {}) {
  return new Promise((resolve) => {
    hapticTap();

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const iconBg = confirmDanger
      ? 'bg-error-container/20 text-error border border-error/40 shadow-[0_0_20px_rgba(255,100,100,0.25)]'
      : 'bg-primary-container/20 text-primary-container border border-primary-container/40 shadow-[0_0_20px_rgba(0,255,102,0.25)]';

    const confirmBtnClass = confirmDanger
      ? 'bg-error hover:bg-error/90 text-white shadow-lg shadow-error/25'
      : 'bg-primary-container hover:bg-primary-container/90 text-on-primary-container shadow-lg shadow-primary-container/25';

    overlay.innerHTML = `
      <div class="w-full max-w-sm bg-surface-container rounded-3xl border border-outline-variant/60 p-6 shadow-2xl flex flex-col gap-4 transform transition-all scale-100 animate-scale-up">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl">${icon}</span>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-headline text-lg font-black text-white uppercase tracking-wider leading-tight">${title}</h3>
            <span class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest font-headline">ImpuApp</span>
          </div>
        </div>

        <div class="text-sm text-on-surface leading-relaxed whitespace-pre-line py-1 font-medium">
          ${message}
        </div>

        <div class="flex items-center gap-2 pt-2">
          <button id="modal-btn-cancel" class="flex-1 h-12 rounded-xl bg-surface-container-high border border-outline-variant/80 text-on-surface hover:text-white font-headline font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center">
            ${cancelText}
          </button>
          <button id="modal-btn-confirm" class="flex-1 h-12 rounded-xl ${confirmBtnClass} font-headline font-black text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    function cleanup(result) {
      hapticTap();
      overlay.classList.add('opacity-0', 'transition-opacity', 'duration-150');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve(result);
      }, 150);
    }

    overlay.querySelector('#modal-btn-confirm').addEventListener('click', () => cleanup(true));
    overlay.querySelector('#modal-btn-cancel').addEventListener('click', () => cleanup(false));

    // Cerrar al tocar fuera del contenedor
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup(false);
      }
    });

    document.body.appendChild(overlay);
  });
}

/**
 * Muestra un modal informativo con diseño atlético integrado a ImpuApp.
 * Reemplaza de forma nativa y elegante el window.alert().
 * 
 * @param {Object} options
 * @param {string} options.title Título del diálogo
 * @param {string} options.message Mensaje explicativo
 * @param {string} [options.confirmText='Entendido'] Texto del botón
 * @param {'info'|'success'|'warning'|'error'} [options.type='info'] Tipo de alerta
 * @param {string} [options.icon] Icono opcional para sobrescribir
 * @returns {Promise<void>}
 */
export function showAlertModal({
  title = 'Información',
  message = '',
  confirmText = 'Entendido',
  type = 'info',
  icon = null
} = {}) {
  return new Promise((resolve) => {
    hapticTap();

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    let defaultIcon = 'info';
    let iconBg = 'bg-primary-container/20 text-primary-container border border-primary-container/40';

    if (type === 'success') {
      defaultIcon = 'check_circle';
      iconBg = 'bg-primary-container/20 text-primary-container border border-primary-container/40 shadow-[0_0_20px_rgba(0,255,102,0.25)]';
    } else if (type === 'error') {
      defaultIcon = 'error';
      iconBg = 'bg-error-container/20 text-error border border-error/40 shadow-[0_0_20px_rgba(255,100,100,0.25)]';
    } else if (type === 'warning') {
      defaultIcon = 'warning';
      iconBg = 'bg-amber-400/20 text-amber-400 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.25)]';
    }

    const resolvedIcon = icon || defaultIcon;

    overlay.innerHTML = `
      <div class="w-full max-w-sm bg-surface-container rounded-3xl border border-outline-variant/60 p-6 shadow-2xl flex flex-col gap-4 transform transition-all scale-100 animate-scale-up">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl">${resolvedIcon}</span>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-headline text-lg font-black text-white uppercase tracking-wider leading-tight">${title}</h3>
            <span class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest font-headline">ImpuApp</span>
          </div>
        </div>

        <div class="text-sm text-on-surface leading-relaxed whitespace-pre-line py-1 font-medium">
          ${message}
        </div>

        <div class="pt-2">
          <button id="modal-btn-ok" class="w-full h-12 rounded-xl bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-primary-container/25 flex items-center justify-center">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    function cleanup() {
      hapticTap();
      overlay.classList.add('opacity-0', 'transition-opacity', 'duration-150');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve();
      }, 150);
    }

    overlay.querySelector('#modal-btn-ok').addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
      }
    });

    document.body.appendChild(overlay);
  });
}

/**
 * Muestra un modal de entrada de datos (prompt) con diseño atlético integrado a ImpuApp.
 * Reemplaza de forma nativa y elegante el window.prompt().
 * 
 * @param {Object} options
 * @param {string} options.title Título del diálogo
 * @param {string} options.message Mensaje explicativo
 * @param {string} [options.defaultValue=''] Valor por defecto del input
 * @param {string} [options.placeholder=''] Placeholder del input
 * @param {string} [options.inputType='text'] Tipo de input ('text', 'number', etc.)
 * @param {string} [options.step] Step si es numérico
 * @param {string} [options.confirmText='Guardar'] Texto del botón de confirmación
 * @param {string} [options.cancelText='Cancelar'] Texto del botón de cancelación
 * @param {string} [options.icon='edit'] Icono de Material Symbols Outlined
 * @returns {Promise<string|null>} Resuelve con el valor ingresado o null si se canceló
 */
export function showPromptModal({
  title = 'Ingresar dato',
  message = '',
  defaultValue = '',
  placeholder = '',
  inputType = 'text',
  step = 'any',
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  icon = 'edit'
} = {}) {
  return new Promise((resolve) => {
    hapticTap();

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const iconBg = 'bg-primary-container/20 text-primary-container border border-primary-container/40 shadow-[0_0_20px_rgba(0,255,102,0.25)]';

    overlay.innerHTML = `
      <div class="w-full max-w-sm bg-surface-container rounded-3xl border border-outline-variant/60 p-6 shadow-2xl flex flex-col gap-4 transform transition-all scale-100 animate-scale-up">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-2xl">${icon}</span>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-headline text-lg font-black text-white uppercase tracking-wider leading-tight">${title}</h3>
            <span class="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest font-headline">ImpuApp</span>
          </div>
        </div>

        ${message ? `
          <div class="text-xs text-on-surface leading-relaxed font-medium">
            ${message}
          </div>
        ` : ''}

        <div class="w-full bg-surface-container-high rounded-2xl border border-primary-container/60 p-3 focus-within:border-primary-container focus-within:shadow-[0_0_15px_rgba(0,255,102,0.2)] transition-all">
          <input id="modal-prompt-input" type="${inputType}" step="${step}" value="${defaultValue}" placeholder="${placeholder}"
            class="w-full bg-transparent font-headline text-xl font-black text-white focus:outline-none text-center" />
        </div>

        <div class="flex items-center gap-2 pt-1">
          <button id="modal-prompt-cancel" class="flex-1 h-12 rounded-xl bg-surface-container-high border border-outline-variant/80 text-on-surface hover:text-white font-headline font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center">
            ${cancelText}
          </button>
          <button id="modal-prompt-confirm" class="flex-1 h-12 rounded-xl bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-primary-container/25 flex items-center justify-center gap-1.5">
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    function cleanup(result) {
      hapticTap();
      overlay.classList.add('opacity-0', 'transition-opacity', 'duration-150');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve(result);
      }, 150);
    }

    const input = overlay.querySelector('#modal-prompt-input');
    overlay.querySelector('#modal-prompt-confirm').addEventListener('click', () => cleanup(input.value));
    overlay.querySelector('#modal-prompt-cancel').addEventListener('click', () => cleanup(null));

    // Permitir enviar con Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        cleanup(input.value);
      } else if (e.key === 'Escape') {
        cleanup(null);
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup(null);
      }
    });

    document.body.appendChild(overlay);
    setTimeout(() => {
      input.focus();
      if (typeof input.select === 'function') input.select();
    }, 100);
  });
}

