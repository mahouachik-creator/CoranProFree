import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Artwork } from '@/components/Artwork';
import { useAudio } from '@/context/AudioContext';
import { useColors } from '@/hooks/useColors';

export function MiniPlayer() {
  const colors = useColors();
  const router = useRouter();
  const { currentSurah, currentAyah, progress, isPlaying, togglePlayback } = useAudio();

  return (
    <Pressable
      testID="mini-player"
      onPress={() => router.push('/player')}
      style={({ pressed }) => [styles.container, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
    >
      <Artwork kind={currentSurah.cover} size={48} />
      <View style={styles.copy}>
        <Text style={[styles.kicker, { color: colors.mutedForeground }]}>{`AYAH ${currentAyah} / ${currentSurah.ayahCount}`}</Text>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {currentSurah.transliteration}
        </Text>
      </View>
      <Pressable
        testID="mini-play-button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        onPress={togglePlayback}
        hitSlop={12}
        style={[styles.play, { backgroundColor: colors.primary }]}
      >
        <Feather name={isPlaying ? 'pause' : 'play'} size={18} color={colors.primaryForeground} />
      </Pressable>
      <View style={[styles.progress, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${progress * 100}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    overflow: 'hidden',
  },
  copy: { flex: 1, gap: 4 },
  kicker: { fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  title: { fontSize: 15, fontWeight: '600' },
  play: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  progress: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  progressFill: { height: 2 },
});