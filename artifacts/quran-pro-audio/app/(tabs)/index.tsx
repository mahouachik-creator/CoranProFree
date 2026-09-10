import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Artwork } from '@/components/Artwork';
import { MiniPlayer } from '@/components/MiniPlayer';
import { surahs } from '@/data/quran';
import { useAudio } from '@/context/AudioContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentSurah, selectSurah, isPlaying } = useAudio();
  const featured = useMemo(() => surahs.find((surah) => surah.featured) ?? surahs[0], []);

  const openSurah = async (surah = featured) => {
    await Haptics.selectionAsync();
    selectSurah(surah);
    router.push('/player');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 112 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled
        data={surahs.slice(1)}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.accent }]}>FRIDAY • 11 SEP</Text>
                <Text style={[styles.greeting, { color: colors.foreground }]}>Assalamu alaikum</Text>
              </View>
              <Pressable testID="profile-button" style={[styles.profile, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.profileText, { color: colors.primary }]}>M</Text>
              </Pressable>
            </View>

            <View style={styles.heroHeading}>
              <View>
                <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>CONTINUE LISTENING</Text>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Make space for{'\n'}something meaningful.</Text>
              </View>
              <Text style={[styles.arabicAccent, { color: colors.primary }]}>القرآن</Text>
            </View>

            <Pressable
              testID="featured-surah"
              onPress={() => openSurah(featured)}
              style={({ pressed }) => [styles.featured, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.94 : 1 }]}
            >
              <Artwork kind={featured.cover} size={104} />
              <View style={styles.featuredCopy}>
                <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
                  <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.pillText, { color: colors.secondaryForeground }]}>MISHARY ALAFASY</Text>
                </View>
                <Text style={[styles.featuredTitle, { color: colors.foreground }]}>{featured.transliteration}</Text>
                <Text style={[styles.featuredSubtitle, { color: colors.mutedForeground }]}>{featured.translation}</Text>
                <View style={styles.featuredBottom}>
                  <Text style={[styles.duration, { color: colors.mutedForeground }]}>{featured.duration} · {featured.verses} ayahs</Text>
                  <View style={[styles.circlePlay, { backgroundColor: colors.primary }]}>
                    <Feather name={isPlaying && currentSurah.id === featured.id ? 'pause' : 'play'} size={17} color={colors.primaryForeground} />
                  </View>
                </View>
              </View>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Explore surahs</Text>
              <Pressable onPress={() => router.push('/library')} hitSlop={10}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            testID={`surah-${item.id}`}
            onPress={() => openSurah(item)}
            style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
          >
            <Text style={[styles.number, { color: colors.accent }]}>{String(item.id).padStart(3, '0')}</Text>
            <Artwork kind={item.cover} size={52} />
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.transliteration}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{item.translation} · {item.verses} ayahs</Text>
            </View>
            <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={[styles.footerArabic, { color: colors.primary }]}>وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</Text>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>“And recite the Quran with measured recitation.”</Text>
          </View>
        }
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  greeting: { fontSize: 25, fontWeight: '600', letterSpacing: -0.6 },
  profile: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileText: { fontSize: 16, fontWeight: '700' },
  heroHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  sectionEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6, marginBottom: 10 },
  sectionTitle: { fontSize: 28, fontWeight: '600', lineHeight: 33, letterSpacing: -0.8 },
  arabicAccent: { fontSize: 28, marginBottom: 6 },
  featured: { borderRadius: 24, borderWidth: 1, padding: 12, flexDirection: 'row', gap: 14, marginBottom: 32 },
  featuredCopy: { flex: 1, paddingVertical: 3 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  featuredTitle: { fontSize: 23, fontWeight: '600', marginTop: 11, letterSpacing: -0.5 },
  featuredSubtitle: { fontSize: 12, marginTop: 3 },
  featuredBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  duration: { fontSize: 11 },
  circlePlay: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionLabel: { fontSize: 19, fontWeight: '600', letterSpacing: -0.3 },
  seeAll: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 11, borderBottomWidth: 1 },
  number: { width: 29, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSubtitle: { fontSize: 11 },
  footer: { alignItems: 'center', paddingTop: 38, paddingBottom: 12, gap: 8 },
  footerArabic: { fontSize: 22 },
  footerText: { fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
  miniDock: { position: 'absolute', left: 12, right: 12 },
});
