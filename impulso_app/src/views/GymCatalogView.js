// Gym Routines Catalog View

import { storage } from '../store/storage.js';
import { hapticTap } from '../utils/haptics.js';
import { renderBottomNav } from '../components/BottomNav.js';

export function renderGymCatalog(container, navigate) {
  let routines = storage.getGymRoutines();
  let selectedFilter = 'TODAS';
  let searchQuery = '';

  function getFilteredRoutines() {
    return routines.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.exercises.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = selectedFilter === 'TODAS' || r.category === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }

  function render() {
    const filtered = getFilteredRoutines();

    const html = `
      <div class="w-full h-full flex flex-col justify-between overflow-hidden bg-background">
        <!-- Top App Bar -->
        <header class="w-full z-40 bg-surface border-b border-outline-variant shrink-0 safe-area-top">
          <div class="flex justify-between items-center w-full px-4 h-16 max-w-md mx-auto">
            <div class="flex items-center gap-3">
              <button id="btn-back-hub" class="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container active:scale-95 transition-transform" aria-label="Volver">
                <span class="material-symbols-outlined text-[22px]">arrow_back</span>
              </button>
              <div>
                <h1 class="font-montserrat text-lg font-black tracking-wider text-white uppercase leading-tight">ImpuApp</h1>
                <span class="block text-[11px] text-on-surface-variant font-bold tracking-widest uppercase">RUTINAS GYM & FUERZA</span>
              </div>
            </div>

            <button id="btn-create-routine" class="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-container text-on-primary font-headline text-xs font-black active:scale-95 transition-transform shadow-md">
              <span class="material-symbols-outlined text-base font-bold">add</span>
              <span>NUEVA</span>
            </button>
          </div>
        </header>

        <!-- Main Content -->
        <main class="w-full flex-1 px-4 py-3 overflow-y-auto no-scrollbar max-w-md mx-auto flex flex-col gap-3 pb-24">
          
          <!-- Search Input -->
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none text-xl">search</span>
            <input id="input-search" type="text" value="${searchQuery}" placeholder="Buscar rutina o ejercicio..." class="w-full h-11 pl-11 pr-4 bg-surface-container rounded-xl border border-outline-variant text-on-surface placeholder:text-outline text-xs focus:outline-none focus:border-primary-container transition-all" />
          </div>

          <!-- Filter Chips -->
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            ${['TODAS', 'HIPERTROFIA', 'FUERZA', 'DEFINICIÓN'].map(cat => `
              <button data-cat="${cat}" class="btn-filter shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold font-headline transition-all active:scale-95 ${
                selectedFilter === cat
                  ? 'bg-surface-bright border border-primary-container text-primary-container shadow-sm'
                  : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface'
              }">
                ${cat}
              </button>
            `).join('')}
          </div>

          <!-- Section Title -->
          <div class="flex items-center justify-between pt-1 px-1">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary-container text-base">view_agenda</span>
              <h2 class="font-headline text-xs tracking-wider text-on-surface uppercase font-black">RUTINAS GUARDADAS</h2>
            </div>
            <span class="text-[10px] font-headline text-on-surface-variant font-bold tracking-widest bg-surface-container-high px-2 py-0.5 rounded">
              ${filtered.length} DISPONIBLES
            </span>
          </div>

          <!-- List of Routine Cards -->
          <div class="flex flex-col gap-3.5">
            ${filtered.length === 0 ? `
              <div class="bg-surface-container rounded-2xl p-6 text-center border border-outline-variant">
                <span class="material-symbols-outlined text-3xl text-on-surface-variant mb-2">fitness_center</span>
                <p class="text-xs text-on-surface-variant font-medium">No se encontraron rutinas para esta búsqueda.</p>
              </div>
            ` : filtered.map(r => {
              const totalSets = r.exercises.reduce((acc, e) => acc + (e.targetSets || 3), 0);
              return `
                <article class="bg-surface-container rounded-2xl border border-outline-variant hover:border-primary-container/60 p-4 transition-all duration-200 flex flex-col gap-3 shadow-md group">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full bg-surface-bright border border-outline-variant text-primary-container text-[10px] font-headline font-black tracking-widest">
                        ${r.days || 'FLEXIBLE'}
                      </span>
                      <span class="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-on-surface-variant text-[10px] font-headline font-bold uppercase">
                        ${r.category || 'FUERZA'}
                      </span>
                    </div>

                    <div class="flex items-center gap-1">
                      <button data-action="edit" data-id="${r.id}" class="btn-routine-action p-1.5 rounded-lg text-on-surface-variant hover:text-primary-container active:scale-95" title="Editar rutina">
                        <span class="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button data-action="delete" data-id="${r.id}" class="btn-routine-action p-1.5 rounded-lg text-on-surface-variant hover:text-error active:scale-95" title="Eliminar">
                        <span class="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 class="font-headline text-lg font-black text-primary uppercase tracking-tight">
                      ${r.title}
                    </h3>
                    <p class="text-xs text-on-surface-variant mt-0.5">
                      ${r.description || `${r.exercises.length} ejercicios planificados`}
                    </p>
                  </div>

                  <!-- Exercise Preview Pills -->
                  <div class="bg-surface-container-low rounded-xl p-2.5 border border-outline-variant/40 flex flex-col gap-1.5 text-xs">
                    ${r.exercises.slice(0, 3).map(e => `
                      <div class="flex justify-between items-center text-on-surface-variant">
                        <span class="font-medium truncate max-w-[220px]">• ${e.name}</span>
                        <span class="text-[11px] font-bold text-on-surface shrink-0">${e.targetSets}x${e.targetReps}</span>
                      </div>
                    `).join('')}
                    ${r.exercises.length > 3 ? `
                      <span class="text-[10px] text-outline font-bold mt-0.5">+ ${r.exercises.length - 3} ejercicios más</span>
                    ` : ''}
                  </div>

                  <!-- Metrics bar & Launch Button -->
                  <div class="flex items-center justify-between pt-1">
                    <div class="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span class="font-bold text-on-surface">${r.exercises.length} <span class="font-normal text-on-surface-variant">ejercicios</span></span>
                      <span>•</span>
                      <span class="font-bold text-on-surface">${totalSets} <span class="font-normal text-on-surface-variant">series</span></span>
                    </div>

                    <button data-routine-id="${r.id}" class="btn-start-gym px-4 py-2.5 rounded-xl bg-primary-container text-on-primary font-headline text-xs font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-transform shadow-md">
                      <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                      <span>INICIAR</span>
                    </button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>

        </main>

        ${renderBottomNav('routines')}
      </div>
    `;

    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    document.getElementById('btn-back-hub')?.addEventListener('click', () => {
      hapticTap();
      navigate('home');
    });

    document.getElementById('btn-create-routine')?.addEventListener('click', () => {
      hapticTap();
      navigate('gym-editor', { isNew: true });
    });

    const searchInput = document.getElementById('input-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
        const input = document.getElementById('input-search');
        if (input) {
          input.focus();
          input.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      });
    }

    container.querySelectorAll('.btn-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        selectedFilter = btn.getAttribute('data-cat');
        render();
      });
    });

    container.querySelectorAll('.btn-start-gym').forEach(btn => {
      btn.addEventListener('click', () => {
        hapticTap();
        const id = btn.getAttribute('data-routine-id');
        const routine = storage.getGymRoutineById(id);
        if (routine) {
          navigate('gym-live', { routine });
        }
      });
    });

    container.querySelectorAll('.btn-routine-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hapticTap();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'edit') {
          const routine = storage.getGymRoutineById(id);
          if (routine) navigate('gym-editor', { routine });
        } else if (action === 'delete') {
          if (confirm('¿Eliminar esta rutina de gimnasio?')) {
            storage.deleteGymRoutine(id);
            routines = storage.getGymRoutines();
            render();
          }
        }
      });
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

