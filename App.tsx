import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Habit = {
  id: string;
  title: string;
  // last 7 days completion flags, index 0 = today, 1 = yesterday, etc.
  days: boolean[]; // length 7
};

const WORK_DURATION = 25 * 60; // 25 minutes in seconds
const BREAK_DURATION = 5 * 60; // 5 minutes in seconds

export default function App() {
  // Pomodoro state
  const [isRunning, setIsRunning] = useState(false);
  const [isWork, setIsWork] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState<number>(WORK_DURATION);

  // Habits state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsWork(true);
    setSecondsLeft(WORK_DURATION);
  }, []);

  const toggleRunning = useCallback(() => {
    setIsRunning((r) => !r);
  }, []);

  const switchMode = useCallback(() => {
    setIsWork((prev) => {
      const next = !prev;
      setSecondsLeft(next ? WORK_DURATION : BREAK_DURATION);
      return next;
    });
  }, []);

  // Run the interval
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // notify, switch mode, pause automatically
          Alert.alert('Süre bitti', isWork ? 'Çalışma süresi tamamlandı. Mola zamanı!' : 'Moladan dönme zamanı!');
          // auto switch to next phase and pause
          setIsRunning(false);
          setIsWork((prev) => !prev);
          return isWork ? BREAK_DURATION : WORK_DURATION;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isWork]);

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(secondsLeft % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  // Habit helpers
  const addHabit = useCallback(() => {
    const title = newHabit.trim();
    if (!title) return;
    const h: Habit = {
      id: `${Date.now()}`,
      title,
      days: Array(7).fill(false),
    };
    setHabits((list) => [h, ...list]);
    setNewHabit('');
  }, [newHabit]);

  const toggleHabitToday = useCallback((id: string) => {
    setHabits((list) =>
      list.map((h) =>
        h.id === id
          ? { ...h, days: [!h.days[0], ...h.days.slice(1)] }
          : h
      )
    );
  }, []);

  const shiftDaysIfNeeded = useCallback(() => {
    // This naïve approach does not track real dates; in a real app we would persist the last open date.
    // For now, we leave as-is. Hook reserved for future improvements.
  }, []);

  useEffect(() => {
    shiftDaysIfNeeded();
  }, [shiftDaysIfNeeded]);

  const successPct = (days: boolean[]) => {
    const count = days.filter(Boolean).length;
    return Math.round((count / days.length) * 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Text style={styles.header}>Growbit</Text>

        {/* Pomodoro Card */}
        <View style={styles.card}>
          <View style={styles.pomoHeaderRow}>
            <Text style={styles.cardTitle}>Pomodoro</Text>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{isWork ? 'Çalışma' : 'Mola'}</Text>
            </View>
          </View>

          <Text style={styles.timer}>{mmss}</Text>

          <View style={styles.row}>
            <Pressable
              onPress={toggleRunning}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              android_ripple={{ color: '#1e40af' }}
            >
              <Text style={styles.buttonText}>{isRunning ? 'Duraklat' : 'Başlat'}</Text>
            </Pressable>
            <Pressable
              onPress={switchMode}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              android_ripple={{ color: '#0b1220' }}
            >
              <Text style={styles.secondaryButtonText}>Mod Değiştir</Text>
            </Pressable>
            <Pressable
              onPress={resetTimer}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              android_ripple={{ color: '#0b1220' }}
            >
              <Text style={styles.secondaryButtonText}>Sıfırla</Text>
            </Pressable>
          </View>
        </View>

        {/* Habits Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alışkanlıklar</Text>

          <View style={styles.inputRow}>
            <TextInput
              placeholder="Yeni alışkanlık..."
              placeholderTextColor="#94a3b8"
              value={newHabit}
              onChangeText={setNewHabit}
              onSubmitEditing={addHabit}
              style={styles.input}
              returnKeyType="done"
            />
            <Pressable
              onPress={addHabit}
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, styles.addBtn]}
              android_ripple={{ color: '#1e40af' }}
            >
              <Text style={styles.buttonText}>Ekle</Text>
            </Pressable>
          </View>

          <FlatList
            data={habits}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.empty}>Henüz alışkanlık yok. Bir tane ekleyin.</Text>}
            renderItem={({ item }) => (
              <View style={styles.habitItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.habitTitle}>{item.title}</Text>
                  <Text style={styles.habitSub}>Son 7 gün başarı: {successPct(item.days)}%</Text>
                </View>
                <Pressable
                  onPress={() => toggleHabitToday(item.id)}
                  style={({ pressed }) => [styles.checkBtn, item.days[0] && styles.checkBtnActive, pressed && styles.buttonPressed]}
                  android_ripple={{ color: '#134e4a' }}
                >
                  <Text style={[styles.checkBtnText, item.days[0] && styles.checkBtnTextActive]}>
                    {item.days[0] ? '✓' : '✓'}
                  </Text>
                </Pressable>
              </View>
            )}
            contentContainerStyle={{ paddingTop: 8 }}
          />
        </View>

        <View style={{ height: 24 }} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#0f172a',
  },
  header: {
    color: '#e6edf3',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#e6edf3',
    fontSize: 18,
    fontWeight: '700',
  },
  pomoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeBadge: {
    backgroundColor: '#0b1220',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modeBadgeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  timer: {
    color: '#e6edf3',
    fontSize: 56,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  addBtn: {
    marginLeft: 8,
  },
  buttonText: {
    color: '#e6edf3',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#0b1220',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#0b1220',
    color: '#e6edf3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  empty: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#0f172a',
    gap: 12,
  },
  habitTitle: {
    color: '#e6edf3',
    fontSize: 16,
    fontWeight: '600',
  },
  habitSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnActive: {
    backgroundColor: '#22c55e22',
    borderColor: '#22c55e',
  },
  checkBtnText: {
    color: '#334155',
    fontSize: 20,
    fontWeight: '800',
  },
  checkBtnTextActive: {
    color: '#22c55e',
  },
});
