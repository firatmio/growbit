import dayjs from 'dayjs';
import { useKeepAwake } from 'expo-keep-awake';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { PomodoroSession, useAppStore, utils } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';

export default function PomodoroScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const { addPomodoroSession, pomodoroSessions, settings } = useAppStore();

  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [seconds, setSeconds] = useState(settings.pomodoro.workSec);
  const [running, setRunning] = useState(false);
  const [focusUI, setFocusUI] = useState(settings.pomodoro.defaultUI === 'focus'); // true: focus, false: normal
  const [autoSwitch, setAutoSwitch] = useState(settings.pomodoro.autoSwitch);
  const [cycleCount, setCycleCount] = useState(0); // tamamlanan work sayısı

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Keep screen awake while focusing if enabled
  if (settings.keepAwakeDuringPomodoro && focusUI) {
    try { useKeepAwake(); } catch {}
  }

  const switchMode = (next?: 'work' | 'break') => {
    const nm = next ?? (mode === 'work' ? 'break' : 'work');
    setMode(nm);
    setSeconds(nm === 'work' ? settings.pomodoro.workSec : settings.pomodoro.breakSec);
  };

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    startedAtRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          const finishedWork = mode === 'work';
          Alert.alert('Süre bitti', finishedWork ? 'Mola zamanı' : 'Çalışma zamanı');
          if (autoSwitch) {
            if (finishedWork) {
              const nextCount = cycleCount + 1;
              setCycleCount(nextCount);
              const useLong = nextCount % settings.pomodoro.cycleLen === 0;
              setMode('break');
              setSeconds(useLong ? settings.pomodoro.longBreakSec : settings.pomodoro.breakSec);
            } else {
              setMode('work');
              setSeconds(settings.pomodoro.workSec);
            }
          } else {
            setRunning(false);
          }
          // basit session kaydı: work bittiğinde bugüne ekle
          if (finishedWork) {
            const ended = new Date();
            const durationSec = settings.pomodoro.workSec;
            const started = new Date(ended.getTime() - durationSec * 1000);
            addPomodoroSession({ id: `${Date.now()}`, startedAt: started.toISOString(), endedAt: ended.toISOString(), durationSec, mode: 'work' });
            if (settings.notifyOnPomodoroEnd) {
              Notifications.scheduleNotificationAsync({
                content: { title: 'Pomodoro bitti', body: 'Mola zamanı! 🎉' },
                trigger: null,
              }).catch(() => {});
            }
          }
          if (finishedWork) {
            const nextCount = cycleCount + 1;
            const useLong = nextCount % settings.pomodoro.cycleLen === 0;
            return useLong ? settings.pomodoro.longBreakSec : settings.pomodoro.breakSec;
          }
          return settings.pomodoro.workSec;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, autoSwitch, settings.pomodoro.workSec, settings.pomodoro.breakSec]);

  // Ayarlar değişirse, çalışmıyorsa kalan süreyi güncelle
  useEffect(() => {
    if (!running) {
      setSeconds(mode === 'work' ? settings.pomodoro.workSec : settings.pomodoro.breakSec);
      setAutoSwitch(settings.pomodoro.autoSwitch);
    }
    // defaultUI, sadece kullanıcı manuel değiştirmediyse uygula
    // burada mevcut UI'ı zorla değiştirmiyoruz
  }, [settings.pomodoro, mode, running]);

  // simple mm:ss
  const mmss = useMemo(() => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [seconds]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* Header with mode and focus toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Pomodoro</Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <View style={styles.badge}><Text style={styles.badgeText}>{mode === 'work' ? 'Focus' : 'Mola'}</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>{cycleCount % settings.pomodoro.cycleLen}/{settings.pomodoro.cycleLen}</Text></View>
        </View>
      </View>

      {/* Focus UI: large centered timer */}
      {focusUI ? (
        <View style={styles.centerWrap}>
          <Text style={styles.timer}>{mmss}</Text>
          <View style={styles.row}>
            <Pressable style={styles.primaryBtn} onPress={() => setRunning((r) => !r)}>
              <Text style={styles.primaryBtnText}>{running ? 'Duraklat' : 'Başlat'}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => switchMode()}>
              <Text style={styles.secondaryBtnText}>Mod Değiştir</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => { setRunning(false); setMode('work'); setSeconds(settings.pomodoro.workSec); setCycleCount(0); }}>
              <Text style={styles.secondaryBtnText}>Sıfırla</Text>
            </Pressable>
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Pressable style={[styles.chip, autoSwitch && styles.chipActive]} onPress={() => setAutoSwitch((v) => !v)}>
              <Text style={[styles.chipText, autoSwitch && styles.chipTextActive]}>Otomatik Geçiş</Text>
            </Pressable>
            <Pressable style={styles.chip} onPress={() => setFocusUI(false)}>
              <Text style={styles.chipText}>Normal Moda Geç</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.card}>
            <Text style={styles.timerSmall}>{mmss}</Text>
            <View style={styles.row}>
              <Pressable style={styles.primaryBtn} onPress={() => setRunning((r) => !r)}>
                <Text style={styles.primaryBtnText}>{running ? 'Duraklat' : 'Başlat'}</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => switchMode()}>
                <Text style={styles.secondaryBtnText}>Mod Değiştir</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => { setRunning(false); setMode('work'); setSeconds(settings.pomodoro.workSec); setCycleCount(0); }}>
                <Text style={styles.secondaryBtnText}>Sıfırla</Text>
              </Pressable>
            </View>
            <View style={[styles.row, { marginTop: 8 }]}>
              <Pressable style={[styles.chip, autoSwitch && styles.chipActive]} onPress={() => setAutoSwitch((v) => !v)}>
                <Text style={[styles.chipText, autoSwitch && styles.chipTextActive]}>Otomatik Geçiş</Text>
              </Pressable>
              <Pressable style={styles.chip} onPress={() => setFocusUI(true)}>
                <Text style={styles.chipText}>Focus Moda Geç</Text>
              </Pressable>
            </View>
          </View>
          <TodayStats />
          <WeeklyStats sessions={pomodoroSessions} />
          <RecentSessions sessions={pomodoroSessions} />
        </View>
      )}
    </SafeAreaView>
  );
}

function getStyles(c: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg, padding: 16 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    title: { color: c.text, fontSize: 24, fontWeight: '700' },
    badge: { backgroundColor: '#0b1220', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    badgeText: { color: c.subtext, fontSize: 12, fontWeight: '600' },
    centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    timer: { color: c.text, fontSize: 72, fontWeight: '800', marginVertical: 12 },
    timerSmall: { color: c.text, fontSize: 40, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    row: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
    primaryBtn: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
    primaryBtnText: { color: c.text, fontWeight: '700' },
    secondaryBtn: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
    secondaryBtnText: { color: c.subtext, fontWeight: '600' },
    chip: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    chipActive: { borderColor: c.accent },
    chipText: { color: c.subtext, fontWeight: '600' },
    chipTextActive: { color: c.accent },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 16, marginTop: 12 },
    sectionTitle: { color: c.text, fontWeight: '700', marginBottom: 6, fontSize: 16 },
    subtext: { color: c.subtext },
  });
}

function TodayStats() {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const { pomodoroSessions } = useAppStore();
  const today = new Date().toISOString().slice(0, 10);
  const totalWork = pomodoroSessions
    .filter((s) => s.mode === 'work' && s.startedAt.startsWith(today))
    .reduce((acc, s) => acc + s.durationSec, 0);
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Bugün</Text>
      <Text style={styles.subtext}>Toplam çalışma: {utils.formatDuration(totalWork)}</Text>
    </View>
  );
}

function WeeklyStats({ sessions }: { sessions: PomodoroSession[] }) {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const { settings } = useAppStore();
  const { start, end } = utils.weekBounds(settings.weekStartsOn);
  const weekly = sessions.filter((s) => dayjs(s.startedAt).isAfter(start.subtract(1, 'second')) && dayjs(s.startedAt).isBefore(end) && s.mode === 'work');
  const total = weekly.reduce((a, s) => a + s.durationSec, 0);
  const count = weekly.length;
  const avg = count ? Math.round(total / count) : 0;
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Bu Hafta</Text>
      <Text style={styles.subtext}>Toplam: {utils.formatDuration(total)} • Oturum: {count} • Ortalama: {utils.formatDuration(avg)}</Text>
    </View>
  );
}

function RecentSessions({ sessions }: { sessions: PomodoroSession[] }) {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const items = sessions.slice(0, 10);
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Önceki Oturumlar</Text>
      {items.length === 0 ? (
        <Text style={styles.subtext}>Kayıt yok.</Text>
      ) : (
        <View style={{ gap: 6 }}>
          {items.map((s) => (
            <Text key={s.id} style={styles.subtext}>
              {dayjs(s.startedAt).format('DD MMM HH:mm')} • {s.mode === 'work' ? 'Çalışma' : 'Mola'} • {utils.formatDuration(s.durationSec)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
