import React, { useState, useEffect } from 'react';
import { UserCheck, Search, ChevronLeft, ChevronRight, ExternalLink, Users, UserMinus, Percent, PieChart, LayoutList, RefreshCw } from 'lucide-react';
import { SchoolDetails, KeberadaanRecord, Teacher } from '../types';
import { getDocument } from '../supabase';
import { KeberadaanAnalytics } from './KeberadaanAnalytics';

interface KeberadaanViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave?: (details: SchoolDetails) => void;
}

function MetricCard({ title, value, fromColor, toColor, iconColor, bgIconColor, icon: Icon }: { title: string, value: string, fromColor: string, toColor: string, iconColor: string, bgIconColor: string, icon: any }) {
  return (
    <div className={`rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all bg-gradient-to-br ${fromColor} ${toColor} relative overflow-hidden flex flex-col justify-center`}>
       <div className="flex items-center space-x-4 relative z-10 w-full">
         <div className={`w-14 h-14 ${bgIconColor} rounded-full flex items-center justify-center shrink-0 shadow-sm backdrop-blur-md`}>
           <Icon className={`w-6 h-6 ${iconColor}`} />
         </div>
         <div className="flex flex-col justify-center items-start">
           <h4 className="text-white/90 text-[14px] font-bold mb-0.5">{title}</h4>
           <div className="flex items-baseline gap-2">
             <div className="text-3xl font-black text-white tracking-tight leading-none mb-1">{value}</div>
           </div>
         </div>
       </div>
       <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
       <div className="absolute top-0 right-0 w-16 h-16 border border-white/10 rounded-full -mr-2 -mt-2 pointer-events-none" />
    </div>
  );
}

const getBadgeStyles = (jenisKeberadaan: string, status: string) => {
  const text = (jenisKeberadaan || status) || '';
  const lowerText = text.toLowerCase();

  if (lowerText.includes('crk') || lowerText.includes('rehat khas')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (lowerText.includes('(cr)') || lowerText.includes('cuti rehat')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (lowerText.includes('mc') || lowerText.includes('sakit')) {
    return 'bg-red-50 text-red-700 border-red-200';
  } else if (lowerText.includes('tanpa rekod') || lowerText.includes('ctr')) {
    return 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (lowerText.includes('urusan rasmi') || lowerText.includes('rasmi')) {
    return 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (lowerText.includes('program sekolah') || lowerText.includes('kursus') || lowerText.includes('bengkel') || lowerText.includes('ldp')) {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  } else if (lowerText.includes('lewat masuk') || lowerText.includes('keluar awal')) {
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  } else if (lowerText === 'hadir' || (lowerText.includes('hadir') && !lowerText.includes('tidak'))) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (lowerText.includes('cuti mingguan')) {
    return 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (lowerText.includes('tidak hadir') && lowerText.includes('lain')) {
    return 'bg-violet-50 text-violet-700 border-violet-200';
  } else if (lowerText.includes('tidak hadir')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  } else {
    // Lain-lain / Default fallback
    return 'bg-violet-50 text-violet-700 border-violet-200';
  }
};

const cleanRecords = (recs: KeberadaanRecord[]): KeberadaanRecord[] => {
  if (!recs) return [];
  return recs.map(r => {
    let jk = r.jenisKeberadaan || '';
    if (jk.toLowerCase().includes('urusan rasmi')) {
      jk = 'Urusan Rasmi';
    }
    let m = r.masa || '';
    if (m) {
      m = formatTimeToAmPm(m);
    }
    return { ...r, jenisKeberadaan: jk, masa: m };
  });
};

function formatTimeToAmPm(timeStr: string): string {
  if (!timeStr) return '';
  let cleaned = timeStr.trim();
  
  // Strip "Masa:" or "Masa : " prefix if present
  cleaned = cleaned.replace(/^(masa|Masa)\s*:\s*/i, '');
  
  if (!cleaned) return '';

  // If it looks like a JavaScript date string, ISO datetime, or contains Google Sheets epoch date (1899-12-30)
  if (cleaned.includes('1899') || /^\d{4}-\d{2}-\d{2}/.test(cleaned) || cleaned.includes('GMT')) {
    // Try to extract time in "HH:MM:SS" or "HH:MM" format
    const timeMatch = cleaned.match(/(?:T|\s|^|\b)(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([APap][Mm]))?/i);
    if (timeMatch) {
      cleaned = `${timeMatch[1]}:${timeMatch[2]}${timeMatch[3] ? ':' + timeMatch[3] : ''}${timeMatch[4] ? ' ' + timeMatch[4] : ''}`;
    } else {
      // If no time is matched and it's literally an 1899 date, it means Apps Script destroyed the time
      if (cleaned.includes('1899-12-30')) {
        return '';
      }
    }
  }

  // Safe fallback to convert dot separation to colon (e.g. 8.30 am -> 8:30 am)
  let matchedStr = cleaned;
  if (/^\d{1,2}\.\d{2}/.test(cleaned)) {
    matchedStr = cleaned.replace(/^(\d{1,2})\.(\d{2})/, '$1:$2');
  }

  // Fallback for 4 digit military time like 1400 -> 14:00
  if (/^\d{4}$/.test(matchedStr)) {
    matchedStr = matchedStr.slice(0, 2) + ':' + matchedStr.slice(2);
  }

  // Fallback for 3 digit military time like 830 -> 8:30
  if (/^\d{3}$/.test(matchedStr)) {
    matchedStr = matchedStr.slice(0, 1) + ':' + matchedStr.slice(1);
  }

  // Regex to match hour counter, minute counter, optional seconds counter, and optional AM/PM
  const fullTimeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([APap][Mm]))?$/;
  const match = matchedStr.match(fullTimeRegex);
  if (match) {
    let hours = parseInt(match[1], 10);
    let minutesInt = parseInt(match[2], 10);
    let ampm = match[4] ? match[4].toUpperCase() : '';
    
    // Convert to 24-hour time for accurate shifting
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    
    // Auto-correct Google Sheets 26-minute LMT shift bug
    // Usually times are entered ending in 0 or 5 (e.g. 7:30, 8:00, 12:00)
    // When shifted backwards by 26 mins, they end in 4 or 9 (e.g. 04, 34, 49)
    if ([4, 9, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59].includes(minutesInt)) {
      // It is extremely likely this is the 26-minute Google Sheets offset shift. Restore it.
      const shifted = new Date(1899, 0, 1, hours, minutesInt);
      shifted.setMinutes(shifted.getMinutes() + 26);
      hours = shifted.getHours();
      minutesInt = shifted.getMinutes();
    }

    const minutesStr = minutesInt.toString().padStart(2, '0');
    
    // Always calculate AM/PM from 24-hour format
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${hours}:${minutesStr} ${ampm}`;
  }

  // Final catch: If somehow it is still 1899-12-30 exactly, hide it
  if (cleaned === '1899-12-30') return '';

  return cleaned;
}

export function KeberadaanView({ details, isAdmin, onSave }: KeberadaanViewProps) {
  // Combine all staffs for dynamic counting
  const allStaffs = [
    ...(details.pentadbirs || []),
    ...(details.teachers || []),
    ...(details.akpStaffs || [])
  ];

  const [activeSubTab, setActiveSubTab] = useState<'senarai' | 'analitik'>('senarai');
  const [records, setRecords] = useState<KeberadaanRecord[]>(() => cleanRecords(details.keberadaanRecords || []));
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isReloading, setIsReloading] = useState(false);

  // Fetch live data from Firestore or Apps Script
  const ambilDataLive = async (forceShowLoading = false) => {
    if (forceShowLoading) setIsReloading(true);
    try {
      if (details.keberadaanGasUrl) {
        let fetchUrl = details.keberadaanGasUrl;
        if (fetchUrl.includes('/a/macros/')) {
          fetchUrl = fetchUrl.replace(/\/a\/macros\/[^\/]+\/s\//, '/macros/s/');
        }
        // Option A: Fetch from Google Apps Script
        const res = await fetch(fetchUrl, { redirect: "follow" });
        if (res.ok) {
          const rawData = await res.json();
          if (Array.isArray(rawData)) {
            // Assume format matches or has basic fields
            const mappedRecords: KeberadaanRecord[] = rawData.map((d: any, i) => {
              const keys = Object.keys(d);
              const findKey = (searchStrings: string[]) => keys.find(k => searchStrings.some(s => k.toLowerCase().includes(s.toLowerCase())));

              const tarikhMulaKey = findKey(['tarikh mula', 'mula']);
              const tarikhAkhirKey = findKey(['tarikh akhir', 'akhir']);
              const nameKey = findKey(['nama guru', 'nama', 'teacher']);
              const jenisKey = findKey(['jenis keberadaan', 'jenis', 'status']);
              const butiranKey = findKey(['butiran', 'sebab lain', 'catatan', 'nota']);

              let rawMula = tarikhMulaKey ? d[tarikhMulaKey] : (d.date || d.status);
              let rawAkhir = tarikhAkhirKey ? d[tarikhAkhirKey] : (d.remarks || rawMula);

              // Normalize dates to YYYY-MM-DD
              const toYMD = (val: any) => {
                if (!val) return '';
                const t = new Date(val);
                if (!isNaN(t.getTime())) {
                  const yr = t.getFullYear();
                  const mo = String(t.getMonth() + 1).padStart(2, '0');
                  const da = String(t.getDate()).padStart(2, '0');
                  return `${yr}-${mo}-${da}`;
                }
                return String(val);
              };

              let tarikhMula = toYMD(rawMula);
              let tarikhAkhir = toYMD(rawAkhir);
              
              let jenisKeberadaan = (jenisKey ? d[jenisKey] : '') || '';
              // Clean up specific labels
              if (jenisKeberadaan.includes('Cuti Tanpa Rekod')) jenisKeberadaan = 'Tidak Hadir – Cuti Tanpa Rekod';
              if (jenisKeberadaan.toLowerCase().includes('urusan rasmi')) jenisKeberadaan = 'Urusan Rasmi';
              
              const jkClean = jenisKeberadaan.toLowerCase();
              let isHadir = jkClean.includes('program sekolah') || 
                            jkClean.includes('lewat masuk') || 
                            jkClean.includes('keluar awal') || 
                            jkClean.includes('kursus') || 
                            jkClean.includes('bengkel') || 
                            jkClean.includes('ldp') ||
                            jkClean.includes('program/taklimat') ||
                            jkClean.includes('urusan rasmi');
              let status = isHadir ? 'Hadir' : 'Tidak Hadir';
              
              // Handle multiple potential list of details
              let butiran = '';
              let masaValue = '';
              
              const masaKey = keys.find(k => {
                const kl = k.trim().toLowerCase();
                return kl === 'masa' || kl === 'time' || kl === 'pukul' || kl.includes('masa ') || kl.includes(' waktu');
              });
              let rawMasa = d.masa || d.Masa || d.Time || d.time || '';
              if (!rawMasa && masaKey) {
                rawMasa = d[masaKey];
              }
              if (rawMasa) {
                masaValue = formatTimeToAmPm(String(rawMasa).trim());
              }

              if (d.butiran !== undefined && d.butiran !== '') {
                butiran = String(d.butiran);
              } else {
                const parts: string[] = [];
                // Check course, official duty, or other reasons
                const courseKey = keys.find(k => k.toLowerCase().includes('kursus') || k.toLowerCase().includes('urusan rasmi') || k.toLowerCase().includes('sebab lain-lain'));
                // Check late/early outlet reasons 
                const programKey = keys.find(k => k.toLowerCase().includes('program/taklimat') || k.toLowerCase().includes('sebab lewat') || k.toLowerCase().includes('keluar awal'));

                if (courseKey && d[courseKey]) parts.push(String(d[courseKey]).trim());
                if (programKey && d[programKey]) parts.push(String(d[programKey]).trim());

                if (parts.length > 0) {
                  butiran = parts.filter(Boolean).join(' | ');
                } else if (butiranKey) {
                  butiran = String(d[butiranKey] || '');
                }
              }

              return {
                id: d.id || d.Timestamp || `gas-${i}`,
                teacherId: d.teacherId || d.ID || '',
                teacherName: nameKey ? d[nameKey] : (d.teacherName || ''),
                date: tarikhMula, // baseline
                status: status,
                remarks: '',
                tarikhMula: tarikhMula,
                tarikhAkhir: tarikhAkhir,
                jenisKeberadaan: jenisKeberadaan,
                butiran: butiran,
                masa: masaValue
              } as any;
            });
            setRecords(mappedRecords);
            return; // Skip Firestore if GAS is successful
          }
        }
      }

      // Option B: Fetch from Supabase
      const data = await getDocument('keberadaan');
      if (data && data.keberadaanRecords) {
        setRecords(cleanRecords(data.keberadaanRecords));
      }
    } catch (e) {
      console.warn("Auto-refresh keberadaan failed:", e);
    } finally {
      setIsReloading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    ambilDataLive();

    const interval = setInterval(() => {
      ambilDataLive();
    }, 300000);

    return () => clearInterval(interval);
  }, [details.keberadaanGasUrl]); // Re-bind if url changes

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const parsedDateForFilter = new Date(selectedDate);
  const isWeekendCheck = parsedDateForFilter.getDay() === 0 || parsedDateForFilter.getDay() === 6;

  // Generate view data
  const filteredRecords = allStaffs.map(staff => {
    // Look for record for selected date based on ID or matching exact names
    const rec = records.find(r => 
      (r.teacherId === staff.id || (r.teacherName && r.teacherName.trim().toLowerCase() === staff.name.trim().toLowerCase())) 
      && selectedDate >= (r.tarikhMula || r.date) && selectedDate <= (r.tarikhAkhir || r.date)
    );
    
    let displayButiran = rec ? rec.butiran || '' : '';
    let displayMasa = rec ? (rec as any).masa || '' : '';

    // Extract and strip any "Masa: ..." portion dynamically if present in displayButiran
    if (displayButiran) {
      const masaMatch = displayButiran.match(/(?:Masa|masa)\s*:\s*([^|]+)/i);
      if (masaMatch) {
        if (!displayMasa) {
          displayMasa = masaMatch[1].trim();
        }
        displayButiran = displayButiran.replace(/(?:Masa|masa)\s*:\s*([^|]+)/i, '');
      }
    }

    // Clean up multiple continuous pipes and leading/trailing leftovers
    displayButiran = displayButiran.trim().replace(/^\|\s*|\s*\|$/g, '').trim();
    displayButiran = displayButiran.replace(/\|\s*\|/g, '|').trim();
    displayButiran = displayButiran.trim().replace(/^\|\s*|\s*\|$/g, '').trim();

    if (displayMasa) {
      displayMasa = formatTimeToAmPm(displayMasa);
    }

    return {
      staff,
      status: rec ? rec.status : (isWeekendCheck ? 'Cuti Mingguan' : 'Hadir'), // Default Hadir if no record explicitly setting 'Tidak Hadir', on weekend default to 'Cuti Mingguan'
      remarks: rec ? rec.remarks : '',
      tarikhMula: rec ? rec.tarikhMula : '',
      tarikhAkhir: rec ? rec.tarikhAkhir : '',
      jenisKeberadaan: rec ? rec.jenisKeberadaan : (isWeekendCheck ? 'Cuti Mingguan' : ''),
      butiran: displayButiran,
      masa: displayMasa
    };
  }).filter(item => {
    // Sembunyikan guru yang tiada rekod khusus pada hujung minggu
    if (isWeekendCheck && item.jenisKeberadaan === 'Cuti Mingguan') return false;

    // Tapis nama/jawatan/catatan
    const searchLow = searchQuery.toLowerCase();
    const matchSearch = item.staff.name.toLowerCase().includes(searchLow) ||
                        item.staff.subject.toLowerCase().includes(searchLow) ||
                        item.remarks.toLowerCase().includes(searchLow) ||
                        (item.butiran || '').toLowerCase().includes(searchLow);
    
    // Tapis status (Hanya papar guru yang mempunyai rekod 'Jenis Keberadaan')
    const matchStatus = item.jenisKeberadaan && item.jenisKeberadaan !== '';

    let matchOption = true;
    if (statusFilter !== 'Semua') {
      const jk = (item.jenisKeberadaan || '').toLowerCase();
      if (statusFilter === 'Program Sekolah') matchOption = jk.includes('program sekolah');
      else if (statusFilter === 'Lewat Masuk') matchOption = jk.includes('lewat masuk');
      else if (statusFilter === 'Keluar Awal') matchOption = jk.includes('keluar awal');
      else if (statusFilter === 'CRK') matchOption = jk.includes('rehat') || jk.includes('crk');
      else if (statusFilter === 'MC') matchOption = jk.includes('sakit') || jk.includes('mc');
      else if (statusFilter === 'CTR') matchOption = jk.includes('tanpa rekod') || jk.includes('ctr') || jk.includes('ctg');
      else if (statusFilter === 'Urusan Rasmi') matchOption = jk.includes('urusan rasmi');
      else if (statusFilter === 'Kursus / Bengkel / LDP') matchOption = jk.includes('kursus') || jk.includes('bengkel') || jk.includes('ldp');
      else if (statusFilter === 'Lain-lain') matchOption = jk.includes('lain-lain');
    }

    return matchSearch && matchStatus && matchOption;
  });

  const parsedDate = new Date(selectedDate);
  const isWeekend = parsedDate.getDay() === 0 || parsedDate.getDay() === 6;

  const totalStaff = allStaffs.length;
  // Based on current selected date
  const totalNotHadir = isWeekend ? 0 : allStaffs.filter(staff => {
    const rec = records.find(r => 
      (r.teacherId === staff.id || (r.teacherName && r.teacherName.trim().toLowerCase() === staff.name.trim().toLowerCase()))
      && selectedDate >= (r.tarikhMula || r.date) && selectedDate <= (r.tarikhAkhir || r.date)
    );
    if (!rec) return false;
    
    // Explicitly exclude these categories from being counted as 'Tidak Hadir' card value
    const jkClean = (rec.jenisKeberadaan || '').toLowerCase();
    const isExcluded = jkClean.includes('program sekolah') ||
                       jkClean.includes('lewat masuk') ||
                       jkClean.includes('keluar awal') ||
                       jkClean.includes('kursus') ||
                       jkClean.includes('bengkel') ||
                       jkClean.includes('ldp') ||
                       jkClean.includes('program/taklimat') ||
                       jkClean.includes('urusan rasmi');
    if (isExcluded) return false;

    return rec.status !== 'Hadir';
  }).length;
  const totalHadir = isWeekend ? 0 : totalStaff - totalNotHadir;
  
  const peratusCemerlang = totalStaff > 0 && !isWeekend ? Math.round((totalHadir / totalStaff) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 w-full">
      {/* ELEMEN BAHAGIAN ATAS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Keberadaan Guru & Staf</h2>
          </div>
        </div>
        <div className="flex items-center">
          {details.keberadaanFormUrl ? (
            <a href={details.keberadaanFormUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white hover:bg-blue-600 text-[10px] uppercase tracking-widest font-black rounded-2xl transition-all shadow-sm gap-2 w-full sm:w-auto">
               Borang Keberadaan <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <button className="inline-flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-400 text-xs font-bold rounded-2xl shadow-sm opacity-50 cursor-not-allowed gap-2 w-full sm:w-auto">
               Borang Keberadaan (Tiada Pautan)
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex justify-center sm:justify-start mb-6 w-full">
        <div className="flex bg-white sm:bg-slate-100/50 rounded-2xl border border-slate-200/60 sm:border-slate-100 p-1.5 shrink-0 overflow-x-auto hide-scrollbar shadow-sm sm:shadow-none w-full sm:w-auto max-w-max">
          <button 
            onClick={() => setActiveSubTab('senarai')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 font-bold sm:font-semibold text-[11px] sm:text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeSubTab === 'senarai' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-100 font-extrabold' 
                : 'text-slate-500 sm:text-slate-600 hover:bg-slate-50 sm:hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>Rekod Harian</span>
          </button>
          <button 
            onClick={() => setActiveSubTab('analitik')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 font-bold sm:font-semibold text-[11px] sm:text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeSubTab === 'analitik' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 scale-100 font-extrabold' 
                : 'text-slate-500 sm:text-slate-600 hover:bg-slate-50 sm:hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Analitik</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'analitik' ? (
        <KeberadaanAnalytics records={records} staffs={allStaffs} />
      ) : (
        <>
          {/* KOTAK INPUT & TAPISAN (FILTERS) */}
          <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            {/* PILIH HARI / TARIKH */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <button onClick={handlePrevDay} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 lg:w-40 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-center text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button onClick={handleNextDay} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

        {/* CARI & FILTER */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto flex-1 lg:flex-initial lg:max-w-3xl justify-end">
          {/* Desktop/Large Tablet Reload Button (Left of the search bar, icon only, no text) */}
          <button
            onClick={() => ambilDataLive(true)}
            disabled={isReloading}
            className="hidden lg:flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-indigo-600 rounded-xl transition-all border border-slate-200/40 shrink-0 self-stretch"
            title="Muat Semula"
          >
            <RefreshCw className={`w-5 h-5 ${isReloading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
              placeholder="Cari nama, jawatan atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-w-[150px]"
          >
            <option value="Semua">Semua</option>
            <option value="Program Sekolah">Program Sekolah</option>
            <option value="Lewat Masuk">Lewat Masuk</option>
            <option value="Keluar Awal">Keluar Awal</option>
            <option value="CRK">CRK</option>
            <option value="MC">MC</option>
            <option value="CTR">CTR</option>
            <option value="Urusan Rasmi">Urusan Rasmi</option>
            <option value="Kursus / Bengkel / LDP">Kursus / Bengkel / LDP</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>

          {/* Mobile & Tablet Reload Button (Below dropdown, only text, responsive) */}
          <button
            onClick={() => ambilDataLive(true)}
            disabled={isReloading}
            className="lg:hidden w-full flex items-center justify-center py-2.5 mt-1 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:bg-indigo-100 border border-indigo-100/80 rounded-xl transition-all shadow-xs"
          >
            <span>{isReloading ? 'Memuat Semula...' : 'Muat Semula'}</span>
          </button>
        </div>
      </div>

      {/* KAD RUMUSAN STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard 
          title="Jumlah Staf" 
          value={totalStaff.toString()} 
          icon={Users} 
          fromColor="from-purple-600" toColor="to-purple-500" 
          bgIconColor="bg-purple-500/20" iconColor="text-purple-50" 
        />
        <MetricCard 
          title="Hadir" 
          value={totalHadir.toString()} 
          icon={UserCheck} 
          fromColor="from-teal-600" toColor="to-teal-500" 
          bgIconColor="bg-teal-500/20" iconColor="text-teal-50" 
        />
        <MetricCard 
          title="Tidak Hadir" 
          value={totalNotHadir.toString()} 
          icon={UserMinus} 
          fromColor="from-orange-600" toColor="to-orange-500" 
          bgIconColor="bg-orange-500/20" iconColor="text-orange-50" 
        />
        <MetricCard 
          title="Peratus Kehadiran" 
          value={`${peratusCemerlang}%`} 
          icon={Percent} 
          fromColor="from-blue-600" toColor="to-blue-500" 
          bgIconColor="bg-blue-500/20" iconColor="text-blue-50"
        />
      </div>

      {/* JADUAL SENARAI (BAHAGIAN BAWAH) */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                <th scope="col" className="px-6 py-5 text-left text-[11px] lg:text-sm font-black text-white uppercase tracking-[0.1em] w-16">
                  Bil.
                </th>
                <th scope="col" className="px-6 py-5 text-left text-[11px] lg:text-sm font-black text-white uppercase tracking-[0.1em]">
                  Nama Guru / Staf
                </th>
                <th scope="col" className="px-6 py-5 text-center text-[11px] lg:text-sm font-black text-white uppercase tracking-[0.1em]">
                  Jenis Keberadaan
                </th>
                <th scope="col" className="px-6 py-5 text-left text-[11px] lg:text-sm font-black text-white uppercase tracking-[0.1em] min-w-[200px] sm:min-w-[280px] md:min-w-[320px]">
                  Butiran
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item, index) => {
                  return (
                    <tr key={item.staff.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap text-[11px] lg:text-sm text-gray-500 font-bold">
                        {index + 1}.
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full border border-gray-200 object-cover" src={item.staff.photoUrl} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-[11px] lg:text-sm font-bold text-slate-800 uppercase tracking-tight">{item.staff.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] lg:text-xs font-black tracking-wider uppercase border justify-center ${getBadgeStyles(item.jenisKeberadaan, item.status)}`}>
                            {item.jenisKeberadaan || item.status}
                          </span>
                          {item.tarikhMula && item.tarikhAkhir && (() => {
                            const t1 = new Date(item.tarikhMula);
                            const t2 = new Date(item.tarikhAkhir);
                            
                            // Normalize dates to midnight to avoid daylight saving time issues
                            const ut1 = Date.UTC(t1.getFullYear(), t1.getMonth(), t1.getDate());
                            const ut2 = Date.UTC(t2.getFullYear(), t2.getMonth(), t2.getDate());
                            
                            const d1 = isNaN(ut1) ? '' : t1.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
                            const d2 = isNaN(ut2) ? '' : t2.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
                            const diffDays = isNaN(ut1) || isNaN(ut2) ? 0 : Math.floor((ut2 - ut1) / (1000 * 60 * 60 * 24)) + 1;

                            const isKetidakhadiran = item.status === 'Tidak Hadir' || (item.jenisKeberadaan && (item.jenisKeberadaan.toLowerCase().includes('cuti') || item.jenisKeberadaan.toLowerCase().includes('mc') || item.jenisKeberadaan.toLowerCase().includes('sakit')));
                            const isKursusBengkelLdp = item.jenisKeberadaan && (item.jenisKeberadaan.toLowerCase().includes('kursus') || item.jenisKeberadaan.toLowerCase().includes('bengkel') || item.jenisKeberadaan.toLowerCase().includes('ldp') || item.jenisKeberadaan.toLowerCase().includes('bengkel/ldp'));

                            if (d1 && d2) {
                              if (d1 !== d2) {
                                return (
                                  <div className="flex flex-col items-center mt-1">
                                    <span className="text-[10px] lg:text-xs text-slate-500 font-medium">
                                      {d1} - {d2}
                                    </span>
                                    {(isKetidakhadiran || isKursusBengkelLdp) && (
                                      <span className="text-[10px] lg:text-xs text-slate-600 font-bold">
                                        ({diffDays} Hari)
                                      </span>
                                    )}
                                  </div>
                                );
                              } else if (isKetidakhadiran || isKursusBengkelLdp) {
                                return (
                                  <span className="text-[10px] lg:text-xs text-slate-600 font-bold mt-1">
                                    (1 Hari)
                                  </span>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-normal min-w-[200px] sm:min-w-[280px] md:min-w-[320px]">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-[11px] lg:text-sm font-semibold text-gray-700">{item.butiran || '-'}</span>
                          {item.masa && (
                            <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100/80 shadow-xs matches-time mt-1">
                              {item.masa}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[11px] lg:text-sm text-gray-500">
                    Tiada rekod dijumpai untuk carian/tapisan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
