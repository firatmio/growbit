import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/ThemeProvider';

export default function DiscoverCategoriesScreen({ navigation }: any) {
  const { theme } = useTheme();
  const styles = getStyles(theme.colors);
  const { categories } = useAppStore();
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>Keşfet</Text>
      <View style={{ gap: 12 }}>
        {categories.map((c) => (
          <Pressable key={c.id} style={styles.catCard} onPress={() => navigation.navigate('DiscoverList', { categoryId: c.id })}>
            <View style={styles.iconWrap}>
              <Ionicons name={c.icon as any} size={22} color={theme.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.catTitle}>{c.title}</Text>
              <Text style={styles.subtext}>Önerilen alışkanlıkları keşfet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function getStyles(c: any) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg, padding: 16 },
    title: { color: c.text, fontSize: 20, fontWeight: '800', marginBottom: 12 },
    subtext: { color: c.subtext, marginTop: 6 },
    catCard: { backgroundColor: c.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrap: { width: 36, height: 36, borderRadius: 999, backgroundColor: '#0b1220', alignItems: 'center', justifyContent: 'center' },
    catTitle: { color: c.text, fontSize: 16, fontWeight: '700' },
  });
}
