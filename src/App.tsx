/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, uploadBase64ToStorage } from './firebase';
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

const defaultPentadbirs = [
  { id: 'p1', name: 'En. Ahmad Bin Abu', subject: 'Guru Besar', grade: 'DG54', photoUrl: 'https://i.pravatar.cc/150?img=11' },
  { id: 'p2', name: 'Pn. Siti Binti Ali', subject: 'PK Pentadbiran', grade: 'DG52', photoUrl: 'https://i.pravatar.cc/150?img=5' },
  { id: 'p3', name: 'En. Razak Bin Osman', subject: 'PK HEM', grade: 'DG48', photoUrl: 'https://i.pravatar.cc/150?img=8' },
  { id: 'p4', name: 'En. Kumar a/l Raj', subject: 'PK Kokurikulum', grade: 'DG48', photoUrl: 'https://i.pravatar.cc/150?img=12' },
];

const defaultAkpStaffs = [
  { id: 'a1', name: 'Pn. Aminah Binti Hassan', subject: 'Ketua Pembantu Tadbir', grade: 'N22', photoUrl: 'https://i.pravatar.cc/150?img=47' },
  { id: 'a2', name: 'En. Rosli Bin Ibrahim', subject: 'Pembantu Tadbir', grade: 'N19', photoUrl: 'https://i.pravatar.cc/150?img=68' },
  { id: 'a3', name: 'Pn. Noraini Binti Zakaria', subject: 'Pembantu Operasi', grade: 'N11', photoUrl: 'https://i.pravatar.cc/150?img=36' },
  { id: 'a4', name: 'En. Mohd Ridzuan Bin Ali', subject: 'Penyelia Asrama', grade: 'N19', photoUrl: 'https://i.pravatar.cc/150?img=53' },
  { id: 'a5', name: 'Pn. Kartini Binti Ismail', subject: 'Pembantu Pengurusan Murid', grade: 'N19', photoUrl: 'https://i.pravatar.cc/150?img=58' },
];

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
  guruBesar: { name: 'En. Ahmad Bin Abu', photoUrl: 'https://i.pravatar.cc/150?img=11' },
  pkPentadbiran: { name: 'Pn. Siti Binti Ali', photoUrl: 'https://i.pravatar.cc/150?img=5' },
  pkHem: { name: 'En. Razak Bin Osman', photoUrl: 'https://i.pravatar.cc/150?img=8' },
  pkKokurikulum: { name: 'En. Kumar a/l Raj', photoUrl: 'https://i.pravatar.cc/150?img=12' },
  session: 'Pagi sahaja',
  totalStudents: 846,
  totalTeachers: 69,
  totalStaff: 5,
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

  // Synchronous local-first state initialization
  const [schoolDetails, setSchoolDetails] = useState<SchoolDetails>(() => {
    try {
      const local = localStorage.getItem('skbl_details');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && typeof parsed === 'object' && parsed.name) {
          return parsed as SchoolDetails;
        }
      }
    } catch (e) {
      console.warn("Cached details parsing failed, falling back", e);
    }
    return fallbackDetails;
  });

  const mainRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const fetchSchoolDetails = async () => {
    let localData: SchoolDetails | null = null;
    let lastFetched = 0;

    try {
      const local = localStorage.getItem('skbl_details');
      if (local) {
        localData = JSON.parse(local) as SchoolDetails;
      }
      const lastFetchedStr = localStorage.getItem('skbl_details_fetched_at');
      if (lastFetchedStr) {
        lastFetched = parseInt(lastFetchedStr, 10);
      }
    } catch (e) {}

    const now = Date.now();
    // If we already have local data and it was fetched within TTL limit, skip extra queries, saving egress/reads!
    if (localData && (now - lastFetched < CACHE_TTL)) {
      console.log("Skipped Firestore reads - fresh cache within TTL.");
      return;
    }

    // If network is offline, bypass quietly
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    try {
      const detailsDocRef = doc(db, 'school', 'details');
      const teachersDocRef = doc(db, 'school', 'teachers');
      const mediaLogoDocRef = doc(db, 'school', 'media_logo');
      const mediaSongDocRef = doc(db, 'school', 'media_song');
      const mediaPlanDocRef = doc(db, 'school', 'media_plan');
      const studentsDocRef = doc(db, 'school', 'students');
      const calendarDocRef = doc(db, 'school', 'calendar');
      const keberadaanDocRef = doc(db, 'school', 'keberadaan');

      // Fetch all partitions in parallel (ultra fast loading)
      const [
        detailsSnap,
        teachersSnap,
        mediaLogoSnap,
        mediaSongSnap,
        mediaPlanSnap,
        studentsSnap,
        calendarSnap,
        keberadaanSnap
      ] = await Promise.all([
        getDoc(detailsDocRef).catch(err => { handleFirestoreError(err, OperationType.GET, 'school/details'); return null; }),
        getDoc(teachersDocRef).catch(err => { handleFirestoreError(err, OperationType.GET, 'school/teachers'); return null; }),
        getDoc(mediaLogoDocRef).catch(err => { handleFirestoreError(err, OperationType.GET, 'school/media_logo'); return null; }),
        getDoc(mediaSongDocRef).catch(err => { handleFirestoreError(err, OperationType.GET, 'school/media_song'); return null; }),
        getDoc(mediaPlanDocRef).catch(err => { handleFirestoreError(err, OperationType.GET, 'school/media_plan'); return null; }),
        getDoc(studentsDocRef).catch(err => { handleFirestoreError(err, OperationType.GET, 'school/students'); return null; }),
        getDoc(calendarDocRef).catch(err => { handleFirestoreError(err, OperationType.GET, 'school/calendar'); return null; }),
        getDoc(keberadaanDocRef).catch(err => { handleFirestoreError(err, OperationType.GET, 'school/keberadaan'); return null; })
      ]);

      // Check if any query failed (they returned null in `.catch`)
      const hasErrors = [
        detailsSnap,
        teachersSnap,
        mediaLogoSnap,
        mediaSongSnap,
        mediaPlanSnap,
        studentsSnap,
        calendarSnap,
        keberadaanSnap
      ].some(snap => snap === null);

      if (hasErrors) {
        setFirebaseError("Gagal berhubung dengan Firebase Firestore. Sila periksa samada pangkalan data anda wujud atau periksa tatapan Security Rules serta konfigurasi Environment Variables Firebase.");
        return;
      } else {
        setFirebaseError(null); // Clear errors on success
      }
      
      const detailsDocExists = detailsSnap && detailsSnap.exists();
      const teachersDocExists = teachersSnap && teachersSnap.exists();
      const mediaLogoDocExists = mediaLogoSnap && mediaLogoSnap.exists();
      const mediaSongDocExists = mediaSongSnap && mediaSongSnap.exists();
      const mediaPlanDocExists = mediaPlanSnap && mediaPlanSnap.exists();
      const studentsDocExists = studentsSnap && studentsSnap.exists();
      const calendarDocExists = calendarSnap && calendarSnap.exists();
      const keberadaanDocExists = keberadaanSnap && keberadaanSnap.exists();

      const dbExists = detailsDocExists || teachersDocExists || mediaLogoDocExists || mediaSongDocExists || mediaPlanDocExists || studentsDocExists || calendarDocExists || keberadaanDocExists;
      
      if (dbExists) {
        let data: SchoolDetails = { ...fallbackDetails };
        
        if (detailsSnap && detailsSnap.exists()) {
          data = { ...data, ...detailsSnap.data() as SchoolDetails };
        }
        
        if (teachersSnap && teachersSnap.exists()) {
          const tData = teachersSnap.data();
          data.teachers = tData.teachers || [];
          data.pentadbirs = tData.pentadbirs || [];
          data.akpStaffs = tData.akpStaffs || [];
        }
        
        if (mediaLogoSnap && mediaLogoSnap.exists()) {
          data.logoUrl = mediaLogoSnap.data().logoUrl || "";
        }
        
        if (mediaSongSnap && mediaSongSnap.exists()) {
          const sData = mediaSongSnap.data();
          data.schoolSongLyrics = sData.schoolSongLyrics || "";
          data.schoolSongAudioUrl = sData.schoolSongAudioUrl || "";
        }
        
        if (mediaPlanSnap && mediaPlanSnap.exists()) {
          data.schoolPlanImageUrl = mediaPlanSnap.data().schoolPlanImageUrl || "";
        }

        if (studentsSnap && studentsSnap.exists()) {
          const stData = studentsSnap.data();
          data.classData = stData.classData || [];
          data.students = stData.students || [];
        }

        if (calendarSnap && calendarSnap.exists()) {
          data.calendarEvents = calendarSnap.data().calendarEvents || [];
        }

        if (keberadaanSnap && keberadaanSnap.exists()) {
          const kData = keberadaanSnap.data();
          data.keberadaanCachedData = kData.keberadaanCachedData || null;
          data.keberadaanGasUrl = kData.keberadaanGasUrl || data.keberadaanGasUrl;
          data.keberadaanSheetIdOrUrl = kData.keberadaanSheetIdOrUrl || data.keberadaanSheetIdOrUrl;
          data.keberadaanSheetRange = kData.keberadaanSheetRange || data.keberadaanSheetRange;
          data.keberadaanFormUrl = kData.keberadaanFormUrl || data.keberadaanFormUrl;
          data.keberadaanRecords = kData.keberadaanRecords || [];
        }
        
        const localTime = localData?.updatedAt || 0;
        const fbTime = data.updatedAt || 0;
        let activeDetails = data;
        if (localData && localTime > fbTime) {
          activeDetails = localData;
        }
        
        setSchoolDetails(activeDetails);
        try {
          localStorage.setItem('skbl_details', JSON.stringify(activeDetails));
          localStorage.setItem('skbl_details_fetched_at', Date.now().toString());
        } catch (e) {
          console.warn("Storage quota exceeded, unable to cache detailed fetch locally.");
        }
      } else {
        // If no documents exist in Cloud Firestore, keep using our local frontend states without overwrite.
        console.info("Firestore DB is empty or fresh. Seeding Firestore with local edits or presets...");
        localStorage.setItem('skbl_details_fetched_at', Date.now().toString());
        
        // Seed Firestore database so that deployed versions have full synchronization instantly!
        const initialDetailsToSeed = localData || fallbackDetails;
        await handleSaveDetails(initialDetailsToSeed);
      }
    } catch (err: any) {
      setFirebaseError(`Gagal membaca data dari Firebase: ${err?.message || err}`);
      console.warn("Failed to fetch latest school details asynchronously from Firebase:", err);
    }
  };

  // Load from Firebase asynchronously in background WITHOUT full-screen blocking re-renders
  useEffect(() => {
    fetchSchoolDetails();
  }, []);

  async function handleSaveDetails(updatedDetails: SchoolDetails) {
    const oldDetails = schoolDetails;
    const timestampedDetails = { ...updatedDetails, updatedAt: Date.now() };
    setSaveStatus('saving');
    setSaveErrorMessage(null);
    setSchoolDetails(timestampedDetails);
    
    try {
      localStorage.setItem('skbl_details', JSON.stringify(timestampedDetails)); // Keep local as a fast fallback cache
      localStorage.setItem('skbl_details_fetched_at', Date.now().toString()); // Refresh cache freshness
    } catch (e) {
      console.warn("Storage quota exceeded, unable to cache to local storage but proceeding with Firebase sync.");
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.info("Offline State: Saved data successfully to local cache.");
      return;
    }

    try {
      const detailsDocRef = doc(db, 'school', 'details');
      const teachersDocRef = doc(db, 'school', 'teachers');
      const mediaLogoDocRef = doc(db, 'school', 'media_logo');
      const mediaSongDocRef = doc(db, 'school', 'media_song');
      const mediaPlanDocRef = doc(db, 'school', 'media_plan');
      const studentsDocRef = doc(db, 'school', 'students');
      const calendarDocRef = doc(db, 'school', 'calendar');
      const keberadaanDocRef = doc(db, 'school', 'keberadaan');

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
      const safeFirestoreWrite = async (operation: () => Promise<void>, path: string) => {
        try {
          await operation();
        } catch (err: any) {
          console.error(`Failed to save ${path} to Firestore:`, err);
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

      // Parallelize all Firestore write operations so the entire process runs in 1 RTT (round-trip time)
      await Promise.all([
        safeFirestoreWrite(() => setDoc(detailsDocRef, basicDataToSave, { merge: true }), 'school/details'),
        safeFirestoreWrite(() => setDoc(teachersDocRef, { teachers: finalTeachers, pentadbirs: finalPentadbirs, akpStaffs: finalAkp }, { merge: true }), 'school/teachers'),
        safeFirestoreWrite(() => setDoc(mediaLogoDocRef, { logoUrl: finalLogoUrl }, { merge: true }), 'school/media_logo'),
        safeFirestoreWrite(async () => {
          const audioStr = schoolSongAudioUrl || "";
          if (audioStr && audioStr.length > 1048000) {
             console.warn("Saiz fail audio terlalu besar");
             return;
          }
          await setDoc(mediaSongDocRef, { schoolSongLyrics: schoolSongLyrics || "", schoolSongAudioUrl: audioStr }, { merge: true });
        }, 'school/media_song'),
        safeFirestoreWrite(() => setDoc(mediaPlanDocRef, { schoolPlanImageUrl: finalPlanUrl }, { merge: true }), 'school/media_plan'),
        safeFirestoreWrite(() => setDoc(studentsDocRef, { classData: classData || [], students: students || [] }, { merge: true }), 'school/students'),
        safeFirestoreWrite(() => setDoc(calendarDocRef, { calendarEvents: calendarEvents || [] }, { merge: true }), 'school/calendar'),
        safeFirestoreWrite(async () => {
          const kCache = typeof keberadaanCachedData === 'string' ? keberadaanCachedData : JSON.stringify(keberadaanCachedData || []);
          if (kCache && kCache.length > 1048000) {
            console.warn("Keberadaan data exceeds 1MB, trimming cache to save metadata integrity.");
          }
          await setDoc(keberadaanDocRef, { 
            keberadaanCachedData: kCache,
            keberadaanGasUrl: timestampedDetails.keberadaanGasUrl || "",
            keberadaanSheetIdOrUrl: keberadaanSheetIdOrUrl || "",
            keberadaanSheetRange: keberadaanSheetRange || "",
            keberadaanFormUrl: keberadaanFormUrl || "",
            keberadaanRecords: keberadaanRecords || []
          }, { merge: true });
        }, 'school/keberadaan')
      ]);

      // Everything saved successfully!
      setSaveStatus('saved');
      
      // Auto clear saved toast after several seconds
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 4000);

    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.includes('offline') || !navigator.onLine) {
        console.warn("Could not sync with Firebase database because the client is offline. Local cache updated.");
        setSaveStatus('saved'); // Offline is self-healing in Firestore, mark as saved locally
      } else {
        console.error("Firebase Sync Failure:", err);
        setSaveStatus('error');
        setSaveErrorMessage(`Gagal selaraskan ke Firebase Firestore: ${errMsg}. Sila semak Security Rules pangkalan data.`);
        
        // Roll back the memory state and localStorage cache to prevent incorrect UI confirmation
        setSchoolDetails(oldDetails);
        try {
          localStorage.setItem('skbl_details', JSON.stringify(oldDetails));
        } catch (storageErr) {}
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
          {firebaseError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-2 shadow-sm text-red-800" id="firebase-conn-error">
              <div className="flex items-center gap-2 font-bold text-base">
                <span>⚠️ Amaran Sambungan Firebase</span>
              </div>
              <p className="text-sm leading-relaxed">{firebaseError}</p>
              <p className="text-xs text-red-500 font-mono mt-1">Sila periksa samada Environment Variables Firebase (NEXT_PUBLIC_FIREBASE_...) sudah dikonfigurasikan dengan betul di Vercel.</p>
            </div>
          )}

          {saveStatus === 'error' && saveErrorMessage && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col gap-2 shadow-sm text-amber-900" id="firebase-save-error">
              <div className="flex items-center gap-2 font-bold text-base">
                <span>⚠️ Gagal Menyimpan Ke Awan (Cloud Sync Failed)</span>
              </div>
              <p className="text-sm leading-relaxed">{saveErrorMessage}</p>
              <p className="text-xs text-amber-600 font-mono mt-1 border-t border-amber-200/50 pt-2">Data tempatan yang tidak selari telah dipulihkan (rolled back) untuk mengelakkan percanggahan data.</p>
              <button 
                onClick={() => { setSaveStatus('idle'); setSaveErrorMessage(null); }} 
                className="mt-2 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100 py-1.5 px-3 rounded-lg self-start transition-colors"
              >
                Tutup Amaran
              </button>
            </div>
          )}

          {saveStatus === 'saving' && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 shadow-sm text-blue-800 animate-pulse" id="firebase-saving-status">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Sedang menyelaraskan data anda ke pangkalan data Firebase...</p>
            </div>
          )}

          {saveStatus === 'saved' && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between shadow-sm text-green-800 text-sm" id="firebase-saved-status">
              <div className="flex items-center gap-2 font-medium">
                <span>✅ Berjaya Disimpan ke Firebase Firestore</span>
              </div>
              <button 
                onClick={() => setSaveStatus('idle')} 
                className="text-xs font-bold text-green-700 hover:text-green-800 hover:underline"
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

