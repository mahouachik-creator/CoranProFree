import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { surahAyahUrl, surahs, type Surah } from '@/data/quran';

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'complete' | 'error';

export type DownloadRecord = {
  surahId: number;
  status: DownloadStatus;
  totalAyahs: number;
  downloadedAyahs: number;
  bytesDownloaded: number;
  localFiles: Record<number, string>;
  error?: string;
  updatedAt: number;
};

const DOWNLOADS_KEY = '@quran-pro-audio/downloads';
const AUDIO_DIRECTORY = 'quran-audio';

export class AudioDownloadManager {
  private controllers = new Map<number, AbortController>();
  private activeTasks = new Map<number, Promise<DownloadRecord>>();
  private writeQueue: Promise<void> = Promise.resolve();

  async list(): Promise<DownloadRecord[]> {
    const stored = await AsyncStorage.getItem(DOWNLOADS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Array<Partial<DownloadRecord>>;
    // Discard the old placeholder manifest, which did not contain audio files.
    const records = parsed.filter(
      (record): record is DownloadRecord =>
        typeof record.surahId === 'number' &&
        typeof record.totalAyahs === 'number' &&
        !!record.localFiles &&
        typeof record.localFiles === 'object',
    );
    return records.map((record) =>
      record.status === 'downloading' && !this.controllers.has(record.surahId)
        ? { ...record, status: 'paused' as const }
        : record,
    );
  }

  async getLocalFiles(surahId: number): Promise<Record<number, string>> {
    const record = (await this.list()).find((item) => item.surahId === surahId);
    if (!record) return {};
    const localFiles: Record<number, string> = {};
    for (const [ayahId, uri] of Object.entries(record.localFiles)) {
      const file = new File(uri);
      if (file.exists && file.size > 0) localFiles[Number(ayahId)] = file.uri;
    }
    return localFiles;
  }

  async downloadSurah(surah: Surah, onProgress?: (record: DownloadRecord) => void) {
    const active = this.activeTasks.get(surah.id);
    if (active) return active;

    const task = this.runDownload(surah, onProgress).finally(() => {
      this.controllers.delete(surah.id);
      this.activeTasks.delete(surah.id);
    });
    this.activeTasks.set(surah.id, task);
    return task;
  }

  async pause(surahId: number) {
    this.controllers.get(surahId)?.abort();
    const active = this.activeTasks.get(surahId);
    if (active) await active;
  }

  async remove(surahId: number) {
    await this.pause(surahId);
    const records = await this.list();
    const record = records.find((item) => item.surahId === surahId);
    for (const uri of Object.values(record?.localFiles ?? {})) {
      const file = new File(uri);
      if (file.exists) file.delete();
    }
    const directory = new Directory(Paths.document, AUDIO_DIRECTORY, `surah-${surahId}`);
    if (directory.exists) directory.delete();
    await this.saveRecords(records.filter((item) => item.surahId !== surahId));
  }

  private async runDownload(surah: Surah, onProgress?: (record: DownloadRecord) => void) {
    const controller = new AbortController();
    this.controllers.set(surah.id, controller);
    const previous = (await this.list()).find((item) => item.surahId === surah.id);
    const localFiles = { ...(previous?.localFiles ?? {}) };
    let bytesDownloaded = 0;
    const record: DownloadRecord = {
      surahId: surah.id,
      status: 'downloading',
      totalAyahs: surah.ayahCount,
      downloadedAyahs: 0,
      bytesDownloaded: 0,
      localFiles,
      updatedAt: Date.now(),
    };

    const directory = new Directory(Paths.document, AUDIO_DIRECTORY, `surah-${surah.id}`);
    try {
      directory.create({ intermediates: true, idempotent: true });
      for (let ayahId = 1; ayahId <= surah.ayahCount; ayahId += 1) {
        if (controller.signal.aborted) throw new DOMException('Download paused', 'AbortError');
        const fileName = `${String(ayahId).padStart(3, '0')}.mp3`;
        const destination = new File(directory, fileName);
        const knownUri = localFiles[ayahId];
        const knownFile = knownUri ? new File(knownUri) : destination;
        if (knownFile.exists && knownFile.size > 0) {
          localFiles[ayahId] = knownFile.uri;
          bytesDownloaded += knownFile.size;
        } else {
          if (destination.exists) destination.delete();
          await File.downloadFileAsync(surahAyahUrl(surah.id, ayahId), destination, {
            idempotent: true,
            signal: controller.signal,
            onProgress: ({ bytesWritten }) => {
              onProgress?.({
                ...record,
                downloadedAyahs: Object.keys(localFiles).length,
                bytesDownloaded: bytesDownloaded + bytesWritten,
                localFiles: { ...localFiles },
                updatedAt: Date.now(),
              });
            },
          });
          localFiles[ayahId] = destination.uri;
          bytesDownloaded += destination.size;
        }

        record.localFiles = { ...localFiles };
        record.downloadedAyahs = Object.keys(localFiles).length;
        record.bytesDownloaded = bytesDownloaded;
        record.updatedAt = Date.now();
        await this.saveRecord({ ...record });
        onProgress?.({ ...record, localFiles: { ...localFiles } });
      }

      record.status = 'complete';
      record.error = undefined;
    } catch (error) {
      const aborted = controller.signal.aborted || (error instanceof Error && error.name === 'AbortError');
      record.status = aborted ? 'paused' : 'error';
      record.error = aborted ? undefined : error instanceof Error ? error.message : 'Download failed.';
    }

    record.localFiles = { ...localFiles };
    record.downloadedAyahs = Object.keys(localFiles).length;
    record.bytesDownloaded = bytesDownloaded;
    record.updatedAt = Date.now();
    await this.saveRecord({ ...record });
    onProgress?.({ ...record, localFiles: { ...localFiles } });
    return record;
  }

  private async saveRecord(record: DownloadRecord) {
    this.writeQueue = this.writeQueue.then(async () => {
      const records = await this.list();
      const next = records.filter((item) => item.surahId !== record.surahId);
      next.push(record);
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next));
    });
    await this.writeQueue;
  }

  private async saveRecords(records: DownloadRecord[]) {
    this.writeQueue = this.writeQueue.then(() =>
      AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(records)),
    );
    await this.writeQueue;
  }
}

export const audioDownloadManager = new AudioDownloadManager();

export const getSurahForDownload = (surahId: number) =>
  surahs.find((surah) => surah.id === surahId);
