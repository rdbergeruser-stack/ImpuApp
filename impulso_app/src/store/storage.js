// Local storage service for routines, presets, history, and theme customization

import {
  DEFAULT_TABATA_PRESETS,
  DEFAULT_RUNNER_PRESETS,
  DEFAULT_GYM_ROUTINES,
  DEFAULT_SETTINGS,
  INITIAL_HISTORY,
  COLOR_THEMES
} from './defaultData.js';

const KEYS = {
  SETTINGS: 'impulso_settings',
  TABATA: 'impulso_tabata_presets',
  RUNNER: 'impulso_runner_presets',
  GYM: 'impulso_gym_routines',
  HISTORY: 'impulso_history'
};

class StorageService {
  constructor() {
    this.initDefaults();
  }

  initDefaults() {
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      this.saveSettings(DEFAULT_SETTINGS);
    }
    if (!localStorage.getItem(KEYS.TABATA)) {
      localStorage.setItem(KEYS.TABATA, JSON.stringify(DEFAULT_TABATA_PRESETS));
    }
    if (!localStorage.getItem(KEYS.RUNNER)) {
      localStorage.setItem(KEYS.RUNNER, JSON.stringify(DEFAULT_RUNNER_PRESETS));
    }
    if (!localStorage.getItem(KEYS.GYM)) {
      localStorage.setItem(KEYS.GYM, JSON.stringify(DEFAULT_GYM_ROUTINES));
    }
    if (!localStorage.getItem(KEYS.HISTORY)) {
      localStorage.setItem(KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
    }
  }

  getSettings() {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      // Clean up legacy hardcoded developer values
      if (parsed.athleteName === 'Rodrigo Berger') {
        parsed.athleteName = '';
        parsed.hasCompletedOnboarding = false;
        parsed.athleteStreakDays = 0;
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      const settings = { ...DEFAULT_SETTINGS, ...parsed };
      settings.athleteStreakDays = this.calculateStreak(this.getHistory());
      return settings;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  calculateStreak(history) {
    if (!Array.isArray(history) || history.length === 0) return 0;

    const uniqueDays = new Set();
    history.forEach(item => {
      if (item && item.date) {
        try {
          const d = new Date(item.date);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            uniqueDays.add(`${y}-${m}-${day}`);
          }
        } catch (e) {}
      }
    });

    if (uniqueDays.size === 0) return 0;

    const toDateKey = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const now = new Date();
    const todayKey = toDateKey(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    let checkDate;
    if (uniqueDays.has(todayKey)) {
      checkDate = new Date(now);
    } else if (uniqueDays.has(yesterdayKey)) {
      checkDate = new Date(yesterday);
    } else {
      return 0;
    }

    let streak = 0;
    while (uniqueDays.has(toDateKey(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  saveSettings(settings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    this.applyTheme(settings);
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'STORAGE_SAVE',
          key: KEYS.SETTINGS,
          value: JSON.stringify(settings)
        }));
      } catch (e) {}
    }
  }

  applyTheme(settings) {
    if (!settings) settings = this.getSettings();
    const root = document.documentElement;
    const body = document.body;

    // Dark vs Light Mode
    if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    // Apply Accent Color Customization
    const accent = COLOR_THEMES[settings.accentColor] || COLOR_THEMES.green;
    root.style.setProperty('--color-primary-container', accent.primaryContainer);
    root.style.setProperty('--color-primary-accent', accent.hex);

    // Apply Background Palette
    if (settings.theme !== 'light') {
      if (settings.bgTheme === 'slate') {
        root.style.setProperty('--color-background', '#0b1320');
        root.style.setProperty('--color-surface', '#0f172a');
        root.style.setProperty('--color-surface-container', '#131e33');
      } else {
        // OLED Negro (Default Kinetic)
        root.style.setProperty('--color-background', '#041108');
        root.style.setProperty('--color-surface', '#041108');
        root.style.setProperty('--color-surface-container', '#081e10');
      }
    }
  }

  getTabataPresets() {
    try {
      const data = localStorage.getItem(KEYS.TABATA);
      return data ? JSON.parse(data) : DEFAULT_TABATA_PRESETS;
    } catch (e) {
      return DEFAULT_TABATA_PRESETS;
    }
  }

  getTabataPresetById(id) {
    const list = this.getTabataPresets();
    return list.find(p => p.id === id) || null;
  }

  saveTabataPreset(preset) {
    const presets = this.getTabataPresets();
    const index = presets.findIndex(p => p.id === preset.id);
    if (index >= 0) {
      presets[index] = preset;
    } else {
      presets.unshift(preset);
    }
    localStorage.setItem(KEYS.TABATA, JSON.stringify(presets));
  }

  deleteTabataPreset(id) {
    let presets = this.getTabataPresets();
    presets = presets.filter(p => p.id !== id);
    localStorage.setItem(KEYS.TABATA, JSON.stringify(presets));
  }

  getRunnerPresets() {
    try {
      const data = localStorage.getItem(KEYS.RUNNER);
      return data ? JSON.parse(data) : DEFAULT_RUNNER_PRESETS;
    } catch (e) {
      return DEFAULT_RUNNER_PRESETS;
    }
  }

  getRunnerPresetById(id) {
    const list = this.getRunnerPresets();
    return list.find(p => p.id === id) || null;
  }

  saveRunnerPreset(preset) {
    const presets = this.getRunnerPresets();
    const index = presets.findIndex(p => p.id === preset.id);
    if (index >= 0) {
      presets[index] = preset;
    } else {
      presets.unshift(preset);
    }
    localStorage.setItem(KEYS.RUNNER, JSON.stringify(presets));
  }

  deleteRunnerPreset(id) {
    let presets = this.getRunnerPresets();
    presets = presets.filter(p => p.id !== id);
    localStorage.setItem(KEYS.RUNNER, JSON.stringify(presets));
  }

  getGymRoutines() {
    try {
      const data = localStorage.getItem(KEYS.GYM);
      return data ? JSON.parse(data) : DEFAULT_GYM_ROUTINES;
    } catch (e) {
      return DEFAULT_GYM_ROUTINES;
    }
  }

  getGymRoutineById(id) {
    const routines = this.getGymRoutines();
    return routines.find(r => r.id === id) || null;
  }

  saveGymRoutine(routine) {
    const routines = this.getGymRoutines();
    const index = routines.findIndex(r => r.id === routine.id);
    if (index >= 0) {
      routines[index] = routine;
    } else {
      routines.unshift(routine);
    }
    localStorage.setItem(KEYS.GYM, JSON.stringify(routines));
  }

  deleteGymRoutine(id) {
    let routines = this.getGymRoutines();
    routines = routines.filter(r => r.id !== id);
    localStorage.setItem(KEYS.GYM, JSON.stringify(routines));
  }

  getHistory() {
    try {
      const settings = this.getSettings();
      if (!settings.hasCompletedOnboarding) {
        return [];
      }
      const data = localStorage.getItem(KEYS.HISTORY);
      if (!data) return [];
      const list = JSON.parse(data);
      if (!Array.isArray(list)) return [];
      // Clean up legacy mock items if any exist
      const cleaned = list.filter(h => !['hist-1', 'hist-2', 'hist-3'].includes(h.id));
      if (cleaned.length !== list.length) {
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch (e) {
      return [];
    }
  }

  addHistoryEntry(entry) {
    const history = this.getHistory();
    const newEntry = {
      id: 'hist-' + Date.now(),
      date: new Date().toISOString(),
      ...entry
    };
    history.unshift(newEntry);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));

    const settings = this.getSettings();
    settings.athleteStreakDays = this.calculateStreak(history);
    this.saveSettings(settings);

    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'STORAGE_SAVE',
          key: KEYS.HISTORY,
          value: JSON.stringify(history)
        }));
      } catch (e) {}
    }

    return newEntry;
  }

  clearHistory() {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify([]));
    const settings = this.getSettings();
    settings.athleteStreakDays = 0;
    this.saveSettings(settings);
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'STORAGE_SAVE',
          key: KEYS.HISTORY,
          value: JSON.stringify([])
        }));
      } catch (e) {}
    }
  }

  resetAllData() {
    localStorage.clear();
    this.initDefaults();
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'STORAGE_CLEAR_ALL'
        }));
      } catch (e) {}
    }
  }
}

export const storage = new StorageService();

