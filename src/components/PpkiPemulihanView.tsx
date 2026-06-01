import React, { useState, useEffect } from 'react';
import { SchoolDetails } from '../types';
import { 
  Users, HandHeart, Link2, RefreshCw, AlertCircle, Database, Edit2, Search,
  PieChart as PieChartIcon, Target, UsersRound, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

interface PpkiPemulihanViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave: (details: SchoolDetails) => void;
}

const DEFAULT_PPKI_GAS_URL = 'https://script.google.com/macros/s/AKfycbxREseFnc1-HopWKZ9Oa5ogwljzR7M3iqYBvWo71GNx_nZDQON-uCuI5W-WSMd7j635Ug/exec';
const DEFAULT_PEMULIHAN_GAS_URL = 'https://script.google.com/macros/s/AKfycbzE8Jh3iCLiecNbv7HD9d3Qg6byWdR_aGVXamZLJDsoMWbWLEo2coOmL7jYuKV7_6AChA/exec';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

export function PpkiPemulihanView({ details, isAdmin, onSave }: PpkiPemulihanViewProps) {
  const [activeTab, setActiveTab] = useState<'ppki' | 'pemulihan'>('ppki');
  
  const ppkiUrl = details.ppkiGasUrl || DEFAULT_PPKI_GAS_URL;
  const pemulihanUrl = details.pemulihanGasUrl || DEFAULT_PEMULIHAN_GAS_URL;

  const [ppkiData, setPpkiData] = useState<any[]>([]);
  const [pemulihanData, setPemulihanData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showSettings, setShowSettings] = useState(false);
  const [formPpkiUrl, setFormPpkiUrl] = useState(ppkiUrl);
  const [formPemulihanUrl, setFormPemulihanUrl] = useState(pemulihanUrl);
  
  const [formPpkiStaff, setFormPpkiStaff] = useState<string[]>(details.ppkiStaffIds || []);
  const [formPemulihanStaff, setFormPemulihanStaff] = useState<string[]>(details.pemulihanStaffIds || []);

  const allStaff = [...(details.teachers || []), ...(details.akpStaffs || []), ...(details.pentadbirs || [])];

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
     setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const fetchData = async (type: 'ppki' | 'pemulihan') => {
    let targetUrl = type === 'ppki' ? ppkiUrl : pemulihanUrl;
    if (!targetUrl) return;

    // Automatically strip workspace domain if present, as it forces authentication and breaks CORS
    if (targetUrl.includes('/a/macros/')) {
      targetUrl = targetUrl.replace(/\/a\/macros\/[^\/]+\/s\//, '/macros/s/');
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(targetUrl, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP Ralat ${res.status}`);
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        if (text.trim().startsWith('<')) {
          throw new Error('Apps Script memulangkan HTML. Pastikan Apps Script anda menggunakan ContentService untuk memulangkan format JSON, bukan HtmlService.');
        }
        throw new Error('Data yang diterima bukan dalam format JSON yang sah.');
      }
      
      const arrayData = Array.isArray(data) ? data : (data.data || data.records || []);
      
      if (type === 'ppki') setPpkiData(arrayData);
      else setPemulihanData(arrayData);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
         setErrorMsg(`Gagal mengambil data ${type.toUpperCase()}: Ralat CORS atau URL App Script disekat. Pastikan App Script di'deploy' dengan tetapan: "Execute as: Me" dan "Who has access: Anyone". Jika menggunakan akaun MOE (moe-dl.edu.my), akses mungkin disekat oleh domain.`);
      } else {
         setErrorMsg(`Gagal mengambil data ${type.toUpperCase()}: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, ppkiUrl, pemulihanUrl]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...details,
      ppkiGasUrl: formPpkiUrl,
      pemulihanGasUrl: formPemulihanUrl,
      ppkiStaffIds: formPpkiStaff,
      pemulihanStaffIds: formPemulihanStaff
    });
    setShowSettings(false);
  };

  const getAnalytics = (data: any[], type: 'ppki' | 'pemulihan') => {
    const total = data.length;
    
    // Male / Female (Assuming JANTINA column exists and values are "LELAKI" / "PEREMPUAN")
    let lelaki = 0;
    let perempuan = 0;
    
    // For PPKI specifically, KATEGORI PPKI, KETIDAKUPAYAAN
    const categoryCount: Record<string, number> = {};
    const disabilityCount: Record<string, number> = {};
    const bangsaCount: Record<string, number> = {};
    const programCount: Record<string, number> = {};
    const tahunCount: Record<string, number> = {};
    
    // Custom logic to guess keys since Apps Script might have varying case
    const getKey = (item: any, possibleKeys: string[]) => {
       for (const key of possibleKeys) {
         const matchingKey = Object.keys(item).find(k => k.toUpperCase().includes(key.toUpperCase()));
         if (matchingKey) return item[matchingKey];
       }
       return null;
    };

    data.forEach(item => {
       const jantina = getKey(item, ['JANTINA', 'GENDER']);
       if (jantina && typeof jantina === 'string') {
         if (jantina.toUpperCase().includes('LELAKI') || jantina.toUpperCase() === 'L') lelaki++;
         else perempuan++;
       }

       const bangsa = getKey(item, ['BANGSA', 'RACE']);
       if (bangsa) {
          bangsaCount[bangsa] = (bangsaCount[bangsa] || 0) + 1;
       }

       if (type === 'ppki') {
          const kategori = getKey(item, ['KATEGORI', 'KATEGORI PPKI']);
          if (kategori) {
             categoryCount[kategori] = (categoryCount[kategori] || 0) + 1;
          }
          const ketidakupayaanRaw = getKey(item, ['KETIDAKUPAYAAN']);
          if (ketidakupayaanRaw) {
             const ketidakupayaan = String(ketidakupayaanRaw).trim().toUpperCase();
             const properCaseKetidakupayaan = ketidakupayaan.charAt(0) + ketidakupayaan.slice(1).toLowerCase();
             disabilityCount[properCaseKetidakupayaan] = (disabilityCount[properCaseKetidakupayaan] || 0) + 1;
          }
       } else if (type === 'pemulihan') {
          const program = getKey(item, ['PROGRAM', 'PROGRAM PEMULIHAN']);
          if (program && typeof program === 'string') {
             programCount[program] = (programCount[program] || 0) + 1;
          }

          const tahunRaw = getKey(item, ['TAHUN', 'YEAR', 'KELAS']);
          if (tahunRaw) {
             let tahunStr = String(tahunRaw).trim().toUpperCase();
             if (/^[1-6](\s|$)/.test(tahunStr)) {
                tahunStr = "Tahun " + tahunStr.charAt(0);
             } else if (tahunStr.startsWith("TAHUN")) {
                // Already "Tahun X"
             } else if (["1","2","3","4","5","6"].includes(tahunStr)) {
                tahunStr = "Tahun " + tahunStr;
             }
             const formattedTahun = tahunStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
             tahunCount[formattedTahun] = (tahunCount[formattedTahun] || 0) + 1;
          }
       }
    });

    const categoryChart = Object.keys(categoryCount).map(k => ({ name: k, value: categoryCount[k] }));
    const disabilityChart = Object.keys(disabilityCount).map(k => ({ name: k, value: disabilityCount[k] }));
    const bangsaChart = Object.keys(bangsaCount).map(k => ({ name: k, value: bangsaCount[k] }));
    const programChart = Object.keys(programCount).map(k => ({ name: k, value: programCount[k] }));
    const tahunChart = Object.keys(tahunCount).map(k => ({ name: k, value: tahunCount[k] }));

    return { total, lelaki, perempuan, categoryChart, disabilityChart, bangsaChart, programChart, tahunChart };
  };

  const currentData = activeTab === 'ppki' ? ppkiData : pemulihanData;
  
  // Advanced search processing
  const processedData = currentData.filter(item => {
    if (!searchTerm) return true;
    const searchString = Object.values(item).join(' ').toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = activeTab === 'pemulihan' 
     ? processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) 
     : processedData;

  const analytics = getAnalytics(currentData, activeTab);

  // Render Table Header dynamically
  const renderTableHeader = () => {
     if (activeTab === 'ppki') {
       return (
         <tr className="bg-blue-600 text-white text-sm uppercase tracking-widest border-b border-blue-700">
           <th className="px-2 py-4 font-black w-12 min-w-[48px] text-center sticky left-0 bg-blue-600 z-20">Bil.</th>
           <th className="px-6 py-4 font-black sticky left-12 bg-blue-600 z-20 border-r border-blue-700 min-w-[180px] max-w-[280px]">Nama Penuh</th>
           <th className="px-6 py-4 font-black">Jantina</th>
           <th className="px-6 py-4 font-black">Umur</th>
           <th className="px-6 py-4 font-black">Bangsa/Agama</th>
           <th className="px-6 py-4 font-black">Kelas/Tahun</th>
           <th className="px-6 py-4 font-black">Kategori/Ketidakupayaan</th>
           <th className="px-6 py-4 font-black">Tarikh Daftar</th>
         </tr>
       );
     }
     
     // Generic fallback for pemulihan or unknown columns
     if (currentData.length === 0) return null;
     const keys = Object.keys(currentData[0]).filter(k => 
        !k.toUpperCase().includes('MYKID') && !k.toUpperCase().includes('TARIKH LAHIR') && !k.toUpperCase().includes('ID') && k.toUpperCase() !== 'BIL'
     );
     // Push "Nama" to front if present
     const nameIndex = keys.findIndex(k => k.toUpperCase().includes('NAMA'));
     if (nameIndex > 0) {
        const nameKey = keys.splice(nameIndex, 1)[0];
        keys.unshift(nameKey);
     }

     return (
        <tr className="bg-emerald-600 text-white text-sm uppercase tracking-widest border-b border-emerald-700">
          <th className="px-2 py-4 font-black w-12 min-w-[48px] text-center sticky left-0 bg-emerald-600 z-20">Bil.</th>
          {keys.map((k, i) => (
            <th 
              key={i} 
              className={`px-6 py-4 font-black ${i === 0 ? 'sticky left-12 bg-emerald-600 z-20 border-r border-emerald-700 min-w-[180px] max-w-[280px]' : ''}`}
            >
              {k}
            </th>
          ))}
        </tr>
     );
  };

  const renderTableBody = () => {
     if (processedData.length === 0) {
        return (
          <tr>
            <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
               <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p className="font-bold text-sm">Tiada Rekod Dijumpai</p>
            </td>
          </tr>
        );
     }

     const getKey = (item: any, possibleKeys: string[]) => {
       for (const key of possibleKeys) {
         const matchingKey = Object.keys(item).find(k => k.toUpperCase().includes(key.toUpperCase()));
         if (matchingKey) return item[matchingKey];
       }
       return '-';
     };

     let fallbackKeys: string[] = [];
     if (activeTab === 'pemulihan' && currentData.length > 0) {
        fallbackKeys = Object.keys(currentData[0]).filter(k => 
           !k.toUpperCase().includes('MYKID') && !k.toUpperCase().includes('TARIKH LAHIR') && !k.toUpperCase().includes('ID') && k.toUpperCase() !== 'BIL'
        );
        const nameIndex = fallbackKeys.findIndex(k => k.toUpperCase().includes('NAMA'));
        if (nameIndex > 0) {
           const nameKey = fallbackKeys.splice(nameIndex, 1)[0];
           fallbackKeys.unshift(nameKey);
        }
     }

     return paginatedData.map((item, idx) => {
        const actualIdx = activeTab === 'pemulihan' ? (currentPage - 1) * itemsPerPage + idx : idx;
        if (activeTab === 'ppki') {
           const nama = getKey(item, ['NAMA', 'NAMA PENUH']);
           const jantina = getKey(item, ['JANTINA']);
           const umur = getKey(item, ['UMUR']);
           const bangsa = getKey(item, ['BANGSA']);
           const agama = getKey(item, ['AGAMA']);
           const kelas = getKey(item, ['KELAS', 'TAHUN']);
           const kategori = getKey(item, ['KATEGORI', 'KATEGORI PPKI']);
           const ketidakupayaan = getKey(item, ['KETIDAKUPAYAAN']);
           const tarikh = getKey(item, ['TARIKH DAFTAR']);

           return (
             <tr key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50 group">
                <td className="px-2 py-4 font-black text-slate-400 text-[11px] text-center sticky left-0 bg-white group-hover:bg-slate-50 z-10 w-12 min-w-[48px]">{idx + 1}</td>
                <td className="px-6 py-4 font-bold text-slate-800 text-[11px] uppercase sticky left-12 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] min-w-[180px] max-w-[280px]" title={nama as string}>
                  <div className="line-clamp-2 whitespace-normal leading-tight">
                    {nama}
                  </div>
                </td>
                <td className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase">{jantina}</td>
                <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{umur}</td>
                <td className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase">
                  <div className="flex flex-col">
                    <span>{bangsa}</span>
                    <span className="text-[10px] text-slate-400">{agama}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[11px] font-bold text-blue-600 uppercase">{kelas}</td>
                <td className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase">
                  <div className="flex flex-col gap-1">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] rounded-lg border border-blue-100 max-w-max">{kategori}</span>
                    <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] rounded-lg border border-amber-100 max-w-max line-clamp-1" title={ketidakupayaan as string}>{ketidakupayaan}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[11px] font-medium text-slate-500">{tarikh}</td>
             </tr>
           );
        }

        // Generic fallback for Pemulihan Tab
        return (
          <tr key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50 group">
             <td className="px-2 py-4 font-black text-slate-400 text-[11px] text-center sticky left-0 bg-white group-hover:bg-slate-50 z-10 w-12 min-w-[48px]">{actualIdx + 1}</td>
             {fallbackKeys.map((keyString, i) => {
                // Find matching key in current row regardless of exact casing, since rows might have random blanks etc.
                const matchingItemKey = Object.keys(item).find(k => k.trim().toUpperCase() === keyString.trim().toUpperCase()) || keyString;
                return (
                   <td key={i} className={`px-6 py-4 text-[11px] font-bold text-slate-700 ${
                        i === 0 
                          ? 'uppercase sticky left-12 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] min-w-[180px] max-w-[280px]' 
                          : ''
                      }`}
                      title={String(item[matchingItemKey] || '-')}
                    >
                      {i === 0 ? (
                        <div className="line-clamp-2 whitespace-normal leading-tight">
                          {String(item[matchingItemKey] || '-')}
                        </div>
                      ) : (
                        String(item[matchingItemKey] || '-')
                      )}
                   </td>
                );
             })}
          </tr>
        );
     });
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-2.5 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100 max-w-max">
          <button 
            onClick={() => setActiveTab('ppki')}
            className={`px-6 py-3 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'ppki' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10 scale-100 font-extrabold' 
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            PPKI
          </button>
          <button 
            onClick={() => setActiveTab('pemulihan')}
            className={`px-6 py-3 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'pemulihan' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 scale-100 font-extrabold' 
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            Pemulihan
          </button>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="flex items-center gap-2 font-black text-xs uppercase px-5 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-2xl transition-all shadow-sm hover:scale-[1.03] active:scale-95 cursor-pointer"
          >
            <Settings className="w-4 h-4" /> 
            <span>Tetapan</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSettings && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-lg shadow-blue-500/10 mb-8 max-w-4xl mx-auto">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Tetapan Apps Script URL
              </h3>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL App Script PPKI</label>
                  <div className="flex gap-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center px-4">
                      <Link2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <input type="text" value={formPpkiUrl} onChange={e => setFormPpkiUrl(e.target.value)} required className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL App Script Pemulihan</label>
                  <div className="flex gap-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center px-4">
                      <Link2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <input type="text" value={formPemulihanUrl} onChange={e => setFormPemulihanUrl(e.target.value)} required className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Guru PPKI */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guru & Staf PPKI Terlibat</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto space-y-2">
                       {allStaff.map(s => (
                         <label key={`ppki-${s.id}`} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={formPpkiStaff.includes(s.id)} onChange={e => {
                               if (e.target.checked) setFormPpkiStaff([...formPpkiStaff, s.id]);
                               else setFormPpkiStaff(formPpkiStaff.filter(id => id !== s.id));
                            }} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                            <span className="text-xs font-bold text-slate-700">{s.name}</span>
                         </label>
                       ))}
                       {allStaff.length === 0 && <span className="text-xs text-slate-400">Tiada rekod guru/staf. Sila tambah di tab Pentadbiran & Staf.</span>}
                    </div>
                  </div>

                  {/* Guru Pemulihan */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guru & Staf Pemulihan Terlibat</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[200px] overflow-y-auto space-y-2">
                       {allStaff.map(s => (
                         <label key={`pemulihan-${s.id}`} className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={formPemulihanStaff.includes(s.id)} onChange={e => {
                               if (e.target.checked) setFormPemulihanStaff([...formPemulihanStaff, s.id]);
                               else setFormPemulihanStaff(formPemulihanStaff.filter(id => id !== s.id));
                            }} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-xs font-bold text-slate-700">{s.name}</span>
                         </label>
                       ))}
                       {allStaff.length === 0 && <span className="text-xs text-slate-400">Tiada rekod guru/staf. Sila tambah di tab Pentadbiran & Staf.</span>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowSettings(false)} className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-colors">Batal</button>
                  <button type="submit" className="px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all">Simpan Tetapan</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assigned Guru/Staff Banner */}
      {(() => {
         const currentStaffIds = activeTab === 'ppki' ? details.ppkiStaffIds : details.pemulihanStaffIds;
         if (!currentStaffIds || currentStaffIds.length === 0) return null;
         
         const assignedStaff = currentStaffIds.map(id => allStaff.find(s => s.id === id)).filter(Boolean);
         if (assignedStaff.length === 0) return null;

         const title = activeTab === 'ppki' ? 'Guru & Staf (PPKI)' : 'Guru Pemulihan';

         return (
            <div className={`filter drop-shadow-sm p-6 rounded-3xl mx-auto flex flex-col items-center justify-center mb-8 max-w-fit border bg-white ${activeTab === 'ppki' ? 'border-blue-100' : 'border-emerald-100'}`}>
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 text-center">{title}</h3>
               <div className="flex flex-wrap justify-center gap-4">
                  {assignedStaff.map(s => (
                     <div key={s!.id} className="bg-white rounded-[16px] p-3 flex items-center space-x-4 w-full sm:w-[260px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all outline-none border-none border-transparent">
                        <div className="relative w-14 h-14 shrink-0 select-none">
                           <img 
                             loading="lazy" decoding="async"
                             src={s!.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s!.name)}&background=EBF4FF&color=3B82F6`} 
                             alt={s!.name} 
                             referrerPolicy="no-referrer"
                             className="w-full h-full object-cover rounded-full shadow-md border-2 border-white" 
                           />
                           {s!.grade && (
                              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 text-[10px] font-black text-white rounded-full leading-none border-2 border-white shadow-md z-10 whitespace-nowrap ${activeTab === 'ppki' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                                {s!.grade}
                              </span>
                           )}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                           {s!.subject && (
                             <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full inline-block mb-1.5 ${activeTab === 'ppki' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                               {s!.subject}
                             </p>
                           )}
                           <h5 className="font-extrabold text-[12px] sm:text-[13px] text-gray-950 line-clamp-2 leading-snug mb-1" title={s!.name}>
                             {s!.name}
                           </h5>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         );
      })()}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">{errorMsg}</p>
        </div>
      )}

      {/* Analytics Overview Cards */}
      {!loading && !errorMsg && currentData.length > 0 && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           {/* Combined Total, Lelaki, Perempuan Card */}
           <div className={`p-8 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 ${activeTab === 'ppki' ? 'bg-blue-600 border-blue-500 lg:col-span-1' : 'bg-emerald-600 border-emerald-500 lg:col-span-1'}`}>
              <div className="flex flex-col items-center md:items-start z-10">
                 <p className="text-xs font-black uppercase tracking-widest mb-2 text-white/80">Jumlah Murid</p>
                 <h4 className="text-6xl font-black text-white">{analytics.total}</h4>
              </div>
              
              <div className="flex gap-8 items-center bg-black/10 px-8 py-6 rounded-3xl backdrop-blur-sm z-10 w-full md:w-auto justify-center">
                 <div className="text-center">
                    <h5 className="text-3xl font-black text-white">{analytics.lelaki}</h5>
                    <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-2 flex items-center gap-1"><Users className="w-3 h-3"/> Lelaki</p>
                 </div>
                 <div className="w-px h-12 bg-white/20"></div>
                 <div className="text-center">
                    <h5 className="text-3xl font-black text-white">{analytics.perempuan}</h5>
                    <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-2 flex items-center gap-1"><Users className="w-3 h-3"/> Perempuan</p>
                 </div>
              </div>
           </div>

           {/* Bangsa Analytics - For PPKI */}
           {activeTab === 'ppki' && analytics.bangsaChart.length > 0 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full lg:col-span-1">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 w-full mb-6">Pecahan Bangsa</h3>
                 <div className="flex gap-6 items-center flex-1">
                    <div className="h-[120px] w-[120px] shrink-0 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Tooltip formatter={(value) => [`${value} Murid`, 'Jumlah']} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}/>
                            <Pie data={analytics.bangsaChart} dataKey="value" innerRadius={35} outerRadius={60} paddingAngle={2}>
                              {analytics.bangsaChart.map((e, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]} />)}
                            </Pie>
                         </PieChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-3 overflow-y-auto max-h-[140px] pr-2 w-full custom-scrollbar">
                       {analytics.bangsaChart.map((c, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 text-sm">
                             <div className="flex items-center gap-2.5 flex-1 min-w-0">
                               <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[(i + 3) % PIE_COLORS.length] }}></div>
                               <span className="font-bold text-slate-600 uppercase truncate leading-tight">{c.name}</span>
                             </div>
                             <span className="font-black text-slate-800 whitespace-nowrap">{c.value}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {/* Conditional PPKI Analytics - Ketidakupayaan */}
           {activeTab === 'ppki' && analytics.disabilityChart.length > 0 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden lg:col-span-2">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 w-full mb-6">Ketidakupayaan Murid</h3>
                 <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 custom-scrollbar">
                    {analytics.disabilityChart.sort((a,b) => b.value - a.value).map((c, i) => (
                       <div key={i} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                             <span className="font-bold text-slate-700 uppercase tracking-tight">{c.name}</span>
                             <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">{c.value}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                             <div 
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ 
                                   backgroundColor: PIE_COLORS[(i + 1) % PIE_COLORS.length], 
                                   width: `${(c.value / analytics.total) * 100}%` 
                                }}
                             />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* Conditional Pemulihan Analytics */}
           {activeTab === 'pemulihan' && analytics.programChart && analytics.programChart.length > 0 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden lg:col-span-1">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 w-full mb-6">Program Pemulihan</h3>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                    {analytics.programChart.sort((a,b) => b.value - a.value).map((c, i) => (
                       <div key={i} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs">
                             <span className="font-bold text-slate-700 uppercase tracking-tight">{c.name}</span>
                             <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">{c.value}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                             <div 
                                className="h-full rounded-full transition-all duration-1000 bg-emerald-500"
                                style={{ width: `${(c.value / analytics.total) * 100}%` }}
                             />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}
         </div>
      )}

      {/* Total Pemulihan Students by Year Chart */}
            {activeTab === 'pemulihan' && analytics.tahunChart && analytics.tahunChart.length > 0 && (
               <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden col-span-full mt-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 w-full mb-6 font-sans">Jumlah Murid Pemulihan Mengikut Tahun</h3>
                  <div className="w-full pt-4">
                     {/* Y-Axis guide & bar container */}
                     <div className="relative flex items-end justify-between gap-1.5 sm:gap-4 h-64 border-b border-l border-slate-200/80 pb-2 pl-2 pr-2 sm:pl-4 sm:pr-4 bg-slate-50/30 rounded-br-2xl">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pl-2 pb-2">
                           <div className="w-full border-t border-dashed border-slate-100 h-0"></div>
                           <div className="w-full border-t border-dashed border-slate-100 h-0"></div>
                           <div className="w-full border-t border-dashed border-slate-100 h-0"></div>
                           <div className="w-full border-t border-dashed border-slate-100 h-0"></div>
                        </div>

                        {analytics.tahunChart.sort((a,b) => a.name.localeCompare(b.name)).map((c, i) => {
                           const maxVal = Math.max(...analytics.tahunChart.map(y => y.value), 1);
                           const pct = (c.value / maxVal) * 90; // scale to max 90% peak height inside block
                           return (
                              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10 min-w-0">
                                 {/* Hover Tooltip/Value */}
                                 <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none whitespace-nowrap">
                                    {c.value} Murid ({Math.round((c.value / (analytics.total || 1)) * 100)}%)
                                 </div>
                                 
                                 {/* Static Value Counter above the bar */}
                                 <span className="text-[10px] sm:text-xs font-extrabold mb-1.5 text-emerald-700">{c.value}</span>
                                 
                                 {/* Vertical Bar column itself with gradient */}
                                 <div 
                                    className="w-full max-w-[36px] min-h-[4px] rounded-t-md transition-all duration-1000 ease-out cursor-pointer shadow-sm hover:translate-y-[-2px] hover:shadow-md bg-gradient-to-t from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500"
                                    style={{ height: `${pct || 4}%` }}
                                 />
                                 
                                 {/* Year Label */}
                                 <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-tight mt-2 text-center truncate w-full" title={c.name}>
                                    {c.name}
                                 </span>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            )}

       {/* Main Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden relative">
         <div className="p-4 sm:p-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div>
               <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <UsersRound className={`w-5 h-5 ${activeTab === 'ppki' ? 'text-blue-500' : 'text-emerald-500'}`} />
                  {activeTab === 'ppki' ? 'Senarai Murid PPKI' : 'Senarai Murid Pemulihan'}
               </h3>
            </div>
            
            <div className="flex flex-1 sm:flex-none items-center gap-3 w-full sm:w-auto">
                <div className="relative group flex-1 sm:flex-none sm:w-[300px]">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                   <input 
                     type="text" 
                     placeholder="Cari rekod..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
                   />
                </div>
                <button 
                  onClick={() => fetchData(activeTab)} 
                  disabled={loading}
                  className="bg-white border border-slate-200 p-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 group"
                  title="Refresh Data"
                >
                   <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : 'group-hover:text-blue-600'}`} />
                </button>
            </div>
         </div>

         <div className="overflow-x-auto w-full min-h-[300px] relative">
            {loading && (
               <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
                  <p className="mt-4 text-sm font-black text-slate-600 uppercase tracking-widest animate-pulse">Menghubungkan ke Pangkalan Data...</p>
               </div>
            )}
            <table className="w-full text-left">
               <thead>
                  {renderTableHeader()}
               </thead>
               <tbody className="divide-y divide-slate-100 max-w-full overflow-hidden">
                  {renderTableBody()}
               </tbody>
            </table>
         </div>
         
         <div className="bg-white p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center text-center sm:text-left">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               Menunjukkan {paginatedData.length} dari {processedData.length} rekod
            </span>
            
            {totalPages > 1 && activeTab === 'pemulihan' && (
               <div className="flex items-center space-x-1.5 select-none">
                  <button 
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1}
                     className={`p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent ${
                        currentPage === 1 ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer px-3 bg-white shadow-sm'
                     }`}
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                     <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[36px] h-[36px] flex items-center justify-center text-xs font-black rounded-xl transition-all ${
                           currentPage === page
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 bg-white shadow-sm'
                        }`}
                     >
                        {page}
                     </button>
                  ))}

                  <button 
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage === totalPages}
                     className={`p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent ${
                        currentPage === totalPages ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer px-3 bg-white shadow-sm'
                     }`}
                  >
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            )}
         </div>
      </div>

    </div>
  );
}
