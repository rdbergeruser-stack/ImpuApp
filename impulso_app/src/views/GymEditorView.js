import { storage } from '../store/storage.js';
import { hapticTap } from '../utils/haptics.js';
import { setHtmlPreservingScroll } from '../utils/dom.js';

export function renderGymEditor(container, navigate, params = {}) {
  const isNew = !!params.isNew;
  let routine = params.routine ? JSON.parse(JSON.stringify(params.routine)) : {
    id: 'gym-custom-' + Date.now(),
    title: 'Mi Rutina Personalizada',
    category: 'HIPERTROFIA',
    days: 'LUN / JUE',
    description: 'Rutina personalizada de entrenamiento',
    exercises: [
      {
        id: 'ex-' + Date.now(),
        name: 'Press de Banca Plano con Barra',
        targetSets: 4,
        targetReps: '8-10',
        defaultWeight: 60,
        restSeconds: 90,
        muscle: 'Pecho / Pectorales',
        notes: '',
        isSuperset: false
      }
    ]
  };

  // Normalizar ejercicios existentes para compatibilidad total con N ejercicios por súper serie
  function normalizeExercise(ex) {
    if (ex.isSuperset) {
      if (!Array.isArray(ex.subExercises) || ex.subExercises.length === 0) {
        ex.subExercises = [
          {
            id: (ex.id || 'ex') + '-sub-1',
            name: ex.name || 'Primer Ejercicio',
            defaultWeight: typeof ex.defaultWeight === 'number' ? ex.defaultWeight : 40,
            targetReps: ex.targetReps || '10'
          },
          {
            id: (ex.id || 'ex') + '-sub-2',
            name: ex.supersetName || 'Segundo Ejercicio',
            defaultWeight: typeof ex.supersetWeight === 'number' ? ex.supersetWeight : 16,
            targetReps: ex.supersetReps || '12'
          }
        ];
      }
    }
    return ex;
  }

  routine.exercises.forEach(normalizeExercise);

  function syncInputs() {
    // Sincronizar título y metadata
    const titleInput = document.getElementById('input-routine-title');
    if (titleInput) routine.title = titleInput.value.trim() || routine.title;
    const catInput = document.getElementById('select-routine-category');
    if (catInput) routine.category = catInput.value;
    const daysInput = document.getElementById('input-routine-days');
    if (daysInput) routine.days = daysInput.value.trim();

    // Sincronizar campos generales de cada bloque
    container.querySelectorAll('.ex-input').forEach(input => {
      const idx = parseInt(input.getAttribute('data-idx'));
      const field = input.getAttribute('data-field');
      if (field && routine.exercises[idx]) {
        if (field === 'targetSets' || field === 'restSeconds') {
          routine.exercises[idx][field] = parseInt(input.value) || (field === 'targetSets' ? 3 : 60);
        } else if (field === 'defaultWeight') {
          routine.exercises[idx][field] = parseFloat(input.value) || 0;
        } else {
          routine.exercises[idx][field] = input.value.trim();
        }
      }
    });

    // Sincronizar sub-ejercicios de las súper series (N ejercicios)
    container.querySelectorAll('.sub-ex-input').forEach(input => {
      const blockIdx = parseInt(input.getAttribute('data-block-idx'));
      const subIdx = parseInt(input.getAttribute('data-sub-idx'));
      const field = input.getAttribute('data-field');
      const ex = routine.exercises[blockIdx];
      if (ex && ex.subExercises && ex.subExercises[subIdx]) {
        if (field === 'sub-name') {
          ex.subExercises[subIdx].name = input.value.trim() || `Ejercicio ${subIdx + 1}`;
          if (subIdx === 0) ex.name = ex.subExercises[0].name;
        } else if (field === 'sub-weight') {
          ex.subExercises[subIdx].defaultWeight = parseFloat(input.value) || 0;
          if (subIdx === 0) ex.defaultWeight = ex.subExercises[0].defaultWeight;
        } else if (field === 'sub-reps') {
          ex.subExercises[subIdx].targetReps = input.value.trim() || '10';
          if (subIdx === 0) ex.targetReps = ex.subExercises[0].targetReps;
        }
      }
    });
  }

  function render() {
    routine.exercises.forEach(normalizeExercise);
    const totalSets = routine.exercises.reduce((acc, e) => acc + (parseInt(e.targetSets) || 3), 0);
    const avgRest = routine.exercises.length > 0 
      ? Math.round(routine.exercises.reduce((acc, e) => acc + (parseInt(e.restSeconds) || 60), 0) / routine.exercises.length)
      : 60;

    const html = `
      <div class="w-full h-full flex flex-col overflow-hidden bg-background select-none">
        <!-- Top App Bar -->
        <header class="sticky top-0 z-40 bg-surface border-b border-outline-variant px-4 h-16 flex items-center justify-between safe-area-top shrink-0">
          <div class="flex items-center gap-3">
            <button id="btn-editor-back" class="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-all" aria-label="Volver">
              <span class="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 class="font-montserrat text-lg font-black tracking-wider text-white leading-tight">
                ImpuApp
              </h1>
              <span class="text-[10px] uppercase tracking-widest text-primary-container font-headline font-bold">
                ${isNew ? 'NUEVA RUTINA GYM' : 'EDITAR RUTINA'}
              </span>
            </div>
          </div>

          <button id="btn-save-routine" class="bg-primary-container text-on-primary hover:bg-primary active:scale-95 transition-transform px-4 py-2 rounded-full flex items-center gap-1.5 font-headline text-xs font-black shadow-md">
            <span class="material-symbols-outlined text-base font-bold">check</span>
            <span>GUARDAR</span>
          </button>
        </header>

        <!-- Main Form Canvas -->
        <main class="w-full flex-1 min-h-0 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-4 pb-20">
          
          <!-- Routine Info Card -->
          <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant flex flex-col gap-3 shadow-sm">
            <div>
              <label class="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1 font-bold">NOMBRE DE LA RUTINA</label>
              <input id="input-routine-title" type="text" value="${routine.title}" class="w-full h-11 px-3 bg-surface-container-high rounded-xl border border-outline-variant text-primary font-headline text-base font-black focus:outline-none focus:border-primary-container transition-all" placeholder="Ej. Torso: Pecho y Espalda" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1 font-bold">CATEGORÍA</label>
                <select id="select-routine-category" class="w-full h-11 px-3 bg-surface-container-high rounded-xl border border-outline-variant text-on-surface text-xs font-headline font-bold focus:outline-none focus:border-primary-container">
                  <option value="HIPERTROFIA" ${routine.category === 'HIPERTROFIA' ? 'selected' : ''}>HIPERTROFIA</option>
                  <option value="FUERZA" ${routine.category === 'FUERZA' ? 'selected' : ''}>FUERZA</option>
                  <option value="DEFINICIÓN" ${routine.category === 'DEFINICIÓN' ? 'selected' : ''}>DEFINICIÓN</option>
                  <option value="RESISTENCIA" ${routine.category === 'RESISTENCIA' ? 'selected' : ''}>RESISTENCIA</option>
                </select>
              </div>

              <div>
                <label class="text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1 font-bold">DÍAS PROGRAMADOS</label>
                <input id="input-routine-days" type="text" value="${routine.days || 'LUN / JUE'}" class="w-full h-11 px-3 bg-surface-container-high rounded-xl border border-outline-variant text-on-surface text-xs font-bold focus:outline-none focus:border-primary-container" placeholder="Ej. LUN / JUE" />
              </div>
            </div>
          </section>

          <!-- Metrics Bento Summary -->
          <section class="grid grid-cols-3 gap-2 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/60 text-center">
            <div class="bg-surface-container p-2.5 rounded-xl">
              <span class="text-[10px] text-on-surface-variant uppercase font-bold block">Bloques</span>
              <span class="font-headline text-xl font-black text-on-surface mt-0.5 block">${routine.exercises.length}</span>
            </div>
            <div class="bg-surface-container p-2.5 rounded-xl border border-primary-container/30">
              <span class="text-[10px] text-primary-container uppercase font-bold block">Series</span>
              <span class="font-headline text-xl font-black text-primary-container mt-0.5 block">${totalSets}</span>
            </div>
            <div class="bg-surface-container p-2.5 rounded-xl">
              <span class="text-[10px] text-on-surface-variant uppercase font-bold block">Descanso Prom.</span>
              <span class="font-headline text-xl font-black text-on-surface mt-0.5 block">${avgRest}s</span>
            </div>
          </section>

          <!-- Exercises List -->
          <section class="flex flex-col gap-3">
            <div class="flex items-center justify-between px-1">
              <h2 class="font-headline text-xs font-black tracking-widest uppercase text-on-surface-variant flex items-center gap-1.5">
                <span class="material-symbols-outlined text-primary-container text-base">format_list_bulleted</span>
                <span>BLOQUES DE EJERCICIOS Y SÚPER SERIES</span>
              </h2>
            </div>

            ${routine.exercises.map((ex, idx) => `
              <article class="bg-surface-container rounded-2xl border ${ex.isSuperset ? 'border-primary-container bg-surface-container-high/40' : 'border-outline-variant'} p-3.5 flex flex-col gap-3 relative shadow-sm shrink-0 w-full">
                <!-- Card Header -->
                <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-surface-bright border border-outline-variant text-primary-container text-xs font-headline font-black flex items-center justify-center">
                      ${idx + 1}
                    </span>
                    <span class="text-xs text-on-surface-variant font-bold uppercase">
                      ${ex.isSuperset ? `⚡ SÚPER SERIE (${ex.subExercises.length} EJERCICIOS)` : (ex.muscle || 'EJERCICIO INDIVIDUAL')}
                    </span>
                  </div>

                  <!-- Toggle Súper Serie -->
                  <div class="flex items-center gap-2">
                    <button data-toggle-superset="${idx}" class="px-2.5 py-1 rounded-lg border text-[11px] font-headline font-black uppercase flex items-center gap-1 active:scale-95 transition-all ${
                      ex.isSuperset 
                        ? 'bg-primary-container text-on-primary-container border-primary-container shadow-sm' 
                        : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:text-on-surface'
                    }">
                      <span class="material-symbols-outlined text-sm">sync_alt</span>
                      <span>${ex.isSuperset ? 'SÚPER SERIE ✓' : '+ SÚPER SERIE'}</span>
                    </button>

                    <button data-delete-idx="${idx}" class="btn-delete-exercise text-on-surface-variant hover:text-error p-1" title="Eliminar bloque">
                      <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>

                ${ex.isSuperset ? `
                  <!-- LISTA DINÁMICA DE N EJERCICIOS DE LA SÚPER SERIE -->
                  <div class="flex flex-col gap-2">
                    ${ex.subExercises.map((subEx, subIdx) => `
                      <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant flex flex-col gap-2 relative">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] font-headline font-black uppercase text-primary-container flex items-center gap-1.5">
                            <span class="w-4 h-4 rounded-full bg-primary-container text-on-primary-container text-[9px] font-black flex items-center justify-center">${subIdx + 1}</span>
                            <span>EJERCICIO ${subIdx + 1} DE LA SÚPER SERIE</span>
                          </span>

                          ${ex.subExercises.length > 2 ? `
                            <button data-remove-sub-ex="${idx}:${subIdx}" class="text-on-surface-variant hover:text-error p-0.5 active:scale-90 transition-transform" title="Quitar este ejercicio de la súper serie">
                              <span class="material-symbols-outlined text-base">close</span>
                            </button>
                          ` : ''}
                        </div>

                        <div>
                          <label class="text-[9px] text-on-surface-variant uppercase font-bold block mb-0.5">Nombre del Ejercicio ${subIdx + 1}</label>
                          <input data-field="sub-name" data-block-idx="${idx}" data-sub-idx="${subIdx}" type="text" value="${subEx.name || ''}" placeholder="Ej. Ejercicio ${subIdx + 1}" class="sub-ex-input w-full h-10 px-3 bg-surface-container-high rounded-xl border border-outline-variant text-on-surface text-xs font-bold focus:outline-none focus:border-primary-container" />
                        </div>

                        <div class="grid grid-cols-2 gap-2">
                          <div>
                            <label class="text-[9px] text-on-surface-variant uppercase font-bold block mb-0.5">Carga Base (kg)</label>
                            <input data-field="sub-weight" data-block-idx="${idx}" data-sub-idx="${subIdx}" type="number" step="0.5" value="${subEx.defaultWeight || 20}" class="sub-ex-input w-full h-9 px-2 bg-surface-container-high rounded-xl border border-outline-variant text-primary font-headline text-xs font-black text-center focus:outline-none focus:border-primary-container" />
                          </div>
                          <div>
                            <label class="text-[9px] text-on-surface-variant uppercase font-bold block mb-0.5">Reps Objetivo</label>
                            <input data-field="sub-reps" data-block-idx="${idx}" data-sub-idx="${subIdx}" type="text" value="${subEx.targetReps || '10-12'}" placeholder="Ej. 10-12" class="sub-ex-input w-full h-9 px-2 bg-surface-container-high rounded-xl border border-outline-variant text-primary font-headline text-xs font-black text-center focus:outline-none focus:border-primary-container" />
                          </div>
                        </div>
                      </div>

                      ${subIdx < ex.subExercises.length - 1 ? `
                        <div class="flex items-center justify-center -my-0.5 text-primary-container">
                          <span class="px-2.5 py-0.5 rounded-full bg-surface-bright border border-primary-container/40 text-[9px] font-headline font-black uppercase flex items-center gap-1 shadow-sm">
                            <span class="material-symbols-outlined text-[12px]">sync_alt</span>
                            <span>SEGUIDO SIN PAUSA POR</span>
                          </span>
                        </div>
                      ` : ''}
                    `).join('')}

                    <!-- Botón para agregar el ejercicio N a la súper serie -->
                    <button data-add-sub-ex="${idx}" class="w-full py-2.5 px-3 rounded-xl border border-dashed border-primary-container/60 hover:border-primary-container text-primary-container bg-surface-container-high/60 font-headline text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-1">
                      <span class="material-symbols-outlined text-sm font-bold">add</span>
                      <span>+ AGREGAR EJERCICIO A ESTA SÚPER SERIE</span>
                    </button>
                  </div>
                ` : `
                  <!-- EJERCICIO INDIVIDUAL -->
                  <div>
                    <label class="text-[10px] text-on-surface-variant uppercase font-bold block mb-0.5">Nombre del Ejercicio</label>
                    <input data-field="name" data-idx="${idx}" type="text" value="${ex.name}" class="ex-input w-full h-10 px-3 bg-surface-container-high rounded-xl border border-outline-variant text-on-surface text-xs font-bold focus:outline-none focus:border-primary-container" />
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-[9px] text-on-surface-variant uppercase font-bold block mb-0.5">Carga Base (kg)</label>
                      <input data-field="defaultWeight" data-idx="${idx}" type="number" step="0.5" value="${ex.defaultWeight || 50}" class="ex-input w-full h-9 px-2 bg-surface-container-high rounded-xl border border-outline-variant text-primary font-headline text-xs font-black text-center focus:outline-none focus:border-primary-container" />
                    </div>
                    <div>
                      <label class="text-[9px] text-on-surface-variant uppercase font-bold block mb-0.5">Reps Meta</label>
                      <input data-field="targetReps" data-idx="${idx}" type="text" value="${ex.targetReps}" class="ex-input w-full h-9 px-2 bg-surface-container-high rounded-xl border border-outline-variant text-primary font-headline text-xs font-black text-center focus:outline-none focus:border-primary-container" />
                    </div>
                  </div>
                `}

                <!-- PARÁMETROS DEL BLOQUE: SERIES Y DESCANSO -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30">
                  <div>
                    <label class="text-[9px] text-on-surface-variant uppercase font-bold block mb-0.5">
                      ${ex.isSuperset ? 'Series / Rondas Súper Serie' : 'Series Totales'}
                    </label>
                    <input data-field="targetSets" data-idx="${idx}" type="number" min="1" max="10" value="${ex.targetSets}" class="ex-input w-full h-9 px-2 bg-surface-container-high rounded-xl border border-outline-variant text-primary font-headline text-xs font-black text-center focus:outline-none focus:border-primary-container" />
                  </div>
                  <div>
                    <label class="text-[9px] text-on-surface-variant uppercase font-bold block mb-0.5">
                      ${ex.isSuperset ? 'Descanso Post Súper Serie (s)' : 'Descanso entre Series (s)'}
                    </label>
                    <input data-field="restSeconds" data-idx="${idx}" type="number" min="15" max="300" step="15" value="${ex.restSeconds || 90}" class="ex-input w-full h-9 px-2 bg-surface-container-high rounded-xl border border-outline-variant text-primary font-headline text-xs font-black text-center focus:outline-none focus:border-primary-container" />
                  </div>
                </div>
              </article>
            `).join('')}

            <!-- Add Buttons: Ejercicio Individual o Bloque Súper Serie -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button id="btn-add-exercise" class="h-13 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary-container text-on-surface font-headline text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 py-3 active:scale-95 transition-all">
                <span class="material-symbols-outlined text-base">add</span>
                <span>+ EJERCICIO</span>
              </button>

              <button id="btn-add-superset" class="h-13 rounded-xl bg-primary-container text-on-primary-container font-headline text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 py-3 active:scale-95 transition-all shadow-md">
                <span class="material-symbols-outlined text-base">bolt</span>
                <span>+ SÚPER SERIE</span>
              </button>
            </div>
          </section>

        </main>
      </div>
    `;

    setHtmlPreservingScroll(container, html);
    attachEvents();
  }

  function attachEvents() {
    document.getElementById('btn-editor-back')?.addEventListener('click', () => {
      hapticTap();
      navigate('routines-hub', { tab: 'gym' });
    });

    document.getElementById('input-routine-title')?.addEventListener('change', (e) => {
      routine.title = e.target.value.trim() || 'Rutina sin título';
    });

    document.getElementById('select-routine-category')?.addEventListener('change', (e) => {
      routine.category = e.target.value;
    });

    document.getElementById('input-routine-days')?.addEventListener('change', (e) => {
      routine.days = e.target.value.trim() || 'FLEXIBLE';
    });

    // Inputs generales de bloques
    container.querySelectorAll('.ex-input').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.getAttribute('data-idx'));
        const field = input.getAttribute('data-field');
        if (field === 'targetSets' || field === 'restSeconds') {
          routine.exercises[idx][field] = parseInt(input.value) || 3;
        } else if (field === 'defaultWeight') {
          routine.exercises[idx][field] = parseFloat(input.value) || 0;
        } else {
          routine.exercises[idx][field] = input.value.trim();
        }
      });
    });

    // Inputs de sub-ejercicios en súper series
    container.querySelectorAll('.sub-ex-input').forEach(input => {
      input.addEventListener('change', () => {
        const blockIdx = parseInt(input.getAttribute('data-block-idx'));
        const subIdx = parseInt(input.getAttribute('data-sub-idx'));
        const field = input.getAttribute('data-field');
        const ex = routine.exercises[blockIdx];
        if (ex && ex.subExercises && ex.subExercises[subIdx]) {
          if (field === 'sub-name') {
            ex.subExercises[subIdx].name = input.value.trim() || `Ejercicio ${subIdx + 1}`;
            if (subIdx === 0) ex.name = ex.subExercises[0].name;
          } else if (field === 'sub-weight') {
            ex.subExercises[subIdx].defaultWeight = parseFloat(input.value) || 0;
            if (subIdx === 0) ex.defaultWeight = ex.subExercises[0].defaultWeight;
          } else if (field === 'sub-reps') {
            ex.subExercises[subIdx].targetReps = input.value.trim() || '10';
            if (subIdx === 0) ex.targetReps = ex.subExercises[0].targetReps;
          }
        }
      });
    });

    // Agregar sub-ejercicio a súper serie existente
    container.querySelectorAll('[data-add-sub-ex]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        syncInputs();
        const idx = parseInt(btn.getAttribute('data-add-sub-ex'));
        const ex = routine.exercises[idx];
        if (ex && ex.subExercises) {
          ex.subExercises.push({
            id: 'sub-' + Date.now() + '-' + ex.subExercises.length,
            name: `Ejercicio ${ex.subExercises.length + 1}`,
            defaultWeight: 20,
            targetReps: '10-12'
          });
          render();
        }
      });
    });

    // Quitar sub-ejercicio de súper serie
    container.querySelectorAll('[data-remove-sub-ex]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        syncInputs();
        const [blockIdxStr, subIdxStr] = btn.getAttribute('data-remove-sub-ex').split(':');
        const blockIdx = parseInt(blockIdxStr);
        const subIdx = parseInt(subIdxStr);
        const ex = routine.exercises[blockIdx];
        if (ex && ex.subExercises && ex.subExercises.length > 2) {
          ex.subExercises.splice(subIdx, 1);
          ex.name = ex.subExercises[0].name;
          ex.defaultWeight = ex.subExercises[0].defaultWeight;
          ex.targetReps = ex.subExercises[0].targetReps;
          render();
        } else {
          alert('Una súper serie debe contener al menos 2 ejercicios.');
        }
      });
    });

    // Toggle Súper Serie en bloque existente
    container.querySelectorAll('[data-toggle-superset]').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        syncInputs();
        const idx = parseInt(btn.getAttribute('data-toggle-superset'));
        const ex = routine.exercises[idx];
        ex.isSuperset = !ex.isSuperset;
        if (ex.isSuperset) {
          if (!Array.isArray(ex.subExercises) || ex.subExercises.length === 0) {
            ex.subExercises = [
              {
                id: 'sub-' + Date.now() + '-1',
                name: ex.name || 'Primer Ejercicio',
                defaultWeight: typeof ex.defaultWeight === 'number' ? ex.defaultWeight : 40,
                targetReps: ex.targetReps || '10'
              },
              {
                id: 'sub-' + Date.now() + '-2',
                name: ex.supersetName || 'Segundo Ejercicio',
                defaultWeight: typeof ex.supersetWeight === 'number' ? ex.supersetWeight : 16,
                targetReps: ex.supersetReps || '12'
              }
            ];
          }
        }
        render();
      });
    });

    // Eliminar bloque completo de la rutina
    container.querySelectorAll('.btn-delete-exercise').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        syncInputs();
        const idx = parseInt(btn.getAttribute('data-delete-idx'));
        if (routine.exercises.length > 1) {
          routine.exercises.splice(idx, 1);
          render();
        } else {
          alert('La rutina debe tener al menos un bloque de ejercicio.');
        }
      });
    });

    // Agregar ejercicio individual
    document.getElementById('btn-add-exercise')?.addEventListener('click', () => {
      hapticTap();
      syncInputs();
      routine.exercises.push({
        id: 'ex-' + Date.now(),
        name: 'Nuevo Ejercicio',
        targetSets: 3,
        targetReps: '10-12',
        defaultWeight: 20,
        restSeconds: 90,
        isSuperset: false,
        muscle: 'Musculación general',
        notes: ''
      });
      render();
      setTimeout(() => {
        const main = container.querySelector('main');
        if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
      }, 50);
    });

    // Agregar nuevo bloque de Súper Serie con N ejercicios
    document.getElementById('btn-add-superset')?.addEventListener('click', () => {
      hapticTap();
      syncInputs();
      routine.exercises.push({
        id: 'ex-ss-' + Date.now(),
        name: 'Ejercicio 1',
        targetSets: 3,
        targetReps: '10',
        defaultWeight: 30,
        restSeconds: 90,
        isSuperset: true,
        muscle: 'Súper Serie',
        notes: '',
        subExercises: [
          {
            id: 'sub-' + Date.now() + '-1',
            name: 'Ejercicio 1',
            defaultWeight: 30,
            targetReps: '10'
          },
          {
            id: 'sub-' + Date.now() + '-2',
            name: 'Ejercicio 2',
            defaultWeight: 14,
            targetReps: '12'
          }
        ]
      });
      render();
      setTimeout(() => {
        const main = container.querySelector('main');
        if (main) main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
      }, 50);
    });

    // Guardar Rutina
    document.getElementById('btn-save-routine')?.addEventListener('click', () => {
      hapticTap();
      syncInputs();
      storage.saveGymRoutine(routine);
      alert('¡Rutina guardada con éxito!');
      navigate('routines-hub', { tab: 'gym' });
    });
  }

  render();
}
