import part1 from '@/data/quran-part-1';
import part2 from '@/data/quran-part-2';
import part3 from '@/data/quran-part-3';
import part4 from '@/data/quran-part-4';
import part5 from '@/data/quran-part-5';
import part6 from '@/data/quran-part-6';
import part7 from '@/data/quran-part-7';
import part8 from '@/data/quran-part-8';
import part9 from '@/data/quran-part-9';
import part10 from '@/data/quran-part-10';
import part11 from '@/data/quran-part-11';
import part12 from '@/data/quran-part-12';
import type { QuranTextSurah } from '@/data/quran-types';

export type CoverKind = 'recitation' | 'learning';
export type Surah = QuranTextSurah & {
  transliteration: string;
  verses: number;
  duration: string;
  cover: CoverKind;
  featured?: boolean;
};

export type Reciter = {
  id: string;
  name: string;
  origin: string;
  style: string;
  initials: string;
  color: string;
  downloaded: boolean;
};

const quranText: readonly QuranTextSurah[] = [
  ...part1,
  ...part2,
  ...part3,
  ...part4,
  ...part5,
  ...part6,
  ...part7,
  ...part8,
  ...part9,
  ...part10,
  ...part11,
  ...part12,
];

const featuredSurahIds = new Set([1, 18, 36, 55, 67, 112]);
export const surahs: Surah[] = quranText.map((surah) => ({
  ...surah,
  transliteration: surah.name,
  verses: surah.ayahCount,
  duration: '--:--',
  cover: surah.id % 2 === 0 ? 'learning' : 'recitation',
  featured: featuredSurahIds.has(surah.id),
}));

export const reciters: Reciter[] = [
  {
    id: 'alafasy',
    name: 'Mishary Alafasy',
    origin: 'Kuwait',
    style: 'Murattal',
    initials: 'MA',
    color: '#6E9B8A',
    downloaded: false,
  },
  {
    id: 'sudais',
    name: 'Abdul Rahman Al-Sudais',
    origin: 'Saudi Arabia',
    style: 'Tajweed',
    initials: 'AS',
    color: '#B88F5A',
    downloaded: false,
  },
  {
    id: 'minshawi',
    name: 'Mohamed Siddiq Al-Minshawi',
    origin: 'Egypt',
    style: 'Murattal',
    initials: 'MM',
    color: '#778DA3',
    downloaded: false,
  },
];

export type Ayah = { id: number; arabic: string; translation: string };

export const getAyahs = (surahId: number): Ayah[] => {
  const surah = quranText.find((item) => item.id === surahId);
  return (surah?.ayahs ?? []).map((arabic, index) => ({
    id: index + 1,
    arabic,
    translation: '',
  }));
};

export const surahAyahUrl = (surahId: number, ayahId: number) =>
  `https://everyayah.com/data/Alafasy_128kbps/${String(surahId).padStart(3, '0')}${String(ayahId).padStart(3, '0')}.mp3`;
