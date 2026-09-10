import type {
  AudioSource,
  PlaybackListener,
  PlaybackQuality,
  PlaybackState,
} from './types';

const qualityBitrates: Record<PlaybackQuality, number> = {
  economy: 64,
  standard: 128,
  hd: 320,
};

/**
 * Platform-neutral audio contract. A native adapter can bind this surface to
 * AVAudioSession/ExoPlayer while the UI stays subscribed to one state stream.
 */
export class AudioPlayerService {
  private source?: AudioSource;
  private listeners = new Set<PlaybackListener>();
  private state: PlaybackState = {
    status: 'idle',
    positionMs: 0,
    durationMs: 0,
    playbackRate: 1,
    quality: 'standard',
  };

  async load(source: AudioSource, quality: PlaybackQuality = 'standard') {
    this.source = source;
    this.update({
      status: 'ready',
      positionMs: 0,
      durationMs: source.durationMs,
      quality,
    });
  }

  play() {
    if (!this.source) throw new Error('Load an audio source before playing.');
    this.update({ status: 'playing' });
  }

  pause() {
    this.update({ status: 'paused' });
  }

  seekTo(positionMs: number) {
    const position = Math.max(0, Math.min(positionMs, this.state.durationMs));
    this.update({ positionMs: position });
  }

  setPlaybackRate(playbackRate: number) {
    if (playbackRate < 0.5 || playbackRate > 2) {
      throw new Error('Playback rate must be between 0.5x and 2x.');
    }
    this.update({ playbackRate });
  }

  setQuality(quality: PlaybackQuality) {
    this.update({ quality });
  }

  getBitrate() {
    return qualityBitrates[this.state.quality];
  }

  subscribe(listener: PlaybackListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState() {
    return this.state;
  }

  private update(patch: Partial<PlaybackState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const audioPlayerService = new AudioPlayerService();