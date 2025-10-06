import * as Notifications from 'expo-notifications';

export async function ensurePermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancel(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

export async function scheduleDaily(hour: number, minute: number, title: string, body?: string) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    // Expo SDK 54 typing farkları nedeniyle trigger'ı any olarak cast ediyoruz
    trigger: ({ hour, minute, repeats: true } as any),
  });
}

export function parseTimeHM(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  return { hour: h || 0, minute: m || 0 };
}

export const WeekdayNum: Record<'Sun'|'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat', number> = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

export async function scheduleWeekly(weekday: number, hour: number, minute: number, title: string, body?: string) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: ({ weekday, hour, minute, repeats: true } as any),
  });
}
