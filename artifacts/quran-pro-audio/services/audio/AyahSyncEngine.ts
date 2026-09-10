import type { TimestampMarker } from './types';

export class AyahSyncEngine {
  private readonly markers: TimestampMarker[];
  private activeAyahId?: number;
  private listeners = new Set<(ayahId: number | undefined) => void>();

  constructor(markers: TimestampMarker[] = []) {
    this.markers = [...markers].sort((a, b) => a.timestampStartMs - b.timestampStartMs);
  }

  getActiveAyah(positionMs: number) {
    const marker = this.markers.find(
      (item) => positionMs >= item.timestampStartMs && positionMs < item.timestampEndMs,
    );
    const nextAyahId = marker?.ayahId;
    if (nextAyahId !== this.activeAyahId) {
      this.activeAyahId = nextAyahId;
      this.listeners.forEach((listener) => listener(nextAyahId));
    }
    return nextAyahId;
  }

  subscribe(listener: (ayahId: number | undefined) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  replaceMarkers(markers: TimestampMarker[]) {
    this.markers.splice(0, this.markers.length, ...markers.sort((a, b) => a.timestampStartMs - b.timestampStartMs));
    this.activeAyahId = undefined;
  }
}