// Bottom Navigation Bar component

export function renderBottomNav(activeTab = 'timers') {
  const tabs = [
    { id: 'timers', label: 'TIMERS', icon: 'timer' },
    { id: 'routines', label: 'RUTINAS', icon: 'fitness_center' },
    { id: 'history', label: 'HISTORIAL', icon: 'history' },
    { id: 'profile', label: 'PERFIL', icon: 'person' }
  ];

  return `
    <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 shrink-0 z-50 flex justify-around items-center px-2 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant safe-area-bottom shadow-2xl">
      ${tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const colorClass = isActive 
          ? 'text-primary-container font-black' 
          : 'text-on-surface-variant hover:text-on-surface font-bold';
        const fillStyle = isActive ? "font-variation-settings: 'FILL' 1;" : "";

        return `
          <button data-nav="${tab.id}" class="nav-tab-btn flex-1 flex flex-col items-center justify-center py-1 ${colorClass} text-[11px] tracking-widest uppercase active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[24px] mb-0.5" style="${fillStyle}">${tab.icon}</span>
            <span class="tracking-wider text-[10px]">${tab.label}</span>
            ${isActive ? '<span class="w-6 h-0.5 bg-primary-container rounded-full mt-0.5"></span>' : ''}
          </button>
        `;
      }).join('')}
    </nav>
  `;
}
