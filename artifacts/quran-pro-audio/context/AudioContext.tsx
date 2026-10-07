import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { surahAyahUrl, surahs, type Surah } from '@/data/quran';
import { audioDownloadManager, type DownloadRecord } from '@/services/audio/AudioDownloadManager';

type RepeatMode = 'off' | 'ayah' | 'range';

export type UserPlaylist = {
  id: string;
  name: string;
  surahIds: number[];
  createdAt: number;
};

type AudioContextValue = {
  currentSurah: Surah;
  currentAyah: number;
  progress: number;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  speed: number;
  repeatMode: RepeatMode;
  repeatCount: number;
  completedRepeats: number;
  sleepTimerMinutes: number | null;
  isDownloaded: boolean;
  audioError: string | null;
  storageError: string | null;
  favoriteIds: number[];
  playlists: UserPlaylist[];
  downloads: DownloadRecord[];
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  seek: (seconds: number) => void;
  seekProgress: (ratio: number) => void;
  seekAyah: (ayahId: number) => void;
  skipAyah: (direction: -1 | 1) => void;
  selectSurah: (surah: Surah) => void;
  nextSurah: () => void;
  previousSurah: () => void;
  setSpeed: (speed: number) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setRepeatCount: (count: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  toggleFavorite: (surahId: number) => void;
  createPlaylist: (name: string) => Promise<UserPlaylist>;
  deletePlaylist: (playlistId: string) => void;
  toggleSurahInPlaylist: (playlistId: string, surahId: number) => void;
  playPlaylist: (playlistId: string) => void;
  downloadSurah: (surah: Surah) => Promise<DownloadRecord>;
  pauseDownload: (surahId: number) => Promise<void>;
  removeDownload: (surahId: number) => Promise<void>;
};

type Track = { surahId: number; ayahId: number; repeatIteration: number };

const AudioContext = createContext<AudioContextValue | null>(null);
const AUDIO_STATE_KEY = '@quran-pro-audio/state';
const FAVORITES_KEY = '@quran-pro-audio/favorites';
const PLAYLISTS_KEY = '@quran-pro-audio/playlists';

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentSurah, setCurrentSurah] = useState<Surah>(surahs[0]);
  const [speed, setSpeedState] = useState(1);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>('off');
  const [repeatCount, setRepeatCount] = useState(1);
  const [completedRepeats, setCompletedRepeats] = useState(0);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const tracksRef = useRef<Track[]>([]);
  const queueSurahsRef = useRef<Surah[]>([]);
  const queueReplacementInProgressRef = useRef(false);
  const continueAfterQueueRef = useRef(false);
  const playbackIntentRef = useRef(false);
  const lastAutoAdvancedIndexRef = useRef<number | null>(null);
  const playbackUrisRef = useRef<Set<string>>(new Set());
  const queueGenerationRef = useRef(0);

  const player = useAudioPlaylist({
    sources: [],
    updateInterval: 250,
    loop: 'none',
    crossOrigin: 'anonymous',
  });
  const status = useAudioPlaylistStatus(player);
  const repeatModeRef = useRef(repeatMode);
  const repeatCountRef = useRef(repeatCount);
  const speedRef = useRef(speed);
  repeatModeRef.current = repeatMode;
  repeatCountRef.current = repeatCount;
  speedRef.current = speed;

  const playSurahs = useCallback(
    async (items: Surah[], autoplay: boolean, continueAfterLastSurah = false) => {
      if (!items.length) return;
      const generation = ++queueGenerationRef.current;
      setAudioError(null);
      const nextPlaybackUris = new Set<string>();
      try {
        const records = await audioDownloadManager.list();
        const bySurah = new Map(records.map((record) => [record.surahId, record]));
        const baseTracks: Omit<Track, 'repeatIteration'>[] = [];
        const baseSources: string[] = [];

        for (const surah of items) {
          const localFiles = bySurah.get(surah.id)?.localFiles ?? {};
          for (let ayahId = 1; ayahId <= surah.ayahCount; ayahId += 1) {
            const localUri = localFiles[ayahId];
            const localPlaybackUri = localUri
              ? await audioDownloadManager.getPlaybackUri(localUri)
              : null;
            if (localPlaybackUri) nextPlaybackUris.add(localUri!);
            const uri = localPlaybackUri ?? surahAyahUrl(surah.id, ayahId);
            baseTracks.push({ surahId: surah.id, ayahId });
            baseSources.push(uri);
          }
        }

        if (generation !== queueGenerationRef.current) {
          audioDownloadManager.retainPlaybackUris(playbackUrisRef.current);
          return;
        }
        const mode = repeatModeRef.current;
        const repetitions = mode === 'off' ? 1 : Math.max(1, repeatCountRef.current);
        const tracks: Track[] = [];
        const sources: string[] = [];
        const appendTrack = (index: number, repeatIteration: number) => {
          const track = baseTracks[index];
          const source = baseSources[index];
          if (track && source) {
            tracks.push({ ...track, repeatIteration });
            sources.push(source);
          }
        };
        if (mode === 'ayah') {
          baseTracks.forEach((_, index) => {
            for (let iteration = 1; iteration <= repetitions; iteration += 1) {
              appendTrack(index, iteration);
            }
          });
        } else {
          for (let iteration = 1; iteration <= (mode === 'range' ? repetitions : 1); iteration += 1) {
            baseTracks.forEach((_, index) => appendTrack(index, iteration));
          }
        }

        playbackIntentRef.current = autoplay;
        continueAfterQueueRef.current = continueAfterLastSurah;
        lastAutoAdvancedIndexRef.current = null;
        queueReplacementInProgressRef.current = true;
        player.pause();
        player.clear();
        tracksRef.current = tracks;
        queueSurahsRef.current = [...items];
        setCurrentSurah(items[0]);
        setCompletedRepeats(0);
        sources.forEach((source) => player.add(source));
        playbackUrisRef.current = nextPlaybackUris;
        audioDownloadManager.retainPlaybackUris(nextPlaybackUris);
        player.loop = 'none';
        player.skipTo(0);
        player.playbackRate = speedRef.current;
        queueReplacementInProgressRef.current = false;
        if (autoplay) player.play();
      } catch (error) {
        queueReplacementInProgressRef.current = false;
        audioDownloadManager.retainPlaybackUris(playbackUrisRef.current);
        setAudioError(error instanceof Error ? error.message : 'Impossible de charger cette récitation.');
      }
    },
    [player],
  );

  useEffect(() => {
    let active = true;
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: true,
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    }).catch((error: unknown) => {
      if (active) setAudioError(error instanceof Error ? error.message : 'La sortie audio ne peut pas être configurée.');
    });

    Promise.all([
      AsyncStorage.getItem(AUDIO_STATE_KEY),
      AsyncStorage.getItem(FAVORITES_KEY),
      AsyncStorage.getItem(PLAYLISTS_KEY),
      audioDownloadManager.list(),
    ])
      .then(async ([audioState, favoritesState, playlistsState, storedDownloads]) => {
        if (!active) return;
        const savedAudio = audioState ? JSON.parse(audioState) as { surahId?: number; speed?: number; repeatCount?: number; repeatMode?: RepeatMode } : {};
        const selected = surahs.find((surah) => surah.id === savedAudio.surahId) ?? surahs[0];
        const favoriteList = favoritesState ? JSON.parse(favoritesState) as number[] : [];
        const playlistList = playlistsState ? JSON.parse(playlistsState) as UserPlaylist[] : [];
        setCurrentSurah(selected);
        if (savedAudio.speed) {
          speedRef.current = savedAudio.speed;
          setSpeedState(savedAudio.speed);
        }
        if (savedAudio.repeatCount) {
          repeatCountRef.current = savedAudio.repeatCount;
          setRepeatCount(savedAudio.repeatCount);
        }
        if (savedAudio.repeatMode === 'ayah' || savedAudio.repeatMode === 'range') {
          repeatModeRef.current = savedAudio.repeatMode;
          setRepeatModeState(savedAudio.repeatMode);
        }
        setFavoriteIds(favoriteList.filter((id) => surahs.some((surah) => surah.id === id)));
        setPlaylists(playlistList);
        setDownloads(storedDownloads);
        await playSurahs([selected], false, true);
        setStorageError(null);
        setStorageReady(true);
      })
      .catch((error: unknown) => {
        if (active) {
          const message = error instanceof Error ? error.message : 'Impossible de charger la bibliothèque locale.';
          setAudioError(message);
          setStorageError(message);
        }
      });

    return () => {
      active = false;
    };
  }, [playSurahs]);

  useEffect(() => {
    const subscription = player.addListener('trackChanged', ({ currentIndex }) => {
      if (
        !playbackIntentRef.current ||
        queueReplacementInProgressRef.current ||
        !tracksRef.current[currentIndex]
      ) {
        return;
      }

      // Keep autoplay intent across native/web playlist item boundaries.
      player.play();
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => {
    if (!storageReady) return;
    AsyncStorage.multiSet([
      [AUDIO_STATE_KEY, JSON.stringify({ surahId: currentSurah.id, speed, repeatCount, repeatMode })],
      [FAVORITES_KEY, JSON.stringify(favoriteIds)],
      [PLAYLISTS_KEY, JSON.stringify(playlists)],
    ])
      .then(() => setStorageError(null))
      .catch((error: unknown) => {
        setStorageError(error instanceof Error ? error.message : 'Impossible d’enregistrer les favoris et les playlists.');
      });
  }, [currentSurah.id, favoriteIds, playlists, repeatCount, repeatMode, speed, storageReady]);

  useEffect(() => {
    const track = tracksRef.current[status.currentIndex];
    if (!track || track.surahId === currentSurah.id) return;
    const nextSurah = surahs.find((item) => item.id === track.surahId);
    if (nextSurah) setCurrentSurah(nextSurah);
  }, [currentSurah.id, status.currentIndex]);

  useEffect(() => {
    if (!playbackIntentRef.current || player.playing || player.isBuffering) return;

    // The native players normally advance the playlist themselves. This catches
    // a completed ayah if a platform leaves the queue paused on its final frame.
    const activeIndex = player.currentIndex;
    const activeTrack = tracksRef.current[activeIndex];
    if (!activeTrack || lastAutoAdvancedIndexRef.current === activeIndex) return;

    const duration = player.duration || status.duration;
    const reachedEnd =
      status.didJustFinish ||
      (duration > 0 && player.currentTime >= duration - 0.35);
    if (!reachedEnd) return;

    lastAutoAdvancedIndexRef.current = activeIndex;
    const nextTrackIndex = activeIndex + 1;
    if (tracksRef.current[nextTrackIndex]) {
      player.skipTo(nextTrackIndex);
      player.play();
      return;
    }

    if (!continueAfterQueueRef.current) {
      playbackIntentRef.current = false;
      return;
    }

    const currentSurahIndex = surahs.findIndex((surah) => surah.id === activeTrack.surahId);
    const nextSurah = surahs[currentSurahIndex + 1];
    if (nextSurah) {
      void playSurahs([nextSurah], true, true);
    } else {
      playbackIntentRef.current = false;
    }
  }, [
    player,
    playSurahs,
    status.currentIndex,
    status.currentTime,
    status.didJustFinish,
    status.duration,
    status.isBuffering,
    status.playing,
  ]);

  useEffect(() => {
    const track = tracksRef.current[status.currentIndex];
    if (track) setCompletedRepeats(Math.max(0, track.repeatIteration - 1));
    if (status.didJustFinish && repeatMode !== 'off') setCompletedRepeats(repeatCount);
    if (repeatMode === 'off') setCompletedRepeats(0);
  }, [repeatCount, repeatMode, status.currentIndex, status.didJustFinish]);

  useEffect(() => {
    if (!sleepTimerMinutes || !status.playing) return;
    const timer = setTimeout(() => {
      playbackIntentRef.current = false;
      player.pause();
      setSleepTimerMinutes(null);
    }, sleepTimerMinutes * 60 * 1000);
    return () => clearTimeout(timer);
  }, [player, sleepTimerMinutes, status.playing]);

  useEffect(() => () => {
    audioDownloadManager.retainPlaybackUris(new Set());
  }, []);

  const toggleFavorite = useCallback((surahId: number) => {
    setFavoriteIds((ids) => ids.includes(surahId) ? ids.filter((id) => id !== surahId) : [...ids, surahId]);
  }, []);

  const createPlaylist = useCallback(async (name: string) => {
    const playlist: UserPlaylist = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      surahIds: [],
      createdAt: Date.now(),
    };
    setPlaylists((items) => [...items, playlist]);
    return playlist;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists((items) => items.filter((item) => item.id !== playlistId));
  }, []);

  const toggleSurahInPlaylist = useCallback((playlistId: string, surahId: number) => {
    setPlaylists((items) => items.map((playlist) => {
      if (playlist.id !== playlistId) return playlist;
      const includesSurah = playlist.surahIds.includes(surahId);
      return {
        ...playlist,
        surahIds: includesSurah
          ? playlist.surahIds.filter((id) => id !== surahId)
          : [...playlist.surahIds, surahId],
      };
    }));
  }, []);

  const playPlaylist = useCallback((playlistId: string) => {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;
    const selected = playlist.surahIds
      .map((id) => surahs.find((surah) => surah.id === id))
      .filter((surah): surah is Surah => !!surah);
    void playSurahs(selected, true, false);
  }, [playSurahs, playlists]);

  const selectSurah = useCallback((surah: Surah) => {
    void playSurahs([surah], true, true);
  }, [playSurahs]);

  const rebuildQueueForRepeat = useCallback(() => {
    const items = [...queueSurahsRef.current];
    if (!items.length) return;
    const activeTrack = tracksRef.current[status.currentIndex];
    const currentTime = status.currentTime;
    const shouldResume = playbackIntentRef.current;
    const continueAfterLastSurah = continueAfterQueueRef.current;
    void playSurahs(items, false, continueAfterLastSurah).then(async () => {
      if (activeTrack) {
        const target = tracksRef.current.findIndex(
          (track) => track.surahId === activeTrack.surahId && track.ayahId === activeTrack.ayahId,
        );
        if (target >= 0) {
          player.skipTo(target);
          if (currentTime > 0) await player.seekTo(currentTime);
        }
      }
      if (shouldResume) {
        playbackIntentRef.current = true;
        player.play();
      }
    });
  }, [playSurahs, player, status.currentIndex, status.currentTime]);

  const stepSurah = useCallback((direction: -1 | 1) => {
    const index = surahs.findIndex((surah) => surah.id === currentSurah.id);
    const nextIndex = (index + direction + surahs.length) % surahs.length;
    selectSurah(surahs[nextIndex]);
  }, [currentSurah.id, selectSurah]);

  const currentAyah = tracksRef.current[status.currentIndex]?.ayahId ?? 1;
  const duration = status.duration || 0;
  const progress = Math.max(0, Math.min(1, (currentAyah - 1 + (duration ? status.currentTime / duration : 0)) / currentSurah.ayahCount));
  const isDownloaded = downloads.some(
    (record) => record.surahId === currentSurah.id &&
      record.status === 'complete' &&
      record.downloadedAyahs === currentSurah.ayahCount,
  );

  const value = useMemo<AudioContextValue>(() => ({
    currentSurah,
    currentAyah,
    progress,
    isPlaying: status.playing,
    isBuffering: status.isBuffering,
    position: status.currentTime,
    duration,
    speed,
    repeatMode,
    repeatCount,
    completedRepeats,
    sleepTimerMinutes,
    isDownloaded,
    audioError,
    storageError,
    favoriteIds,
    playlists,
    downloads,
    play: () => {
      setAudioError(null);
      playbackIntentRef.current = true;
      player.play();
    },
    pause: () => {
      playbackIntentRef.current = false;
      player.pause();
    },
    togglePlayback: () => {
      if (status.playing) {
        playbackIntentRef.current = false;
        player.pause();
      }
      else {
        setAudioError(null);
        playbackIntentRef.current = true;
        player.play();
      }
    },
    seek: (seconds) => {
      void player.seekTo(Math.max(0, Math.min(status.duration || 0, seconds)));
    },
    seekProgress: (ratio) => {
      const targetAyah = Math.min(currentSurah.ayahCount, Math.max(1, Math.floor(ratio * currentSurah.ayahCount) + 1));
      const trackIndex = tracksRef.current.findIndex((track) => track.surahId === currentSurah.id && track.ayahId === targetAyah);
      if (trackIndex >= 0) player.skipTo(trackIndex);
    },
    seekAyah: (ayahId) => {
      const trackIndex = tracksRef.current.findIndex((track) => track.surahId === currentSurah.id && track.ayahId === ayahId);
      if (trackIndex >= 0) player.skipTo(trackIndex);
    },
    skipAyah: (direction) => {
      const targetIndex = Math.max(0, Math.min(tracksRef.current.length - 1, status.currentIndex + direction));
      if (tracksRef.current[targetIndex]) player.skipTo(targetIndex);
    },
    selectSurah,
    nextSurah: () => stepSurah(1),
    previousSurah: () => stepSurah(-1),
    setSpeed: (nextSpeed) => {
      setSpeedState(nextSpeed);
      player.playbackRate = nextSpeed;
    },
    setRepeatMode: (mode) => {
      repeatModeRef.current = mode;
      setRepeatModeState(mode);
      setCompletedRepeats(0);
      rebuildQueueForRepeat();
    },
    setRepeatCount: (count) => {
      repeatCountRef.current = count;
      setRepeatCount(Math.max(1, Math.min(7, count)));
      setCompletedRepeats(0);
      rebuildQueueForRepeat();
    },
    setSleepTimer: setSleepTimerMinutes,
    toggleFavorite,
    createPlaylist,
    deletePlaylist,
    toggleSurahInPlaylist,
    playPlaylist,
    downloadSurah: async (surah) => {
      setAudioError(null);
      try {
        const record = await audioDownloadManager.downloadSurah(surah, (nextRecord) => {
          setDownloads((items) => [...items.filter((item) => item.surahId !== nextRecord.surahId), nextRecord]);
        });
        setDownloads((items) => [...items.filter((item) => item.surahId !== record.surahId), record]);
        return record;
      } catch (error) {
        setAudioError(error instanceof Error ? error.message : 'Impossible de télécharger cette sourate.');
        throw error;
      }
    },
    pauseDownload: async (surahId) => {
      await audioDownloadManager.pause(surahId);
      setDownloads(await audioDownloadManager.list());
    },
    removeDownload: async (surahId) => {
      await audioDownloadManager.remove(surahId);
      setDownloads(await audioDownloadManager.list());
    },
  }), [
    audioError,
    completedRepeats,
    createPlaylist,
    currentAyah,
    currentSurah,
    deletePlaylist,
    downloads,
    duration,
    favoriteIds,
    isDownloaded,
    playPlaylist,
    playlists,
    player,
    progress,
    repeatCount,
    repeatMode,
    rebuildQueueForRepeat,
    selectSurah,
    sleepTimerMinutes,
    storageError,
    speed,
    status.currentIndex,
    status.currentTime,
    status.duration,
    status.isBuffering,
    status.playing,
    stepSurah,
    toggleFavorite,
    toggleSurahInPlaylist,
  ]);

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used inside AudioProvider');
  return context;
}
