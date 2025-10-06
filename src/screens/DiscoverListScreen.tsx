import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<any, any>;

export default function DiscoverListScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const categoryId = route.params?.categoryId as string;
  const { templates, categories, acquireHabit, habits } = useAppStore();

  const cat = categories.find((c) => c.id === categoryId);
  const list = useMemo(() => templates.filter((t) => t.categoryId === categoryId), [templates, categoryId]);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>{cat?.title}</Text>
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const already = habits.some((h) => h.templateId === item.id);
          return (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.subtext}>Zorluk: {item.difficulty}</Text>
            </View>
            {already ? (
              <View style={[styles.primaryBtn, { opacity: 0.6 }]}> 
                <Ionicons name="checkmark-outline" color={theme.colors.text} size={18} />
                <Text style={styles.primaryBtnText}>Edinilmiş</Text>
              </View>
            ) : (
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  const h = acquireHabit(item.id);
                  (navigation as any).navigate('Alışkanlıklarım', { screen: 'HabitDetail', params: { habitId: h.id } });
                }}
              >
                <Ionicons name="add-outline" color={theme.colors.text} size={18} />
                <Text style={styles.primaryBtnText}>Edin</Text>
              </Pressable>
            )}
          </View>
        );}}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

function getStyles(c: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg, padding: 16 },
    title: { color: c.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
    card: { backgroundColor: c.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemTitle: { color: c.text, fontSize: 16, fontWeight: '700' },
    subtext: { color: c.subtext },
    primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.accent, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
    primaryBtnText: { color: c.text, fontWeight: '700' },
  });
}
