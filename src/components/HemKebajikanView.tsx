import React, { useState, useEffect, useMemo } from 'react';
import { SchoolDetails, KebajikanTabConfig } from '../types';
import { 
  Users, RefreshCw, AlertCircle, Database, Search, Settings, 
  ChevronLeft, ChevronRight, Trash2, Plus, HeartHandshake, Check
} from 'lucide-react';

interface HemKebajikanViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave: (details: SchoolDetails) => void;
}

const DEFAULT_KEBAJIKAN_TABS: KebajikanTabConfig[] = [
  {
    id: 'rmt_pss',
    title: 'RMT/PSS',
    url: 'https://script.google.com/macros/s/AKfycbzsOTbhQhk8cRA_qeNdloq2ejh_Dv9LIHiWV90FonOwJwYdOEb6MOQPTyhAGL3xKqzG/exec'
  },
  {
    id: 'asnaf_yatim',
    title: 'Asnaf/Anak Yatim',
    url: 'https://script.google.com/macros/s/AKfycbz13xPdo7cMn42KDvwuE2Gxm2s7kLYAT5hTuZ2TaroQ1YTjxMiMhejVKIm0lKsRux6oGg/exec'
  }
];

export function HemKebajikanView({ details, isAdmin, onSave }: HemKebajikanViewProps) {
  const tabsList = useMemo(() => {
    if (details.kebajikanTabs && details.kebajikanTabs.length > 0) {
      return details.kebajikanTabs;
    }
    return DEFAULT_KEBAJIKAN_TABS;
  }, [details.kebajikanTabs]);

  const [activeTabId, setActiveTabId] = useState<string>(tabsList[0]?.id || 'rmt_pss');

  // If the active tab somehow gets deleted, reset to the first available tab
  useEffect(() => {
    if (tabsList.length > 0 && !tabsList.find(t => t.id === activeTabId)) {
      setActiveTabId(tabsList[0].id);
    }
  }, [tabsList, activeTabId]);

  const activeTabConfig = useMemo(() => {
    return tabsList.find(t => t.id === activeTabId) || tabsList[0];
  }, [tabsList, activeTabId]);

  const isRmt = activeTabId === 'rmt_pss';
  const isAsnaf = activeTabId === 'asnaf_yatim';

  const themeBg = isRmt ? 'bg-amber-600' : isAsnaf ? 'bg-violet-600' : 'bg-rose-600';
  const themeBgHover = isRmt ? 'hover:bg-amber-700' : isAsnaf ? 'hover:bg-violet-700' : 'hover:bg-rose-700';
  const themeText = isRmt ? 'text-amber-600' : isAsnaf ? 'text-violet-600' : 'text-rose-600';
  const themeTextDark = isRmt ? 'text-amber-700' : isAsnaf ? 'text-violet-700' : 'text-rose-700';
  const themeBorder = isRmt ? 'border-amber-100' : isAsnaf ? 'border-violet-100' : 'border-rose-100';
  const themeLightBg = isRmt ? 'bg-amber-50' : isAsnaf ? 'bg-violet-50' : 'bg-rose-50';
  const themeShadow = isRmt ? 'shadow-amber-600/10' : isAsnaf ? 'shadow-violet-600/10' : 'shadow-rose-600/10';
  const themeTableHead = isRmt ? 'bg-amber-600' : isAsnaf ? 'bg-violet-600' : 'bg-rose-600';
  const themeInputFocus = isRmt ? 'focus:ring-amber-50 focus:border-amber-500' : isAsnaf ? 'focus:ring-violet-50 focus:border-violet-500' : 'focus:ring-rose-50 focus:border-rose-500';
  const themePageBtnActive = isRmt ? 'bg-amber-600 shadow-amber-500/20' : isAsnaf ? 'bg-violet-600 shadow-violet-500/20' : 'bg-rose-600 shadow-rose-500/20';
  const themeIconStyle = 'bg-blue-50 border-blue-100 text-blue-600';
  const themeRowBorder = isRmt ? 'border-amber-50/40' : isAsnaf ? 'border-violet-50/40' : 'border-rose-50/40';

  const [loadedData, setLoadedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterTahun, setFilterTahun] = useState('Semua');
  const [filterJantina, setFilterJantina] = useState('Semua');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Admin settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [tempTabs, setTempTabs] = useState<KebajikanTabConfig[]>([]);

  // Fetch student records from Active Tab Apps Script URL
  const fetchData = async (tabConfig: KebajikanTabConfig | undefined) => {
    if (!tabConfig || !tabConfig.url) {
      setLoadedData([]);
      return;
    }
    
    let targetUrl = tabConfig.url.trim();
    if (targetUrl.includes('/a/macros/')) {
      targetUrl = targetUrl.replace(/\/a\/macros\/[^\/]+\/s\//, '/macros/s/');
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(targetUrl, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP Ralat ${res.status}`);
      
      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (parseError) {
        if (text.trim().startsWith('<')) {
          throw new Error('Apps Script memulangkan HTML. Sila pastikan Apps Script anda di-deploy mengikut kaedah ContentService JSON.');
        }
        throw new Error('Data yang diterima bukan format JSON yang sah.');
      }

      const arrayData = Array.isArray(parsed) ? parsed : (parsed.data || parsed.records || []);
      setLoadedData(arrayData);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setErrorMsg('Gagal mengambil data: Ralat CORS atau URL App Script disekat. Pastikan App Script diteduh dengan tetapan: "Execute as: Me" dan "Who has access: Anyone". Jika menggunakan akaun MOE (moe-dl.edu.my), akses luaran mungkin disekat.');
      } else {
        setErrorMsg(`Gagal mengambil data: ${err.message}`);
      }
      setLoadedData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTabConfig);
    // Reset filters
    setSearchTerm('');
    setFilterKelas('Semua');
    setFilterTahun('Semua');
    setFilterJantina('Semua');
    setCurrentPage(1);
  }, [activeTabConfig]);

  // Utility to find keys casing-insensitively
  const getValueByKey = (item: any, possibleKeys: string[]) => {
    for (const key of possibleKeys) {
      const matchingKey = Object.keys(item).find(k => k.toUpperCase().trim() === key.toUpperCase().trim());
      if (matchingKey !== undefined) return item[matchingKey];
    }
    return '';
  };

  // Extract all Class options Dynamically
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    loadedData.forEach(item => {
      const clsVal = getValueByKey(item, ['KELAS', 'CLASS']);
      if (clsVal) {
        classes.add(String(clsVal).trim().toUpperCase());
      }
    });
    return Array.from(classes).sort();
  }, [loadedData]);

  // Normalize Year/Tahun from student records
  const getStudentTahun = (item: any) => {
    const rawKelas = String(getValueByKey(item, ['KELAS', 'CLASS'])).trim().toUpperCase();
    const rawTahun = getValueByKey(item, ['TAHUN', 'YEAR']);
    
    if (rawTahun) {
      const tNum = parseInt(String(rawTahun));
      if (!isNaN(tNum) && tNum >= 1 && tNum <= 6) {
        return `Tahun ${tNum}`;
      }
    }
    
    // Heuristic parsing from KELAS which often starts with a number like "3 HARMONI" or "Pendidikan Khas"
    if (/^[1-6](\s|$)/.test(rawKelas)) {
      return `Tahun ${rawKelas.charAt(0)}`;
    }
    
    if (rawKelas.includes('PRA') || rawKelas.includes('PRAS')) {
      return 'Prasekolah';
    }
    
    if (rawKelas.includes('AMANAH') || rawKelas.includes('PPKI')) {
      return 'Pendidikan Khas';
    }
    
    return 'Lain-lain';
  };

  // Filter processes
  const processedData = useMemo(() => {
    return loadedData.filter(item => {
      const nama = String(getValueByKey(item, ['NAMA', 'NAMA MURID', 'NAME'])).toLowerCase();
      const matchSearch = !searchTerm || nama.includes(searchTerm.toLowerCase());
      
      const kelas = String(getValueByKey(item, ['KELAS', 'CLASS'])).trim().toUpperCase();
      const matchKelas = filterKelas === 'Semua' || kelas === filterKelas;
      
      const jantina = String(getValueByKey(item, ['JANTINA', 'GENDER'])).trim().toUpperCase();
      let matchJantina = true;
      if (filterJantina !== 'Semua') {
        const isLelaki = jantina.startsWith('L') || jantina.includes('LELAKI') || jantina.includes('MALE');
        if (filterJantina === 'Lelaki') matchJantina = isLelaki;
        else if (filterJantina === 'Perempuan') matchJantina = !isLelaki && jantina.length > 0;
      }

      const studTahun = getStudentTahun(item);
      const matchTahun = filterTahun === 'Semua' || studTahun === filterTahun;

      return matchSearch && matchKelas && matchJantina && matchTahun;
    });
  }, [loadedData, searchTerm, filterKelas, filterTahun, filterJantina]);

  // Tab Statistics / Analytics
  const analytics = useMemo(() => {
    let total = processedData.length;
    let lelaki = 0;
    let perempuan = 0;
    const tahunCounts: Record<string, number> = {};
    const asnafCounts: Record<string, number> = { 'Asnaf': 0, 'Anak Yatim': 0, 'Lain-lain / Asnaf Baik': 0 };

    processedData.forEach(item => {
      const jVal = String(getValueByKey(item, ['JANTINA', 'GENDER'])).trim().toUpperCase();
      if (jVal.startsWith('L') || jVal.includes('LELAKI') || jVal.includes('MALE')) {
        lelaki++;
      } else if (jVal.length > 0) {
        perempuan++;
      }

      // Year statistics
      const studTahun = getStudentTahun(item);
      tahunCounts[studTahun] = (tahunCounts[studTahun] || 0) + 1;

      // Remarks categorization (specifically looking at CATATAN)
      const catatan = String(getValueByKey(item, ['CATATAN', 'REMARKS', 'STATUS'])).toUpperCase();
      if (catatanIncludes(catatan, ['YATIM', 'PIATU'])) {
        asnafCounts['Anak Yatim']++;
      } else if (catatanIncludes(catatan, ['ASNAF', 'ZAKAT', 'MISKIN', 'FAKIR'])) {
        asnafCounts['Asnaf']++;
      } else {
        asnafCounts['Lain-lain / Asnaf Baik']++;
      }
    });

    const yearsList = Object.keys(tahunCounts).map(k => ({
      name: k,
      value: tahunCounts[k]
    })).sort((a,b) => a.name.localeCompare(b.name));

    return { total, lelaki, perempuan, yearsList, asnafCounts };

    function catatanIncludes(text: string, arr: string[]) {
      return arr.some(sub => text.includes(sub));
    }
  }, [processedData]);

  // Pagination bounds
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
    }
  };

  // Open Admin Settings
  const handleOpenSettings = () => {
    setTempTabs(JSON.parse(JSON.stringify(tabsList)));
    setShowSettings(true);
  };

  const handleAddTempTab = () => {
    const uniqueId = `tab_${Date.now()}`;
    setTempTabs([
      ...tempTabs,
      {
        id: uniqueId,
        title: 'Nama Tab Baru',
        url: ''
      }
    ]);
  };

  const handleUpdateTempTab = (index: number, key: keyof KebajikanTabConfig, val: string) => {
    const updated = [...tempTabs];
    updated[index] = { ...updated[index], [key]: val };
    setTempTabs(updated);
  };

  const handleRemoveTempTab = (index: number) => {
    const updated = [...tempTabs];
    updated.splice(index, 1);
    setTempTabs(updated);
  };

  const handleSaveSettings = () => {
    // Validate empty titles or URLs
    const valid = tempTabs.filter(t => t.title.trim() && t.url.trim());
    if (valid.length === 0) {
      alert('Sila tambah sekurang-kurangnya satu tab dengan maklumat URL yang sah.');
      return;
    }
    
    onSave({
      ...details,
      kebajikanTabs: valid
    });
    
    setShowSettings(false);
  };

  // Render Dynamic Columns based on Tab config
  const renderTableHead = () => {
    if (activeTabId === 'rmt_pss') {
      return (
        <tr className={`${themeTableHead} text-white text-[11px] lg:text-sm uppercase tracking-[0.1em]`}>
          <th className="px-1 lg:px-4 py-5 font-black w-8 lg:w-16 text-center bg-transparent">Bil.</th>
          <th className="px-2 lg:px-6 py-5 font-black text-left w-auto bg-transparent">
            <div className="w-full whitespace-normal break-words leading-tight">Nama Murid</div>
          </th>
          <th className="px-2 lg:px-6 py-5 font-black text-center w-[65px] xs:w-[75px] sm:w-[120px] lg:w-[200px] bg-transparent">
            <div className="w-full whitespace-normal break-words leading-tight">Kelas</div>
          </th>
          <th className="px-2 lg:px-6 py-5 font-black text-center w-[55px] xs:w-[65px] sm:w-24 lg:w-[160px] pl-[2px] pr-2 lg:px-0 bg-transparent">Jantina</th>
        </tr>
      );
    }

    if (activeTabId === 'asnaf_yatim') {
      return (
        <tr className={`${themeTableHead} text-white text-[11px] lg:text-sm uppercase tracking-[0.1em]`}>
          <th className="px-1 lg:px-4 py-5 font-black w-8 lg:w-16 text-center bg-transparent">Bil.</th>
          <th className="px-2 lg:px-6 py-5 font-black text-left sticky lg:static left-0 lg:left-auto bg-violet-600 z-20 w-[140px] xs:w-[170px] sm:w-[220px] md:w-[260px] lg:w-auto min-w-[140px] xs:min-w-[170px] sm:min-w-[220px] md:min-w-[260px] lg:min-w-[300px] max-w-[140px] xs:max-w-[170px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-none">
            <div className="w-full whitespace-normal break-words leading-tight">Nama Murid</div>
          </th>
          <th className="px-2 lg:px-6 py-5 font-black text-center w-[65px] xs:w-[75px] sm:w-[120px] lg:w-[180px] bg-transparent">
            <div className="w-full whitespace-normal break-words leading-tight">Kelas</div>
          </th>
          <th className="px-2 lg:px-6 py-5 font-black text-center w-28 xs:w-32 sm:w-40 lg:w-[250px] bg-transparent">Catatan</th>
          <th className="px-2 lg:px-6 py-5 font-black text-center w-[55px] xs:w-[65px] sm:w-24 lg:w-[140px] bg-transparent">Jantina</th>
        </tr>
      );
    }

    // Generic fallback for custom admin tabs
    if (loadedData.length === 0) return null;
    const allRowKeys = Object.keys(loadedData[0]).filter(k => 
      !k.toUpperCase().includes('ID') && k.toUpperCase() !== 'BIL'
    );
    
    // Sort so NAMA / NAME is first
    const nameIndex = allRowKeys.findIndex(k => k.toUpperCase().includes('NAMA') || k.toUpperCase().includes('NAME'));
    if (nameIndex > 0) {
      const nameKey = allRowKeys.splice(nameIndex, 1)[0];
      allRowKeys.unshift(nameKey);
    }

    return (
      <tr className={`${themeTableHead} text-white text-[10px] md:text-xs uppercase tracking-wider`}>
        <th className="px-1 py-4 font-black w-8 text-center bg-transparent">Bil.</th>
        {allRowKeys.map((col, i) => {
          const isName = i === 0;
          const isSecondCol = i === 1;
          return (
            <th 
              key={i} 
              className={`px-2 py-4 font-black bg-transparent ${
                isName 
                  ? 'text-left w-auto' 
                  : isSecondCol 
                  ? 'text-center w-1/4' 
                  : 'text-center w-auto'
              }`}
            >
              {isName ? (
                <div className="w-full whitespace-normal break-words leading-tight">{col}</div>
              ) : (
                col
              )}
            </th>
          );
        })}
      </tr>
    );
  };

  const renderTableBody = () => {
    if (paginatedData.length === 0) {
      return (
        <tr>
          <td colSpan={10} className="px-6 py-16 text-center text-slate-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm">Tiada Rekod Dijumpai</p>
          </td>
        </tr>
      );
    }

    return paginatedData.map((item, idx) => {
      const realIndex = (currentPage - 1) * itemsPerPage + idx + 1;
      
      const renderJantinaBadge = (j: string) => {
        const isLaki = j.trim().toUpperCase().startsWith('L');
        const isPerem = j.trim().toUpperCase().startsWith('P');
        if (isLaki) return <span className="inline-block px-2 lg:px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[10px] sm:text-[11px] lg:text-xs font-bold leading-none">{j}</span>;
        if (isPerem) return <span className="inline-block px-2 lg:px-3 py-1 bg-pink-50 text-pink-700 border border-pink-100 rounded-lg text-[10px] sm:text-[11px] lg:text-xs font-bold leading-none">{j}</span>;
        return <span className="inline-block px-2 lg:px-3 py-1 bg-slate-50 text-slate-700 border border-slate-100 rounded-lg text-[10px] sm:text-[11px] lg:text-xs font-bold leading-none">{j || '-'}</span>;
      };

      if (activeTabId === 'rmt_pss') {
        const nama = String(getValueByKey(item, ['NAMA MURID', 'NAMA', 'NAME'])).toUpperCase();
        const kelas = String(getValueByKey(item, ['KELAS', 'CLASS'])).toUpperCase();
        const jantina = String(getValueByKey(item, ['JANTINA', 'GENDER'])).toUpperCase();

        return (
          <tr key={idx} className={`hover:bg-slate-50 transition-colors border-b ${themeRowBorder} group`}>
            <td className="w-8 lg:w-16 px-1 lg:px-4 py-4 text-center font-black text-slate-400 text-[11px] lg:text-sm">
              {realIndex}
            </td>
            <td className="px-2 lg:px-6 py-4 font-bold text-slate-800 text-[11px] sm:text-xs lg:text-sm leading-snug uppercase w-auto min-w-0">
              <div className="w-full whitespace-normal break-words leading-tight" title={nama}>
                {nama || '-'}
              </div>
            </td>
            <td className="px-2 lg:px-6 py-4 text-center text-[11px] lg:text-sm font-bold text-indigo-600 uppercase w-[65px] xs:w-[75px] sm:w-[120px] lg:w-[200px]">
              <div className="w-full whitespace-normal break-words leading-tight" title={kelas}>
                {kelas || '-'}
              </div>
            </td>
            <td className="px-2 lg:px-6 py-4 text-center text-[11px] lg:text-sm font-bold text-slate-600 uppercase w-[55px] xs:w-[65px] sm:w-24 lg:w-[160px] pl-[2px] pr-2 lg:px-0">
              <div className="w-full flex justify-center">{renderJantinaBadge(jantina)}</div>
            </td>
          </tr>
        );
      }

      if (activeTabId === 'asnaf_yatim') {
        const nama = String(getValueByKey(item, ['NAMA MURID', 'NAMA', 'NAME'])).toUpperCase();
        const kelas = String(getValueByKey(item, ['KELAS', 'CLASS'])).toUpperCase();
        const catatan = String(getValueByKey(item, ['CATATAN', 'REMARKS', 'STATUS'])).toUpperCase();
        const jantina = String(getValueByKey(item, ['JANTINA', 'GENDER'])).toUpperCase();

        return (
          <tr key={idx} className={`hover:bg-slate-50 transition-colors border-b ${themeRowBorder} group`}>
            <td className="w-8 lg:w-16 px-1 lg:px-4 py-4 text-center font-black text-slate-400 text-[11px] lg:text-sm">
              {realIndex}
            </td>
            <td className="px-2 lg:px-6 py-4 font-bold text-slate-800 text-[11px] sm:text-xs lg:text-sm leading-snug uppercase sticky lg:static left-0 lg:left-auto bg-white group-hover:bg-slate-50 z-10 lg:z-auto border-r border-slate-100 lg:border-r-0 shadow-[2px_0_5px_rgba(0,0,0,0.02)] lg:shadow-none w-[140px] xs:w-[170px] sm:w-[220px] md:w-[260px] lg:w-auto min-w-[140px] xs:min-w-[170px] sm:min-w-[220px] md:min-w-[260px] lg:min-w-[300px] max-w-[140px] xs:max-w-[170px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-none">
              <div className="w-full whitespace-normal break-words leading-tight" title={nama}>
                {nama || '-'}
              </div>
            </td>
            <td className="px-2 lg:px-6 py-4 text-center text-[11px] lg:text-sm font-bold text-indigo-600 uppercase w-[65px] xs:w-[75px] sm:w-[120px] lg:w-[180px]">
              <div className="w-full whitespace-normal break-words leading-tight" title={kelas}>
                {kelas || '-'}
              </div>
            </td>
            <td className="px-2 lg:px-6 py-4 text-center text-[11px] lg:text-sm font-semibold text-slate-600 leading-snug w-28 xs:w-32 sm:w-40 lg:w-[250px]">
              <span className={`inline-block px-1.5 lg:px-3 py-0.5 lg:py-1 text-[9px] lg:text-[11px] rounded-lg border font-bold whitespace-normal sm:whitespace-nowrap ${
                catatan.includes('YATIM') ? 'bg-amber-50 text-amber-700 border-amber-100' :
                catatan.includes('ASNAF') ? 'bg-violet-50 text-violet-700 border-violet-100' :
                'bg-rose-50 text-rose-700 border-rose-100'
               }`}>
                {catatan || '-'}
              </span>
            </td>
            <td className="px-2 lg:px-6 py-4 text-center text-[11px] lg:text-sm font-bold text-slate-600 uppercase w-[55px] xs:w-[65px] sm:w-24 lg:w-[140px]">
              <div className="w-full flex justify-center">{renderJantinaBadge(jantina)}</div>
            </td>
          </tr>
        );
      }

      // Dynamic column parsing
      const allRowKeys = Object.keys(loadedData[0]).filter(k => 
        !k.toUpperCase().includes('ID') && k.toUpperCase() !== 'BIL'
      );
      const nameIndex = allRowKeys.findIndex(k => k.toUpperCase().includes('NAMA') || k.toUpperCase().includes('NAME'));
      if (nameIndex > 0) {
        const nameKey = allRowKeys.splice(nameIndex, 1)[0];
        allRowKeys.unshift(nameKey);
      }

      return (
        <tr key={idx} className={`hover:bg-slate-50 transition-colors border-b ${themeRowBorder} group`}>
          <td className="w-8 px-1 py-4 text-center font-black text-slate-400 text-[11px]">
            {realIndex}
          </td>
          {allRowKeys.map((k, colIdx) => {
            const rawVal = item[k];
            const isName = colIdx === 0;
            const isSecondCol = colIdx === 1;
            return (
              <td 
                key={colIdx} 
                className={`px-2 py-4 text-[11px] ${
                  isName 
                    ? 'font-bold text-slate-800 uppercase w-auto min-w-0 text-left' 
                    : isSecondCol 
                    ? 'text-slate-600 font-medium w-1/4 text-center'
                    : 'text-slate-600 font-medium text-center'
                }`}
              >
                {isName ? (
                  <div className="w-full whitespace-normal break-words leading-tight" title={String(rawVal || '-')}>
                    {rawVal !== null && rawVal !== undefined ? String(rawVal) : '-'}
                  </div>
                ) : (
                  rawVal !== null && rawVal !== undefined ? String(rawVal) : '-'
                )}
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Welfare Header Dashboard */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 ${themeIconStyle} rounded-2xl flex items-center justify-center shadow-sm`}>
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Kebajikan & Bantuan</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={handleOpenSettings}
              className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-2xl transition-all shadow-sm hover:scale-[1.03] active:scale-95 cursor-pointer"
              title="Kemaskini Tetapan Apps Script & Tab Baru"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Welfare Tabs selection */}
      {tabsList.length > 1 && (
        <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-100 w-full sm:w-auto sm:max-w-max">
          {tabsList.map(tab => {
            const isSelected = activeTabId === tab.id;
            const tabBtnBg = isSelected
              ? (tab.id === 'rmt_pss' ? 'bg-amber-600 shadow-amber-600/10 font-extrabold' : tab.id === 'asnaf_yatim' ? 'bg-violet-600 shadow-violet-600/10 font-extrabold' : 'bg-rose-600 shadow-rose-600/10 font-extrabold')
              : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`px-6 py-3 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all ${
                  isSelected ? `${tabBtnBg} text-white shadow-md scale-100 font-extrabold` : tabBtnBg
                }`}
              >
                {tab.title}
              </button>
            );
          })}
        </div>
      )}

      {errorMsg && (
        <div className={`border p-5 rounded-2xl flex items-start gap-3.5 ${isRmt ? 'bg-amber-50 border-amber-200 text-amber-700' : isAsnaf ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black uppercase tracking-wider mb-1">Ralat Diambil Semasa Integrasi</p>
            <p className="text-xs leading-relaxed font-semibold opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Analytics Subsection */}
      {!loading && !errorMsg && loadedData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Main counts */}
          <div className={`p-8 rounded-3xl border ${themeBorder} ${themeBg} shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 ${activeTabId === 'rmt_pss' ? 'lg:col-span-2' : ''}`}>
            <div className="flex flex-col items-center md:items-start z-10">
              <p className="text-xs font-black uppercase tracking-widest mb-2 text-white/80">Jumlah Bantuan Penerima</p>
              <h4 className="text-6xl font-black text-white">{analytics.total}</h4>
            </div>
            
            <div className="flex flex-wrap gap-4 sm:gap-8 items-center bg-black/10 px-6 sm:px-8 py-5 sm:py-6 rounded-3xl backdrop-blur-sm z-10 w-full md:w-auto justify-center">
              <div className="text-center">
                <h5 className="text-3xl font-black text-white">{analytics.lelaki}</h5>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Lelaki
                </p>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <h5 className="text-3xl font-black text-white">{analytics.perempuan}</h5>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" /> Perempuan
                </p>
              </div>
            </div>
          </div>

          {/* Demographics / Category Counts (only for Asnaf/Anak Yatim) */}
          {activeTabId === 'asnaf_yatim' ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 w-full mb-6">Pecahan Status Kebajikan</h3>
              <div className="flex-1 space-y-4 pr-1">
                {Object.entries(analytics.asnafCounts as Record<string, number>).filter(([_, val]) => val > 0).map(([key, val], idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 uppercase tracking-tight">{key}</span>
                      <span className="font-black text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md">{val}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 bg-violet-500"
                        style={{ width: `${(val / analytics.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTabId !== 'rmt_pss' ? (
            // For other tabs we show simple layout filling
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full items-center justify-center text-slate-400">
              <HeartHandshake className="w-12 h-12 mb-3 shrink-0 text-slate-300" />
              <p className="text-xs font-bold uppercase tracking-wider">Tiada Pecahan Mengikut Status</p>
            </div>
          ) : null}

          {/* Graf Bar Terhebat untuk Jumlah Murid Bantuan Mengikut Tahun */}
          {analytics.yearsList && analytics.yearsList.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden lg:col-span-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 w-full mb-6 font-sans">Jumlah Murid Bantuan Mengikut Tahun</h3>
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

                  {analytics.yearsList.map((c, i) => {
                    const maxVal = Math.max(...analytics.yearsList.map(y => y.value), 1);
                    const pct = (c.value / maxVal) * 90; // scale to max 90% space inside block
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10 min-w-0">
                        {/* Hover Tooltip/Value */}
                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none whitespace-nowrap">
                          {c.value} Murid ({Math.round((c.value / (analytics.total || 1)) * 100)}%)
                        </div>
                        
                        {/* Static Value Counter above the bar */}
                        <span className={`text-[10px] sm:text-xs font-extrabold mb-1.5 ${themeTextDark}`}>{c.value}</span>
                        
                        {/* Vertical Bar column itself with gradient */}
                        <div 
                          className={`w-full max-w-[36px] min-h-[4px] rounded-t-md transition-all duration-1000 ease-out cursor-pointer shadow-sm hover:translate-y-[-2px] hover:shadow-md ${
                            activeTabId === 'rmt_pss' 
                              ? 'bg-gradient-to-t from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500' 
                              : activeTabId === 'asnaf_yatim'
                              ? 'bg-gradient-to-t from-violet-500 to-violet-400 hover:from-violet-600 hover:to-violet-500'
                              : 'bg-gradient-to-t from-rose-500 to-rose-400 hover:from-rose-600 hover:to-rose-500'
                          }`}
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
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden relative">
        
        {/* Table Filter Panel */}
        <div className={`p-6 border-b ${isRmt ? 'border-amber-100/50' : isAsnaf ? 'border-violet-100/50' : 'border-rose-100/50'} bg-slate-50/50 flex flex-col lg:flex-row gap-5 justify-between lg:items-center`}>
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">
              Senarai Rekod {activeTabConfig?.title || 'Data'}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1 lg:justify-end">
            {/* Search component */}
            <div className="relative w-full sm:max-w-xs md:max-w-sm flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama murid..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm focus:ring-4 ${themeInputFocus} outline-none transition-all placeholder:text-slate-300 placeholder:font-medium`}
              />
            </div>

            {/* Custom selects & Refresh Button */}
            <div className="grid grid-cols-2 sm:flex gap-2.5 items-center">
              <select
                value={filterKelas}
                onChange={e => { setFilterKelas(e.target.value); setCurrentPage(1); }}
                className={`px-3.5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:border-${isRmt ? 'amber' : isAsnaf ? 'violet' : 'rose'}-500 cursor-pointer shadow-sm`}
              >
                <option value="Semua">Semua Kelas</option>
                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={filterTahun}
                onChange={e => { setFilterTahun(e.target.value); setCurrentPage(1); }}
                className={`px-3.5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:border-${isRmt ? 'amber' : isAsnaf ? 'violet' : 'rose'}-500 cursor-pointer shadow-sm`}
              >
                <option value="Semua">Semua Aliran</option>
                <option value="Tahun 1">Tahun 1</option>
                <option value="Tahun 2">Tahun 2</option>
                <option value="Tahun 3">Tahun 3</option>
                <option value="Tahun 4">Tahun 4</option>
                <option value="Tahun 5">Tahun 5</option>
                <option value="Tahun 6">Tahun 6</option>
                <option value="Prasekolah">Prasekolah</option>
                <option value="Pendidikan Khas">Pendidikan Khas</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>

              <select
                value={filterJantina}
                onChange={e => { setFilterJantina(e.target.value); setCurrentPage(1); }}
                className={`col-span-2 sm:col-auto px-3.5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl outline-none focus:border-${isRmt ? 'amber' : isAsnaf ? 'violet' : 'rose'}-500 cursor-pointer shadow-sm`}
              >
                <option value="Semua">Semua Jantina</option>
                <option value="Lelaki">Lelaki</option>
                <option value="Perempuan">Perempuan</option>
              </select>

              <button 
                onClick={() => fetchData(activeTabConfig)}
                disabled={loading}
                title="Segarkan Data"
                className="bg-white border border-slate-200 p-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 group shrink-0 hidden sm:flex"
              >
                <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : `group-hover:${themeText}`}`} />
              </button>
            </div>
            
            {/* Mobile Refresh Button (shows below selects on small screens) */}
            <button 
                onClick={() => fetchData(activeTabConfig)}
                disabled={loading}
                title="Segarkan Data"
                className="sm:hidden w-full bg-white border border-slate-200 p-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 group flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : `group-hover:${themeText}`}`} />
                <span className="text-xs font-bold text-slate-600">Segarkan Data</span>
            </button>
          </div>
        </div>

        {/* The Table layout */}
        <div className="overflow-x-auto w-full">
          <table className={`w-full text-left border-collapse ${activeTabId === 'asnaf_yatim' ? 'min-w-[700px]' : 'min-w-0'} lg:min-w-full text-xs`}>
            <thead>
              {renderTableHead()}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-20 text-center text-slate-400">
                    <RefreshCw className={`w-8 h-8 mx-auto mb-3 animate-spin ${themeText}`} />
                    <p className="font-extrabold text-xs uppercase tracking-widest text-slate-500">Memuat naik data dari Google Sheet...</p>
                  </td>
                </tr>
              ) : (
                renderTableBody()
              )}
            </tbody>
          </table>
        </div>

        {/* Styling pagination exactly like Senarai Nama Guru on School Directory page */}
        {!loading && totalPages > 1 && (
          <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/40">
            <p className="text-xs font-bold text-slate-500">
              Memaparkan <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> daripada <span className={themeText}>{processedData.length}</span> rekod
            </p>
            
            <div className="flex items-center space-x-1.5 select-none">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
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
                  onClick={() => handlePageChange(page)}
                  className={`min-w-[36px] h-[36px] flex items-center justify-center text-xs font-black rounded-xl transition-all ${
                    currentPage === page
                      ? `${themePageBtnActive} text-white shadow-md`
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 bg-white shadow-sm'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent ${
                  currentPage === totalPages ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer px-3 bg-white shadow-sm'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Settings Modal Overlay in UI code directly */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col overflow-hidden relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div>
                <h4 className="font-black text-lg text-slate-800">Urus URL Apps Script & Tab Kebajikan</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tambah, Ubah atau Buang tab integrasi bantuan</p>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-sm flex items-center justify-center transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* List of configuration-editable URL tabs */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-6">
              {tempTabs.map((tab, index) => (
                <div key={tab.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 relative">
                  
                  {/* Tab Title Edit */}
                  <div className="flex flex-col w-full md:w-1/4">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Nama Tab</label>
                    <input 
                      type="text" 
                      value={tab.title}
                      onChange={e => handleUpdateTempTab(index, 'title', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-rose-500 outline-none shadow-sm"
                      placeholder="e.g. RMT/PSS"
                    />
                  </div>

                  {/* Apps Script URL Edit */}
                  <div className="flex flex-col w-full flex-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">URL Apps Script (GET)</label>
                    <input 
                      type="text" 
                      value={tab.url}
                      onChange={e => handleUpdateTempTab(index, 'url', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-rose-500 outline-none shadow-sm font-mono text-slate-600"
                      placeholder="https://script.google.com/macros/s/.../exec"
                    />
                  </div>

                  {/* Remove Tab Trigger */}
                  <button
                    onClick={() => handleRemoveTempTab(index)}
                    className="p-2 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-sm shrink-0 self-end md:self-center mt-2 md:mt-0 cursor-pointer"
                    title="Padam Tab ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button 
                onClick={handleAddTempTab}
                className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-rose-500 text-slate-500 hover:text-rose-600 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer bg-slate-50/50 hover:bg-rose-50/10"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tab Baru</span>
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-5 py-3 border border-slate-200 text-slate-600 hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-rose-600/10 cursor-pointer"
              >
                Simpan Tetapan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
