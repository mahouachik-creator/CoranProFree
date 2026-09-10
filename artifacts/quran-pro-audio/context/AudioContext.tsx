import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentSurah, setCurrentSurah] = useState<Surah>(surahs[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [speed, setSpeedState] = useState(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [repeatCount, setRepeatCount] = useState(1);
  const [completedRepeats, setCompletedRepeats] = useState(0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [downloaded, setDownloaded] = useState<Record<number, boolean>>({ 36: true });

  const duration = durationFor(currentSurah);

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
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setPosition((current) => {
        const next = current + speed;
        if (next < duration) return next;
        if (repeatMode !== 'off' && completedRepeats + 1 < repeatCount) {
          setCompletedRepeats((count) => count + 1);
          return 0;
        }
        setCompletedRepeats(0);
        setIsPlaying(false);
        return duration;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [completedRepeats, duration, isPlaying, repeatCount, repeatMode, speed]);

  useEffect(() => {
    if (!sleepTimerMinutes || !isPlaying) return;
    const timer = setTimeout(() => {
      setIsPlaying(false);
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, sleepTimerMinutes]);

  const selectSurah = (surah: Surah) => {
    setCurrentSurah(surah);
    setPosition(0);
    setCompletedRepeats(0);
    setIsPlaying(true);
  };

  const stepSurah = (direction: 1 | -1) => {
    const index = surahs.findIndex((surah) => surah.id === currentSurah.id);
    const nextIndex = (index + direction + surahs.length) % surahs.length;
    selectSurah(surahs[nextIndex]);
  };

  const value = useMemo<AudioContextValue>(
    () => ({
      currentSurah,
      isPlaying,
      position,
      duration,
      speed,
      repeatMode,
      repeatCount,
      completedRepeats,
      sleepTimerMinutes,
      isDownloaded: !!downloaded[currentSurah.id],
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      togglePlayback: () => setIsPlaying((playing) => !playing),
      seek: (seconds) => setPosition(Math.max(0, Math.min(duration, seconds))),
      selectSurah,
      nextSurah: () => stepSurah(1),
      previousSurah: () => stepSurah(-1),
      setSpeed: setSpeedState,
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
      isPlaying,
      position,
      repeatCount,
      repeatMode,
      sleepTimerMinutes,
      speed,
    ],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used inside AudioProvider');
  return context;
}