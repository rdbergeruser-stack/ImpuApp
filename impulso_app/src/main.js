// Main Application Entry Point and Router

import './style.css';
import { storage } from './store/storage.js';
import { audio } from './audio/audioService.js';
import { setHapticsEnabled } from './utils/haptics.js';
import { setWakeLockEnabled } from './utils/wakeLock.js';

// Views
import { renderHomeHub } from './views/HomeHubView.js';
import { renderTabataConfig } from './views/TabataConfigView.js';
import { renderTabataLive } from './views/TabataLiveView.js';
import { renderRunnerCatalog } from './views/RunnerCatalogView.js';
import { renderRunnerEditor } from './views/RunnerEditorView.js';
import { renderRunnerLive } from './views/RunnerLiveView.js';
import { renderRoutinesHub } from './views/RoutinesHubView.js';
import { renderGymCatalog } from './views/GymCatalogView.js';
import { renderGymEditor } from './views/GymEditorView.js';
import { renderGymLiveTracker } from './views/GymLiveTrackerView.js';
import { renderSummary } from './views/SummaryView.js';
import { renderHistory } from './views/HistoryView.js';
import { renderProfile } from './views/ProfileView.js';
import { renderSettings } from './views/SettingsView.js';
import { renderOnboarding } from './views/OnboardingView.js';

class AppRouter {
  constructor() {
    this.appContainer = document.getElementById('app');
    this.currentRoute = 'home';
    this.currentParams = {};
    this.initSettings();
    this.initAudioUnlock();

    const settings = storage.getSettings();
    if (!settings.hasCompletedOnboarding) {
      this.navigate('onboarding');
    } else {
      this.navigate('home');
    }
  }

  initSettings() {
    const settings = storage.getSettings();
    storage.applyTheme(settings.theme);
    audio.setSoundEnabled(settings.soundEnabled);
    audio.setVoiceEnabled(settings.voiceEnabled);
    setHapticsEnabled(settings.hapticsEnabled);
    setWakeLockEnabled(settings.wakeLockEnabled);
  }

  initAudioUnlock() {
    const unlock = () => {
      audio.ensureContext();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  navigate(route, params = {}) {
    this.currentRoute = route;
    this.currentParams = params;
    window.scrollTo(0, 0);

    const nav = (r, p) => this.navigate(r, p);

    switch (route) {
      case 'home':
        renderHomeHub(this.appContainer, nav);
        break;
      case 'tabata-config':
        renderTabataConfig(this.appContainer, nav, params);
        break;
      case 'tabata-live':
        renderTabataLive(this.appContainer, nav, params);
        break;
      case 'runner-catalog':
        renderRunnerCatalog(this.appContainer, nav);
        break;
      case 'runner-editor':
        renderRunnerEditor(this.appContainer, nav, params);
        break;
      case 'runner-live':
        renderRunnerLive(this.appContainer, nav, params);
        break;
      case 'routines-hub':
        renderRoutinesHub(this.appContainer, nav, params);
        break;
      case 'gym-catalog':
        renderGymCatalog(this.appContainer, nav);
        break;
      case 'gym-editor':
        renderGymEditor(this.appContainer, nav, params);
        break;
      case 'gym-live':
        renderGymLiveTracker(this.appContainer, nav, params);
        break;
      case 'summary':
        renderSummary(this.appContainer, nav, params);
        break;
      case 'history':
        renderHistory(this.appContainer, nav);
        break;
      case 'profile':
        renderProfile(this.appContainer, nav);
        break;
      case 'settings':
        renderSettings(this.appContainer, nav, params);
        break;
      case 'colors':
        renderSettings(this.appContainer, nav, { subTab: 'colors' });
        break;
      case 'onboarding':
        renderOnboarding(this.appContainer, nav);
        break;
      default:
        renderHomeHub(this.appContainer, nav);
        break;
    }
  }
}

// Mount application
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppRouter();
});

// Fallback in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (!window.app) {
    window.app = new AppRouter();
  }
}

