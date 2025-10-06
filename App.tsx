import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import RootNavigation from './src/navigation';
import { ThemeProvider } from './src/theme/ThemeProvider';

export default function App() {
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        // SDK 54: aşağıdaki alanlar bazı platformlarda beklenebiliyor
        // @ts-ignore
        shouldShowBanner: true,
        // @ts-ignore
        shouldShowList: true,
      }),
    });
    // Android varsayılan kanal
    (async () => {
      try {
        // @ts-ignore - Android API mevcut olduğunda çalışır
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        } as any);
      } catch {}
    })();
  }, []);
  return (
    <ThemeProvider>
      <RootNavigation />
    </ThemeProvider>
  );
}
