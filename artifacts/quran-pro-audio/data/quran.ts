export type CoverKind = 'recitation' | 'learning';

export type Surah = {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
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

export const surahs: Surah[] = [
  {
    id: 36,
    arabic: 'يس',
    transliteration: 'Ya-Sin',
    translation: 'The Heart of the Quran',
    verses: 83,
    duration: '17:42',
    cover: 'recitation',
    featured: true,
  },
  {
    id: 67,
    arabic: 'الملك',
    transliteration: 'Al-Mulk',
    translation: 'The Sovereignty',
    verses: 30,
    duration: '08:16',
    cover: 'learning',
  },
  {
    id: 18,
    arabic: 'الكهف',
    transliteration: 'Al-Kahf',
    translation: 'The Cave',
    verses: 110,
    duration: '31:08',
    cover: 'recitation',
  },
  {
    id: 55,
    arabic: 'الرحمن',
    transliteration: 'Ar-Rahman',
    translation: 'The Most Merciful',
    verses: 78,
    duration: '14:50',
    cover: 'learning',
  },
  {
    id: 112,
    arabic: 'الإخلاص',
    transliteration: 'Al-Ikhlas',
    translation: 'The Sincerity',
    verses: 4,
    duration: '01:12',
    cover: 'recitation',
  },
];

export const reciters: Reciter[] = [
  {
    id: 'alafasy',
    name: 'Mishary Alafasy',
    origin: 'Kuwait',
    style: 'Murattal',
    initials: 'MA',
    color: '#6E9B8A',
    downloaded: true,
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

export const ayahs = [
  { id: 1, arabic: 'يس', translation: 'Ya-Sin.' },
  { id: 2, arabic: 'وَالْقُرْآنِ الْحَكِيمِ', translation: 'By the wise Quran,' },
  { id: 3, arabic: 'إِنَّكَ لَمِنَ الْمُرْسَلِينَ', translation: 'Indeed, you are truly among the messengers,' },
  { id: 4, arabic: 'عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ', translation: 'On a straight path.' },
  { id: 5, arabic: 'تَنزِيلَ الْعَزِيزِ الرَّحِيمِ', translation: 'A revelation from the Almighty, Most Merciful.' },
];