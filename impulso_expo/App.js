import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform, LogBox, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_HTML } from './appHtml.js';

// Silenciar warnings de consola en la pantalla de Expo Go
LogBox.ignoreAllLogs(true);

export default function App() {
  // Mantener pantalla encendida durante el entrenamiento
  useKeepAwake();
  const webViewRef = useRef(null);
  const [injectedStorageScript, setInjectedStorageScript] = useState('');
  const [availableVoices, setAvailableVoices] = useState([]);

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
    async function loadNativeVoices() {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const spanish = voices.filter(v => 
          v.language && (v.language.toLowerCase().startsWith('es') || v.language.toLowerCase().startsWith('spa'))
        );
        setAvailableVoices(spanish.length > 0 ? spanish : voices);
      } catch (err) {
        console.warn('Error loading voices:', err);
      }
    }
    loadNativeVoices();
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

      // Si empieza el conteo en 'Tres', detenemos cualquier frase anterior (para que 'Tres' arranque sin retraso).
      // Para 'Dos' y 'Uno' NO llamamos stop() para mantener caliente el pipeline de audio en Android.
      if (text === 'Tres' || text === '3') {
        Speech.stop();
      } else if (!isCountdown) {
        Speech.stop();
      }

      // 1. Si se pasó un voiceId específico
      let matchedVoice = null;
      if (voiceId && availableVoices.length > 0) {
        matchedVoice = availableVoices.find(v => v.identifier === voiceId);
      }

      // 2. Selección fija de las dos voces elegidas por el usuario:
      // - Sofía: 1ra voz de la lista (Índice 0)
      // - Mateo: 6ta voz de la lista (Índice 5)
      if (!matchedVoice && availableVoices.length > 0) {
        const spanishVoices = availableVoices.filter(v => 
          v.language && (v.language.toLowerCase().startsWith('es') || v.language.toLowerCase().startsWith('spa'))
        );
        const listToSearch = spanishVoices.length > 0 ? spanishVoices : availableVoices;

        if (isSofia) {
          // 1ra voz (Sofía)
          matchedVoice = listToSearch[0];
        } else {
          // 6ta voz (Mateo)
          if (listToSearch.length >= 6) {
            matchedVoice = listToSearch[5];
          } else {
            matchedVoice = listToSearch.find(isMaleVoice) || listToSearch[listToSearch.length - 1];
          }
        }
      }

      // Calibración acústica: para conteos 3-2-1 forzamos velocidad 1.25 para sincronización milimétrica con el reloj
      const defaultPitch = 1.0;
      const defaultRate = isCountdown ? 1.25 : (isSofia ? 1.02 : 0.98);

      const pitch = typeof pitchOverride === 'number' ? pitchOverride : defaultPitch;
      const rate = isCountdown ? 1.25 : (typeof rateOverride === 'number' ? rateOverride : defaultRate);

      const speakOptions = {
        language: matchedVoice ? matchedVoice.language : 'es-ES',
        pitch: pitch,
        rate: rate,
        onError: (err) => {
          console.warn('Speech.speak standard error:', err);
          try {
            Speech.speak(text, { pitch, rate });
          } catch (e2) {}
        }
      };

      if (matchedVoice && matchedVoice.identifier) {
        speakOptions.voice = matchedVoice.identifier;
      }

      Speech.speak(text, speakOptions);
    } catch (e) {
      console.warn('speakNative exception:', e);
    }
  };

  const handleMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      // 1. NATIVE TTS SPEECH ENGINE
      if (data.type === 'SPEECH_SPEAK') {
        speakNative(data.text, data.gender, data.pitch, data.rate, data.voiceId);
      } else if (data.type === 'SPEECH_STOP') {
        Speech.stop();
      } else if (data.type === 'SPEECH_PREWARM') {
        try {
          Speech.speak(' ', { volume: 0, rate: 2.0 });
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

      // 4. CONSOLE ERRORS
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
            javaScriptEnabled={true}
            domStorageEnabled={true}
            injectedJavaScriptBeforeContentLoaded={injectedStorageScript}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onMessage={handleMessage}
            onLoadEnd={() => {
              if (availableVoices && availableVoices.length > 0 && webViewRef.current) {
                const list = availableVoices.map(v => ({
                  identifier: v.identifier,
                  name: v.name,
                  language: v.language,
                  quality: v.quality
                }));
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
