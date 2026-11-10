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
    this._cache = {
      settings: null,
      tabata: null,
      runner: null,
      gym: null,
      history: null
    };
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
    if (this._cache.settings) {
      return this._cache.settings;
    }
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (!data) {
        this._cache.settings = { ...DEFAULT_SETTINGS };
        return this._cache.settings;
      }
      const parsed = JSON.parse(data);
      // Clean up legacy hardcoded developer values
      if (parsed.athleteName === 'Rodrigo Berger') {
        parsed.athleteName = '';
        parsed.hasCompletedOnboarding = false;
        parsed.athleteStreakDays = 0;
        this.saveSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      const settings = { ...DEFAULT_SETTINGS, ...parsed };
      // Calculate streak from raw history directly - avoids recursion
      settings.athleteStreakDays = this.calculateStreak(this.getRawHistory());
      this._cache.settings = settings;
      return settings;
    } catch (e) {
      this._cache.settings = { ...DEFAULT_SETTINGS };
      return this._cache.settings;
    }
  }

  calculateStreak(history) {
    if (!Array.isArray(history) || history.length === 0) return 0;

    const uniqueDays = new Set();
    for (let i = 0; i < history.length; i++) {
      const item = history[i];
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
    }

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
    this._cache.settings = { ...settings };
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
    if (this._cache.tabata) return this._cache.tabata;
    try {
      const data = localStorage.getItem(KEYS.TABATA);
      this._cache.tabata = data ? JSON.parse(data) : DEFAULT_TABATA_PRESETS;
    } catch (e) {
      this._cache.tabata = DEFAULT_TABATA_PRESETS;
    }
    return this._cache.tabata;
  }

  getTabataPresetById(id) {
    const list = this.getTabataPresets();
    return list.find(p => p.id === id) || null;
  }

  saveTabataPreset(preset) {
    const presets = [...this.getTabataPresets()];
    const index = presets.findIndex(p => p.id === preset.id);
    if (index >= 0) {
      presets[index] = preset;
    } else {
      presets.unshift(preset);
    }
    this._cache.tabata = presets;
    localStorage.setItem(KEYS.TABATA, JSON.stringify(presets));
  }

  deleteTabataPreset(id) {
    const presets = this.getTabataPresets().filter(p => p.id !== id);
    this._cache.tabata = presets;
    localStorage.setItem(KEYS.TABATA, JSON.stringify(presets));
  }

  getRunnerPresets() {
    if (this._cache.runner) return this._cache.runner;
    try {
      const data = localStorage.getItem(KEYS.RUNNER);
      this._cache.runner = data ? JSON.parse(data) : DEFAULT_RUNNER_PRESETS;
    } catch (e) {
      this._cache.runner = DEFAULT_RUNNER_PRESETS;
    }
    return this._cache.runner;
  }

  getRunnerPresetById(id) {
    const list = this.getRunnerPresets();
    return list.find(p => p.id === id) || null;
  }

  saveRunnerPreset(preset) {
    const presets = [...this.getRunnerPresets()];
    const index = presets.findIndex(p => p.id === preset.id);
    if (index >= 0) {
      presets[index] = preset;
    } else {
      presets.unshift(preset);
    }
    this._cache.runner = presets;
    localStorage.setItem(KEYS.RUNNER, JSON.stringify(presets));
  }

  deleteRunnerPreset(id) {
    const presets = this.getRunnerPresets().filter(p => p.id !== id);
    this._cache.runner = presets;
    localStorage.setItem(KEYS.RUNNER, JSON.stringify(presets));
  }

  getGymRoutines() {
    if (this._cache.gym) return this._cache.gym;
    try {
      const data = localStorage.getItem(KEYS.GYM);
      this._cache.gym = data ? JSON.parse(data) : DEFAULT_GYM_ROUTINES;
    } catch (e) {
      this._cache.gym = DEFAULT_GYM_ROUTINES;
    }
    return this._cache.gym;
  }

  getGymRoutineById(id) {
    const routines = this.getGymRoutines();
    return routines.find(r => r.id === id) || null;
  }

  saveGymRoutine(routine) {
    const routines = [...this.getGymRoutines()];
    const index = routines.findIndex(r => r.id === routine.id);
    if (index >= 0) {
      routines[index] = routine;
    } else {
      routines.unshift(routine);
    }
    this._cache.gym = routines;
    localStorage.setItem(KEYS.GYM, JSON.stringify(routines));
  }

  deleteGymRoutine(id) {
    const routines = this.getGymRoutines().filter(r => r.id !== id);
    this._cache.gym = routines;
    localStorage.setItem(KEYS.GYM, JSON.stringify(routines));
  }

  getRawHistory() {
    if (this._cache.history) return this._cache.history;
    try {
      const data = localStorage.getItem(KEYS.HISTORY);
      if (!data) {
        this._cache.history = [];
        return [];
      }
      const list = JSON.parse(data);
      if (!Array.isArray(list)) {
        this._cache.history = [];
        return [];
      }
      const cleaned = list.filter(h => !['hist-1', 'hist-2', 'hist-3'].includes(h.id));
      if (cleaned.length !== list.length) {
        localStorage.setItem(KEYS.HISTORY, JSON.stringify(cleaned));
      }
      this._cache.history = cleaned;
      return cleaned;
    } catch (e) {
      this._cache.history = [];
      return [];
    }
  }

  getHistory() {
    const settings = this.getSettings();
    if (!settings.hasCompletedOnboarding) {
      return [];
    }
    return this.getRawHistory();
  }

  addHistoryEntry(entry) {
    const history = [...this.getRawHistory()];
    const newEntry = {
      id: 'hist-' + Date.now(),
      date: new Date().toISOString(),
      ...entry
    };
    history.unshift(newEntry);
    this._cache.history = history;
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
    this._cache.history = [];
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
    this._cache = {
      settings: null,
      tabata: null,
      runner: null,
      gym: null,
      history: null
    };
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

