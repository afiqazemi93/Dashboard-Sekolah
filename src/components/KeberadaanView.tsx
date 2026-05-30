import React, { useState, useEffect } from 'react';
import { UserCheck, Search, ChevronLeft, ChevronRight, ExternalLink, Users, UserMinus, Percent, PieChart, LayoutList } from 'lucide-react';
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

export function KeberadaanView({ details, isAdmin, onSave }: KeberadaanViewProps) {
  // Combine all staffs for dynamic counting
  const allStaffs = [
    ...(details.pentadbirs || []),
    ...(details.teachers || []),
    ...(details.akpStaffs || [])
  ];

  const [activeSubTab, setActiveSubTab] = useState<'senarai' | 'analitik'>('senarai');
  const [records, setRecords] = useState<KeberadaanRecord[]>(details.keberadaanRecords || []);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Fetch live data from Firestore or Apps Script
  const ambilDataLive = async () => {
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
              if (jenisKeberadaan.includes('Urusan Rasmi')) jenisKeberadaan = 'Tidak Hadir – Urusan Rasmi';
              
              let isHadir = jenisKeberadaan.includes('Program Sekolah') || jenisKeberadaan.includes('Lewat Masuk') || jenisKeberadaan.includes('Keluar Awal');
              let status = isHadir ? 'Hadir' : 'Tidak Hadir';
              let butiran = (butiranKey ? d[butiranKey] : '') || '';

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
                butiran: butiran
              };
            });
            setRecords(mappedRecords);
            return; // Skip Firestore if GAS is successful
          }
        }
      }

      // Option B: Fetch from Supabase
      const data = await getDocument('keberadaan');
      if (data && data.keberadaanRecords) {
        setRecords(data.keberadaanRecords);
      }
    } catch (e) {
      console.warn("Auto-refresh keberadaan failed:", e);
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

  // Generate view data
  const filteredRecords = allStaffs.map(staff => {
    // Look for record for selected date based on ID or matching exact names
    const rec = records.find(r => 
      (r.teacherId === staff.id || (r.teacherName && r.teacherName.trim().toLowerCase() === staff.name.trim().toLowerCase())) 
      && selectedDate >= (r.tarikhMula || r.date) && selectedDate <= (r.tarikhAkhir || r.date)
    );
    return {
      staff,
      status: rec ? rec.status : 'Hadir', // Default Hadir if no record explicitly setting 'Tidak Hadir'
      remarks: rec ? rec.remarks : '',
      tarikhMula: rec ? rec.tarikhMula : '',
      tarikhAkhir: rec ? rec.tarikhAkhir : '',
      jenisKeberadaan: rec ? rec.jenisKeberadaan : '',
      butiran: rec ? rec.butiran : ''
    };
  }).filter(item => {
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

  const totalStaff = allStaffs.length;
  // Based on current selected date
  const totalNotHadir = allStaffs.filter(staff => {
    const rec = records.find(r => 
      (r.teacherId === staff.id || (r.teacherName && r.teacherName.trim().toLowerCase() === staff.name.trim().toLowerCase()))
      && selectedDate >= (r.tarikhMula || r.date) && selectedDate <= (r.tarikhAkhir || r.date)
    );
    return rec && rec.status !== 'Hadir';
  }).length;
  const totalHadir = totalStaff - totalNotHadir;
  
  const peratusCemerlang = totalStaff > 0 ? Math.round((totalHadir / totalStaff) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 w-full max-w-7xl mx-auto">
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

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveSubTab('senarai')}
          className={`pb-3 px-4 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
            activeSubTab === 'senarai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <LayoutList className="w-4 h-4" />
          Rekod Harian
        </button>
        <button
          onClick={() => setActiveSubTab('analitik')}
          className={`pb-3 px-4 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
            activeSubTab === 'analitik' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Analitik Keberadaan Guru
        </button>
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
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1 lg:flex-initial lg:max-w-2xl justify-end">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition-colors"
              placeholder="Cari nama, jawatan atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-16">
                  Bil.
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Nama Guru / Staf
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Jenis Keberadaan
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Butiran
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((item, index) => {
                  return (
                    <tr key={item.staff.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}.
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full border border-gray-200 object-cover" src={item.staff.photoUrl} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.staff.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${item.status === 'Hadir' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {item.jenisKeberadaan || item.status}
                          </span>
                          {item.tarikhMula && item.tarikhAkhir && (() => {
                            const t1 = new Date(item.tarikhMula);
                            const t2 = new Date(item.tarikhAkhir);
                            const d1 = isNaN(t1.getTime()) ? '' : t1.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
                            const d2 = isNaN(t2.getTime()) ? '' : t2.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
                            if (d1 && d2 && d1 !== d2) {
                              return (
                                <span className="text-xs text-slate-500 font-medium ml-1">
                                  Mula: {d1} - Hingga: {d2}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        <span className="text-sm text-gray-700">{item.butiran || '-'}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
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
