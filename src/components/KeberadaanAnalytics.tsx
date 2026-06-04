import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Lightbulb, Calendar, Award, AlertCircle, Users, Activity, Filter, Loader2, Clock, Layers, Info, X } from 'lucide-react';
import { Teacher, KeberadaanRecord } from '../types';

interface KeberadaanAnalyticsProps {
  records: KeberadaanRecord[];
  staffs: Teacher[];
}

const GAS_URL = "https://script.google.com/macros/s/AKfycbzZnxUYMEwyc5a1cQIVQfzdQvcfn1_qa75fz9Yu8tkR6GFscOY1aSLYFU5M1oZU_qxszw/exec";
const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

export function KeberadaanAnalytics({ records, staffs }: KeberadaanAnalyticsProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
  const [selectedYear, setSelectedYear] = useState<string>('Semua');
  const [selectedExactDate, setSelectedExactDate] = useState<string>('');
  const [selectedStaffName, setSelectedStaffName] = useState<string>('Semua');
  
  const anchorRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top <= 0);
      },
      { threshold: 1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  
  // Normalize live data from `records` prop
  const liveRecords = useMemo(() => {
    return records.map(r => {
      let dObj: Date | null = null;
      let dateRaw = r.date || r.tarikhMula;
      if (dateRaw) {
        // Handle YYYY-MM-DD or DD/MM/YYYY
        if (dateRaw.includes('/')) {
            const parts = dateRaw.split('/');
            if (parts.length === 3) {
                // assume DD/MM/YYYY if first part > 12, or just generic
                let d = parseInt(parts[0], 10);
                let m = parseInt(parts[1], 10);
                let y = parseInt(parts[2], 10);
                if (d > 12) {
                   dObj = new Date(y, m - 1, d);
                } else {
                   // ambiguous but fallback to DD/MM/YYYY for strict RM locales usually
                   dObj = new Date(y, m - 1, d);
                }
            }
        }
        
        if (!dObj) {
            const t = new Date(dateRaw);
            if (!isNaN(t.getTime())) dObj = t;
        }
      }
      
      let rawJenis = String(r.jenisKeberadaan || r.status || 'Hadir');
      let jenisKeberadaan = rawJenis;
      if (rawJenis.includes('Cuti Rehat (CRK)') || rawJenis.includes('CRK')) jenisKeberadaan = 'CRK';
      else if (rawJenis.toLowerCase().includes('cuti sakit') || rawJenis.toLowerCase().includes('sakit') || rawJenis.toLowerCase().includes('mc')) jenisKeberadaan = 'Cuti Sakit';
      else if (rawJenis.includes('Cuti Tanpa Rekod')) jenisKeberadaan = 'CTR';
      else if (rawJenis.toLowerCase().includes('urusan rasmi')) jenisKeberadaan = 'Urusan Rasmi';
      else if (rawJenis.toLowerCase().includes('kursus') || rawJenis.toLowerCase().includes('bengkel') || rawJenis.toLowerCase().includes('ldp')) jenisKeberadaan = 'Kursus / Bengkel / LDP';
      else if (rawJenis.toLowerCase().includes('lain-lain') || rawJenis.toLowerCase().includes('lain')) jenisKeberadaan = 'Lain-lain';
      else if (rawJenis === 'Tidak Hadir') jenisKeberadaan = 'Tidak Hadir (Lain-lain)';

      return {
        id: r.id,
        teacherName: r.teacherName || 'Unknown',
        date: r.date,
        dObj: dObj,
        jenisKeberadaan: jenisKeberadaan,
      };
    }).filter(m => m.teacherName && m.teacherName !== 'Unknown' && m.date);
  }, [records]);
  // Parse dates and extract available months, years, and staff names from live records
  const availableFilters = useMemo(() => {
    const months = new Set<string>();
    const years = new Set<string>();
    const names = new Set<string>();
    
    liveRecords.forEach(r => {
      if (r.dObj) {
        months.add((r.dObj.getMonth() + 1).toString());
        years.add(r.dObj.getFullYear().toString());
      }
      if (r.teacherName) {
        names.add(r.teacherName.trim());
      }
    });
    
    return {
      months: Array.from(months).sort((a, b) => parseInt(a) - parseInt(b)),
      years: Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)),
      names: Array.from(names).sort()
    };
  }, [liveRecords]);

  // Filter records based on selections
  const filteredRecords = useMemo(() => {
    return liveRecords.filter(r => {
      const exactDateMatch = !selectedExactDate || r.date === selectedExactDate;
      const monthMatch = selectedMonth === 'Semua' || (r.dObj && (r.dObj.getMonth() + 1).toString() === selectedMonth);
      const yearMatch = selectedYear === 'Semua' || (r.dObj && r.dObj.getFullYear().toString() === selectedYear);
      // Using includes for name matching since GAS names might slightly differ or have spaces
      const staffMatch = selectedStaffName === 'Semua' || (r.teacherName && r.teacherName.trim().toLowerCase() === selectedStaffName.toLowerCase());
      
      return exactDateMatch && monthMatch && yearMatch && staffMatch;
    });
  }, [liveRecords, selectedExactDate, selectedMonth, selectedYear, selectedStaffName]);

  // 1. Analisis Mengikut Jenis Keberadaan (Kategori Dominan)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      let jk = r.jenisKeberadaan || 'Hadir';
      if (!jk.trim()) jk = 'Hadir';
      counts[jk] = (counts[jk] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  const dominantCategory = categoryData.length > 0 ? categoryData[0] : null;

  // 2. Trend Bulanan (Line Chart)
  const monthlyTrendData = useMemo(() => {
    const yearToUse = selectedYear !== 'Semua' ? parseInt(selectedYear) : new Date().getFullYear();
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      name: ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'][i],
      monthIdx: i + 1,
      kursus: 0,
      tidakHadir: 0,
      rasmi: 0
    }));

    liveRecords.forEach(r => {
      if (r.dObj && r.dObj.getFullYear() === yearToUse) {
        const mIdx = r.dObj.getMonth();
        const jk = String(r.jenisKeberadaan || '').toLowerCase();
        
        if (jk.includes('kursus') || jk.includes('bengkel') || jk.includes('ldp')) monthsData[mIdx].kursus++;
        else if (jk.includes('rasmi')) monthsData[mIdx].rasmi++;
        else if (!jk.includes('hadir') || jk.includes('tidak')) monthsData[mIdx].tidakHadir++;
      }
    });

    return monthsData;
  }, [liveRecords, selectedYear]);

  const maxKursusMonth = [...monthlyTrendData].sort((a, b) => b.kursus - a.kursus)[0];

  // 3. Analisis Individu (Top Guru)
  const topTeachersByKursus = useMemo(() => {
    const counts: Record<string, { name: string, count: number }> = {};
    filteredRecords.forEach(r => {
      const jk = String(r.jenisKeberadaan || '').toLowerCase();
      if (jk.includes('kursus') || jk.includes('bengkel') || jk.includes('rasmi') || jk.includes('ldp')) {
        const tname = r.teacherName.trim();
        if (!counts[tname]) counts[tname] = { name: tname, count: 0 };
        counts[tname].count++;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredRecords]);

  // 4. Analisis Hari & Minggu
  const dayTrendData = useMemo(() => {
    const days = [
      { name: 'Ahad', countK: 0, countT: 0, sum: 0 },
      { name: 'Isnin', countK: 0, countT: 0, sum: 0 },
      { name: 'Selasa', countK: 0, countT: 0, sum: 0 },
      { name: 'Rabu', countK: 0, countT: 0, sum: 0 },
      { name: 'Khamis', countK: 0, countT: 0, sum: 0 },
      { name: 'Jumaat', countK: 0, countT: 0, sum: 0 },
      { name: 'Sabtu', countK: 0, countT: 0, sum: 0 }
    ];

    filteredRecords.forEach(r => {
      if (r.dObj) {
        let dayOfWeek = r.dObj.getDay(); 
        if (dayOfWeek >= 0 && dayOfWeek <= 6) {
           days[dayOfWeek].sum++;
           const jk = String(r.jenisKeberadaan || '').toLowerCase();
           if (jk.includes('kursus') || jk.includes('bengkel') || jk.includes('rasmi')) {
             days[dayOfWeek].countK++;
           } else if (!jk.includes('hadir') || jk.includes('tidak') || jk.includes('cuti')) {
             days[dayOfWeek].countT++;
           }
        }
      }
    });

    // Exclude weekends if they're 0, but keep standard Mon-Fri
    return [days[1], days[2], days[3], days[4], days[5]].map(d => ({
      name: d.name,
      'Cuti/Tidak Hadir': d.countT,
      'Kursus/Aktiviti Luar': d.countK,
      'Jumlah Keseluruhan': d.sum
    }));
  }, [filteredRecords]);

  const maxAbsentDay = [...dayTrendData].sort((a, b) => b['Cuti/Tidak Hadir'] - a['Cuti/Tidak Hadir'])[0];

  // Selected Individual Stats
  const selectedStaffStats = useMemo(() => {
    if (selectedStaffName === 'Semua') return null;
    let hadir = 0, crk = 0, mc = 0, kursus = 0, totalAbsences = 0, rasmi = 0;

    filteredRecords.forEach(r => {
      const jk = String(r.jenisKeberadaan || '').toLowerCase();
      // Heuristic parsing
      if (jk === 'hadir' || jk.includes('program sekolah')) {
        hadir++;
      } else {
        totalAbsences++;
      }

      if (jk.includes('crk') || jk.includes('rehat')) crk++;
      else if (jk.includes('sakit') || jk.includes('mc')) mc++;
      else if (jk.includes('kursus') || jk.includes('bengkel') || jk.includes('ldp')) kursus++;
      else if (jk.includes('rasmi')) rasmi++;
    });

    return { hadir, crk, mc, kursus, rasmi, totalAbsences };
  }, [filteredRecords, selectedStaffName]);

  // For avatar
  const matchedStaffObj = staffs.find(s => s.name.toLowerCase() === selectedStaffName.toLowerCase());

  if (records.length === 0) {
    return (
      <div className="w-full pb-12 animate-in fade-in">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-8">
           <div className="h-10 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
           <div className="h-10 bg-slate-200 rounded-lg w-full max-w-md animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
           <div className="h-80 bg-slate-200 rounded-3xl w-full"></div>
           <div className="h-80 bg-slate-200 rounded-3xl w-full"></div>
           <div className="h-80 bg-slate-200 rounded-3xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 w-full animate-in fade-in duration-500">
      
      {/* Filters Section */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-4">
             
             {/* Exact Date Filter */}
             <div className="flex items-center gap-1.5 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
               <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
               <input 
                 type="date" 
                 value={selectedExactDate} 
                 onChange={(e) => setSelectedExactDate(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none focus:ring-0 py-1"
                 placeholder="Semua Tarikh"
               />
               {selectedExactDate && (
                 <button onClick={() => setSelectedExactDate('')} className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                    <X className="w-2.5 h-2.5" />
                 </button>
               )}
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-1.5 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
               <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
               <select 
                 value={selectedMonth} 
                 onChange={(e) => setSelectedMonth(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none focus:ring-0 py-1 cursor-pointer pr-4"
               >
                 <option value="Semua">Semua Bulan</option>
                 <option value="1">Januari</option>
                 <option value="2">Februari</option>
                 <option value="3">Mac</option>
                 <option value="4">April</option>
                 <option value="5">Mei</option>
                 <option value="6">Jun</option>
                 <option value="7">Julai</option>
                 <option value="8">Ogos</option>
                 <option value="9">September</option>
                 <option value="10">Oktober</option>
                 <option value="11">November</option>
                 <option value="12">Disember</option>
               </select>
            </div>
            
            {/* Year Filter */}
            <div className="flex items-center gap-1.5 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
               <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
               <select 
                 value={selectedYear} 
                 onChange={(e) => setSelectedYear(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none focus:ring-0 py-1 cursor-pointer pr-4"
               >
                 <option value="Semua">Semua Tahun</option>
                 {availableFilters.years.map(y => (
                   <option key={y} value={y}>{y}</option>
                 ))}
               </select>
            </div>

            {/* Staff Filter */}
            <div className="flex items-center gap-1.5 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-200/80 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow">
               <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
               <select 
                 value={selectedStaffName} 
                 onChange={(e) => setSelectedStaffName(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none focus:ring-0 py-1 max-w-[120px] sm:max-w-[150px] truncate cursor-pointer pr-4 shrink-0"
                 >
                 <option value="Semua">Semua Guru / Staf</option>
                 {availableFilters.names.map(name => (
                   <option key={name} value={name}>{name}</option>
                 ))}
               </select>
            </div>
          </div>

      {/* Auto-Generated Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shrink-0 shadow-sm">
               <Lightbulb className="w-5 h-5" />
            </div>
            <div>
               <h4 className="text-[11px] font-bold text-indigo-800 uppercase tracking-widest mb-1.5">Kategori Paling Dominan</h4>
               <p className="text-sm text-indigo-900 font-medium leading-snug">
                 {dominantCategory ? 
                   `"${dominantCategory.name}" mendahului carta catatan pendaftaran keseluruhan.` 
                   : 'Tiada data kategori mencukupi untuk dianalisa.'}
               </p>
            </div>
         </div>
         
         <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-100/50 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600 shrink-0 shadow-sm">
               <AlertCircle className="w-5 h-5" />
            </div>
            <div>
               <h4 className="text-[11px] font-bold text-rose-800 uppercase tracking-widest mb-1.5">Corak Ketiadaan</h4>
               <p className="text-sm text-rose-900 font-medium leading-snug">
                 {maxAbsentDay && maxAbsentDay['Cuti/Tidak Hadir'] > 0 ? 
                   `Hari ${maxAbsentDay.name} mencatat kekerapan ketidakhadiran tertinggi (${maxAbsentDay['Cuti/Tidak Hadir']} kes).` 
                   : 'Kadar kehadiran harian adalah konsisten.'}
               </p>
            </div>
         </div>

         <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-2xl p-5 flex items-start gap-4">
            <div className="bg-emerald-100 p-2.5 rounded-xl text-emerald-600 shrink-0 shadow-sm">
               <Award className="w-5 h-5" />
            </div>
            <div>
               <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5">Analisis Aktiviti Luar</h4>
               <p className="text-sm text-emerald-900 font-medium leading-snug">
                 {maxKursusMonth && maxKursusMonth.kursus > 0 ? 
                   `Bulan ${maxKursusMonth.name} merupakan bulan penglibatan luar tertinggi (${maxKursusMonth.kursus} aktiviti).` 
                   : 'Tiada lonjakan aktiviti luar dikesan.'}
               </p>
            </div>
         </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Keberadaan (Modern Grid Layout) */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-transparent ring-1 ring-slate-100 overflow-hidden flex flex-col relative group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-50"></div>
          <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-md">
             <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
               <Layers className="w-5 h-5 text-blue-500" />
               Analisis Data Mengikut Kategori
             </h3>
          </div>
          <div className="p-6 flex-1 flex flex-col xl:flex-row items-center gap-8">
            <div className="h-[240px] w-full xl:w-2/5 relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={categoryData.slice(0, 6)}
                     cx="50%"
                     cy="50%"
                     innerRadius={55}
                     outerRadius={95}
                     paddingAngle={3}
                     dataKey="value"
                     stroke="none"
                   >
                     {categoryData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <RechartsTooltip 
                     contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                     itemStyle={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               {/* Center text of pie chart */}
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-black text-gray-800 leading-none">{filteredRecords.length}</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rekod</span>
               </div>
            </div>
            
            <div className="w-full xl:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {categoryData.slice(0, 6).map((entry, index) => {
                const perc = filteredRecords.length > 0 ? Math.round((entry.value / filteredRecords.length) * 100) : 0;
                
                const getCategoryIcon = (ns: string) => {
                  const s = ns.toLowerCase();
                  if (s.includes('hadir') && !s.includes('tidak')) return <Award className="w-5 h-5" />;
                  if (s.includes('crk') || s.includes('cuti') || s.includes('ctr')) return <Calendar className="w-5 h-5" />;
                  if (s.includes('sakit') || s.includes('mc')) return <Clock className="w-5 h-5" />;
                  if (s.includes('kursus') || s.includes('bengkel') || s.includes('ldp') || s.includes('rasmi')) return <Activity className="w-5 h-5" />;
                  return <AlertCircle className="w-5 h-5" />;
                };

                return (
                  <div key={index} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 flex gap-4 items-center hover:shadow-md hover:border-slate-200 transition-all group">
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center opacity-90 transition-transform group-hover:scale-105" style={{ backgroundColor: `${COLORS[index % COLORS.length]}15`, color: COLORS[index % COLORS.length] }}>
                      {getCategoryIcon(entry.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold text-slate-700 whitespace-normal break-words leading-tight" title={entry.name}>{entry.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-slate-900">{entry.value}</span>
                        <span className="text-[10px] font-semibold text-slate-400">({perc}%)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trend Bulanan (Line chart with Area) */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-transparent ring-1 ring-slate-100 overflow-hidden flex flex-col relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 to-fuchsia-500 opacity-50"></div>
          <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-md">
             <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
               <Activity className="w-4 h-4 text-purple-500" />
               Trend Bulanan Dinamik ({selectedYear !== 'Semua' ? selectedYear : new Date().getFullYear()})
             </h3>
          </div>
          <div className="p-6 flex-1 h-[280px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorKursus" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorTakHadir" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                 <RechartsTooltip 
                   contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                 />
                 <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                 <Area type="monotone" name="Kursus / LDP" dataKey="kursus" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorKursus)" activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
                 <Area type="monotone" name="Ketidakhadiran" dataKey="tidakHadir" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorTakHadir)" activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} />
                 <Area type="monotone" name="Urusan Rasmi" dataKey="rasmi" stroke="#0ea5e9" strokeWidth={3} fillOpacity={0} />
               </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Hari Dalam Minggu (Bar) */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-transparent ring-1 ring-slate-100 overflow-hidden flex flex-col relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-50"></div>
          <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-md">
             <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
               <Calendar className="w-4 h-4 text-emerald-500" />
               Analisis Hari Dalam Seminggu
             </h3>
          </div>
          <div className="p-6 flex-1 h-[320px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dayTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={16}>
                 <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} />
                 <RechartsTooltip 
                   cursor={{ fill: '#f8fafc' }}
                   contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }} 
                 />
                 <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                 <Bar dataKey="Kursus/Aktiviti Luar" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="Cuti/Tidak Hadir" fill="#f43f5e" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
        
        {/* Analisis Individu Guru (Bento Box structure) */}
        <div className="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-transparent ring-1 ring-slate-100 overflow-hidden flex flex-col relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-50"></div>
          <div className="px-6 py-5 border-b border-slate-50 bg-white/50 backdrop-blur-md">
             <h3 className="text-base font-extrabold text-gray-900 flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-500" />
                  Profil Individu & Prestasí
                </span>
                {selectedStaffName === 'Semua' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-widest hidden sm:inline-block">PILIH GURU (ATAS)</span>}
             </h3>
          </div>
          
          <div className="p-6 h-full">
            {selectedStaffName === 'Semua' ? (
              <div className="h-full flex flex-col">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Top 5: Paling Aktif Kursus / Luar</h4>
                <div className="space-y-3.5 flex-1">
                  {topTeachersByKursus.slice(0, 5).map((t, idx) => (
                    <div key={t.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/60 hover:bg-white hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-white text-slate-500 border border-slate-200'}`}>
                           #{idx + 1}
                         </div>
                         <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{t.name}</p>
                      </div>
                      <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100 shrink-0 shadow-sm">
                         {t.count} Terlibat
                       </div>
                    </div>
                  ))}
                  {topTeachersByKursus.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 pb-10">
                      <Award className="w-8 h-8 opacity-20" />
                      <p className="text-sm italic">Tiada rekod kursus direkodkan.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
               <div className="animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center mb-6 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                     <img src={matchedStaffObj?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStaffName)}&background=random&color=fff&rounded=true&bold=true`} alt="" className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md" />
                     <div className="ml-4">
                        <h4 className="font-black text-lg text-slate-900 tracking-tight leading-none">{selectedStaffName}</h4>
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1.5">{matchedStaffObj?.subject || 'Guru / Staf Akademik'}</p>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                     <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5">
                          <AlertCircle className="w-20 h-20" />
                        </div>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1 z-10 w-full text-center">Ketidakhadiran</p>
                        <p className="text-4xl font-black text-slate-800 z-10">{selectedStaffStats?.totalAbsences || 0}</p>
                     </div>
                     <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5 text-indigo-800">
                          <Clock className="w-20 h-20" />
                        </div>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 z-10 w-full text-center">Sakit / MC</p>
                        <p className="text-4xl font-black text-slate-800 z-10">{selectedStaffStats?.mc || 0}</p>
                     </div>

                     <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm text-center col-span-2 relative overflow-hidden group hover:border-emerald-300 transition-colors">
                        <div className="absolute -right-4 -top-8 opacity-5 text-emerald-800 transition-transform group-hover:scale-110 duration-700">
                          <Activity className="w-32 h-32" />
                        </div>
                        <div className="flex justify-between items-center px-0 sm:px-4 z-10 relative">
                          <div className="text-center sm:text-left w-1/3">
                            <p className="text-[9px] sm:text-[10px] font-bold text-emerald-500 uppercase tracking-normal sm:tracking-widest mb-1">Kursus/LDP</p>
                            <p className="text-2xl sm:text-4xl font-black text-slate-800">{selectedStaffStats?.kursus || 0}</p>
                          </div>
                          <div className="h-10 sm:h-12 w-px bg-slate-200 shrink-0"></div>
                          <div className="text-center w-1/3 px-1">
                            <p className="text-[9px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-normal sm:tracking-widest mb-1">Cuti / CRK</p>
                            <p className="text-2xl sm:text-3xl font-black text-slate-700">{selectedStaffStats?.crk || 0}</p>
                          </div>
                          <div className="h-10 sm:h-12 w-px bg-slate-200 shrink-0"></div>
                          <div className="text-center sm:text-right w-1/3">
                             <p className="text-[9px] sm:text-[10px] font-bold text-cyan-500 uppercase tracking-normal sm:tracking-widest mb-1">Urusan Rasmi</p>
                             <p className="text-2xl sm:text-4xl font-black text-slate-800">{selectedStaffStats?.rasmi || 0}</p>
                          </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

