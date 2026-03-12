import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campushive.app',
  appName: 'CampusHive',
  webDir: 'www',
  server: {
    url: 'https://hivezone.vercel.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
