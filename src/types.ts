export interface PersonProfile {
  name: string;
  photoUrl: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string; // Opsyen / subjek
  grade: string;   // Gred jawatan
  photoUrl: string;
}

export interface Announcement {
  id: string;
  date: string; // e.g. "20 MEI"
  title: string;
  desc: string; // e.g. "20 Mei 2024 (Isnin) |..."
}

export interface CalendarEvent {
  id: string;
  day?: number; // legacy
  type: 'event' | 'holiday' | 'school_holiday' | 'public_holiday';
  title?: string;
  desc?: string;
  date?: string; // e.g. "2026-05-18"
  dates?: string[]; // Array of selected dates
}

export interface ClassHeadcount {
  id: string;
  className: string;
  males: number;
  females: number;
}

export interface StudentRecord {
  id: string;
  name: string;
  idNumber: string;
  className: string;
  tahun?: string;
  gender: 'Lelaki' | 'Perempuan';
  race?: string; // Melayu, Cina, India, Lain-lain
}

export interface HemKehadiranRecord {
  id: string;
  month: string;
  hadir: number;
  sepatutnya: number;
}

export interface KeberadaanRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  status: string;
  remarks: string;
  tarikhMula?: string;
  tarikhAkhir?: string;
  jenisKeberadaan?: string;
  butiran?: string;
}

export interface PanitiaMember {
  id: string;
  name: string;
  role: 'Ketua Panitia' | 'Setiausaha' | 'AJK' | 'Guru Panitia';
  gender: 'Lelaki' | 'Perempuan';
  photoUrl?: string;
}

export interface Panitia {
  id: string;
  name: string;
  slug: string;
  color: string;
  members: PanitiaMember[];
  isArchived?: boolean;
}

export interface KurikulumData {
  panitiaList: Panitia[];
  uasaPbdBannerUrl?: string;
  uasaPbdScreenshots?: string[];
  simpUrl?: string;
  simpButtonLabel?: string;
}

export interface KebajikanTabConfig {
  id: string;
  title: string;
  url: string;
}

export interface SchoolDetails {
  name: string;
  logoUrl: string;
  address: string;
  code: string;
  phone: string;
  email: string;
  facebook: string;
  youtube?: string;
  tiktok?: string;
  guruBesar: PersonProfile;
  pkPentadbiran: PersonProfile;
  pkHem: PersonProfile;
  pkKokurikulum: PersonProfile;
  session: string;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalClasses: number;
  district: string;
  state: string;
  motto: string;
  vision: string;
  mission: string;
  schoolSongLyrics?: string;
  schoolSongAudioUrl?: string;
  schoolPlanImageUrl?: string;
  announcements?: Announcement[];
  calendarEvents?: CalendarEvent[];
  teachers?: Teacher[];
  pentadbirs?: Teacher[];
  akpStaffs?: Teacher[];
  keberadaanSheetIdOrUrl?: string;
  keberadaanSheetRange?: string;
  keberadaanSource?: 'manual' | 'sheets';
  keberadaanCachedData?: any;
  keberadaanFormUrl?: string;
  keberadaanGasUrl?: string;
  ppkiGasUrl?: string;
  pemulihanGasUrl?: string;
  kokoGasUrl?: string;
  ppkiStaffIds?: string[];
  pemulihanStaffIds?: string[];
  kebajikanTabs?: KebajikanTabConfig[];
  keberadaanRecords?: KeberadaanRecord[];
  kehadiranMonthly?: HemKehadiranRecord[];
  classData?: ClassHeadcount[];
  students?: StudentRecord[];
  kurikulumData?: KurikulumData;
  updatedAt?: number;
}

export type TabId = 
  | 'maklumat' 
  | 'pentadbiran' | 'organisasi' | 'keberadaan' 
  | 'kurikulum' | 'kurikulum_panitia' | 'kurikulum_ppki' | 'kurikulum_uasa' 
  | 'hem' | 'senarai_murid' | 'hem_kehadiran' | 'hem_kebajikan' 
  | 'kokurikulum' | 'koko_pencapaian';
