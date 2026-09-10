import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { reciters } from '@/data/quran';
import { useColors } from '@/hooks/useColors';

export default function RecitersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={reciters}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}><Feather name="arrow-left" size={22} color={colors.foreground} /></Pressable>
            <View style={styles.headerCopy}>
              <Text style={[styles.eyebrow, { color: colors.accent }]}>RECITERS</Text>
              <Text style={[styles.heading, { color: colors.foreground }]}>Find your voice.</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: item.color }]}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.origin} · {item.style}</Text>
              <View style={styles.downloadRow}>
                <Feather name={item.downloaded ? 'check-circle' : 'cloud'} size={13} color={item.downloaded ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.downloadText, { color: item.downloaded ? colors.primary : colors.mutedForeground }]}>{item.downloaded ? 'Downloaded' : 'Stream when online'}</Text>
              </View>
            </View>
            <Pressable
              testID={`reciter-${item.id}`}
              onPress={async () => {
                await Haptics.selectionAsync();
              }}
              style={[styles.action, { backgroundColor: item.downloaded ? colors.secondary : colors.primary }]}
            >
              <Feather name={item.downloaded ? 'check' : 'download'} size={17} color={item.downloaded ? colors.primary : colors.primaryForeground} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 11 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 23 },
  headerCopy: { gap: 6 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  heading: { fontSize: 28, fontWeight: '600', letterSpacing: -0.7 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 12, gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  copy: { flex: 1, gap: 4 },
  name: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 11 },
  downloadRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  downloadText: { fontSize: 10, fontWeight: '600' },
  action: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});