import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform, LogBox, Text, AppState } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_HTML } from './appHtml.js';

// Importación condicional segura de Health Connect (solo activa en builds nativos)
let HealthConnect = null;
try {
  HealthConnect = require('react-native-health-connect');
} catch (e) {
  console.log('HealthConnect native module not present (Expo Go mode)');
}

// Silenciar warnings de consola en la pantalla de Expo Go
LogBox.ignoreAllLogs(true);

export default function App() {
  // Mantener pantalla encendida durante el entrenamiento
  useKeepAwake();
  const webViewRef = useRef(null);
  const restTimerTimeoutRef = useRef(null);
  const restTargetTimeRef = useRef(null);
  const [injectedStorageScript, setInjectedStorageScript] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

  // Sincronización al volver de segundo plano
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active' && restTargetTimeRef.current) {
        if (Date.now() >= restTargetTimeRef.current) {
          // El tiempo venció mientras la app estaba minimizada
          webViewRef.current?.injectJavaScript(`
            try {
              window.dispatchEvent(new CustomEvent('nativeRestCompleted'));
            } catch(e) {}
          `);
          restTargetTimeRef.current = null;
        }
      }
    });
    return () => subscription.remove();
  }, []);

  // Clasificadores de género vocal para Android Google TTS, Samsung e iOS
  const isMaleVoice = (v) => {
    if (!v) return false;
    const name = (v.name || '').toLowerCase();
    const id = (v.identifier || '').toLowerCase();
    
    // Descartar si coincide con nombres o códigos conocidos de voces femeninas
    const isFemale = (
      name.includes('female') || name.includes('mujer') || name.includes('sofia') ||
      name.includes('sabina') || name.includes('helena') || name.includes('monica') ||
      name.includes('mónica') || name.includes('paulina') || name.includes('lucia') ||
      name.includes('lucía') || name.includes('victoria') || name.includes('francisca') ||
      id.includes('female') || id.includes('_f0') ||
      id.includes('-eea') || id.includes('-eef') || id.includes('-sfa') || id.includes('-sfb') ||
      id.includes('neural2-a') || id.includes('neural2-c') || id.includes('neural2-d') || id.includes('neural2-e') ||
      id.includes('wavenet-a') || id.includes('wavenet-c') || id.includes('journey-f') || id.includes('achernar')
    );
    if (isFemale) return false;

    // Detectar patrones masculinos conocidos
    return (
      name.includes('male') || id.includes('male') ||
      name.includes('hombre') || name.includes('varon') || name.includes('varón') ||
      name.includes('mateo') || id.includes('mateo') ||
      name.includes('jorge') || id.includes('jorge') ||
      name.includes('diego') || id.includes('diego') ||
      name.includes('carlos') || id.includes('carlos') ||
      name.includes('juan') || id.includes('juan') ||
      name.includes('pablo') || id.includes('pablo') ||
      name.includes('raul') || id.includes('raul') ||
      name.includes('enrique') || id.includes('enrique') ||
      name.includes('alvaro') || id.includes('alvaro') ||
      // Identificadores Google TTS en Android para voces masculinas:
      id.includes('eed') || // es-es-x-eed (Voz 2 España - Masculina)
      id.includes('eee') || // es-es-x-eee (Voz 3 España - Masculina)
      id.includes('sfc') || // es-us-x-sfc / es-mx-x-sfc (Voz 3 US/MX - Masculina)
      id.includes('sfd') || // es-us-x-sfd / es-mx-x-sfd (Voz 4 US/MX - Masculina)
      id.includes('_m0') || // Samsung TTS Masculina
      id.includes('neural2-b') || id.includes('neural2-f') ||
      id.includes('wavenet-b') || id.includes('wavenet-d') ||
      id.includes('journey-d') || id.includes('umbriel') ||
      id.includes('standard-b') || id.includes('standard-c')
    );
  };

  const isFemaleVoice = (v) => {
    if (!v) return false;
    if (isMaleVoice(v)) return false;
    const name = (v.name || '').toLowerCase();
    const id = (v.identifier || '').toLowerCase();

    return (
      name.includes('female') || id.includes('female') ||
      name.includes('mujer') || name.includes('sofia') ||
      name.includes('sabina') || name.includes('helena') ||
      name.includes('monica') || name.includes('mónica') ||
      name.includes('paulina') || name.includes('lucia') || name.includes('lucía') ||
      name.includes('victoria') || name.includes('francisca') ||
      id.includes('-eea') || id.includes('-eef') ||
      id.includes('-sfa') || id.includes('-sfb') ||
      id.includes('_f0') ||
      id.includes('neural2-a') || id.includes('neural2-c') ||
      id.includes('journey-f') || id.includes('achernar')
    );
  };

  // Cargar lista de voces nativas disponibles en el dispositivo
  useEffect(() => {
    let isMounted = true;
    async function loadNativeVoices() {
      try {
        // Inicializar el subsistema TextToSpeech de Android con un micro-speak inocuo
        try { Speech.speak('', { language: 'es' }); } catch (e) {}
        const voices = await Speech.getAvailableVoicesAsync();
        if (voices && voices.length > 0 && isMounted) {
          const spanish = voices.filter(v => 
            v.language && (v.language.toLowerCase().startsWith('es') || v.language.toLowerCase().startsWith('spa'))
          );
          setAvailableVoices(spanish.length > 0 ? spanish : voices);
        }
      } catch (err) {
        console.warn('Error loading voices:', err);
      }
    }
    loadNativeVoices();
    // Reintentar tras 1.5s por si el daemon TTS del sistema tardó en inicializarse
    const timer = setTimeout(loadNativeVoices, 1500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Inyectar catálogo de voces del dispositivo en cuanto se obtengan con indicación de género
  useEffect(() => {
    if (availableVoices && availableVoices.length > 0 && webViewRef.current) {
      try {
        const list = availableVoices.map(v => {
          const male = isMaleVoice(v);
          const female = !male && isFemaleVoice(v);
          return {
            identifier: v.identifier,
            name: v.name,
            language: v.language,
            quality: v.quality,
            gender: male ? 'male' : (female ? 'female' : 'unknown')
          };
        });
        const code = `
          try {
            window.__NATIVE_VOICES__ = ${JSON.stringify(list)};
            window.dispatchEvent(new CustomEvent('nativeVoicesLoaded', { detail: window.__NATIVE_VOICES__ }));
          } catch(e) {}
        `;
        webViewRef.current.injectJavaScript(code);
      } catch (e) {}
    }
  }, [availableVoices]);

  // Cargar datos previos de AsyncStorage para inyectarlos en localStorage de la WebView
  useEffect(() => {
    async function loadStorageBackup() {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const impulsoKeys = keys.filter(k => k.startsWith('impulso_') || k.startsWith('@tabata_'));
        if (impulsoKeys.length > 0) {
          const pairs = await AsyncStorage.multiGet(impulsoKeys);
          let script = '';
          pairs.forEach(([k, v]) => {
            if (v != null) {
              const safeKey = JSON.stringify(k);
              const safeVal = JSON.stringify(v);
              script += `try { if (!localStorage.getItem(${safeKey})) { localStorage.setItem(${safeKey}, ${safeVal}); } } catch(e){};\n`;
            }
          });
          setInjectedStorageScript(script);
        }
      } catch (err) {
        console.warn('Error loading storage backup:', err);
      }
    }
    loadStorageBackup();
  }, []);

  const speakNative = (text, gender = 'female', pitchOverride, rateOverride, voiceId) => {
    if (!text) return;
    try {
      const isSofia = (gender === 'female' || gender === 'sofia');
      const isCountdown = (text === 'Tres' || text === 'Dos' || text === 'Uno' || text === '3' || text === '2' || text === '1');

      // Solo si arranca el conteo 3-2-1 en 'Tres' cancelamos frases largas previas para evitar retraso.
      // IMPORTANTE: Para frases normales NUNCA llamamos Speech.stop() antes de speak() porque en Android
      // TextToSpeech vacía la cola y descarta asíncronamente el speak inmediato.
      if (text === 'Tres' || text === '3') {
        try { Speech.stop(); } catch (e) {}
      }

      // 1. Si se pasó un voiceId específico
      let matchedVoice = null;
      if (voiceId && availableVoices.length > 0) {
        matchedVoice = availableVoices.find(v => v.identifier === voiceId);
      }

      // 2. Si no hay voiceId, buscar voz según género en el catálogo disponible
      if (!matchedVoice && availableVoices.length > 0) {
        const spanishVoices = availableVoices.filter(v => 
          v.language && (v.language.toLowerCase().startsWith('es') || v.language.toLowerCase().startsWith('spa'))
        );
        const listToSearch = spanishVoices.length > 0 ? spanishVoices : availableVoices;

        if (isSofia) {
          matchedVoice = listToSearch.find(isFemaleVoice) || listToSearch[0];
        } else {
          matchedVoice = listToSearch.find(isMaleVoice) || (listToSearch.length >= 6 ? listToSearch[5] : listToSearch[listToSearch.length - 1]);
        }
      }

      // 3. Calibración acústica nítida:
      // Sofía: 1.15 (tono femenino enérgico, claro) y velocidad 1.02
      // Mateo: 0.80 (tono masculino grave, firme) y velocidad 0.96
      // Conteos 3-2-1: velocidad 1.25 para sincronía exacta con el segundero
      const defaultPitch = isSofia ? 1.15 : 0.80;
      const defaultRate = isCountdown ? 1.25 : (isSofia ? 1.02 : 0.96);

      const pitch = typeof pitchOverride === 'number' ? pitchOverride : defaultPitch;
      const rate = isCountdown ? 1.25 : (typeof rateOverride === 'number' ? rateOverride : defaultRate);

      const speakOptions = {
        language: 'es', // Usar código estándar 'es' para garantizar compatibilidad con cualquier variante regional (es-AR, es-US, es-ES)
        pitch: pitch,
        rate: rate,
        volume: 1.0,
        onError: (err) => {
          console.warn('Speech.speak standard error, attempting fallback:', err);
          try {
            Speech.speak(text, { language: 'es', pitch, rate, volume: 1.0 });
          } catch (e2) {}
        }
      };

      // Asignar identificador de voz ÚNICAMENTE si no depende de streaming en la nube ('network')
      // para asegurar reproducción instantánea y offline en la APK standalone
      if (matchedVoice && matchedVoice.identifier && !matchedVoice.identifier.toLowerCase().includes('network')) {
        speakOptions.voice = matchedVoice.identifier;
      }

      Speech.speak(text, speakOptions);
    } catch (e) {
      console.warn('speakNative exception:', e);
      try {
        Speech.speak(text, { language: 'es', volume: 1.0 });
      } catch (e2) {}
    }
  };

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // 1. NATIVE TTS SPEECH ENGINE
      if (data.type === 'SPEECH_SPEAK') {
        speakNative(data.text, data.gender, data.pitch, data.rate, data.voiceId);
      } else if (data.type === 'SPEECH_STOP') {
        try { Speech.stop(); } catch (e) {}
      } else if (data.type === 'SPEECH_PREWARM') {
        try {
          Speech.speak(' ', { language: 'es', volume: 0, rate: 2.0 });
        } catch (e) {}
      }

      // 2. NATIVE PERSISTENCE BRIDGE (ASYNC-STORAGE)
      else if (data.type === 'STORAGE_SAVE') {
        if (data.key && data.value) {
          AsyncStorage.setItem(data.key, data.value).catch(err => {
            console.warn('AsyncStorage setItem error:', err);
          });
        }
      } else if (data.type === 'STORAGE_REMOVE') {
        if (data.key) {
          AsyncStorage.removeItem(data.key).catch(err => {
            console.warn('AsyncStorage removeItem error:', err);
          });
        }
      }

      // 3. NATIVE HAPTICS
      else if (data.type === 'HAPTIC_TAP') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (data.type === 'HAPTIC_COUNTDOWN') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (data.type === 'HAPTIC_PHASE') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // 4. NATIVE BACKGROUND REST TIMER & ALERT
      else if (data.type === 'REST_TIMER_START') {
        try {
          if (restTimerTimeoutRef.current) {
            clearTimeout(restTimerTimeoutRef.current);
            restTimerTimeoutRef.current = null;
          }
          const secs = Math.max(1, Math.round(data.seconds));
          restTargetTimeRef.current = Date.now() + (secs * 1000);

          restTimerTimeoutRef.current = setTimeout(() => {
            // El motor TTS del sistema Android habla a través del altavoz incluso si la app está minimizada
            speakNative('¡Descanso terminado! Siguiente serie.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            webViewRef.current?.injectJavaScript(`
              try {
                window.dispatchEvent(new CustomEvent('nativeRestCompleted'));
              } catch(e) {}
            `);
            restTargetTimeRef.current = null;
            restTimerTimeoutRef.current = null;
          }, secs * 1000);
        } catch (err) {}
      } else if (data.type === 'REST_TIMER_CANCEL') {
        try {
          if (restTimerTimeoutRef.current) {
            clearTimeout(restTimerTimeoutRef.current);
            restTimerTimeoutRef.current = null;
          }
          restTargetTimeRef.current = null;
        } catch (err) {}
      }

      // 5. HEALTH CONNECT / XIAOMI SMART BAND INTEGRATION
      else if (data.type === 'HEALTH_CONNECT_INIT_OR_CHECK') {
        (async () => {
          try {
            if (!HealthConnect) {
              webViewRef.current?.injectJavaScript(`
                window.dispatchEvent(new CustomEvent('healthConnectStatus', {
                  detail: { available: false, reason: 'NATIVE_MODULE_NOT_LOADED' }
                }));
              `);
              return;
            }

            const isAvailable = await HealthConnect.isAvailable();
            if (!isAvailable) {
              webViewRef.current?.injectJavaScript(`
                window.dispatchEvent(new CustomEvent('healthConnectStatus', {
                  detail: { available: false, reason: 'HEALTH_CONNECT_NOT_INSTALLED' }
                }));
              `);
              return;
            }

            const initialized = await HealthConnect.initialize();
            webViewRef.current?.injectJavaScript(`
              window.dispatchEvent(new CustomEvent('healthConnectStatus', {
                detail: { available: true, initialized: ${!!initialized} }
              }));
            `);
          } catch (err) {
            console.warn('HealthConnect init check error:', err);
          }
        })();
      }

      else if (data.type === 'HEALTH_CONNECT_REQUEST_PERMISSIONS') {
        (async () => {
          try {
            if (!HealthConnect) return;
            await HealthConnect.initialize();
            const granted = await HealthConnect.requestPermission([
              { accessType: 'read', recordType: 'Steps' },
              { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
              { accessType: 'read', recordType: 'TotalCaloriesBurned' },
              { accessType: 'read', recordType: 'HeartRate' },
              { accessType: 'read', recordType: 'ExerciseSession' }
            ]);

            webViewRef.current?.injectJavaScript(`
              window.dispatchEvent(new CustomEvent('healthConnectPermissionsResponse', {
                detail: { success: true, granted: ${JSON.stringify(granted)} }
              }));
            `);
          } catch (err) {
            console.warn('HealthConnect request permission error:', err);
            // Intentar abrir configuración directa de Health Connect si falla el popup nativo
            try {
              if (HealthConnect.openHealthConnectSettings) {
                HealthConnect.openHealthConnectSettings();
              }
            } catch (e2) {}

            webViewRef.current?.injectJavaScript(`
              window.dispatchEvent(new CustomEvent('healthConnectPermissionsResponse', {
                detail: { success: false, error: ${JSON.stringify(err.message || String(err))} }
              }));
            `);
          }
        })();
      }

      else if (data.type === 'HEALTH_CONNECT_OPEN_SETTINGS') {
        try {
          if (HealthConnect && HealthConnect.openHealthConnectSettings) {
            HealthConnect.openHealthConnectSettings();
          }
        } catch (e) {
          console.warn('Error opening Health Connect settings:', e);
        }
      }

      else if (data.type === 'HEALTH_CONNECT_GET_TODAY_STATS') {
        (async () => {
          try {
            if (!HealthConnect) return;
            await HealthConnect.initialize();

            // Si aún no tenemos permisos, solicitarlos automáticamente
            try {
              const currentGranted = await HealthConnect.getGrantedPermissions();
              if (!currentGranted || currentGranted.length === 0) {
                await HealthConnect.requestPermission([
                  { accessType: 'read', recordType: 'Steps' },
                  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
                  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
                  { accessType: 'read', recordType: 'HeartRate' }
                ]);
              }
            } catch (permErr) {
              console.log('Permission check notice:', permErr);
            }

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
            const endOfDay = now.toISOString();

            // Helpers locales para priorización y desduplicación de fuentes
            const getSourcePriority = (dataOrigin) => {
              const o = (dataOrigin || '').toLowerCase();
              // 1. Xiaomi / Mi Fitness (Smart Band 9 Active, Mi Band, etc.)
              if (o.includes('mi.health') || o.includes('xiaomi') || o.includes('wearable') || o.includes('zepp')) return 100;
              // 2. Otras bandas y smartwatches reconocidos
              if (o.includes('shealth') || o.includes('samsung') || o.includes('garmin') || o.includes('fitbit') || o.includes('polar') || o.includes('whoop') || o.includes('huawei')) return 80;
              // 3. Google Fit
              if (o.includes('fitness') || o.includes('google')) return 50;
              // 4. Sensor del teléfono / Health Connect Phone (mínima prioridad, solo fallback si la pulsera no sincronizó aún)
              if (o.includes('phone') || o.includes('healthconnect') || o.includes('android')) return 5;
              // 5. Otros
              return 10;
            };

            const selectBestRecords = (records) => {
              if (!records || !Array.isArray(records) || records.length === 0) return { sourceApp: null, records: [] };
              const byOrigin = {};
              records.forEach(r => {
                const origin = (r.metadata && r.metadata.dataOrigin) || 'unknown';
                if (!byOrigin[origin]) byOrigin[origin] = [];
                byOrigin[origin].push(r);
              });
              const originKeys = Object.keys(byOrigin);
              if (originKeys.length === 1) {
                return { sourceApp: originKeys[0], records: byOrigin[originKeys[0]] };
              }
              originKeys.sort((a, b) => {
                const prioDiff = getSourcePriority(b) - getSourcePriority(a);
                if (prioDiff !== 0) return prioDiff;
                return byOrigin[b].length - byOrigin[a].length;
              });
              const bestOrigin = originKeys[0];
              return { sourceApp: bestOrigin, records: byOrigin[bestOrigin] };
            };

            const formatFriendlySourceName = (sourceApp) => {
              if (!sourceApp) return 'Health Connect';
              const s = sourceApp.toLowerCase();
              if (s.includes('mi.health') || s.includes('xiaomi') || s.includes('wearable')) return 'Mi Fitness (Xiaomi)';
              if (s.includes('zepp')) return 'Zepp Life';
              if (s.includes('shealth') || s.includes('samsung')) return 'Samsung Health';
              if (s.includes('fitbit')) return 'Fitbit';
              if (s.includes('garmin')) return 'Garmin';
              if (s.includes('fitness') || s.includes('google')) return 'Google Fit';
              if (s.includes('healthconnect') || s.includes('phone') || s.includes('android')) return 'Sensor del Teléfono';
              return 'Health Connect';
            };

            // 1. Leer pasos de hoy desduplicando la fuente para no sumar el podómetro del móvil y la pulsera
            let steps = 0;
            let primarySource = null;
            try {
              const stepsRes = await HealthConnect.readRecords('Steps', {
                timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: endOfDay }
              });
              if (stepsRes && stepsRes.records && stepsRes.records.length > 0) {
                const { sourceApp, records: filteredSteps } = selectBestRecords(stepsRes.records);
                primarySource = sourceApp;
                steps = filteredSteps.reduce((acc, r) => acc + (Number(r.count) || 0), 0);
              }
            } catch (e) {
              console.log('Error reading steps:', e);
            }

            // 2. Leer calorías de hoy (Active o Total) con desduplicación
            let calories = 0;
            try {
              const calRes = await HealthConnect.readRecords('ActiveCaloriesBurned', {
                timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: endOfDay }
              });
              const { sourceApp: calSource, records: activeRecords } = selectBestRecords(calRes?.records);
              if (activeRecords.length > 0) {
                calories = Math.round(activeRecords.reduce((acc, r) => acc + ((r.energy && r.energy.inKilocalories) || 0), 0));
                if (!primarySource && calSource) primarySource = calSource;
              } else {
                // Probar con TotalCaloriesBurned
                const totRes = await HealthConnect.readRecords('TotalCaloriesBurned', {
                  timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: endOfDay }
                });
                const { sourceApp: totSource, records: totalRecords } = selectBestRecords(totRes?.records);
                if (totalRecords.length > 0) {
                  calories = Math.round(totalRecords.reduce((acc, r) => acc + ((r.energy && r.energy.inKilocalories) || 0), 0));
                  if (!primarySource && totSource) primarySource = totSource;
                }
              }
            } catch (e) {
              console.log('Error reading calories:', e);
            }

            // 3. Leer último pulso o promedio de hoy
            let latestBpm = null;
            let avgBpm = null;
            try {
              const hrRes = await HealthConnect.readRecords('HeartRate', {
                timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: endOfDay }
              });
              const { sourceApp: hrSource, records: hrRecords } = selectBestRecords(hrRes?.records);
              if (hrRecords.length > 0) {
                if (!primarySource && hrSource) primarySource = hrSource;
                let totalSamples = 0;
                let sumBpm = 0;
                hrRecords.forEach(r => {
                  if (r.samples && r.samples.length > 0) {
                    r.samples.forEach(s => {
                      if (s.beatsPerMinute) {
                        sumBpm += s.beatsPerMinute;
                        totalSamples++;
                        latestBpm = s.beatsPerMinute;
                      }
                    });
                  }
                });
                if (totalSamples > 0) {
                  avgBpm = Math.round(sumBpm / totalSamples);
                }
              }
            } catch (e) {
              console.log('Error reading HR:', e);
            }

            const friendlySource = formatFriendlySourceName(primarySource);

            webViewRef.current?.injectJavaScript(`
              window.dispatchEvent(new CustomEvent('healthConnectTodayStats', {
                detail: {
                  steps: ${steps},
                  calories: ${calories},
                  latestBpm: ${latestBpm || 'null'},
                  avgBpm: ${avgBpm || 'null'},
                  sourceApp: ${JSON.stringify(friendlySource)},
                  updatedAt: ${Date.now()}
                }
              }));
            `);
          } catch (err) {
            console.warn('HealthConnect get today stats error:', err);
          }
        })();
      }

      else if (data.type === 'HEALTH_CONNECT_GET_SESSION_TELEMETRY') {
        (async () => {
          try {
            if (!HealthConnect) return;
            const startTime = data.startTime ? new Date(data.startTime).toISOString() : new Date(Date.now() - 3600000).toISOString();
            const endTime = data.endTime ? new Date(data.endTime).toISOString() : new Date().toISOString();

            let avgBpm = null;
            let maxBpm = null;
            let samples = [];
            let calories = 0;

            const getSourcePriority = (dataOrigin) => {
              const o = (dataOrigin || '').toLowerCase();
              if (o.includes('mi.health') || o.includes('xiaomi') || o.includes('wearable') || o.includes('zepp')) return 100;
              if (o.includes('shealth') || o.includes('samsung') || o.includes('garmin') || o.includes('fitbit') || o.includes('polar') || o.includes('whoop') || o.includes('huawei')) return 80;
              if (o.includes('fitness') || o.includes('google')) return 50;
              return 10;
            };

            const selectBestRecords = (records) => {
              if (!records || !Array.isArray(records) || records.length === 0) return [];
              const byOrigin = {};
              records.forEach(r => {
                const origin = (r.metadata && r.metadata.dataOrigin) || 'unknown';
                if (!byOrigin[origin]) byOrigin[origin] = [];
                byOrigin[origin].push(r);
              });
              const originKeys = Object.keys(byOrigin);
              if (originKeys.length === 1) return byOrigin[originKeys[0]];
              originKeys.sort((a, b) => (getSourcePriority(b) - getSourcePriority(a)) || (byOrigin[b].length - byOrigin[a].length));
              return byOrigin[originKeys[0]];
            };

            // Leer ritmo cardíaco de la sesión con desduplicación
            try {
              const hrRes = await HealthConnect.readRecords('HeartRate', {
                timeRangeFilter: { operator: 'between', startTime, endTime }
              });
              const hrRecords = selectBestRecords(hrRes?.records);
              if (hrRecords.length > 0) {
                let sum = 0;
                let count = 0;
                hrRecords.forEach(rec => {
                  if (rec.samples) {
                    rec.samples.forEach(s => {
                      if (s.beatsPerMinute) {
                        const bpm = s.beatsPerMinute;
                        sum += bpm;
                        count++;
                        if (maxBpm === null || bpm > maxBpm) maxBpm = bpm;
                        samples.push({ bpm, time: s.time });
                      }
                    });
                  }
                });
                if (count > 0) {
                  avgBpm = Math.round(sum / count);
                }
              }
            } catch (e) {
              console.log('Error reading session HR:', e);
            }

            // Leer calorías reales de la sesión con desduplicación
            try {
              const calRes = await HealthConnect.readRecords('ActiveCaloriesBurned', {
                timeRangeFilter: { operator: 'between', startTime, endTime }
              });
              const calRecords = selectBestRecords(calRes?.records);
              if (calRecords.length > 0) {
                calories = Math.round(calRecords.reduce((acc, r) => acc + ((r.energy && r.energy.inKilocalories) || 0), 0));
              }
            } catch (e) {}

            webViewRef.current?.injectJavaScript(`
              window.dispatchEvent(new CustomEvent('healthConnectSessionTelemetryResponse', {
                detail: {
                  sessionId: ${JSON.stringify(data.sessionId || '')},
                  avgBpm: ${avgBpm || 'null'},
                  maxBpm: ${maxBpm || 'null'},
                  calories: ${calories || 0},
                  samplesCount: ${samples.length}
                }
              }));
            `);
          } catch (err) {
            console.warn('HealthConnect get session telemetry error:', err);
          }
        })();
      }

      // 6. CONSOLE ERRORS
      else if (data.type === 'LOG_ERROR') {
        console.warn('WebApp Error:', data.message);
      }
    } catch (e) {
      // Ignorar errores de parseo
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#041108" translucent={false} />
        
        <View style={styles.content}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: APP_HTML, baseUrl: 'https://impulso.app' }}
            style={styles.webview}
            androidHardwareAccelerationDisabled={false}
            renderToHardwareTextureAndroid={true}
            cacheEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            injectedJavaScriptBeforeContentLoaded={injectedStorageScript}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onMessage={handleMessage}
            onLoadEnd={() => {
              if (availableVoices && availableVoices.length > 0 && webViewRef.current) {
                const list = availableVoices.map(v => {
                  const male = isMaleVoice(v);
                  const female = !male && isFemaleVoice(v);
                  return {
                    identifier: v.identifier,
                    name: v.name,
                    language: v.language,
                    quality: v.quality,
                    gender: male ? 'male' : (female ? 'female' : 'unknown')
                  };
                });
                const code = `
                  try {
                    window.__NATIVE_VOICES__ = ${JSON.stringify(list)};
                    window.dispatchEvent(new CustomEvent('nativeVoicesLoaded', { detail: window.__NATIVE_VOICES__ }));
                  } catch(e) {}
                `;
                webViewRef.current.injectJavaScript(code);
              }
            }}
            scalesPageToFit={false}
            overScrollMode="never"
            bounces={false}
            renderError={(errorName) => (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Cargando IMPULSO+ ({errorName})...</Text>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041108',
  },
  content: {
    flex: 1,
    backgroundColor: '#041108',
  },
  webview: {
    flex: 1,
    backgroundColor: '#041108',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#041108',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#00ff66',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
