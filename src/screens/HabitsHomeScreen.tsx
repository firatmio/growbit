import { useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Habit, useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';

export default function HabitsHomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const { habits } = useAppStore();
  const [showProgramModal, setShowProgramModal] = useState(false);
  const sorted = useMemo(() => {
    const inProgress = habits.filter((h) => h.status !== 'acquired');
    const acquired = habits.filter((h) => h.status === 'acquired');
    return [...inProgress, ...acquired];
  }, [habits]);
  // basit program özeti: bugüne ait tüm saatleri toparla (metinsel)
  const programSummary = useMemo(() => {
    const today = new Date();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const key = days[today.getDay()];
    const slots: string[] = [];
    for (const h of sorted) {
      const p = h.program;
      if (p.type === 'daily') {
        slots.push(...(p.schedule['*'] || []).map((t) => `${t} • ${h.title}`));
      } else {
        const arr = p.schedule[key as keyof typeof p.schedule];
        if (arr) slots.push(...arr.map((t) => `${t} • ${h.title}`));
      }
    }
    return slots.sort();
  }, [sorted]);

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={styles.card} onPress={() => setShowProgramModal(true)}>
        <Text style={styles.title}>Bugünün Programı</Text>
        {programSummary.length === 0 ? (
          <Text style={styles.subtext}>Bugün için planlanmış slot yok.</Text>
        ) : (
          <View style={{ gap: 6, marginTop: 6 }}>
            {programSummary.map((line, i) => (
              <Text key={i} style={styles.subtext}>{line}</Text>
            ))}
          </View>
        )}
      </Pressable>
      <View style={styles.card}>
        <Text style={styles.title}>Alışkanlıklarım</Text>
        {sorted.length === 0 ? (
          <Text style={styles.subtext}>Henüz alışkanlık edinmediniz. Keşfet’ten başlayın.</Text>
        ) : (
          <View style={{ gap: 8, marginTop: 8 }}>
            {sorted.map((h) => (
              <Pressable key={h.id} style={styles.rowItem} onPress={() => navigation.navigate('HabitDetail', { habitId: h.id })}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hTitle}>{h.title}</Text>
                  <Text style={styles.subtext}>Zorluk: {h.difficulty} • {h.status === 'acquired' ? 'Edinilmiş' : 'Devam'}</Text>
                </View>
                <Text style={[styles.badge, h.status === 'acquired' && styles.badgeDone]}>{h.status === 'acquired' ? '✓' : '→'}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ProgramSummaryModal visible={showProgramModal} onClose={() => setShowProgramModal(false)} habits={sorted} />
    </SafeAreaView>
  );
}

function getStyles(c: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg, padding: 16 },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    title: { color: c.text, fontSize: 18, fontWeight: '700' },
    subtext: { color: c.subtext, marginTop: 6 },
    rowItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hTitle: { color: c.text, fontSize: 16, fontWeight: '700' },
    badge: { color: c.accent, fontWeight: '800', fontSize: 16 },
    badgeDone: { color: '#22c55e' },
  });
}

function ProgramSummaryModal({ visible, onClose, habits }: { visible: boolean; onClose: () => void; habits: Habit[] }) {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const days: Array<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'> = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dayNamesTR: Record<string, string> = { Mon: 'Pazartesi', Tue: 'Salı', Wed: 'Çarşamba', Thu: 'Perşembe', Fri: 'Cuma', Sat: 'Cumartesi', Sun: 'Pazar' };
  const byDay = useMemo(() => {
    const out: Record<string, Array<{ time: string; title: string }>> = {};
    for (const d of days) out[d] = [];
    for (const h of habits) {
      const p = h.program;
      if (p.type === 'daily') {
        const arr: string[] = p.schedule['*'] || [];
        for (const d of days) {
          out[d].push(...arr.map((t: string) => ({ time: t, title: h.title })));
        }
      } else {
        for (const d of days) {
          const arr = p.schedule[d] as string[] | undefined;
          if (arr) out[d].push(...arr.map((t) => ({ time: t, title: h.title })));
        }
      }
    }
    for (const d of days) {
      out[d].sort((a, b) => a.time.localeCompare(b.time));
    }
    return out;
  }, [habits]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent:'center', padding:16 }}>
        <View style={[styles.card, { maxHeight: '80%' }]}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <Text style={styles.title}>Haftalık Program</Text>
            <Pressable onPress={onClose}><Text style={[styles.badge, { fontSize: 14 }]}>Kapat</Text></Pressable>
          </View>
          <ScrollView style={{ maxHeight: '100%' }}>
            {days.map((d) => (
              <View key={d} style={{ marginBottom: 12 }}>
                <Text style={[styles.hTitle, { marginBottom: 6 }]}>{dayNamesTR[d]}</Text>
                {byDay[d].length === 0 ? (
                  <Text style={styles.subtext}>Planlanmış slot yok.</Text>
                ) : (
                  <View style={{ gap: 4 }}>
                    {byDay[d].map((it, idx) => (
                      <Text key={idx} style={styles.subtext}>{it.time} • {it.title}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
