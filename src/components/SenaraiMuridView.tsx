import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, UserPlus, FileSpreadsheet, Upload, Download, Search, Filter as FilterIcon, 
  Trash2, X, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon, Target, UsersRound, Settings, User
} from 'lucide-react';
import { SchoolDetails, StudentRecord } from '../types';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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
       <div className="absolute top-4 right-4 flex items-start justify-end opacity-50 z-0">
          <div className="flex space-x-1">
             <div className="w-1 h-1 rounded-full bg-white"></div>
             <div className="w-1 h-1 rounded-full bg-white"></div>
             <div className="w-1 h-1 rounded-full bg-white"></div>
          </div>
       </div>
    </div>
  );
}

interface SenaraiMuridViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave?: (updatedDetails: SchoolDetails) => void;
}

export function SenaraiMuridView({ details, isAdmin, onSave }: SenaraiMuridViewProps) {
  // --- States ---
  const [students, setStudents] = useState<StudentRecord[]>(() => details.students || []);
  useEffect(() => {
    if (details.students) setStudents(details.students);
  }, [details.students]);

  // Admin Panel states
  const [showAdminDrawer, setShowAdminDrawer] = useState(false);
  const [adminTab, setAdminTab] = useState<'individu' | 'upload' | 'pukal'>('individu');

  // Individu Form
  const [formName, setFormName] = useState('');
  const [formTahun, setFormTahun] = useState('Tahun 1');
  const [formClass, setFormClass] = useState('');
  const [formGender, setFormGender] = useState<'Lelaki' | 'Perempuan'>('Lelaki');

  // Pukal Form
  const [pukalText, setPukalText] = useState('');
  
  // Upload State
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTahun, setFilterTahun] = useState('Semua');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterGender, setFilterGender] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'className' | 'tahun'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 15;

  const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9']; // modern colors

  // --- Helpers for Students ---
  const saveStudents = (newStudents: StudentRecord[]) => {
    setStudents(newStudents);
    if (onSave) {
      onSave({ ...details, students: newStudents });
    }
  };

  const getTahunFromStr = (val?: string) => {
    if (val && val.toLowerCase().includes('tahun')) return val;
    // try to guess from class: "1 Bestari" -> "Tahun 1"
    if (val) {
      const match = val.match(/^(\d)/);
      if (match) return `Tahun ${match[1]}`;
    }
    return 'Tiada Data';
  };

  // Enhance old records that might not have `tahun`
  const normalizedStudents = useMemo(() => {
    return students.map(s => ({
      ...s,
      tahun: s.tahun || getTahunFromStr(s.className),
      className: s.className || 'Tidak Ditetapkan'
    }));
  }, [students]);

  // --- Analytics Derivates ---
  const analytics = useMemo(() => {
    const total = normalizedStudents.length;
    const maleCount = normalizedStudents.filter(s => s.gender === 'Lelaki').length;
    const femaleCount = normalizedStudents.filter(s => s.gender === 'Perempuan').length;
    
    // Classes
    const uniqueClasses = new Set(normalizedStudents.map(s => s.className));
    const activeClasses = uniqueClasses.size;
    const avgPerClass = activeClasses > 0 ? Math.round(total / activeClasses) : 0;

    // By Year
    const yearCounts: Record<string, number> = {};
    normalizedStudents.forEach(s => {
      const year = s.tahun || 'Tiada Data';
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    let maxYearCount = 0;
    let maxYear = '-';
    Object.entries(yearCounts).forEach(([y, c]) => {
      if (c > maxYearCount) { maxYearCount = c; maxYear = y; }
    });

    const ratio = femaleCount > 0 ? (maleCount / femaleCount).toFixed(1) : maleCount > 0 ? '1:0' : '0:0';

    return { total, maleCount, femaleCount, activeClasses, avgPerClass, maxYear, maxYearCount, yearCounts, ratio };
  }, [normalizedStudents]);

  // --- Chart Data ---
  const chartDataYear = useMemo(() => {
    return ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6', 'Tiada Data'].map(y => ({
      name: y,
      Jumlah: analytics.yearCounts[y] || 0
    })).filter(d => d.Jumlah > 0 || d.name !== 'Tiada Data');
  }, [analytics.yearCounts]);

  const chartDataGender = [
    { name: 'Lelaki', value: analytics.maleCount, color: '#3b82f6' },
    { name: 'Perempuan', value: analytics.femaleCount, color: '#ec4899' }
  ];

  // Unique lists for filters
  const availableYears = useMemo(() => Array.from(new Set(normalizedStudents.map(s => s.tahun || ''))).filter(Boolean).sort(), [normalizedStudents]);
  const availableClasses = useMemo(() => Array.from(new Set(normalizedStudents.map(s => s.className))).filter(Boolean).sort(), [normalizedStudents]);

  // Filter & Sort
  const processedData = useMemo(() => {
    let res = normalizedStudents.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTahun = filterTahun === 'Semua' || s.tahun === filterTahun;
      const matchKelas = filterKelas === 'Semua' || s.className === filterKelas;
      const matchGender = filterGender === 'Semua' || s.gender === filterGender;
      return matchSearch && matchTahun && matchKelas && matchGender;
    });

    res.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string' && typeof valB === 'string') {
         const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
         return sortDirection === 'asc' ? cmp : -cmp;
      }
      return 0;
    });

    return res;
  }, [normalizedStudents, searchTerm, filterTahun, filterKelas, filterGender, sortField, sortDirection]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const currentData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: 'name' | 'className' | 'tahun') => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  // --- Handlers ---
  const handleAddIndividu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formClass) return;
    const newRec: StudentRecord = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      idNumber: `ST-${Date.now().toString().slice(-6)}`,
      name: formName.trim().toUpperCase(),
      className: formClass.trim().toUpperCase(),
      tahun: formTahun,
      gender: formGender
    };
    saveStudents([newRec, ...students]);
    setFormName(''); setFormClass('');
    alert(`Rekod ${newRec.name} berjaya ditambah!`);
  };

  const handlePukalParse = () => {
    if (!pukalText.trim()) return;
    const lines = pukalText.split('\\n').filter(l => l.trim());
    const newRecs: StudentRecord[] = [];
    lines.forEach(line => {
      // Format expected: Nama | Tahun | Kelas | Jantina
      const parts = line.split(/[|\\t,]+/).map(p => p.trim());
      if (parts.length >= 4) {
        newRecs.push({
          id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          idNumber: `ST-${Date.now().toString().slice(-6)}`,
          name: parts[0].toUpperCase(),
          tahun: parts[1],
          className: parts[2].toUpperCase(),
          gender: parts[3].toLowerCase().startsWith('p') ? 'Perempuan' : 'Lelaki'
        });
      }
    });

    if (newRecs.length > 0) {
      saveStudents([...newRecs, ...students]);
      setPukalText('');
      alert(`${newRecs.length} rekod murid berjaya ditambah secara pukal.`);
    } else {
      alert("Tiada data sah dijumpai. Sila ikut format yang ditetapkan.");
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const sheets = ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6'];
    sheets.forEach(sheetName => {
        const ws = XLSX.utils.json_to_sheet([
            { 'Nama Murid': 'CONTOH PELAJAR SATU', 'Kelas': 'BESTARI', 'Jantina': 'Lelaki' },
            { 'Nama Murid': 'CONTOH PELAJAR DUA', 'Kelas': 'BESTARI', 'Jantina': 'Perempuan' },
        ]);
        // Set column widths
        const wscols = [ {wch: 40}, {wch: 15}, {wch: 15} ];
        ws['!cols'] = wscols;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    XLSX.writeFile(wb, 'Template_Senarai_Murid.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const allNew: StudentRecord[] = [];
          
          wb.SheetNames.forEach(sheet => {
            const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
            data.forEach(row => {
              if (row['Nama Murid'] || row['Nama'] || row['NAMA']) {
                allNew.push({
                  id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                  idNumber: `ST-${Date.now().toString().slice(-6)}`,
                  name: String(row['Nama Murid'] || row['Nama'] || row['NAMA']).toUpperCase().trim(),
                  className: String(row['Kelas'] || row['KELAS'] || 'UMUM').toUpperCase().trim(),
                  tahun: sheet.toLowerCase().includes('tahun') ? sheet : 'Tahun ' + String(row['Tahun'] || '1'),
                  gender: String(row['Jantina'] || row['JANTINA'] || '').toLowerCase().startsWith('p') ? 'Perempuan' : 'Lelaki'
                });
              }
            });
          });

          setUploadData(allNew);
        } catch (err: any) {
          setUploadError('Gagal membaca fail Excel. Pastikan format adalah betul.');
          console.error(err);
        } finally {
          setIsUploading(false);
          // Reset file input
          if (e.target) e.target.value = '';
        }
    };
    reader.readAsBinaryString(file);
  };

  const confirmUpload = () => {
    if (uploadData.length > 0) {
      saveStudents([...uploadData, ...students]);
      alert(`${uploadData.length} data murid berjaya diimport!`);
      setUploadData([]);
    }
  };

  const deleteStudent = (id: string) => {
    if (confirm('Adakah anda pasti untuk padam rekod ini?')) {
      saveStudents(students.filter(s => s.id !== id));
    }
  };


  return (
    <div className="w-full max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-500">
      {/* 1. Header Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
           <UsersRound className="w-64 h-64 -mt-16 -mr-16" />
        </div>
        <div className="z-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Maklumat Enrolmen Murid</h1>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdminDrawer(true)} className="z-10 bg-white text-indigo-700 px-6 py-3.5 rounded-2xl font-extrabold shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-slate-50 transition-all flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Urus Enrolmen</span>
          </button>
        )}
      </div>

      {/* 2. Top Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
         <MetricCard 
           title="Jumlah Murid" 
           value={analytics.total.toString()} 
           icon={Users} 
           fromColor="from-purple-600" toColor="to-purple-500" 
           bgIconColor="bg-purple-500/20" iconColor="text-purple-50" 
         />
         <MetricCard 
           title="Lelaki" 
           value={analytics.maleCount.toString()} 
           icon={User} 
           fromColor="from-blue-600" toColor="to-blue-500" 
           bgIconColor="bg-blue-500/20" iconColor="text-blue-50" 
         />
         <MetricCard 
           title="Perempuan" 
           value={analytics.femaleCount.toString()} 
           icon={User} 
           fromColor="from-pink-600" toColor="to-pink-500" 
           bgIconColor="bg-pink-500/20" iconColor="text-pink-50" 
         />
         <MetricCard 
           title={`Paling Ramai: ${analytics.maxYear}`} 
           value={analytics.maxYearCount.toString()} 
           icon={Target} 
           fromColor="from-amber-600" toColor="to-amber-500" 
           bgIconColor="bg-amber-500/20" iconColor="text-amber-50" 
         />
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Bar Chart: Tahun */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-6">
               <BarChart3 className="w-5 h-5 text-indigo-500" />
               Jumlah Murid Mengikut Tahun
            </h3>
            <div className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataYear} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                     <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                     <Bar dataKey="Jumlah" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Pie Chart: Gender */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-2">
               <PieChartIcon className="w-5 h-5 text-pink-500" />
               Komposisi Jantina
            </h3>
            <p className="text-xs font-bold text-slate-500 mb-4 text-center mt-2">Nisbah Keseluruhan: <span className="text-indigo-600">{analytics.ratio}</span></p>
            <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={chartDataGender} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {chartDataGender.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                     <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* 4. Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
         {/* Table Header & Filters */}
         <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row justify-between shrink-0 gap-4">
               <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Direktori Enrolmen</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">Senarai lengkap maklumat murid mengikut paparan terkini.</p>
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                     <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input 
                       type="text" 
                       placeholder="Cari nama..." 
                       value={searchTerm}
                       onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                       className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full md:w-64 transition-all"
                     />
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl">
                     <FilterIcon className="w-4 h-4 text-slate-400" />
                     <select value={filterTahun} onChange={e => { setFilterTahun(e.target.value); setCurrentPage(1); }} className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                        <option value="Semua">Semua Tahun</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl hidden sm:flex">
                     <FilterIcon className="w-4 h-4 text-slate-400" />
                     <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setCurrentPage(1); }} className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                        <option value="Semua">Semua Kelas</option>
                        {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
               </div>
            </div>
         </div>

         {/* The Table */}
         <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
               <thead className="bg-blue-600">
                  <tr className="border-b border-blue-700">
                     <th className="px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest w-16">Bil</th>
                     <th className="px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('name')}>
                        Nama Murid
                        {sortField === 'name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                     </th>
                     <th className="px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest cursor-pointer hover:bg-blue-700 transition-colors" onClick={() => handleSort('tahun')}>
                        Tahun / Kelas
                        {sortField === 'tahun' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                     </th>
                     <th className="px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest">Jantina</th>
                     {isAdmin && <th className="px-6 py-4 text-[11px] font-bold text-white uppercase tracking-widest text-center">Tindakan</th>}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {currentData.length > 0 ? currentData.map((s, idx) => (
                     <tr key={s.id} className="even:bg-slate-50/50 hover:bg-indigo-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-slate-400">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td className="px-6 py-4">
                           <p className="text-sm font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{s.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm">{s.idNumber || s.id}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-50 text-blue-700 uppercase tracking-wider mb-1 block w-max">
                              {s.tahun}
                           </span>
                           <span className="text-xs font-bold text-slate-500 ml-1">{s.className}</span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.gender === 'Lelaki' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.gender === 'Lelaki' ? 'bg-blue-500' : 'bg-pink-500'}`}></span>
                              {s.gender}
                           </span>
                        </td>
                        {isAdmin && (
                           <td className="px-6 py-4 text-center">
                              <button onClick={() => deleteStudent(s.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </td>
                        )}
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center">
                           <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                           <p className="text-sm font-bold text-slate-500">Tiada rekod murid dijumpai.</p>
                           <p className="text-xs font-medium text-slate-400">Sila ubah carian atau tambah rekod baru.</p>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination Header */}
         {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
               <p className="text-xs font-bold text-slate-500">
                  Memaparkan <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> daripada <span className="text-indigo-600">{processedData.length}</span> rekod
               </p>
               <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 transition-all"
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold px-2 px-3 bg-white border border-slate-200 rounded-lg py-1.5">Muka {currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 transition-all"
                  >
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
         )}
      </div>


      {/* ADMIN DRAWER MENU MODAL */}
      {showAdminDrawer && isAdmin && (
         <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
               
               {/* Drawer Header */}
               <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <UserPlus className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-extrabold text-slate-800 text-lg">Urus Enrolmen</h3>
                        <p className="text-[11px] font-bold text-slate-500">Pengurusan data murid</p>
                     </div>
                  </div>
                  <button onClick={() => setShowAdminDrawer(false)} className="p-2 text-slate-400 hover:text-slate-700 bg-white shadow-sm border border-slate-200 rounded-full transition-all">
                     <X className="w-4 h-4" />
                  </button>
               </div>

               {/* Drawer Tabs */}
               <div className="p-4 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                  <button onClick={() => setAdminTab('individu')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${adminTab === 'individu' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Tambah Individu</button>
                  <button onClick={() => setAdminTab('upload')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${adminTab === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Upload (Excel/CSV)</button>
                  <button onClick={() => setAdminTab('pukal')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${adminTab === 'pukal' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Teks Pukal</button>
               </div>

               {/* Drawer Content */}
               <div className="flex-1 overflow-y-auto p-6 font-medium text-sm text-slate-600">
                  
                  {/* INDIVIDU */}
                  {adminTab === 'individu' && (
                     <form onSubmit={handleAddIndividu} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Penuh Murid</label>
                           <input required type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Contoh: MUHAMMAD ALI BIN ABU" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm text-slate-800" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tahun Persekolahan</label>
                           <select value={formTahun} onChange={e => setFormTahun(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm text-slate-800 cursor-pointer">
                              {['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6', 'Prasekolah'].map(y => <option key={y} value={y}>{y}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Kelas</label>
                           <input required type="text" value={formClass} onChange={e => setFormClass(e.target.value)} placeholder="Contoh: BESTARI" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm text-slate-800" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Jantina</label>
                           <div className="flex gap-3">
                              <button type="button" onClick={() => setFormGender('Lelaki')} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${formGender === 'Lelaki' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>Lelaki</button>
                              <button type="button" onClick={() => setFormGender('Perempuan')} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${formGender === 'Perempuan' ? 'bg-pink-50 border-pink-200 text-pink-700 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>Perempuan</button>
                           </div>
                        </div>

                        <div className="pt-4 mt-8 border-t border-slate-100">
                           <button type="submit" className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
                              Sah & Simpan
                           </button>
                        </div>
                     </form>
                  )}

                  {/* UPLOAD EXCEL/CSV */}
                  {adminTab === 'upload' && (
                     <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                           <h4 className="text-[13px] font-extrabold text-indigo-900 flex items-center gap-2 mb-2">
                              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                              Cara Format Fail Excel
                           </h4>
                           <ul className="text-[11px] font-bold text-indigo-700 space-y-1.5 list-disc pl-4">
                              <li>Sila guna template rasmi untuk elak ralat.</li>
                              <li>Jantina mesti ditulis 'Lelaki' / 'Perempuan'.</li>
                              <li>Jangan campurkan nama kelas (contoh: Biar 'BESTARI', elakkan '1 BESTARI' jika sheet adalah Tahun 1).</li>
                           </ul>
                           <button onClick={downloadTemplate} className="mt-4 w-full py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl shadow-sm transition-all flex justify-center items-center gap-2">
                              <Download className="w-4 h-4" /> Muat Turun Template Excel (XLSX)
                           </button>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Pilih Fail Anda</label>
                           {isUploading ? (
                              <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 border-dashed rounded-2xl bg-indigo-50/50">
                                 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                 <p className="text-xs font-bold text-indigo-600">Sedang memproses fail...</p>
                              </div>
                           ) : (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
                                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-6 h-6 mb-3 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <p className="mb-1 text-xs text-slate-500 font-bold">Kilk untuk pilih fail</p>
                                    <p className="text-[10px] text-slate-400 font-semibold">Format: .xlsx / .csv</p>
                                 </div>
                                 <input onChange={handleFileUpload} accept=".xlsx, .csv" type="file" className="hidden" />
                              </label>
                           )}
                        </div>

                        {uploadError && (
                           <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              {uploadError}
                           </div>
                        )}

                        {uploadData.length > 0 && (
                           <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-in fade-in zoom-in-95">
                              <div className="flex justify-between items-center mb-3">
                                 <h4 className="text-sm font-extrabold text-emerald-900 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    {uploadData.length} Data Bersedia
                                 </h4>
                              </div>
                              <div className="max-h-32 overflow-y-auto w-full custom-scrollbar bg-white rounded-lg border border-emerald-100 p-2 text-xs font-semibold text-slate-600 space-y-1">
                                 {uploadData.slice(0, 10).map((d, i) => (
                                    <div key={i} className="flex justify-between border-b border-slate-50 pb-1">
                                       <span className="truncate w-1/2">{d.name}</span>
                                       <span className="w-1/4">{d.tahun}</span>
                                       <span className="w-1/4">{d.gender}</span>
                                    </div>
                                 ))}
                                 {uploadData.length > 10 && <p className="text-center text-emerald-500 font-bold mt-2 pt-1">...serta {uploadData.length - 10} rekod lain</p>}
                              </div>
                              
                              <button onClick={confirmUpload} className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 hidden sm:flex justify-center items-center gap-2">
                                 Sahkan Simpan & Import
                              </button>
                           </div>
                        )}
                        
                        {/* Mobile confirmation placement */}
                        {uploadData.length > 0 && (
                           <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-50">
                             <button onClick={confirmUpload} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-2">
                                 Sahkan Simpan & Import
                              </button>
                           </div>
                        )}
                     </div>
                  )}

                  {/* TAMBAH PUKAL (TEXTAREA) */}
                  {adminTab === 'pukal' && (
                     <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                           <h4 className="text-[13px] font-extrabold text-amber-900 flex items-center gap-2 mb-2">Peringatan Format</h4>
                           <p className="text-[11px] font-bold text-amber-700">Tampal (paste) data dari mana-mana jadual Excel. Pisahkan mengikut tab, koma atau |.</p>
                           <p className="text-[11px] font-bold text-amber-700 mt-2 p-2 bg-amber-100/50 rounded-lg font-mono">Ali Bin Abu | Tahun 1 | Bestari | Lelaki<br/>Siti Nur | Tahun 1 | Bestari | Perempuan</p>
                        </div>
                        
                        <textarea 
                           className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                           placeholder="Ali Bin Abu | Tahun 1 | Bestari | Lelaki&#10;..."
                           value={pukalText}
                           onChange={e => setPukalText(e.target.value)}
                        />

                        <button onClick={handlePukalParse} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
                           Import Teks
                        </button>
                     </div>
                  )}

               </div>
               
            </div>
         </div>
      )}

    </div>
  );
}
