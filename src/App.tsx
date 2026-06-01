/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, Server, Settings, CheckCircle, Wifi, RefreshCw, 
  Calendar, HeartHandshake, Layers, Award, MonitorCheck 
} from 'lucide-react';
import { getDocument, setDocument, uploadBase64ToStorage, isSupabaseConfigured, SQL_MIGRATION_SCRIPT } from './supabase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MaklumatSekolahView } from './components/MaklumatSekolahView';
import { PentadbiranView } from './components/PentadbiranView';
import { KeberadaanView } from './components/KeberadaanView';
import { SenaraiMuridView } from './components/SenaraiMuridView';
import { KurikulumView } from './components/KurikulumView';
import { HemView } from './components/HemView';
import { HemKehadiranView } from './components/HemKehadiranView';
import { HemKebajikanView } from './components/HemKebajikanView';
import { KokurikulumView } from './components/KokurikulumView';
import { AdminLoginModal } from './components/AdminModals';
import { TabId, SchoolDetails, ClassHeadcount, StudentRecord } from './types';
import { generateDefaultTeachers } from './defaultTeachers';
import { motion, AnimatePresence } from 'motion/react';

// Cache TTL config (saving egress): 3 minutes (180,000 milliseconds)
const CACHE_TTL = 180000;

const defaultPentadbirs: any[] = [];
const defaultAkpStaffs: any[] = [];

const ALLOWED_CLASSES = ['AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA', 'AMANAH', 'PRASEKOLAH'];

function isClassAllowed(className?: string): boolean {
  if (!className) return false;
  const upper = className.toUpperCase();
  return ALLOWED_CLASSES.some(allowed => upper.includes(allowed));
}

// Fallback initial data with student and class headcounts definitions for total persistent coverage
const fallbackDetails: SchoolDetails = {
  name: 'Sekolah Kebangsaan Batu Lanchang',
  logoUrl: 'https://img.freepik.com/premium-vector/school-badge-logo-design-template_397981-196.jpg',
  code: 'PBA1004',
  phone: '04-1234567',
  address: 'Lorong Batu Lanchang, 11600 Jelutong',
  email: 'pba1004@moe.edu.my',
  facebook: 'https://facebook.com/skblofficial',
  youtube: 'https://youtube.com/@skbatulanchang',
  tiktok: 'https://tiktok.com/@skbatulanchang',
  guruBesar: { name: '', photoUrl: '' },
  pkPentadbiran: { name: '', photoUrl: '' },
  pkHem: { name: '', photoUrl: '' },
  pkKokurikulum: { name: '', photoUrl: '' },
  session: 'Pagi sahaja',
  totalStudents: 846,
  totalTeachers: 0,
  totalStaff: 0,
  totalClasses: 28,
  district: 'Timur Laut',
  state: 'Pulau Pinang',
  motto: 'Berilmu, Beramal, Berbakti',
  vision: 'Pendidikan Berkualiti Insan Terdidik Negara Sejahtera',
  mission: 'Melestarikan Sistem Pendidikan Yang Berkualiti Untuk Mengoptimalkan Potensi Individu Bagi Memenuhi Aspirasi Negara',
  keberadaanGasUrl: 'https://script.google.com/macros/s/AKfycbzZnxUYMEwyc5a1cQIVQfzdQvcfn1_qa75fz9Yu8tkR6GFscOY1aSLYFU5M1oZU_qxszw/exec',
  schoolSongLyrics: 'Kami murid SK Batu Lanchang\nBerikrar dan berjanji\nBelajar tekun berusaha\nMencapai cita-cita mulia',
  announcements: [
    { id: '1', date: '20\nMEI', title: 'Mesyuarat Kurikulum Bil. 3/2024', desc: '20 Mei 2024 (Isnin) | 2:30 Petang | Bilik Mesyuarat' },
    { id: '2', date: '18\nMEI', title: 'Program Gotong-Royong Perdana', desc: '18 Mei 2024 (Sabtu) | 8:00 Pagi | Perkarangan Sekolah' },
    { id: '3', date: '15\nMEI', title: 'Peperiksaan Pertengahan Tahun', desc: '15 - 23 Mei 2024 | Tahun 1 - Tahun 6' },
  ],
  calendarEvents: [
    { id: '1', date: '2026-05-18', type: 'event', title: 'Mesyuarat Guru Jom', desc: 'Sesi taklimat pagi' },
    { id: '2', date: '2026-05-22', type: 'holiday', title: 'Cuti Umum', desc: 'Hari Wesak' },
    { id: '3', date: '2026-05-05', type: 'holiday', title: 'Cuti Aktiviti', desc: 'Cuti Ganti' },
    { id: '4', date: '2026-05-15', type: 'holiday', title: 'Cuti Sokongan', desc: 'Hari Belia' },
  ],
  teachers: generateDefaultTeachers(),
  pentadbirs: defaultPentadbirs,
  akpStaffs: defaultAkpStaffs,
  classData: [
    { id: '1a', className: 'AMAN', males: 15, females: 18 },
    { id: '2b', className: 'BAHAGIA', males: 16, females: 20 },
    { id: '3h', className: 'HARMONI', males: 14, females: 18 },
    { id: '4m', className: 'MAKMUR', males: 17, females: 15 },
    { id: '5s', className: 'SENTOSA', males: 18, females: 17 },
  ],
  students: [
    { id: 's1', name: 'MUHAMMAD ALIFF FARHAN BIN AZMI', idNumber: 'SKBL-2024-001', className: 'AMAN', tahun: 'Tahun 1', gender: 'Lelaki' },
    { id: 's2', name: 'NUR ALYA QISTINA BINTI MOHD FAIZAL', idNumber: 'SKBL-2024-002', className: 'AMAN', tahun: 'Tahun 1', gender: 'Perempuan' },
    { id: 's3', name: 'ADAM HARITH BIN NORAZAM', idNumber: 'SKBL-2024-003', className: 'BAHAGIA', tahun: 'Tahun 2', gender: 'Lelaki' },
    { id: 's4', name: 'ESHAAN PILLAI A/L RAVINDRAN', idNumber: 'SKBL-2024-004', className: 'HARMONI', tahun: 'Tahun 3', gender: 'Lelaki' },
    { id: 's5', name: 'SITI NURAISYAH BINTI ABDULLAH', idNumber: 'SKBL-2024-005', className: 'MAKMUR', tahun: 'Tahun 4', gender: 'Perempuan' },
    { id: 's6', name: 'LIM WEI HAN', idNumber: 'SKBL-2024-006', className: 'SENTOSA', tahun: 'Tahun 5', gender: 'Lelaki' },
    { id: 's7', name: 'YASMIN HUMAIRA BINTI KHAIRUL ANUAR', idNumber: 'SKBL-2024-007', className: 'HARMONI', tahun: 'Tahun 2', gender: 'Perempuan' },
    { id: 's8', name: 'TEH JIA LING', idNumber: 'SKBL-2024-008', className: 'SENTOSA', tahun: 'Tahun 4', gender: 'Perempuan' },
    { id: 's9', name: 'AINA SYAFIQAH BINTI ROSLI', idNumber: 'SKBL-2024-009', className: 'AMAN', tahun: 'Tahun 5', gender: 'Perempuan' },
    { id: 's10', name: 'MUHAMMAD AMIRUL BIN IBRAHIM', idNumber: 'SKBL-2024-010', className: 'BAHAGIA', tahun: 'Tahun 6', gender: 'Lelaki' },
    { id: 's11', name: 'NUR SYUHADA BINTI MANSOR', idNumber: 'SKBL-2024-011', className: 'BAHAGIA', tahun: 'Tahun 6', gender: 'Perempuan' },
  ]
};

const CONSTRUCTION_DATA = {
  hem_kehadiran: { title: 'Kehadiran Murid', icon: Calendar },
  hem_kebajikan: { title: 'Kebajikan & Bantuan', icon: HeartHandshake },
  koko_pencapaian: { title: 'Pencapaian Kokurikulum', icon: Award },
};

function ConstructionView({ tabId }: { tabId: keyof typeof CONSTRUCTION_DATA }) {
  const data = CONSTRUCTION_DATA[tabId];
  const Icon = data.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
      <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 animate-pulse">
        <Icon className="w-12 h-12 text-blue-600" />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">{data.title}</h2>
      <div className="flex flex-col items-center gap-4">
        <span className="px-4 py-1.5 bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 animate-spin-slow" />
          Sedang Dibangunkan
        </span>
        <p className="text-slate-500 max-w-md leading-relaxed">
          Kami sedang giat membangunkan modul ini untuk memberikan pengalaman terbaik kepada anda. Nantikan kemaskini seterusnya tidak lama lagi!
        </p>
      </div>
      
      <div className="mt-12 flex gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
        <div className="w-2 h-2 rounded-full bg-blue-200"></div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('maklumat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // States for Firebase status tracking & error reporting
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  
  // Track initial load to prevent layout glitches
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Synchronous database/cache-first state initialization
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>(fallbackDetails);

  const mainRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const fetchSchoolDetails = async () => {
    // If network is offline, bypass quietly
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    if (!isSupabaseConfigured) {
      // Run quietly in local offline mode without showing error banners on load.
      return;
    }

    try {
      // Fetch all partitions in parallel (ultra fast loading)
      const [
        detailsData,
        teachersData,
        mediaLogoData,
        mediaSongData,
        mediaPlanData,
        studentsData,
        calendarData,
        keberadaanData
      ] = await Promise.all([
        getDocument('details').catch(err => err),
        getDocument('teachers').catch(err => err),
        getDocument('media_logo').catch(err => err),
        getDocument('media_song').catch(err => err),
        getDocument('media_plan').catch(err => err),
        getDocument('students').catch(err => err),
        getDocument('calendar').catch(err => err),
        getDocument('keberadaan').catch(err => err)
      ]);

      // Check if any error indicates a missing table
      const isTableMissing = [
        detailsData, teachersData, mediaLogoData, mediaSongData,
        mediaPlanData, studentsData, calendarData, keberadaanData
      ].some(data => {
        if (data && typeof data === 'object' && (data as any).message === 'TABLE_MISSING') {
          return true;
        }
        if (data instanceof Error && data.message === 'TABLE_MISSING') {
          return true;
        }
        return false;
      });

      if (isTableMissing) {
        setFirebaseError("Jadual 'school_data' tidak ditemui di pangkalan data Supabase anda. Sila mulakan jadual ini menggunakan skrip SQL migrasi yang betul.");
        return;
      }

      // Check for any other network or query issues
      const anyOtherErrors = [
        detailsData, teachersData, mediaLogoData, mediaSongData,
        mediaPlanData, studentsData, calendarData, keberadaanData
      ].some(data => data instanceof Error);

      if (anyOtherErrors) {
        const firstErr = [
          detailsData, teachersData, mediaLogoData, mediaSongData,
          mediaPlanData, studentsData, calendarData, keberadaanData
        ].find(data => data instanceof Error) as Error;
        setFirebaseError(`Gagal berhubung dengan Supabase: ${firstErr?.message || 'Ralat tidak diketahui'}`);
        return;
      }

      setFirebaseError(null); // Clear errors on success

      let data: SchoolDetails = { ...fallbackDetails };

      const seedPromises: Promise<any>[] = [];

      // 1. General Details
      if (detailsData && !(detailsData instanceof Error)) {
        data = { ...data, ...detailsData };
      } else if (!detailsData) {
        seedPromises.push(
          setDocument('details', {
            name: data.name || fallbackDetails.name,
            code: data.code || fallbackDetails.code,
            phone: data.phone || fallbackDetails.phone,
            address: data.address || fallbackDetails.address,
            email: data.email || fallbackDetails.email,
            facebook: data.facebook || fallbackDetails.facebook,
            youtube: data.youtube || fallbackDetails.youtube,
            tiktok: data.tiktok || fallbackDetails.tiktok,
            guruBesar: data.guruBesar || fallbackDetails.guruBesar,
            pkPentadbiran: data.pkPentadbiran || fallbackDetails.pkPentadbiran,
            pkHem: data.pkHem || fallbackDetails.pkHem,
            pkKokurikulum: data.pkKokurikulum || fallbackDetails.pkKokurikulum,
            session: data.session || fallbackDetails.session,
            totalStudents: data.totalStudents || fallbackDetails.totalStudents,
            totalTeachers: data.totalTeachers || 0,
            totalStaff: data.totalStaff || 0,
            totalClasses: data.totalClasses || fallbackDetails.totalClasses,
            district: data.district || fallbackDetails.district,
            state: data.state || fallbackDetails.state,
            motto: data.motto || fallbackDetails.motto,
            vision: data.vision || fallbackDetails.vision,
            mission: data.mission || fallbackDetails.mission,
            keberadaanGasUrl: data.keberadaanGasUrl || fallbackDetails.keberadaanGasUrl,
            schoolSongLyrics: data.schoolSongLyrics || fallbackDetails.schoolSongLyrics
          })
        );
      }

      // 2. Teachers & Staff
      if (teachersData && !(teachersData instanceof Error)) {
        data.teachers = teachersData.teachers || [];
        data.pentadbirs = teachersData.pentadbirs || [];
        data.akpStaffs = teachersData.akpStaffs || [];
      } else if (!teachersData) {
        seedPromises.push(
          setDocument('teachers', {
            teachers: data.teachers || [],
            pentadbirs: data.pentadbirs || [],
            akpStaffs: data.akpStaffs || []
          })
        );
      }

      // 3. Media Logo
      if (mediaLogoData && !(mediaLogoData instanceof Error)) {
        data.logoUrl = mediaLogoData.logoUrl || fallbackDetails.logoUrl;
      } else if (!mediaLogoData) {
        seedPromises.push(setDocument('media_logo', { logoUrl: data.logoUrl || fallbackDetails.logoUrl }));
      }

      // 4. Media Song
      if (mediaSongData && !(mediaSongData instanceof Error)) {
        data.schoolSongLyrics = mediaSongData.schoolSongLyrics || fallbackDetails.schoolSongLyrics;
        data.schoolSongAudioUrl = mediaSongData.schoolSongAudioUrl || "";
      } else if (!mediaSongData) {
        seedPromises.push(
          setDocument('media_song', {
            schoolSongLyrics: data.schoolSongLyrics || fallbackDetails.schoolSongLyrics,
            schoolSongAudioUrl: data.schoolSongAudioUrl || ""
          })
        );
      }

      // 5. Media Plan
      if (mediaPlanData && !(mediaPlanData instanceof Error)) {
        data.schoolPlanImageUrl = mediaPlanData.schoolPlanImageUrl || "";
      } else if (!mediaPlanData) {
        seedPromises.push(setDocument('media_plan', { schoolPlanImageUrl: data.schoolPlanImageUrl || "" }));
      }

      // 6. Students & Class headcounts
      if (studentsData && !(studentsData instanceof Error)) {
        // Only use fallback if the data is completely missing or null
        const rawClassData = studentsData.classData !== undefined && studentsData.classData !== null ? studentsData.classData : fallbackDetails.classData;
        const rawStudents = studentsData.students !== undefined && studentsData.students !== null ? studentsData.students : fallbackDetails.students;

        // Use raw data without destructive filtering to respect user's request "jangan delete apa2 data"
        const cleanedClassData = (rawClassData || []);
        const cleanedStudents = (rawStudents || []);

        // Accept empty arrays as intentional states
        data.classData = cleanedClassData;
        data.students = cleanedStudents;

        // If we found and deleted non-matching items from DB, save the pristine DB states immediately
        if (cleanedClassData.length !== (rawClassData || []).length || cleanedStudents.length !== (rawStudents || []).length) {
          seedPromises.push(
            setDocument('students', {
              classData: data.classData,
              students: data.students
            })
          );
        }
      } else if (!studentsData) {
        seedPromises.push(
          setDocument('students', {
            classData: data.classData || fallbackDetails.classData,
            students: data.students || fallbackDetails.students
          })
        );
      }

      // 7. Calendar
      if (calendarData && !(calendarData instanceof Error)) {
        data.calendarEvents = calendarData.calendarEvents || fallbackDetails.calendarEvents;
      } else if (!calendarData) {
        seedPromises.push(setDocument('calendar', { calendarEvents: data.calendarEvents || fallbackDetails.calendarEvents }));
      }

      // 8. Keberadaan
      if (keberadaanData && !(keberadaanData instanceof Error)) {
        data.keberadaanCachedData = keberadaanData.keberadaanCachedData || null;
        data.keberadaanGasUrl = keberadaanData.keberadaanGasUrl || fallbackDetails.keberadaanGasUrl;
        data.keberadaanSheetIdOrUrl = keberadaanData.keberadaanSheetIdOrUrl || "";
        data.keberadaanSheetRange = keberadaanData.keberadaanSheetRange || "";
        data.keberadaanFormUrl = keberadaanData.keberadaanFormUrl || "";
        data.keberadaanRecords = keberadaanData.keberadaanRecords || [];
      } else if (!keberadaanData) {
        seedPromises.push(
          setDocument('keberadaan', {
            keberadaanCachedData: data.keberadaanCachedData || JSON.stringify([]),
            keberadaanGasUrl: data.keberadaanGasUrl || fallbackDetails.keberadaanGasUrl || "",
            keberadaanSheetIdOrUrl: data.keberadaanSheetIdOrUrl || "",
            keberadaanSheetRange: data.keberadaanSheetRange || "",
            keberadaanFormUrl: data.keberadaanFormUrl || "",
            keberadaanRecords: data.keberadaanRecords || []
          })
        );
      }

      setSchoolDetails(data);

      if (seedPromises.length > 0) {
        console.info(`Supabase DB partially empty. Seeding ${seedPromises.length} missing partitions in background...`);
        Promise.all(seedPromises).catch(err => {
          console.warn("Background partition seeding failed:", err);
        });
      }
    } catch (err: any) {
      setFirebaseError(`Gagal membaca data dari Supabase: ${err?.message || err}`);
      console.warn("Failed to fetch latest school details asynchronously from Supabase:", err);
    } finally {
      setIsInitialLoad(false);
    }
  };

  // Load from Supabase asynchronously in background WITHOUT full-screen blocking re-renders
  useEffect(() => {
    fetchSchoolDetails();
  }, []);

  async function handleSaveDetails(updatedDetails: SchoolDetails) {
    const oldDetails = schoolDetails;
    const timestampedDetails = { ...updatedDetails, updatedAt: Date.now() };
    setSaveStatus('saving');
    setSaveErrorMessage(null);
    setSchoolDetails(timestampedDetails);

    // 2. If Supabase is not configured, treat the local cache save as fully successful.
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        setSaveStatus('saved');
      }, 600);
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 4000);
      return;
    }

    try {
      const { 
        teachers, pentadbirs, akpStaffs, 
        logoUrl, 
        schoolSongLyrics, schoolSongAudioUrl, 
        schoolPlanImageUrl, 
        classData, students,
        calendarEvents,
        keberadaanCachedData, keberadaanSheetIdOrUrl, keberadaanSheetRange, keberadaanFormUrl, keberadaanRecords,
        ...basicDetails 
      } = timestampedDetails;

      const basicDataToSave = {
        ...basicDetails,
        schoolSongLyrics: schoolSongLyrics || ""
      };

      // Helper to log errors and throw them so that the save operation bubbles up failures correctly
      const safeSupabaseWrite = async (operation: () => Promise<void>, path: string) => {
        try {
          await operation();
        } catch (err: any) {
          if (err?.message === "TABLE_MISSING") {
            throw new Error("TABLE_MISSING");
          }
          console.error(`Failed to save ${path} to Supabase:`, err);
          throw new Error(`Gagal menyimpan laluan '${path}' - ${err?.message || err}`);
        }
      };

      const uploadImageFields = async (items: any[]) => {
        return Promise.all((items || []).map(async (item) => {
          const updated = { ...item };
          if (updated.photoUrl && updated.photoUrl.startsWith('data:image')) {
             try {
                 const fileName = `images/staff_${updated.id}_${Date.now()}.webp`;
                 const url = await uploadBase64ToStorage(fileName, updated.photoUrl);
                 updated.photoUrl = url;
             } catch (e) {
                 console.error("Failed to upload staff photo to Storage", e);
                 if (updated.photoUrl.length > 350000) {
                    updated.photoUrl = '';
                 }
             }
          }
          return updated;
        }));
      };

      const [finalTeachers, finalPentadbirs, finalAkp] = await Promise.all([
        uploadImageFields(teachers || []),
        uploadImageFields(pentadbirs || []),
        uploadImageFields(akpStaffs || [])
      ]);
      
      timestampedDetails.teachers = finalTeachers;
      timestampedDetails.pentadbirs = finalPentadbirs;
      timestampedDetails.akpStaffs = finalAkp;

      let finalLogoUrl = logoUrl || "";
      let finalPlanUrl = schoolPlanImageUrl || "";

      await Promise.all([
        (async () => {
          if (finalLogoUrl.startsWith('data:image')) {
              try {
                  finalLogoUrl = await uploadBase64ToStorage(`images/logo_${Date.now()}.webp`, finalLogoUrl);
              } catch (e) {
                  if (finalLogoUrl.length > 350000) finalLogoUrl = '';
              }
          }
        })(),
        (async () => {
          if (finalPlanUrl.startsWith('data:image')) {
              try {
                  finalPlanUrl = await uploadBase64ToStorage(`images/plan_${Date.now()}.webp`, finalPlanUrl);
              } catch (e) {
                 if (finalPlanUrl.length > 350000) finalPlanUrl = '';
              }
          }
        })()
      ]);

      timestampedDetails.logoUrl = finalLogoUrl;
      timestampedDetails.schoolPlanImageUrl = finalPlanUrl;

      const kCache = typeof keberadaanCachedData === 'string' ? keberadaanCachedData : JSON.stringify(keberadaanCachedData || []);

      // Helper function to check if values are changed
      const hasChanged = (newVal: any, oldVal: any) => {
        return JSON.stringify(newVal) !== JSON.stringify(oldVal);
      };

      const { 
        teachers: oldTeachers, pentadbirs: oldPentadbirs, akpStaffs: oldAkp,
        logoUrl: oldLogoUrl, 
        schoolSongLyrics: oldLyrics, schoolSongAudioUrl: oldAudio, 
        schoolPlanImageUrl: oldPlan, 
        classData: oldClassData, students: oldStudents,
        calendarEvents: oldEvents,
        keberadaanCachedData: oldKCacheRaw, keberadaanGasUrl: oldGasUrl, keberadaanSheetIdOrUrl: oldSheetId, keberadaanSheetRange: oldSheetRange, keberadaanFormUrl: oldFormUrl, keberadaanRecords: oldRecords,
        ...oldBasicDetails 
      } = oldDetails;

      const oldBasicDataToSave = {
        ...oldBasicDetails,
        schoolSongLyrics: oldLyrics || ""
      };

      const oldKCacheStr = typeof oldKCacheRaw === 'string' ? oldKCacheRaw : JSON.stringify(oldKCacheRaw || []);

      // Strip updatedAt for clean base data structure comparison
      const { updatedAt: _, ...cmpNewBasic } = basicDataToSave;
      const { updatedAt: __, ...cmpOldBasic } = oldBasicDataToSave;

      const writesToPerform = [];

      // 1. Details partition
      if (hasChanged(cmpNewBasic, cmpOldBasic)) {
        writesToPerform.push({
          name: 'school/details',
          op: () => setDocument('details', basicDataToSave)
        });
      }

      // 2. Teachers partition
      const newTeachersPayload = { teachers: finalTeachers, pentadbirs: finalPentadbirs, akpStaffs: finalAkp };
      const oldTeachersPayload = { teachers: oldTeachers || [], pentadbirs: oldPentadbirs || [], akpStaffs: oldAkp || [] };
      if (hasChanged(newTeachersPayload, oldTeachersPayload)) {
        writesToPerform.push({
          name: 'school/teachers',
          op: () => setDocument('teachers', newTeachersPayload)
        });
      }

      // 3. Media Logo partition
      const newLogoPayload = { logoUrl: finalLogoUrl };
      const oldLogoPayload = { logoUrl: oldLogoUrl || "" };
      if (hasChanged(newLogoPayload, oldLogoPayload)) {
        writesToPerform.push({
          name: 'school/media_logo',
          op: () => setDocument('media_logo', newLogoPayload)
        });
      }

      // 4. Media Song partition
      const newSongPayload = { schoolSongLyrics: schoolSongLyrics || "", schoolSongAudioUrl: schoolSongAudioUrl || "" };
      const oldSongPayload = { schoolSongLyrics: oldLyrics || "", schoolSongAudioUrl: oldAudio || "" };
      if (hasChanged(newSongPayload, oldSongPayload)) {
        writesToPerform.push({
          name: 'school/media_song',
          op: async () => {
            const audioStr = schoolSongAudioUrl || "";
            if (audioStr && audioStr.length > 10480000) {
               console.warn("Saiz fail audio terlalu besar");
               return;
            }
            await setDocument('media_song', { schoolSongLyrics: schoolSongLyrics || "", schoolSongAudioUrl: audioStr });
          }
        });
      }

      // 5. Media Plan partition
      const newPlanPayload = { schoolPlanImageUrl: finalPlanUrl };
      const oldPlanPayload = { schoolPlanImageUrl: oldPlan || "" };
      if (hasChanged(newPlanPayload, oldPlanPayload)) {
        writesToPerform.push({
          name: 'school/media_plan',
          op: () => setDocument('media_plan', newPlanPayload)
        });
      }

      // 6. Students partition
      const newStudentsPayload = { classData: classData || [], students: students || [] };
      const oldStudentsPayload = { classData: oldClassData || [], students: oldStudents || [] };
      if (hasChanged(newStudentsPayload, oldStudentsPayload)) {
        writesToPerform.push({
          name: 'school/students',
          op: () => setDocument('students', newStudentsPayload)
        });
      }

      // 7. Calendar partition
      const newCalendarPayload = { calendarEvents: calendarEvents || [] };
      const oldCalendarPayload = { calendarEvents: oldEvents || [] };
      if (hasChanged(newCalendarPayload, oldCalendarPayload)) {
        writesToPerform.push({
          name: 'school/calendar',
          op: () => setDocument('calendar', newCalendarPayload)
        });
      }

      // 8. Keberadaan partition
      const newKeberadaanPayload = { 
        keberadaanCachedData: kCache,
        keberadaanGasUrl: timestampedDetails.keberadaanGasUrl || "",
        keberadaanSheetIdOrUrl: keberadaanSheetIdOrUrl || "",
        keberadaanSheetRange: keberadaanSheetRange || "",
        keberadaanFormUrl: keberadaanFormUrl || "",
        keberadaanRecords: keberadaanRecords || []
      };
      const oldKeberadaanPayload = { 
        keberadaanCachedData: oldKCacheStr,
        keberadaanGasUrl: oldGasUrl || "",
        keberadaanSheetIdOrUrl: oldSheetId || "",
        keberadaanSheetRange: oldSheetRange || "",
        keberadaanFormUrl: oldFormUrl || "",
        keberadaanRecords: oldRecords || []
      };
      if (hasChanged(newKeberadaanPayload, oldKeberadaanPayload)) {
        writesToPerform.push({
          name: 'school/keberadaan',
          op: () => setDocument('keberadaan', newKeberadaanPayload)
        });
      }

      // Perform all scheduled differential writes sequentially
      console.info(`Saving school changes: Executing ${writesToPerform.length} database upserts sequentially.`);
      for (const task of writesToPerform) {
        await safeSupabaseWrite(task.op, task.name);
      }

      // Everything saved successfully!
      setSaveStatus('saved');
      
      // Auto clear saved toast after several seconds
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 4000);

    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg === 'TABLE_MISSING') {
        setSaveStatus('error');
        setSaveErrorMessage("Jadual 'school_data' tidak ditemui di Supabase. Sila salin dan jalankan skrip SQL migrasi yang disediakan di bahagian atas halaman dashboard utama.");
      } else {
        console.error("Supabase Save Failure:", err);
        setSaveStatus('error');
        setSaveErrorMessage(`Gagal selaraskan ke Supabase: ${errMsg}. Sila semak sambungan rangkaian atau polisi RLS.`);
        
        // Roll back the memory state to prevent incorrect UI confirmation
        setSchoolDetails(oldDetails);
      }
    }
  };

  const AppSkeleton = () => (
    <div className="w-full h-full p-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
      <div className="bg-white rounded-3xl p-6 h-[500px] border border-slate-100">
        <div className="h-6 bg-slate-100 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-50 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-50 rounded w-5/6 mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
           <div className="h-32 bg-slate-50 rounded-2xl"></div>
           <div className="h-32 bg-slate-50 rounded-2xl"></div>
           <div className="h-32 bg-slate-50 rounded-2xl"></div>
           <div className="h-32 bg-slate-50 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isInitialLoad) {
      return <AppSkeleton />;
    }
    switch (activeTab) {
      case 'maklumat':
        return <MaklumatSekolahView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
      case 'pentadbiran':
        return <PentadbiranView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
      case 'organisasi':
        return <PentadbiranView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
      case 'keberadaan':
        return <KeberadaanView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
      case 'senarai_murid':
        return <SenaraiMuridView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
      case 'kurikulum':
      case 'kurikulum_panitia':
      case 'kurikulum_ppki':
      case 'kurikulum_uasa': {
        let kurikulumSubTab: 'panitia' | 'ppki_pemulihan' | 'uasa_pbd' = 'panitia';
        if (activeTab === 'kurikulum_ppki') kurikulumSubTab = 'ppki_pemulihan';
        else if (activeTab === 'kurikulum_uasa') kurikulumSubTab = 'uasa_pbd';
        return <KurikulumView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} activeTab={kurikulumSubTab} />;
      }
      case 'hem':
      case 'senarai_murid':
      case 'hem_kehadiran':
      case 'hem_kebajikan':
        if (activeTab === 'senarai_murid') {
          return <SenaraiMuridView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
        }
        if (activeTab === 'hem_kehadiran') {
          return <HemKehadiranView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
        }
        if (activeTab === 'hem_kebajikan') {
          return <HemKebajikanView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
        }
        return <HemView />;
      case 'kokurikulum':
      case 'koko_pencapaian':
        if (activeTab === 'koko_pencapaian' || activeTab === 'kokurikulum') {
          return <KokurikulumView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
        }
        return <ConstructionView tabId={activeTab as any} />;
      default:
        return <MaklumatSekolahView details={schoolDetails} isAdmin={isAdmin} onSave={handleSaveDetails} />;
    }
  };

  return (
    <div className="h-screen w-full bg-[#f9f9f9] flex font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab === 'pentadbiran' ? 'organisasi' : tab);
          setIsSidebarOpen(false);
        }} 
        onOpenLogin={() => {
          setIsLoginOpen(true);
          setIsSidebarOpen(false);
        }}
        isAdmin={isAdmin}
        onLogoutAction={() => {
          setIsAdmin(false);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        logoUrl={schoolDetails.logoUrl}
      />
      
      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header 
          schoolDetails={schoolDetails} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <main ref={mainRef} className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 pt-4 lg:pt-7 overflow-y-auto w-full">
          {saveStatus === 'error' && saveErrorMessage && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-2 shadow-sm text-amber-900" id="supabase-save-error">
              <div className="flex items-center gap-2 font-bold text-base">
                <span>⚠️ Gagal Menyimpan Ke Awan (Cloud Sync Failed)</span>
              </div>
              <p className="text-sm leading-relaxed">{saveErrorMessage}</p>
              
              {saveErrorMessage.includes('school_data') && (
                <div className="mt-3 bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs overflow-x-auto relative shadow-inner">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800 text-[10px] text-slate-400 select-none">
                    <span>SUPABASE SQL MIGRATION EDITOR</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(SQL_MIGRATION_SCRIPT);
                        alert("Skrip SQL telah disalin ke papan klip!");
                      }} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2.5 rounded transition-colors cursor-pointer select-all"
                    >
                      Salin SQL
                    </button>
                  </div>
                  <pre className="text-slate-300 leading-relaxed whitespace-pre">{SQL_MIGRATION_SCRIPT}</pre>
                </div>
              )}

              <p className="text-xs text-amber-600 font-mono mt-1 border-t border-amber-200/50 pt-2">Data tempatan yang tidak selari telah dipulihkan (rolled back) untuk mengelakkan percanggahan data.</p>
              <button 
                onClick={() => { setSaveStatus('idle'); setSaveErrorMessage(null); }} 
                className="mt-2 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 py-1.5 px-3 rounded-lg self-start transition-colors cursor-pointer"
              >
                Tutup Amaran
              </button>
            </div>
          )}

          {saveStatus === 'saving' && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 shadow-sm text-blue-800 animate-pulse" id="supabase-saving-status">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Sedang menyelaraskan data anda ke pangkalan data Supabase...</p>
            </div>
          )}

          {saveStatus === 'saved' && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between shadow-sm text-green-800 text-sm" id="supabase-saved-status">
              <div className="flex items-center gap-2 font-medium">
                <span>✅ Berjaya Disimpan ke Database Supabase</span>
              </div>
              <button 
                onClick={() => setSaveStatus('idle')} 
                className="text-xs font-bold text-green-700 hover:text-green-800 hover:underline cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="max-w-[1400px] mx-auto h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AdminLoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => {
          setIsLoginOpen(false);
          setIsAdmin(true);
          setActiveTab('maklumat');
        }}
      />
    </div>
  );
}

