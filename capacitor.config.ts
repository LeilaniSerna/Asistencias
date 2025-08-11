import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'asistencias',
  webDir: 'www',

  // configuración del servidor `
  server: {
    cleartext: true,              // Permite tráfico HTTP en Android
    androidScheme: 'http',        // Usa el esquema http en vez de capacitor://
    hostname: '192.168.0.103',    // Tu IP local para live-reload
  },
};

export default config;
