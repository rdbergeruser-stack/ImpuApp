// Default datasets for Tabata, Runner, Gym, Athlete Profile, and Settings

export const DEFAULT_TABATA_PRESETS = [
  {
    id: 'tabata-classic',
    title: 'Tabata Clásico 20/10',
    description: 'Intervalos clásicos de alta intensidad Dr. Izumi Tabata',
    prep: 10,
    work: 20,
    rest: 10,
    cycles: 8,
    sets: 1,
    restBetweenSets: 60,
    cooldown: 30,
    workName: 'Jumping Jacks / Burpees',
    restName: 'Caminar / Hidratación'
  },
  {
    id: 'tabata-hiit-pro',
    title: 'HIIT Intenso 30/15',
    description: 'Mayor duración de trabajo para máxima demanda cardiovascular',
    prep: 10,
    work: 30,
    rest: 15,
    cycles: 6,
    sets: 2,
    restBetweenSets: 90,
    cooldown: 45,
    workName: 'Mountain Climbers / Sentadillas con Salto',
    restName: 'Respiración activa'
  },
  {
    id: 'tabata-cardio-burn',
    title: 'Cardio Burn 40/20',
    description: 'Quema calórica acelerada con descansos breves',
    prep: 15,
    work: 40,
    rest: 20,
    cycles: 5,
    sets: 2,
    restBetweenSets: 90,
    cooldown: 60,
    workName: 'Skipping alto / Burpees',
    restName: 'Caminar suave'
  },
  {
    id: 'tabata-abs-core',
    title: 'Core & Abs Explosivo',
    description: 'Enfoque total en zona media y estabilidad',
    prep: 10,
    work: 25,
    rest: 10,
    cycles: 8,
    sets: 1,
    restBetweenSets: 60,
    cooldown: 30,
    workName: 'Plancha dinámica / Hollow hold',
    restName: 'Estiramiento suave'
  }
];

export const DEFAULT_RUNNER_PRESETS = [
  {
    id: 'runner-cuestas',
    title: 'Progresiones Cuestas',
    description: 'Potencia muscular y zancada explosiva en pendientes',
    totalDistanceEst: '4.5 km',
    intervals: [
      { name: 'Calentamiento', duration: 180, zone: 'Z1', bpm: '120-135', cue: 'Trote suave y progresivo' },
      { name: 'Subida Fuerte', duration: 45, zone: 'Z4', bpm: '165-175', cue: 'Pasos cortos, tronco erguido y cadencia alta' },
      { name: 'Bajada Suave', duration: 75, zone: 'Z1', bpm: '125-135', cue: 'Trote regenerativo de bajada' },
      { name: 'Subida Fuerte', duration: 45, zone: 'Z4', bpm: '165-175', cue: 'Impulsa con los tobillos y braceo enérgico' },
      { name: 'Bajada Suave', duration: 75, zone: 'Z1', bpm: '125-135', cue: 'Respira hondo y relaja hombros' },
      { name: 'Subida Fuerte', duration: 45, zone: 'Z4', bpm: '165-175', cue: 'Máxima potencia sin perder la postura' },
      { name: 'Bajada Suave', duration: 75, zone: 'Z1', bpm: '125-135', cue: 'Recupera pulsaciones' },
      { name: 'Sprint Final Cuesta', duration: 30, zone: 'Z5', bpm: '175-185', cue: '¡Todo lo que te queda hasta la cima!' },
      { name: 'Enfriamiento', duration: 180, zone: 'Z1', bpm: '115-125', cue: 'Caminar y trote de vuelta a la calma' }
    ]
  },
  {
    id: 'runner-sprints-400',
    title: 'Series de Velocidad (Sprints)',
    description: 'Desarrollo de VO2 Máx y velocidad punta',
    totalDistanceEst: '5.0 km',
    intervals: [
      { name: 'Calentamiento Dinámico', duration: 240, zone: 'Z1', bpm: '120-130', cue: 'Trote con movilidad articular' },
      { name: 'Sprint 90%', duration: 60, zone: 'Z5', bpm: '175-188', cue: 'Aceleración continua y zancada amplia' },
      { name: 'Recuperación Activa', duration: 90, zone: 'Z1', bpm: '125-135', cue: 'Camina o trota muy lento' },
      { name: 'Sprint 90%', duration: 60, zone: 'Z5', bpm: '175-188', cue: 'Fija la mirada al frente, relaja mandíbula' },
      { name: 'Recuperación Activa', duration: 90, zone: 'Z1', bpm: '125-135', cue: 'Oxigena con exhalaciones profundas' },
      { name: 'Sprint 95%', duration: 60, zone: 'Z5', bpm: '180-190', cue: '¡Ritmo de competición!' },
      { name: 'Recuperación Activa', duration: 90, zone: 'Z1', bpm: '125-135', cue: 'Respira y camina' },
      { name: 'Sprint Máximo', duration: 45, zone: 'Z5', bpm: '185-195', cue: '¡Último esfuerzo al 100%!' },
      { name: 'Vuelta a la Calma', duration: 180, zone: 'Z1', bpm: '110-120', cue: 'Caminar relajando piernas' }
    ]
  },
  {
    id: 'runner-fartlek',
    title: 'Fartlek Clásico (Juego de Ritmos)',
    description: 'Cambios de ritmo continuos sin paradas totales',
    totalDistanceEst: '6.0 km',
    intervals: [
      { name: 'Trote Base', duration: 240, zone: 'Z2', bpm: '135-145', cue: 'Ritmo conversacional suave' },
      { name: 'Cambio de Ritmo Rápido', duration: 90, zone: 'Z4', bpm: '165-175', cue: 'Aumenta cadencia sostenida' },
      { name: 'Trote Crucero', duration: 120, zone: 'Z2', bpm: '138-148', cue: 'Mantén el trote sin parar' },
      { name: 'Aceleración Fuerte', duration: 60, zone: 'Z4', bpm: '170-180', cue: 'Braceo constante y zancada firme' },
      { name: 'Trote Crucero', duration: 120, zone: 'Z2', bpm: '138-148', cue: 'Recupera el pulso corriendo' },
      { name: 'Sprint Fartlek', duration: 45, zone: 'Z5', bpm: '175-185', cue: 'Cambio de marcha agresivo' },
      { name: 'Enfriamiento', duration: 180, zone: 'Z1', bpm: '120-130', cue: 'Caminar y trote suave' }
    ]
  }
];

export const DEFAULT_GYM_ROUTINES = [
  {
    id: 'gym-torso',
    title: 'Torso: Pecho y Espalda',
    category: 'HIPERTROFIA',
    days: 'LUN / JUE',
    description: 'Enfoque en masa muscular y fuerza en tren superior',
    exercises: [
      {
        id: 'e1',
        name: 'Press de Banca Plano con Barra',
        targetSets: 4,
        targetReps: '8-10',
        defaultWeight: 70,
        restSeconds: 90,
        muscle: 'Pecho / Pectoral Mayor',
        notes: 'Retracción escapular y pies firmes contra el suelo'
      },
      {
        id: 'e2',
        name: 'Remo con Barra Inclinado (Pendlay)',
        targetSets: 4,
        targetReps: '10-12',
        defaultWeight: 60,
        restSeconds: 90,
        muscle: 'Espalda / Dorsal Ancho',
        notes: 'Espalda recta, llevar la barra hacia la cadera'
      },
      {
        id: 'e3',
        name: 'Press Inclinado con Mancuernas',
        targetSets: 3,
        targetReps: '10-12',
        defaultWeight: 26,
        restSeconds: 75,
        muscle: 'Pectoral Superior',
        notes: 'Banco a 30 grados, control del descenso'
      },
      {
        id: 'e4',
        name: 'Jalón al Pecho en Polea Alta',
        targetSets: 3,
        targetReps: '10-12',
        defaultWeight: 55,
        restSeconds: 60,
        muscle: 'Espalda / Dorsales',
        notes: 'Codos apuntando hacia abajo, contracción de 1 segundo'
      },
      {
        id: 'e5',
        name: 'Cruces en Polea Media (Aperturas)',
        targetSets: 3,
        targetReps: '12-15',
        defaultWeight: 15,
        restSeconds: 60,
        muscle: 'Pectoral / Aislamiento',
        notes: 'Ligera flexión de codos, sentir el estiramiento'
      }
    ]
  },
  {
    id: 'gym-piernas',
    title: 'Pierna y Glúteos',
    category: 'FUERZA',
    days: 'MAR / VIE',
    description: 'Máxima potencia y desarrollo completo de tren inferior',
    exercises: [
      {
        id: 'e6',
        name: 'Sentadilla Trasera con Barra',
        targetSets: 4,
        targetReps: '6-8',
        defaultWeight: 90,
        restSeconds: 120,
        muscle: 'Cuádriceps / Glúteos',
        notes: 'Romper el paralelo con rodillas alineadas a las puntas'
      },
      {
        id: 'e7',
        name: 'Prensa de Piernas 45°',
        targetSets: 4,
        targetReps: '10-12',
        defaultWeight: 140,
        restSeconds: 90,
        muscle: 'Cuádriceps',
        notes: 'Descenso profundo sin despegar la zona lumbar'
      },
      {
        id: 'e8',
        name: 'Peso Muerto Rumano con Barra',
        targetSets: 3,
        targetReps: '10-12',
        defaultWeight: 75,
        restSeconds: 90,
        muscle: 'Isquios / Glúteos',
        notes: 'Empujar cadera hacia atrás sintiendo tensión en isquios'
      },
      {
        id: 'e9',
        name: 'Elevación de Talones de Pie',
        targetSets: 4,
        targetReps: '15-20',
        defaultWeight: 50,
        restSeconds: 45,
        muscle: 'Gemelos',
        notes: 'Pausa de 2 segundos arriba en contracción máxima'
      },
      {
        id: 'e9-b',
        name: 'Sentadilla Búlgara con Mancuernas',
        targetSets: 3,
        targetReps: '10',
        mode: 'c_lado',
        defaultWeight: 14,
        restSeconds: 75,
        muscle: 'Cuádriceps / Glúteos',
        notes: '10 repeticiones completas por cada pierna'
      },
      {
        id: 'e9-c',
        name: 'Plancha Abdominal Isométrica',
        targetSets: 3,
        targetReps: '45',
        mode: 'seg',
        defaultWeight: 0,
        restSeconds: 60,
        muscle: 'Core / Abdomen',
        notes: 'Mantener tensión sostenida durante 45 segundos'
      }
    ]
  },
  {
    id: 'gym-hombros-brazos',
    title: 'Hombros y Brazos',
    category: 'DEFINICIÓN',
    days: 'MIÉ / SÁB',
    description: 'Deltoides 3D, bíceps y tríceps con alta congestión',
    exercises: [
      {
        id: 'e10',
        name: 'Press Militar de Pie con Barra',
        targetSets: 4,
        targetReps: '8-10',
        defaultWeight: 45,
        restSeconds: 90,
        muscle: 'Deltoides Anterior / Tríceps',
        notes: 'Core apretado, trayectoria recta sobre la cabeza'
      },
      {
        id: 'e11',
        name: 'Elevaciones Laterales con Mancuernas',
        targetSets: 4,
        targetReps: '12-15',
        defaultWeight: 12,
        restSeconds: 60,
        muscle: 'Deltoides Lateral',
        notes: 'Subir hasta la altura de los hombros sin balanceo'
      },
      {
        id: 'e12',
        name: 'Curl de Bíceps con Barra Z',
        targetSets: 3,
        targetReps: '10-12',
        defaultWeight: 30,
        restSeconds: 60,
        muscle: 'Bíceps Braquial',
        notes: 'Codos pegados a los costados'
      },
      {
        id: 'e13',
        name: 'Fondos en Paralelas (Dips)',
        targetSets: 3,
        targetReps: '10-12',
        defaultWeight: 0,
        restSeconds: 75,
        muscle: 'Tríceps / Pecho inferior',
        notes: 'Torso erguido para mayor énfasis en tríceps'
      }
    ]
  }
];

export const COLOR_THEMES = {
  green: {
    id: 'green',
    name: 'Verde Kinetic',
    hex: '#00ff66',
    primaryContainer: '#00ff66',
    onPrimaryContainer: '#041108',
    glow: 'rgba(0, 255, 102, 0.45)',
    border: '#00ff66'
  },
  coral: {
    id: 'coral',
    name: 'Fuego Coral',
    hex: '#fe7453',
    primaryContainer: '#fe7453',
    onPrimaryContainer: '#450900',
    glow: 'rgba(254, 116, 83, 0.45)',
    border: '#fe7453'
  },
  amber: {
    id: 'amber',
    name: 'Ámbar Alerta',
    hex: '#ffa276',
    primaryContainer: '#ffa276',
    onPrimaryContainer: '#3d1300',
    glow: 'rgba(255, 162, 118, 0.45)',
    border: '#ffa276'
  },
  volt: {
    id: 'volt',
    name: 'Volt Neón',
    hex: '#ccff00',
    primaryContainer: '#ccff00',
    onPrimaryContainer: '#1a2e00',
    glow: 'rgba(204, 255, 0, 0.45)',
    border: '#ccff00'
  },
  cyan: {
    id: 'cyan',
    name: 'Láser Ciano',
    hex: '#00e5ff',
    primaryContainer: '#00e5ff',
    onPrimaryContainer: '#002633',
    glow: 'rgba(0, 229, 255, 0.45)',
    border: '#00e5ff'
  },
  purple: {
    id: 'purple',
    name: 'Púrpura Neón',
    hex: '#d946ef',
    primaryContainer: '#d946ef',
    onPrimaryContainer: '#38003d',
    glow: 'rgba(217, 70, 239, 0.45)',
    border: '#d946ef'
  }
};

export const DEFAULT_SETTINGS = {
  theme: 'dark', // 'dark' | 'light'
  bgTheme: 'oled', // 'oled' | 'slate' | 'light'
  accentColor: 'green', // 'green' | 'coral' | 'amber' | 'volt' | 'cyan' | 'purple'
  dynamicContrast: true,
  highNeonContrast: true,
  soundEnabled: true,
  voiceEnabled: true,
  voiceGender: 'female',
  sofiaPitch: 1.15,
  sofiaRate: 1.02,
  mateoPitch: 0.80,
  mateoRate: 0.96,
  hapticsEnabled: true,
  wakeLockEnabled: true,
  countdownTime: 3,
  hasCompletedOnboarding: false,
  athleteName: '',
  athleteLevel: 'Intermedio', // 'Principiante' | 'Intermedio' | 'Avanzado'
  athleteStreakDays: 0,
  athleteWeight: 74.5,
  targetWeight: 72.0,
  athleteHeight: 175,
  athleteAge: 25,
  smartbandConnected: true,
  smartbandDeviceName: 'SmartBand BLE HR'
};

export const DEFAULT_WEIGHT_LOGS = [
  { id: 'w-1', date: new Date(Date.now() - 21 * 86400000).toISOString(), weight: 77.8, diff: 0, notes: 'Inicio de seguimiento' },
  { id: 'w-2', date: new Date(Date.now() - 14 * 86400000).toISOString(), weight: 76.5, diff: -1.3, notes: 'Semana 1 - Buena adherencia' },
  { id: 'w-3', date: new Date(Date.now() - 7 * 86400000).toISOString(), weight: 75.3, diff: -1.2, notes: 'Semana 2 - Mayor volumen' },
  { id: 'w-4', date: new Date(Date.now() - 1 * 86400000).toISOString(), weight: 74.5, diff: -0.8, notes: 'Pesaje reciente en ayunas' }
];

export const INITIAL_HISTORY = [
  {
    id: 'hist-sample-1',
    type: 'tabata',
    routineName: 'Tabata Kinetic HIIT',
    date: new Date(Date.now() - 1 * 3600000).toISOString(),
    durationSeconds: 480,
    caloriesEst: 195,
    summary: '8 intervalos completados al 100%',
    avgBpm: 164,
    maxBpm: 182,
    recoveryDrop: 34,
    zones: { z1: 5, z2: 10, z3: 15, z4: 35, z5: 35 },
    hasSmartband: true
  },
  {
    id: 'hist-sample-2',
    type: 'gym',
    routineName: 'Torso & Brazos Hipertrofia',
    date: new Date(Date.now() - 26 * 3600000).toISOString(),
    durationSeconds: 2720,
    caloriesEst: 410,
    totalVolumeKg: 8450,
    totalSets: 18,
    summary: 'Completadas 18 series de fuerza + 1 bloque Tabata con 8.450 kg.',
    avgBpm: 128,
    maxBpm: 156,
    recoveryDrop: 28,
    zones: { z1: 25, z2: 35, z3: 25, z4: 15, z5: 0 },
    hasSmartband: true
  },
  {
    id: 'hist-sample-3',
    type: 'runner',
    routineName: 'Series Cuestas Z4 & Umbral',
    date: new Date(Date.now() - 52 * 3600000).toISOString(),
    durationSeconds: 1690,
    caloriesEst: 340,
    summary: '9 fases de carrera e intervalos de potencia completados.',
    avgBpm: 158,
    maxBpm: 176,
    recoveryDrop: 32,
    zones: { z1: 10, z2: 20, z3: 30, z4: 35, z5: 5 },
    hasSmartband: true
  }
];

