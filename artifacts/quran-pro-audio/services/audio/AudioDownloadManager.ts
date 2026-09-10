import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AudioSource } from './types';

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'complete' | 'error';

type DownloadRecord = {
  surahId: number;
  status: DownloadStatus;
  localUri?: string;
  checksum?: string;
  updatedAt: number;
};

const DOWNLOADS_KEY = '@quran-pro-audio/downloads';

/**
 * Persistent download manifest. Native background transfer can implement the
 * actual file transport behind this queue without changing the UI contract.
 */
export class AudioDownloadManager {
  async list(): Promise<DownloadRecord[]> {
    const stored = await AsyncStorage.getItem(DOWNLOADS_KEY);
    return stored ? (JSON.parse(stored) as DownloadRecord[]) : [];
  }

  async enqueue(source: AudioSource): Promise<DownloadRecord> {
    const records = await this.list();
    const next: DownloadRecord = {
      surahId: source.surahId,
      status: 'queued',
      checksum: source.checksum,
      updatedAt: Date.now(),
    };
    const remaining = records.filter((record) => record.surahId !== source.surahId);
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify([...remaining, next]));
    return next;
  }

  async markComplete(surahId: number, localUri: string) {
    const records = await this.list();
    const next = records.map((record) =>
      record.surahId === surahId
        ? { ...record, status: 'complete' as const, localUri, updatedAt: Date.now() }
        : record,
    );
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next));
  }

  async remove(surahId: number) {
    const records = await this.list();
    await AsyncStorage.setItem(
      DOWNLOADS_KEY,
      JSON.stringify(records.filter((record) => record.surahId !== surahId)),
    );
  }
}

export const audioDownloadManager = new AudioDownloadManager();