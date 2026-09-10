import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Artwork } from '@/components/Artwork';
import { MiniPlayer } from '@/components/MiniPlayer';
import { reciters, surahs } from '@/data/quran';
import { useAudio } from '@/context/AudioContext';
import { useColors } from '@/hooks/useColors';

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectSurah, isDownloaded, toggleDownloaded } = useAudio();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={surahs}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 126 }]}
        ListHeaderComponent={
          <View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR LIBRARY</Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>Listen your way.</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>Keep your favorite recitations close, even when you are offline.</Text>
            <View style={[styles.storageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.storageIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="download-cloud" size={20} color={colors.primary} />
              </View>
              <View style={styles.storageCopy}>
                <Text style={[styles.storageTitle, { color: colors.foreground }]}>Offline library</Text>
                <Text style={[styles.storageSubtitle, { color: colors.mutedForeground }]}>1 surah downloaded · 17.4 MB used</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </View>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Reciters</Text>
              <Pressable onPress={() => router.push('/reciters')}>
                <Text style={[styles.link, { color: colors.primary }]}>Manage</Text>
              </Pressable>
            </View>
            <View style={styles.reciters}>
              {reciters.slice(0, 2).map((reciter) => (
                <Pressable key={reciter.id} onPress={() => router.push('/reciters')} style={[styles.reciter, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.avatar, { backgroundColor: reciter.color }]}>
                    <Text style={styles.avatarText}>{reciter.initials}</Text>
                  </View>
                  <View style={styles.reciterCopy}>
                    <Text style={[styles.reciterName, { color: colors.foreground }]} numberOfLines={1}>{reciter.name}</Text>
                    <Text style={[styles.reciterMeta, { color: colors.mutedForeground }]}>{reciter.style} · {reciter.origin}</Text>
                  </View>
                  <Feather name={reciter.downloaded ? 'check-circle' : 'plus-circle'} size={18} color={reciter.downloaded ? colors.primary : colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Downloaded surahs</Text>
              <Text style={[styles.count, { color: colors.mutedForeground }]}>1 / 114</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const downloaded = item.id === 36 ? true : isDownloaded && false;
          return (
            <Pressable
              onPress={async () => {
                await Haptics.selectionAsync();
                selectSurah(item);
                router.push('/player');
              }}
              style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
            >
              <Artwork kind={item.cover} size={50} />
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.transliteration}</Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{item.translation} · {item.duration}</Text>
              </View>
              <Pressable onPress={toggleDownloaded} hitSlop={12}>
                <Feather name={downloaded ? 'check-circle' : 'download'} size={19} color={downloaded ? colors.primary : colors.mutedForeground} />
              </Pressable>
            </Pressable>
          );
        }}
      />
      <View style={[styles.miniDock, { bottom: insets.bottom + 74 }]}>
        <MiniPlayer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  heading: { fontSize: 30, fontWeight: '600', letterSpacing: -0.8 },
  description: { fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 310 },
  storageCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 13, marginTop: 25, gap: 12 },
  storageIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  storageCopy: { flex: 1, gap: 4 },
  storageTitle: { fontSize: 14, fontWeight: '600' },
  storageSubtitle: { fontSize: 11 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 30, marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '600' },
  link: { fontSize: 12, fontWeight: '600' },
  count: { fontSize: 11 },
  reciters: { gap: 9 },
  reciter: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, borderWidth: 1, padding: 10 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  reciterCopy: { flex: 1, gap: 4 },
  reciterName: { fontSize: 13, fontWeight: '600' },
  reciterMeta: { fontSize: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1 },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 11 },
  miniDock: { position: 'absolute', left: 12, right: 12 },
});