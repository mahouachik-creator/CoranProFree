import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Artwork } from '@/components/Artwork';
import { Waveform } from '@/components/Waveform';
import { ayahs } from '@/data/quran';
import { useAudio } from '@/context/AudioContext';
import { useColors } from '@/hooks/useColors';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

export default function PlayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    currentSurah,
    isPlaying,
    position,
    duration,
    speed,
    repeatMode,
    repeatCount,
    completedRepeats,
    sleepTimerMinutes,
    togglePlayback,
    seek,
    nextSurah,
    previousSurah,
    setSpeed,
    setRepeatMode,
    setRepeatCount,
    setSleepTimer,
  } = useAudio();
  const [showOptions, setShowOptions] = useState(false);
  const progress = duration ? position / duration : 0;
  const activeAyah = Math.min(ayahs.length - 1, Math.floor(progress * ayahs.length));
  const speeds = [0.75, 1, 1.25, 1.5];
  const repeatLabel = repeatMode === 'off' ? 'Off' : repeatMode === 'ayah' ? 'Ayah' : 'Range';

  const setTimer = () => {
    const options = [15, 30, 60];
    const next = sleepTimerMinutes ? null : options[0];
    setSleepTimer(next);
  };

  const onSeek = (ratio: number) => seek(ratio * duration);

  const chapterDetails = useMemo(() => `${currentSurah.verses} ayahs  ·  Mishary Alafasy`, [currentSurah.verses]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable testID="close-player" onPress={() => router.back()} hitSlop={12} style={styles.iconButton}>
          <Feather name="chevron-down" size={25} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.mutedForeground }]}>NOW PLAYING</Text>
        <Pressable onPress={() => setShowOptions((visible) => !visible)} hitSlop={12} style={styles.iconButton}>
          <Feather name="more-horizontal" size={23} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.artworkWrap}>
          <Artwork kind={currentSurah.cover} size={286} />
        </View>
        <View style={styles.titleBlock}>
          <View>
            <Text style={[styles.chapter, { color: colors.foreground }]}>{currentSurah.transliteration}</Text>
            <Text style={[styles.chapterMeta, { color: colors.mutedForeground }]}>{chapterDetails}</Text>
          </View>
          <Pressable hitSlop={10}>
            <Feather name="heart" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.waveform}>
          <Waveform progress={progress} />
          <Pressable testID="seek-track" onPress={(event) => onSeek(event.nativeEvent.locationX / 320)} style={styles.seekOverlay} />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: colors.foreground }]}>{formatTime(position)}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>-{formatTime(duration - position)}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={previousSurah} hitSlop={14}><Feather name="skip-back" size={23} color={colors.foreground} /></Pressable>
          <Pressable onPress={() => seek(Math.max(0, position - 15))} hitSlop={12}><Feather name="rotate-ccw" size={20} color={colors.mutedForeground} /></Pressable>
          <Pressable
            testID="main-play-button"
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              togglePlayback();
            }}
            style={[styles.mainPlay, { backgroundColor: colors.primary }]}
          >
            <Feather name={isPlaying ? 'pause' : 'play'} size={26} color={colors.primaryForeground} />
          </Pressable>
          <Pressable onPress={() => seek(Math.min(duration, position + 15))} hitSlop={12}><Feather name="rotate-cw" size={20} color={colors.mutedForeground} /></Pressable>
          <Pressable onPress={nextSurah} hitSlop={14}><Feather name="skip-forward" size={23} color={colors.foreground} /></Pressable>
        </View>

        <View style={[styles.toolRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <Pressable style={styles.tool} onPress={() => setRepeatMode(repeatMode === 'off' ? 'ayah' : repeatMode === 'ayah' ? 'range' : 'off')}>
            <Feather name="repeat" size={18} color={repeatMode === 'off' ? colors.mutedForeground : colors.accent} />
            <Text style={[styles.toolLabel, { color: repeatMode === 'off' ? colors.mutedForeground : colors.accent }]}>{repeatLabel}</Text>
          </Pressable>
          <Pressable style={styles.tool} onPress={() => setTimer()}>
            <Feather name="moon" size={18} color={sleepTimerMinutes ? colors.accent : colors.mutedForeground} />
            <Text style={[styles.toolLabel, { color: sleepTimerMinutes ? colors.accent : colors.mutedForeground }]}>{sleepTimerMinutes ? `${sleepTimerMinutes} min` : 'Sleep'}</Text>
          </Pressable>
          <Pressable style={styles.tool} onPress={() => setShowOptions((visible) => !visible)}>
            <Feather name="sliders" size={18} color={colors.mutedForeground} />
            <Text style={[styles.toolLabel, { color: colors.mutedForeground }]}>{speed}x</Text>
          </Pressable>
        </View>

        {showOptions && (
          <View style={[styles.options, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.optionHeader}>
              <Text style={[styles.optionTitle, { color: colors.foreground }]}>Playback settings</Text>
              <Pressable onPress={() => setShowOptions(false)}><Feather name="x" size={18} color={colors.mutedForeground} /></Pressable>
            </View>
            <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>SPEED</Text>
            <View style={styles.optionChoices}>
              {speeds.map((option) => (
                <Pressable key={option} onPress={() => setSpeed(option)} style={[styles.choice, { backgroundColor: speed === option ? colors.primary : colors.secondary }]}>
                  <Text style={[styles.choiceText, { color: speed === option ? colors.primaryForeground : colors.secondaryForeground }]}>{option}x</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>REPEAT COUNT</Text>
            <View style={styles.optionChoices}>
              {[1, 3, 5, 7].map((option) => (
                <Pressable key={option} onPress={() => setRepeatCount(option)} style={[styles.choice, { backgroundColor: repeatCount === option ? colors.primary : colors.secondary }]}>
                  <Text style={[styles.choiceText, { color: repeatCount === option ? colors.primaryForeground : colors.secondaryForeground }]}>{option === 1 ? 'Once' : `${option}×`}</Text>
                </Pressable>
              ))}
            </View>
            {repeatMode !== 'off' && <Text style={[styles.repeatHint, { color: colors.accent }]}>{completedRepeats} of {repeatCount} repetitions completed</Text>}
          </View>
        )}

        <View style={styles.ayahHeader}>
          <Text style={[styles.ayahHeading, { color: colors.foreground }]}>Live transcript</Text>
          <View style={[styles.livePill, { backgroundColor: colors.secondary }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.liveText, { color: colors.primary }]}>SYNCED</Text>
          </View>
        </View>
        <View style={[styles.transcript, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ayahs.map((ayah, index) => (
            <View key={ayah.id} style={[styles.ayah, index === activeAyah && { backgroundColor: colors.secondary, borderRadius: 14 }]}>
              <Text style={[styles.ayahNumber, { color: index === activeAyah ? colors.accent : colors.mutedForeground }]}>{ayah.id}</Text>
              <View style={styles.ayahCopy}>
                <Text style={[styles.ayahArabic, { color: index === activeAyah ? colors.foreground : colors.mutedForeground }]}>{ayah.arabic}</Text>
                <Text style={[styles.ayahTranslation, { color: colors.mutedForeground }]}>{ayah.translation}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  topTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  iconButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 25 },
  artworkWrap: { alignItems: 'center', marginTop: 20, marginBottom: 29 },
  titleBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chapter: { fontSize: 26, fontWeight: '600', letterSpacing: -0.6 },
  chapterMeta: { fontSize: 12, marginTop: 5 },
  waveform: { height: 55, marginTop: 29, position: 'relative', justifyContent: 'center' },
  seekOverlay: StyleSheet.absoluteFill,
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { fontSize: 10, fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 21 },
  mainPlay: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  toolRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderBottomWidth: 1, marginTop: 27, paddingVertical: 17 },
  tool: { alignItems: 'center', gap: 6, minWidth: 70 },
  toolLabel: { fontSize: 10, fontWeight: '600' },
  options: { borderWidth: 1, borderRadius: 18, padding: 15, marginTop: 16, gap: 13 },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionTitle: { fontSize: 14, fontWeight: '600' },
  optionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.3 },
  optionChoices: { flexDirection: 'row', gap: 8 },
  choice: { borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 },
  choiceText: { fontSize: 11, fontWeight: '600' },
  repeatHint: { fontSize: 11 },
  ayahHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 31, marginBottom: 11 },
  ayahHeading: { fontSize: 18, fontWeight: '600' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  transcript: { borderRadius: 18, borderWidth: 1, padding: 7 },
  ayah: { flexDirection: 'row', padding: 12, gap: 12 },
  ayahNumber: { fontSize: 11, fontWeight: '700', width: 16, paddingTop: 3 },
  ayahCopy: { flex: 1, alignItems: 'flex-end', gap: 6 },
  ayahArabic: { fontSize: 19, textAlign: 'right', lineHeight: 31 },
  ayahTranslation: { alignSelf: 'stretch', fontSize: 11, lineHeight: 17, textAlign: 'left' },
});