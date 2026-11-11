// Weight Tracker View - Body Weight Progress & Trend Monitoring
import { storage } from '../store/storage.js';
import { formatDate } from '../utils/formatters.js';
import { hapticTap, hapticSuccess } from '../utils/haptics.js';
import { renderBottomNav } from '../components/BottomNav.js';
import { showConfirmModal, showAlertModal, showPromptModal } from '../utils/modal.js';
import { setHtmlPreservingScroll } from '../utils/dom.js';

export function renderWeightTracker(container, navigate) {
  let logs = storage.getWeightLogs();
  let settings = storage.getSettings();
  let targetWeight = settings.targetWeight || 72.0;

  // Input state for new weigh-in
  const latestLog = logs[0] || null;
  let currentInputWeight = latestLog ? latestLog.weight : (settings.athleteWeight || 75.0);
  let currentInputNotes = '';

  function renderChart(logsList, target) {
    if (!logsList || logsList.length < 2) {
      return `
        <div class="h-36 flex flex-col items-center justify-center text-center p-4 text-on-surface-variant">
          <span class="material-symbols-outlined text-3xl mb-1 text-primary-container/60">show_chart</span>
          <p class="text-xs font-bold">Registra al menos 2 pesajes para ver tu curva de tendencia.</p>
        </div>
      `;
    }

    // Sort chronologically (oldest to newest) for chart
    const chronLogs = [...logsList].sort((a, b) => new Date(a.date) - new Date(b.date));
    const weights = chronLogs.map(l => l.weight);
    if (target) weights.push(target);

    const minW = Math.floor(Math.min(...weights) - 1);
    const maxW = Math.ceil(Math.max(...weights) + 1);
    const rangeW = Math.max(1, maxW - minW);

    const svgWidth = 320;
    const svgHeight = 130;
    const paddingX = 25;
    const paddingY = 20;
    const usableW = svgWidth - paddingX * 2;
    const usableH = svgHeight - paddingY * 2;

    const points = chronLogs.map((l, idx) => {
      const x = paddingX + (idx / (chronLogs.length - 1)) * usableW;
      const y = paddingY + usableH - ((l.weight - minW) / rangeW) * usableH;
      return { x, y, weight: l.weight, date: l.date };
    });

    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

    const targetY = paddingY + usableH - ((target - minW) / rangeW) * usableH;

    return `
      <div class="relative w-full overflow-hidden flex flex-col items-center">
        <svg class="w-full h-36" viewBox="0 0 ${svgWidth} ${svgHeight}">
          <defs>
            <linearGradient id="weightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#00ff66" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#00ff66" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <!-- Target Goal Dashed Line -->
          <line x1="${paddingX}" y1="${targetY}" x2="${svgWidth - paddingX}" y2="${targetY}" 
            stroke="#ffa276" stroke-dasharray="4,4" stroke-width="1.5" opacity="0.8" />
          <text x="${svgWidth - paddingX}" y="${targetY - 4}" fill="#ffa276" font-size="8" font-family="Montserrat" font-weight="bold" text-anchor="end">
            META: ${target.toFixed(1)} kg
          </text>

          <!-- Filled Area Under Curve -->
          <path d="${areaD}" fill="url(#weightGrad)" />

          <!-- Main Progression Stroke Line -->
          <path d="${pathD}" fill="none" stroke="#00ff66" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

          <!-- Data Points -->
          ${points.map((p, i) => `
            <circle cx="${p.x}" cy="${p.y}" r="${i === points.length - 1 ? 5 : 3.5}" 
              fill="${i === points.length - 1 ? '#00ff66' : '#cceed2'}" 
              stroke="#041108" stroke-width="1.5" class="transition-all" />
          `).join('')}
        </svg>

        <div class="flex items-center justify-between w-full px-2 text-[9px] text-on-surface-variant font-bold uppercase mt-1">
          <span>${formatDate(chronLogs[0].date)}</span>
          <span class="text-primary-container font-black">ÚLTIMO: ${chronLogs[chronLogs.length - 1].weight} kg</span>
          <span>${formatDate(chronLogs[chronLogs.length - 1].date)}</span>
        </div>
      </div>
    `;
  }

  function render() {
    logs = storage.getWeightLogs();
    settings = storage.getSettings();
    targetWeight = settings.targetWeight || 72.0;

    const latest = logs[0] || { weight: settings.athleteWeight || 75.0, date: new Date().toISOString() };
    const oldest = logs[logs.length - 1] || latest;
    const diffTotal = parseFloat((latest.weight - oldest.weight).toFixed(1));
    const toTarget = parseFloat((latest.weight - targetWeight).toFixed(1));

    const html = `
      <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background select-none">
        <!-- Top App Bar -->
        <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
          <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
            <div class="flex items-center gap-3">
              <button id="btn-back-profile" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
                <span class="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div>
                <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</h1>
                <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">CONTROL DE PESO CORPORAL</span>
              </div>
            </div>

            <button id="btn-edit-target" class="h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-[11px] font-headline font-black text-amber-400 flex items-center gap-1 active:scale-95 transition-all" title="Fijar Meta de Peso">
              <span class="material-symbols-outlined text-base">flag</span>
              <span>META</span>
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-3.5 pb-24">

          <!-- Hero Bento Stats Card -->
          <section class="grid grid-cols-3 gap-2 bg-surface-container rounded-2xl p-3 border border-outline-variant shadow-sm text-center shrink-0">
            <div>
              <span class="text-[9px] text-on-surface-variant uppercase font-bold block">Peso Actual</span>
              <span class="font-headline text-2xl font-black text-primary mt-0.5 block tabular-nums leading-tight">
                ${latest.weight} <span class="text-xs text-primary-dim font-bold">kg</span>
              </span>
            </div>
            <div class="border-x border-outline-variant/30">
              <span class="text-[9px] text-on-surface-variant uppercase font-bold block">Diferencia Total</span>
              <span class="font-headline text-2xl font-black ${diffTotal <= 0 ? 'text-primary-container' : 'text-amber-400'} mt-0.5 block tabular-nums leading-tight">
                ${diffTotal > 0 ? '+' : ''}${diffTotal} <span class="text-xs font-bold">kg</span>
              </span>
            </div>
            <div>
              <span class="text-[9px] text-on-surface-variant uppercase font-bold block">Meta Objetivo</span>
              <span class="font-headline text-2xl font-black text-amber-400 mt-0.5 block tabular-nums leading-tight">
                ${targetWeight.toFixed(1)} <span class="text-xs font-bold">kg</span>
              </span>
            </div>
          </section>

          <!-- Weight Progression Chart Card -->
          <section class="bg-surface-container rounded-2xl p-3.5 border border-outline-variant shadow-sm flex flex-col gap-2 shrink-0">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary-container text-base">trending_down</span>
                <span class="font-headline text-xs font-black text-white uppercase tracking-wider">CURVA DE EVOLUCIÓN</span>
              </div>
              <span class="text-[10px] ${toTarget > 0 ? 'text-primary-dim' : 'text-primary-container'} font-bold">
                ${toTarget > 0 ? `Faltan ${toTarget} kg para meta` : '¡Meta alcanzada! 🎉'}
              </span>
            </div>

            ${renderChart(logs, targetWeight)}
          </section>

          <!-- Quick Log New Weight Card -->
          <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant shadow-sm flex flex-col gap-3 shrink-0">
            <div class="flex items-center justify-between">
              <span class="font-headline text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary-container text-base">scale</span>
                <span>REGISTRAR PESO DE HOY</span>
              </span>
              <span class="text-[10px] text-on-surface-variant font-bold">PESAJE EN AYUNAS</span>
            </div>

            <!-- Weight Stepper -->
            <div class="flex items-center justify-between gap-3 bg-surface-container-high p-2 rounded-2xl border border-outline-variant/60">
              <button id="btn-step-minus" class="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary-container font-headline text-2xl font-black active:scale-90 transition-transform">
                −
              </button>

              <div class="flex flex-col items-center justify-center flex-1">
                <div class="flex items-baseline gap-1">
                  <span id="ui-current-input-weight" class="font-headline text-4xl font-black text-white tabular-nums tracking-tight">
                    ${currentInputWeight.toFixed(1)}
                  </span>
                  <span class="font-headline text-sm font-bold text-primary-dim uppercase">KG</span>
                </div>
                <span class="text-[9px] text-on-surface-variant font-bold">Toca para ajustar rápido</span>
              </div>

              <button id="btn-step-plus" class="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary-container font-headline text-2xl font-black active:scale-90 transition-transform">
                +
              </button>
            </div>

            <!-- Notes input -->
            <input id="input-weight-notes" type="text" placeholder="Nota opcional (ej: en ayunas, post-entreno)" 
              value="${currentInputNotes}"
              class="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container" />

            <button id="btn-save-weight" class="w-full h-12 rounded-xl bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-primary-container/25 flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'FILL' 1;">check_circle</span>
              <span>GUARDAR PESO</span>
            </button>
          </section>

          <!-- History of Weigh-ins -->
          <section class="flex flex-col gap-2 shrink-0">
            <span class="font-headline text-xs font-black text-on-surface-variant tracking-wider uppercase px-1">
              HISTORIAL DE PESAJES RECIENTES (${logs.length})
            </span>

            <div class="flex flex-col gap-2">
              ${logs.map((item, idx) => {
                const diffBadge = item.diff < 0 
                  ? `<span class="text-primary-container font-headline font-black text-xs">▼ ${Math.abs(item.diff)} kg</span>`
                  : item.diff > 0 
                    ? `<span class="text-amber-400 font-headline font-black text-xs">▲ +${item.diff} kg</span>`
                    : `<span class="text-on-surface-variant font-headline font-bold text-xs">= 0.0 kg</span>`;

                return `
                  <article class="bg-surface-container rounded-2xl border border-outline-variant p-3 flex items-center justify-between shadow-sm">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container shrink-0">
                        <span class="material-symbols-outlined text-lg">scale</span>
                      </div>
                      <div>
                        <div class="flex items-baseline gap-2">
                          <span class="font-headline text-base font-black text-white tabular-nums">${item.weight} kg</span>
                          ${diffBadge}
                        </div>
                        <span class="text-[10px] text-on-surface-variant font-medium block">
                          ${formatDate(item.date)} ${item.notes ? `• ${item.notes}` : ''}
                        </span>
                      </div>
                    </div>

                    ${logs.length > 1 ? `
                      <button data-delete-id="${item.id}" class="btn-delete-weight p-2 text-on-surface-variant hover:text-error active:scale-90 transition-all" title="Eliminar pesaje">
                        <span class="material-symbols-outlined text-lg">delete</span>
                      </button>
                    ` : ''}
                  </article>
                `;
              }).join('')}
            </div>
          </section>

        </main>

        ${renderBottomNav('profile')}
      </div>
    `;

    setHtmlPreservingScroll(container, html);
    attachEvents();
  }

  function attachEvents() {
    // Back button
    document.getElementById('btn-back-profile')?.addEventListener('click', () => {
      hapticTap();
      navigate('profile');
    });

    // Steppers
    document.getElementById('btn-step-minus')?.addEventListener('click', () => {
      hapticTap();
      currentInputWeight = Math.max(30, parseFloat((currentInputWeight - 0.2).toFixed(1)));
      const el = document.getElementById('ui-current-input-weight');
      if (el) el.textContent = currentInputWeight.toFixed(1);
    });

    document.getElementById('btn-step-plus')?.addEventListener('click', () => {
      hapticTap();
      currentInputWeight = Math.min(250, parseFloat((currentInputWeight + 0.2).toFixed(1)));
      const el = document.getElementById('ui-current-input-weight');
      if (el) el.textContent = currentInputWeight.toFixed(1);
    });

    // Save weight
    document.getElementById('btn-save-weight')?.addEventListener('click', async () => {
      hapticSuccess();
      const notesInput = document.getElementById('input-weight-notes');
      currentInputNotes = notesInput ? notesInput.value.trim() : '';
      
      try {
        storage.addWeightLog({
          weight: currentInputWeight,
          notes: currentInputNotes
        });

        await showAlertModal({
          title: '¡Peso Registrado!',
          message: `Se registró tu pesaje de ${currentInputWeight.toFixed(1)} kg correctamente.\nTu IMC en el Perfil ha sido actualizado.`,
          type: 'success'
        });

        currentInputNotes = '';
        render();
      } catch (err) {
        showAlertModal({
          title: 'Error',
          message: err.message || 'No se pudo guardar el pesaje.',
          type: 'error'
        });
      }
    });

    // Edit Target Weight Modal
    document.getElementById('btn-edit-target')?.addEventListener('click', async () => {
      hapticTap();
      const promptVal = await showPromptModal({
        title: 'Fijar Meta de Peso',
        message: 'Ingresa tu peso objetivo para calcular tu porcentaje de avance y visualizar la meta en la curva de evolución.',
        defaultValue: targetWeight.toFixed(1),
        placeholder: 'ej: 72.0',
        inputType: 'number',
        step: '0.1',
        confirmText: 'Guardar Meta',
        cancelText: 'Cancelar',
        icon: 'flag'
      });
      if (promptVal !== null) {
        const parsed = parseFloat(promptVal);
        if (!isNaN(parsed) && parsed >= 30 && parsed <= 250) {
          storage.saveTargetWeight(parsed);
          await showAlertModal({
            title: 'Meta Actualizada',
            message: `Tu nuevo peso objetivo es de ${parsed.toFixed(1)} kg.`,
            type: 'success'
          });
          render();
        }
      }
    });

    // Delete weight entry
    container.querySelectorAll('.btn-delete-weight').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        hapticTap();
        const id = btn.getAttribute('data-delete-id');
        const confirmed = await showConfirmModal({
          title: 'Eliminar Pesaje',
          message: '¿Deseas eliminar este registro de peso del historial?',
          confirmText: 'Sí, eliminar',
          cancelText: 'Cancelar',
          confirmDanger: true,
          icon: 'delete'
        });
        if (confirmed) {
          storage.deleteWeightLog(id);
          render();
        }
      });
    });

    // Navigation bottom bar
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
