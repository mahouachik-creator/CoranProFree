import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { surahs, type Surah } from '@/data/quran';

type RepeatMode = 'off' | 'ayah' | 'range';

type AudioContextValue = {
  currentSurah: Surah;
  isPlaying: boolean;
  position: number;
  duration: number;
  speed: number;
  repeatMode: RepeatMode;
  repeatCount: number;
  completedRepeats: number;
  sleepTimerMinutes: number | null;
  isDownloaded: boolean;
  audioError: string | null;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  seek: (seconds: number) => void;
  selectSurah: (surah: Surah) => void;
  nextSurah: () => void;
  previousSurah: () => void;
  setSpeed: (speed: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setRepeatCount: (count: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  toggleDownloaded: () => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);
const AUDIO_STATE_KEY = '@quran-pro-audio/state';

const durationFor = (surah: Surah) => {
  const [minutes, seconds] = surah.duration.split(':').map(Number);
  return minutes * 60 + seconds;
};

const audioUrlFor = (surah: Surah) =>
  `https://everyayah.com/data/Alafasy_128kbps/${String(surah.id).padStart(3, '0')}001.mp3`;

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentSurah, setCurrentSurah] = useState<Surah>(surahs[0]);
  const [speed, setSpeedState] = useState(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [repeatCount, setRepeatCount] = useState(1);
  const [completedRepeats, setCompletedRepeats] = useState(0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState<Record<number, boolean>>({ 36: true });
  const [audioError, setAudioError] = useState<string | null>(null);
  const shouldAutoplayRef = useRef(false);
  const player = useAudioPlayer(null, {
    updateInterval: 250,
    preferredForwardBufferDuration: 12,
    keepAudioSessionActive: true,
  });
  const status = useAudioPlayerStatus(player);

  const duration = durationFor(currentSurah);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: true,
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    }).catch((error: unknown) => {
      setAudioError(error instanceof Error ? error.message : 'Unable to configure audio output.');
    });
  }, []);

  useEffect(() => {
    setAudioError(null);
    try {
      player.replace(audioUrlFor(currentSurah));
      if (shouldAutoplayRef.current) {
        shouldAutoplayRef.current = false;
        player.play();
      }
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : 'Unable to load this recitation.');
    }
  }, [currentSurah.id, player]);

  useEffect(() => {
    AsyncStorage.getItem(AUDIO_STATE_KEY)
      .then((stored) => {
        if (!stored) return;
        const state = JSON.parse(stored) as {
          surahId?: number;
          speed?: number;
          repeatCount?: number;
          downloaded?: Record<number, boolean>;
        };
        const savedSurah = surahs.find((surah) => surah.id === state.surahId);
        if (savedSurah) setCurrentSurah(savedSurah);
        if (state.speed) setSpeedState(state.speed);
        if (state.repeatCount) setRepeatCount(state.repeatCount);
        if (state.downloaded) setDownloaded(state.downloaded);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      AUDIO_STATE_KEY,
      JSON.stringify({
        surahId: currentSurah.id,
        speed,
        repeatCount,
        downloaded,
      }),
    ).catch(() => undefined);
  }, [currentSurah.id, speed, repeatCount, downloaded]);

  useEffect(() => {
    if (!status.didJustFinish) return;
    if (repeatMode !== 'off' && completedRepeats + 1 < repeatCount) {
      setCompletedRepeats((count) => count + 1);
      void player.seekTo(0);
      player.play();
      return;
    }
    setCompletedRepeats(0);
  }, [completedRepeats, player, repeatCount, repeatMode, status.didJustFinish]);

  useEffect(() => {
    if (!sleepTimerMinutes || !status.playing) return;
    const timer = setTimeout(() => {
      player.pause();
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [player, sleepTimerMinutes, status.playing]);

  const selectSurah = (surah: Surah) => {
    shouldAutoplayRef.current = true;
    setCurrentSurah(surah);
    setCompletedRepeats(0);
  };

  const stepSurah = (direction: 1 | -1) => {
    const index = surahs.findIndex((surah) => surah.id === currentSurah.id);
    const nextIndex = (index + direction + surahs.length) % surahs.length;
    selectSurah(surahs[nextIndex]);
  };

  const value = useMemo<AudioContextValue>(
    () => ({
      currentSurah,
      isPlaying: status.playing,
      position: status.currentTime,
      duration: status.duration || duration,
      speed,
      repeatMode,
      repeatCount,
      completedRepeats,
      sleepTimerMinutes,
      isDownloaded: !!downloaded[currentSurah.id],
      audioError,
      play: () => {
        setAudioError(null);
        player.play();
      },
      pause: () => player.pause(),
      togglePlayback: () => {
        if (status.playing) player.pause();
        else {
          setAudioError(null);
          player.play();
        }
      },
      seek: (seconds) => {
        void player.seekTo(Math.max(0, Math.min(status.duration || duration, seconds)));
      },
      selectSurah,
      nextSurah: () => stepSurah(1),
      previousSurah: () => stepSurah(-1),
      setSpeed: (nextSpeed) => {
        setSpeedState(nextSpeed);
        player.setPlaybackRate(nextSpeed, 'high');
      },
      setRepeatMode: (mode) => {
        setRepeatMode(mode);
        setCompletedRepeats(0);
      },
      setRepeatCount: (count) => {
        setRepeatCount(count);
        setCompletedRepeats(0);
      },
      setSleepTimer: setSleepTimerMinutes,
      toggleDownloaded: () =>
        setDownloaded((state) => ({
          ...state,
          [currentSurah.id]: !state[currentSurah.id],
        })),
    }),
    [
      completedRepeats,
      currentSurah,
      downloaded,
      duration,
      audioError,
      player,
      repeatCount,
      repeatMode,
      sleepTimerMinutes,
      speed,
      status.currentTime,
      status.duration,
      status.playing,
    ],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used inside AudioProvider');
  return context;
}