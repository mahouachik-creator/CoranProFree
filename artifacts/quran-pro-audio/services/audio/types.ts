export type PlaybackQuality = 'economy' | 'standard' | 'hd';

export type AudioSource = {
  surahId: number;
  ayahId?: number;
  streamUrl: string;
  localUri?: string;
  durationMs: number;
  checksum?: string;
};

export type TimestampMarker = {
  surahId: number;
  ayahId: number;
  timestampStartMs: number;
  timestampEndMs: number;
};

export type PlaybackState = {
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
  positionMs: number;
  durationMs: number;
  playbackRate: number;
  quality: PlaybackQuality;
  activeAyahId?: number;
  errorMessage?: string;
};

export type PlaybackListener = (state: PlaybackState) => void;