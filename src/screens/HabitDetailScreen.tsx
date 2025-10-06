import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { HabitTemplate, useAppStore, utils } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';

export default function HabitDetailScreen({ route }: any) {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const { habits, toggleHabitSlot, updateHabitTitle, updateHabitProgram } = useAppStore();
  const id = route.params?.habitId as string;
  const habit = habits.find((h) => h.id === id);
  if (!habit) return null;

  const today = utils.todayISO();
  const slotsToday = useMemo(() => {
    if (habit.program.type === 'daily') return habit.program.schedule['*'] || [];
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const key = days[new Date().getDay()];
    return habit.program.schedule[key] || [];
  }, [habit.program]);

  const scheduleText = habit.program.type === 'daily'
    ? `Günlük saatler: ${(habit.program.schedule['*'] || []).join(', ')}`
    : `Haftalık: ${Object.entries(habit.program.schedule).map(([d, arr]) => `${d}: ${arr.join(', ')}`).join(' | ')}`;

  const slotDone = (t: string) => !!habit.slotProgress?.[today]?.[t];
  const streak = utils.habitStreak(habit);
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0,10);
    return { iso, ok: utils.isHabitDayComplete(habit, iso) };
  }).reverse();

  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(habit.title);
  const [programDraft, setProgramDraft] = useState<HabitTemplate['program']>(habit.program);
  const [newSlot, setNewSlot] = useState('');
  const [selectedDay, setSelectedDay] = useState<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'>('Mon');
  const removeDailySlot = (t: string) => {
    if (programDraft.type !== 'daily') return;
    const arr = (programDraft.schedule['*'] || []).filter((x) => x !== t);
    setProgramDraft({ ...programDraft, schedule: { '*': arr } });
  };

  const saveEdits = () => {
    if (newTitle.trim() && newTitle !== habit.title) updateHabitTitle(habit.id, newTitle.trim());
    if (JSON.stringify(programDraft) !== JSON.stringify(habit.program)) updateHabitProgram(habit.id, programDraft);
    setEditing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        {editing ? (
          <View style={{ gap: 8 }}>
            <TextInput value={newTitle} onChangeText={setNewTitle} style={styles.input} placeholder="Başlık" placeholderTextColor={'#94a3b8'} />
            <View style={{ flexDirection:'row', gap:8 }}>
              <Pressable style={styles.secondaryBtn} onPress={saveEdits}><Text style={styles.secondaryBtnText}>Kaydet</Text></Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => { setEditing(false); setNewTitle(habit.title); setProgramDraft(habit.program); }}><Text style={styles.secondaryBtnText}>Vazgeç</Text></Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.title}>{habit.title}</Text>
            <Text style={styles.subtext}>Zorluk: {habit.difficulty} • Durum: {habit.status === 'acquired' ? 'Edinilmiş' : 'Devam'}</Text>
            <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
              <Pressable style={styles.secondaryBtn} onPress={() => { setEditing(true); setNewTitle(habit.title); setProgramDraft(habit.program); }}>
                <Text style={styles.secondaryBtnText}>Düzenle</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Program</Text>
        {editing ? (
          programDraft.type === 'daily' ? (
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                {(programDraft.schedule['*'] || []).map((t) => (
                  <Pressable key={t} style={styles.slot} onPress={() => removeDailySlot(t)}>
                    <Text style={styles.slotText}>− {t}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor={'#94a3b8'}
                  value={newSlot}
                  onChangeText={setNewSlot}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => {
                    if (programDraft.type !== 'daily') return;
                    const v = newSlot.trim();
                    const ok = /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
                    if (!ok) return;
                    const arr = [...(programDraft.schedule['*'] || [])];
                    if (!arr.includes(v)) {
                      arr.push(v);
                      arr.sort();
                      setProgramDraft({ ...programDraft, schedule: { '*': arr } });
                    }
                    setNewSlot('');
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Ekle</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={styles.subtext}>Haftalık program düzenleme (basit) bu sürümde sınırlı. İstersen gün/saatleri birlikte netleştirelim.</Text>
          )
          ) : (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                {(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const).map((d) => (
                  <Pressable key={d} onPress={() => setSelectedDay(d)} style={[styles.chip, selectedDay === d && styles.chipActive]}>
                    <Text style={[styles.chipText, selectedDay === d && styles.chipTextActive]}>{dayLabelTR[d]}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                {((programDraft.schedule[selectedDay] as string[] | undefined) || []).map((t) => (
                  <Pressable key={t} style={styles.slot} onPress={() => {
                    const arr = ((programDraft.schedule[selectedDay] as string[] | undefined) || []).filter((x) => x !== t);
                    setProgramDraft({ ...programDraft, schedule: { ...programDraft.schedule, [selectedDay]: arr } });
                  }}>
                    <Text style={styles.slotText}>− {t}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor={'#94a3b8'}
                  value={newSlot}
                  onChangeText={setNewSlot}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => {
                    const v = newSlot.trim();
                    const ok = /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
                    if (!ok) return;
                    const arr = [ ...(((programDraft.schedule[selectedDay] as string[] | undefined) || [])) ];
                    if (!arr.includes(v)) {
                      arr.push(v);
                      arr.sort();
                      setProgramDraft({ ...programDraft, schedule: { ...programDraft.schedule, [selectedDay]: arr } });
                    }
                    setNewSlot('');
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Ekle</Text>
                </Pressable>
              </View>
              <Text style={styles.subtext}>Bir slotu kaldırmak için üzerine dokun.</Text>
            </View>
          )
        ) : (
          <Text style={styles.subtext}>{scheduleText}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.subtext}>Seri: {streak} gün</Text>
        <View style={{ flexDirection:'row', gap:8, marginTop:6 }}>
          {last7.map((d) => (
            <View key={d.iso} style={[styles.dot, d.ok ? styles.dotOk : styles.dotNo]} />
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bugün</Text>
        {slotsToday.length === 0 ? (
          <Text style={styles.subtext}>Bugün için planlı slot yok.</Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {slotsToday.map((t) => {
              const active = slotDone(t);
              return (
                <Pressable key={t} style={[styles.slot, active && styles.slotActive]} onPress={() => toggleHabitSlot(habit.id, today, t, !active)}>
                  <Text style={[styles.slotText, active && styles.slotTextActive]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function getStyles(c: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg, padding: 16 },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 12 },
    title: { color: c.text, fontSize: 20, fontWeight: '800' },
    subtext: { color: c.subtext, marginTop: 4 },
    sectionTitle: { color: c.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
    slot: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
    slotActive: { backgroundColor: '#22c55e22', borderColor: '#22c55e' },
    slotText: { color: '#94a3b8', fontWeight: '700' },
    slotTextActive: { color: '#22c55e' },
    dot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#475569' },
    dotOk: { backgroundColor: '#22c55e' },
    dotNo: { backgroundColor: '#475569' },
    input: { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1, color: c.text, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 100 },
    secondaryBtn: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
    secondaryBtnText: { color: c.subtext, fontWeight: '600' },
    chip: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    chipActive: { borderColor: c.accent },
    chipText: { color: c.subtext, fontWeight: '600' },
    chipTextActive: { color: c.accent },
  });
}

const dayLabelTR: Record<'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun', string> = {
  Mon: 'Pzt',
  Tue: 'Sal',
  Wed: 'Çar',
  Thu: 'Per',
  Fri: 'Cum',
  Sat: 'Cmt',
  Sun: 'Paz',
};
