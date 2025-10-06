import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';
import { Themes } from '../theme/themes';
import { cancel, ensurePermissions, parseTimeHM, scheduleDaily, scheduleWeekly, WeekdayNum } from '../utils/notifications';

export default function SettingsScreen() {
  const { theme, setThemeName, themeName } = useTheme();
  const styles = getStyles(theme.colors);
  const { settings, setPomodoroDefaults, setKeepAwakeDuringPomodoro, setHabitRemindersEnabled, setNotifyOnPomodoroEnd, setWeekStartsOn } = useAppStore();
  const { habits, templates, setHabitNotificationIds, habitNotificationIds } = useAppStore();
  const [work, setWork] = useState(String(Math.round(settings.pomodoro.workSec / 60)));
  const [brk, setBrk] = useState(String(Math.round(settings.pomodoro.breakSec / 60)));
  const [lbrk, setLBrk] = useState(String(Math.round(settings.pomodoro.longBreakSec / 60)));
  const [cycle, setCycle] = useState(String(settings.pomodoro.cycleLen));
  const [auto, setAuto] = useState(settings.pomodoro.autoSwitch);
  const [ui, setUI] = useState(settings.pomodoro.defaultUI);
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Tema</Text>
      <View style={styles.row}>
        {Object.keys(Themes).map((name) => {
          const t = Themes[name];
          const selected = themeName === name;
          return (
            <Pressable key={name} style={[styles.preview, selected && styles.previewSelected]} onPress={() => setThemeName(name as any)}>
              <View style={[styles.previewBlock, { backgroundColor: t.colors.bg }]} />
              <View style={[styles.previewBlock, { backgroundColor: t.colors.card }]} />
              <View style={[styles.previewBlock, { backgroundColor: t.colors.accent }]} />
              <Text style={styles.previewText}>{t.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.card, { marginTop: 16, gap: 10 }]}>
        <Text style={styles.sectionTitle}>Pomodoro Varsayılanları</Text>
        <View style={styles.formRow}>
          <Text style={styles.label}>Çalışma (dk)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={work}
            onChangeText={setWork}
            onBlur={() => {
              const n = Math.max(1, Math.min(180, parseInt(work || '0', 10)));
              setWork(String(n));
              setPomodoroDefaults({ workSec: n * 60 });
            }}
            placeholder="25"
            placeholderTextColor={theme.colors.subtext}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Mola (dk)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={brk}
            onChangeText={setBrk}
            onBlur={() => {
              const n = Math.max(1, Math.min(60, parseInt(brk || '0', 10)));
              setBrk(String(n));
              setPomodoroDefaults({ breakSec: n * 60 });
            }}
            placeholder="5"
            placeholderTextColor={theme.colors.subtext}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Uzun mola (dk)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={lbrk}
            onChangeText={setLBrk}
            onBlur={() => {
              const n = Math.max(5, Math.min(60, parseInt(lbrk || '0', 10)));
              setLBrk(String(n));
              setPomodoroDefaults({ longBreakSec: n * 60 });
            }}
            placeholder="15"
            placeholderTextColor={theme.colors.subtext}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Döngü (çalışma sayısı)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={cycle}
            onChangeText={setCycle}
            onBlur={() => {
              const n = Math.max(2, Math.min(8, parseInt(cycle || '0', 10)));
              setCycle(String(n));
              setPomodoroDefaults({ cycleLen: n });
            }}
            placeholder="4"
            placeholderTextColor={theme.colors.subtext}
          />
        </View>
        <View style={[styles.formRow, { alignItems: 'center' }]}>
          <Text style={styles.label}>Otomatik Geçiş</Text>
          <Switch
            value={auto}
            onValueChange={(v) => { setAuto(v); setPomodoroDefaults({ autoSwitch: v }); }}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.card}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Varsayılan Arayüz</Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            <Pressable onPress={() => { setUI('focus'); setPomodoroDefaults({ defaultUI: 'focus' }); }} style={[styles.chip, ui === 'focus' && styles.chipActive]}>
              <Text style={[styles.chipText, ui === 'focus' && styles.chipTextActive]}>Focus</Text>
            </Pressable>
            <Pressable onPress={() => { setUI('normal'); setPomodoroDefaults({ defaultUI: 'normal' }); }} style={[styles.chip, ui === 'normal' && styles.chipActive]}>
              <Text style={[styles.chipText, ui === 'normal' && styles.chipTextActive]}>Normal</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtext}>Değişiklikler otomatik kaydedilir.</Text>
      </View>

      <View style={[styles.card, { marginTop: 16, gap: 10 }]}>
        <Text style={styles.sectionTitle}>Gelişmiş</Text>
        <View style={[styles.formRow, { alignItems: 'center' }]}>
          <Text style={styles.label}>Pomodoro’da ekranı açık tut</Text>
          <Switch
            value={settings.keepAwakeDuringPomodoro}
            onValueChange={setKeepAwakeDuringPomodoro}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.card}
          />
        </View>
        <View style={[styles.formRow, { alignItems: 'center' }]}>
          <Text style={styles.label}>Alışkanlık hatırlatmaları</Text>
          <Switch
            value={settings.habitRemindersEnabled}
            onValueChange={async (v) => {
              setHabitRemindersEnabled(v);
              if (v) {
                const ok = await ensurePermissions();
                if (!ok) return;
                // mevcutları iptal et
                if (habitNotificationIds && habitNotificationIds.length) await cancel(habitNotificationIds);
                const ids: string[] = [];
                // planlı saatleri topla ve bildirimi ayarla
                for (const h of habits) {
                  const p = h.program;
                  if (p.type === 'daily') {
                    const times = p.schedule['*'] || [];
                    for (const t of times) {
                      const { hour, minute } = parseTimeHM(t);
                      const id = await scheduleDaily(hour, minute, h.title, 'Planlı zaman geldi');
                      ids.push(id);
                    }
                  } else {
                    for (const [day, times] of Object.entries(p.schedule)) {
                      for (const t of times) {
                        const { hour, minute } = parseTimeHM(t);
                        const weekday = WeekdayNum[day as keyof typeof WeekdayNum];
                        if (weekday) {
                          const id = await scheduleWeekly(weekday, hour, minute, h.title, 'Planlı zaman geldi');
                          ids.push(id);
                        }
                      }
                    }
                  }
                }
                setHabitNotificationIds(ids);
              } else {
                if (habitNotificationIds && habitNotificationIds.length) await cancel(habitNotificationIds);
                setHabitNotificationIds([]);
              }
            }}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.card}
          />
        </View>
        <View style={[styles.formRow, { alignItems: 'center' }]}>
          <Text style={styles.label}>Pomodoro bitiş bildirimi</Text>
          <Switch
            value={settings.notifyOnPomodoroEnd}
            onValueChange={setNotifyOnPomodoroEnd}
            trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
            thumbColor={theme.colors.card}
          />
        </View>
        <View style={styles.formRow}>
          <Text style={styles.label}>Haftabaşı</Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            <Pressable onPress={() => setWeekStartsOn('sunday')} style={[styles.chip, settings.weekStartsOn === 'sunday' && styles.chipActive]}>
              <Text style={[styles.chipText, settings.weekStartsOn === 'sunday' && styles.chipTextActive]}>Pazar</Text>
            </Pressable>
            <Pressable onPress={() => setWeekStartsOn('monday')} style={[styles.chip, settings.weekStartsOn === 'monday' && styles.chipActive]}>
              <Text style={[styles.chipText, settings.weekStartsOn === 'monday' && styles.chipTextActive]}>Pazartesi</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.subtext}>Hatırlatmalar etkinleştirildiğinde planlı saatler için bildirim planlanır.</Text>
      </View>
    </SafeAreaView>
  );
}

function getStyles(c: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg, padding: 16 },
    title: { color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    row: { flexDirection: 'row', gap: 12 },
    preview: { backgroundColor: c.card, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center' },
    previewSelected: { borderColor: c.accent },
    previewBlock: { width: 40, height: 10, borderRadius: 4, marginBottom: 6 },
    previewText: { color: c.subtext, fontSize: 12 },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 16 },
    sectionTitle: { color: c.text, fontWeight: '700' },
    subtext: { color: c.subtext, marginTop: 6 },
    formRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    label: { color: c.text, fontWeight: '600' },
    input: { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1, color: c.text, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 80, textAlign: 'center' },
    chip: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    chipActive: { borderColor: c.accent },
    chipText: { color: c.subtext, fontWeight: '600' },
    chipTextActive: { color: c.accent },
  });
}
