/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, Server, Settings, CheckCircle, Wifi, RefreshCw } from 'lucide-react';
import { getDocument, setDocument, uploadBase64ToStorage, isSupabaseConfigured, SQL_MIGRATION_SCRIPT } from './supabase';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MaklumatSekolahView } from './components/MaklumatSekolahView';
import { PentadbiranView } from './components/PentadbiranView';
import { KeberadaanView } from './components/KeberadaanView';
import { SenaraiMuridView } from './components/SenaraiMuridView';
import { KurikulumView } from './components/KurikulumView';
import { HemView } from './components/HemView';
import { KokurikulumView } from './components/KokurikulumView';
import { AdminLoginModal } from './components/AdminModals';
import { TabId, SchoolDetails, ClassHeadcount, StudentRecord } from './types';
import { generateDefaultTeachers } from './defaultTeachers';
import { motion, AnimatePresence } from 'motion/react';

// Cache TTL config (saving egress): 3 minutes (180,000 milliseconds)
const CACHE_TTL = 180000;

const defaultPentadbirs: any[] = [];
const defaultAkpStaffs: any[] = [];

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
  mission: 'Melestarikan Sistem Pendidikan Yang Berkualiti Untuk Membangunkan Potensi Individu Bagi Memenuhi Aspirasi Negara',
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
    { id: 'p1', className: 'Prasekolah Bestari', males: 12, females: 13 },
    { id: '1b', className: '1 Bestari', males: 18, females: 20 },
    { id: '1p', className: '1 Pintar', males: 15, females: 16 },
    { id: '2b', className: '2 Bestari', males: 14, females: 18 },
    { id: '2p', className: '2 Pintar', males: 16, females: 15 },
    { id: '3b', className: '3 Bestari', males: 17, females: 19 },
    { id: '3p', className: '3 Pintar', males: 15, females: 14 },
    { id: '4b', className: '4 Bestari', males: 20, females: 18 },
    { id: '4p', className: '4 Pintar', males: 12, females: 15 },
    { id: '5b', className: '5 Bestari', males: 16, females: 17 },
    { id: '5p', className: '5 Pintar', males: 15, females: 15 },
    { id: '6b', className: '6 Bestari', males: 19, females: 21 },
    { id: '6p', className: '6 Pintar', males: 14, females: 16 },
  ],
  students: [
    { id: 's1', name: 'Muhammad Aliff Farhan Bin Azmi', idNumber: 'SKBL-2024-001', className: '6 Bestari', gender: 'Lelaki' },
    { id: 's2', name: 'Nur Alya Qistina Binti Mohd Faizal', idNumber: 'SKBL-2024-002', className: '6 Bestari', gender: 'Perempuan' },
    { id: 's3', name: 'Adam Harith Bin Norazam', idNumber: 'SKBL-2024-003', className: '5 Bestari', gender: 'Lelaki' },
    { id: 's4', name: 'Eshaan Pillai a/l Ravindran', idNumber: 'SKBL-2024-004', className: '4 Bestari', gender: 'Lelaki' },
    { id: 's5', name: 'Siti Nuraisyah Binti Abdullah', idNumber: 'SKBL-2024-005', className: '3 Pintar', gender: 'Perempuan' },
    { id: 's6', name: 'Lim Wei Han', idNumber: 'SKBL-2024-006', className: '5 Pintar', gender: 'Lelaki' },
    { id: 's7', name: 'Yasmin Humaira Binti Khairul anuar', idNumber: 'SKBL-2024-007', className: '2 Bestari', gender: 'Perempuan' },
    { id: 's8', name: 'Teh Jia Ling', idNumber: 'SKBL-2024-008', className: '1 Bestari', gender: 'Perempuan' },
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('maklumat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // States for Firebase status tracking & error reporting
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

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
        data.classData = studentsData.classData && studentsData.classData.length > 0 ? studentsData.classData : fallbackDetails.classData;
        data.students = studentsData.students && studentsData.students.length > 0 ? studentsData.students : fallbackDetails.students;
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
                 if (updated.photoUrl.length > 1048000) {
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
                  if (finalLogoUrl.length > 1048000) finalLogoUrl = '';
              }
          }
        })(),
        (async () => {
          if (finalPlanUrl.startsWith('data:image')) {
              try {
                  finalPlanUrl = await uploadBase64ToStorage(`images/plan_${Date.now()}.webp`, finalPlanUrl);
              } catch (e) {
                 if (finalPlanUrl.length > 1048000) finalPlanUrl = '';
              }
          }
        })()
      ]);

      timestampedDetails.logoUrl = finalLogoUrl;
      timestampedDetails.schoolPlanImageUrl = finalPlanUrl;

      const kCache = typeof keberadaanCachedData === 'string' ? keberadaanCachedData : JSON.stringify(keberadaanCachedData || []);

      // Parallelize all Supabase write operations so the entire process runs in 1 RTT (round-trip time)
      await Promise.all([
        safeSupabaseWrite(() => setDocument('details', basicDataToSave), 'school/details'),
        safeSupabaseWrite(() => setDocument('teachers', { teachers: finalTeachers, pentadbirs: finalPentadbirs, akpStaffs: finalAkp }), 'school/teachers'),
        safeSupabaseWrite(() => setDocument('media_logo', { logoUrl: finalLogoUrl }), 'school/media_logo'),
        safeSupabaseWrite(async () => {
          const audioStr = schoolSongAudioUrl || "";
          if (audioStr && audioStr.length > 1048000) {
             console.warn("Saiz fail audio terlalu besar");
             return;
          }
          await setDocument('media_song', { schoolSongLyrics: schoolSongLyrics || "", schoolSongAudioUrl: audioStr });
        }, 'school/media_song'),
        safeSupabaseWrite(() => setDocument('media_plan', { schoolPlanImageUrl: finalPlanUrl }), 'school/media_plan'),
        safeSupabaseWrite(() => setDocument('students', { classData: classData || [], students: students || [] }), 'school/students'),
        safeSupabaseWrite(() => setDocument('calendar', { calendarEvents: calendarEvents || [] }), 'school/calendar'),
        safeSupabaseWrite(() => setDocument('keberadaan', { 
          keberadaanCachedData: kCache,
          keberadaanGasUrl: timestampedDetails.keberadaanGasUrl || "",
          keberadaanSheetIdOrUrl: keberadaanSheetIdOrUrl || "",
          keberadaanSheetRange: keberadaanSheetRange || "",
          keberadaanFormUrl: keberadaanFormUrl || "",
          keberadaanRecords: keberadaanRecords || []
        }), 'school/keberadaan')
      ]);

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

  const renderContent = () => {
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
        return <KurikulumView />;
      case 'hem':
        return <HemView />;
      case 'kokurikulum':
        return <KokurikulumView />;
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

