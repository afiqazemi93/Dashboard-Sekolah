import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, UserPlus, FileSpreadsheet, Upload, Download, Search, Filter as FilterIcon, 
  Trash2, X, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon, Target, UsersRound, Settings, User
} from 'lucide-react';
import { SchoolDetails, StudentRecord } from '../types';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

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
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);

  // Individu Form
  const [formName, setFormName] = useState('');
  const [formTahun, setFormTahun] = useState('Tahun 1');
  const [formClass, setFormClass] = useState('AMAN');
  const [formGender, setFormGender] = useState<'Lelaki' | 'Perempuan'>('Lelaki');

  // Pukal Form
  const [pukalText, setPukalText] = useState('');
  
  // Upload State
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTahun, setFilterTahun] = useState('Tahun 1');
  const [filterKelas, setFilterKelas] = useState('AMAN');
  const [filterGender, setFilterGender] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'name' | 'className' | 'tahun'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

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
    // Standard years
    const standardYears = ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6', 'Prasekolah'];
    const data = standardYears.map(y => {
      let count = analytics.yearCounts[y] || 0;
      // If it's Tahun 4, subtract AMANAH students as they get their own bar
      if (y === 'Tahun 4') {
        const amanahCount = normalizedStudents.filter(s => s.className === 'AMANAH').length;
        count = Math.max(0, count - amanahCount);
      }
      return {
        name: y,
        Jumlah: count
      };
    });

    // Add Amanah (PPKI) separately
    const ppkiCount = normalizedStudents.filter(s => s.className === 'AMANAH').length;
    if (ppkiCount > 0) {
      data.push({ name: 'Amanah (PPKI)', Jumlah: ppkiCount });
    }

    return data.filter(d => d.Jumlah > 0);
  }, [analytics.yearCounts, normalizedStudents]);

  const chartDataGender = [
    { name: 'Lelaki', value: analytics.maleCount, color: '#3b82f6' },
    { name: 'Perempuan', value: analytics.femaleCount, color: '#ec4899' }
  ];

  // Unique lists for filters
  const ALL_CLASSES = ['AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA', 'AMANAH', 'PRASEKOLAH'];
  const ALL_YEARS = ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6', 'Prasekolah'];
  
  // Use ALL_YEARS for the filter dropdown
  const filterYearsList = useMemo<string[]>(() => {
    const existing = new Set(normalizedStudents.map(s => s.tahun || ''));
    return Array.from(new Set([...ALL_YEARS, ...Array.from(existing)]))
      .filter((y): y is string => Boolean(y))
      .sort((a, b) => {
         if (a.toLowerCase().includes('tahun') && b.toLowerCase().includes('tahun')) {
            return a.localeCompare(b, undefined, { numeric: true });
         }
         return a.localeCompare(b);
      });
  }, [normalizedStudents]);

  // Use ALL_CLASSES for the filter dropdown so user can see all options even if empty
  const filterClassesList = useMemo<string[]>(() => {
    const existing = new Set(normalizedStudents.map(s => s.className));
    // Combine all allowed classes and any "other" classes that might exist in data
    return Array.from(new Set([...ALL_CLASSES, ...Array.from(existing)]))
      .filter((c): c is string => Boolean(c))
      .sort();
  }, [normalizedStudents]);

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
      const CLASS_SORT_ORDER = ['AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA', 'AMANAH', 'PRASEKOLAH'];

      // If sorting by name, and we are showing all classes, prioritize class order first to group them
      if (sortField === 'name' && filterKelas === 'Semua') {
         const idxA = CLASS_SORT_ORDER.indexOf(a.className || '');
         const idxB = CLASS_SORT_ORDER.indexOf(b.className || '');
         const effectiveA = idxA === -1 ? 999 : idxA;
         const effectiveB = idxB === -1 ? 999 : idxB;
         if (effectiveA !== effectiveB) return effectiveA - effectiveB;
      }

      // If user specifically sorts by class, use the custom order
      if (sortField === 'className') {
         const idxA = CLASS_SORT_ORDER.indexOf(a.className || '');
         const idxB = CLASS_SORT_ORDER.indexOf(b.className || '');
         const effectiveA = idxA === -1 ? 999 : idxA;
         const effectiveB = idxB === -1 ? 999 : idxB;
         if (effectiveA !== effectiveB) return sortDirection === 'asc' ? effectiveA - effectiveB : effectiveB - effectiveA;
      }

      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string' && typeof valB === 'string') {
         const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
         if (cmp !== 0) {
            return sortDirection === 'asc' ? cmp : -cmp;
         }
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
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
    const allowedUpper = ['AMANAH', 'PRASEKOLAH', 'AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA'];
    const typedClass = formClass.trim().toUpperCase();
    
    // Prioritize exact match first, then fallback to inclusion (but check from longest to shortest)
    let matchedClass = allowedUpper.find(cls => typedClass === cls);
    if (!matchedClass) {
      matchedClass = allowedUpper.find(cls => typedClass.includes(cls));
    }
    
    if (!matchedClass) {
      alert("Hanya kelas AMAN, BAHAGIA, HARMONI, MAKMUR, SENTOSA, AMANAH, atau PRASEKOLAH yang dibenarkan.");
      return;
    }

    const newRec: StudentRecord = {
      id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      idNumber: `ST-${Date.now().toString().slice(-6)}`,
      name: formName.trim().toUpperCase(),
      className: matchedClass,
      tahun: formTahun,
      gender: formGender
    };
    saveStudents([newRec, ...students]);
    setFormName(''); setFormClass('AMAN');
    alert(`Rekod ${newRec.name} berjaya ditambah!`);
  };

  const handlePukalParse = () => {
    if (!pukalText.trim()) return;
    const lines = pukalText.split('\n').filter(l => l.trim());
    const newRecs: StudentRecord[] = [];
    const allowedUpper = ['AMANAH', 'PRASEKOLAH', 'AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA'];

    lines.forEach(line => {
      // Format expected: Nama | Tahun | Kelas | Jantina
      const parts = line.split(/[|\t,]+/).map(p => p.trim());
      if (parts.length >= 4) {
        const rawClass = parts[2].toUpperCase();
        let matchedClass = allowedUpper.find(cls => rawClass === cls);
        if (!matchedClass) {
          matchedClass = allowedUpper.find(cls => rawClass.includes(cls));
        }

        if (matchedClass) {
          newRecs.push({
            id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            idNumber: `ST-${Date.now().toString().slice(-6)}`,
            name: parts[0].toUpperCase(),
            tahun: parts[1],
            className: matchedClass,
            gender: parts[3].toLowerCase().startsWith('p') ? 'Perempuan' : 'Lelaki'
          });
        }
      }
    });

    if (newRecs.length > 0) {
      saveStudents([...newRecs, ...students]);
      setPukalText('');
      alert(`${newRecs.length} rekod murid berjaya ditambah secara pukal.`);
    } else {
      alert("Tiada data kelas yang sah dijumpai.");
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const sheets = ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6', '4 Amanah (PPKI)', 'Prasekolah'];
    sheets.forEach(sheetName => {
        const ws = XLSX.utils.json_to_sheet([
            { 'Nama Murid': 'CONTOH PELAJAR SATU', 'Kelas': 'AMAN', 'Jantina': 'Lelaki' },
            { 'Nama Murid': 'CONTOH PELAJAR DUA', 'Kelas': 'BAHAGIA', 'Jantina': 'Perempuan' },
        ]);
        if (sheetName === '4 Amanah (PPKI)') {
            ws['A2'] = { v: 'CONTOH PELAJAR PPKI' };
            ws['B2'] = { v: 'AMANAH' };
        }
        if (sheetName === 'Prasekolah') {
            ws['B2'] = { v: 'PRASEKOLAH' };
        }
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
          const allowedUpper = ['AMANAH', 'PRASEKOLAH', 'AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA'];
          
          wb.SheetNames.forEach(sheet => {
            const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
            data.forEach(row => {
              if (row['Nama Murid'] || row['Nama'] || row['NAMA']) {
                const rawClass = String(row['Kelas'] || row['KELAS'] || '').toUpperCase().trim();
                let matchedClass = allowedUpper.find(cls => rawClass === cls);
                if (!matchedClass) {
                  matchedClass = allowedUpper.find(cls => rawClass.includes(cls));
                }
                
                // Default class for specific sheets if not specified in cell
                if (sheet === '4 Amanah (PPKI)') matchedClass = 'AMANAH';
                if (sheet === 'Prasekolah') matchedClass = 'PRASEKOLAH';

                if (matchedClass) {
                  allNew.push({
                    id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    idNumber: `ST-${Date.now().toString().slice(-6)}`,
                    name: String(row['Nama Murid'] || row['Nama'] || row['NAMA']).toUpperCase().trim(),
                    className: matchedClass,
                    tahun: sheet.toLowerCase().includes('tahun') ? sheet : 
                          sheet === 'Prasekolah' ? 'Prasekolah' :
                          sheet === '4 Amanah (PPKI)' ? 'Tahun 4' :
                          'Tahun ' + String(row['Tahun'] || '1'),
                    gender: String(row['Jantina'] || row['JANTINA'] || '').toLowerCase().startsWith('p') ? 'Perempuan' : 'Lelaki'
                  });
                }
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
    const s = students.find(st => st.id === id);
    if (s) setStudentToDelete(s);
  };

  const confirmDeleteStudent = () => {
    if (studentToDelete) {
      saveStudents(students.filter(s => s.id !== studentToDelete.id));
      setStudentToDelete(null);
    }
  };

  const handleDeleteAll = () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = () => {
    saveStudents([]);
    setShowDeleteAllConfirm(false);
    alert('Semua rekod murid telah dipadamkan.');
  };


  return (
    <div className="w-full max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-500">
      {/* 1. Header Hero */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 mt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-[1.75rem] flex items-center justify-center shadow-xl shadow-slate-200/50">
            <UsersRound className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">Enrolmen Murid</h1>
            <p className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
              PENGURUSAN DATA & STATISTIK
            </p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdminDrawer(true)} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] uppercase tracking-widest font-black shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-blue-600 transition-all flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Urus Enrolmen</span>
          </button>
        )}
      </header>

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
           title="Murid Lelaki" 
           value={analytics.maleCount.toString()} 
           icon={User} 
           fromColor="from-blue-600" toColor="to-blue-500" 
           bgIconColor="bg-blue-500/20" iconColor="text-blue-50" 
         />
         <MetricCard 
           title="Murid Perempuan" 
           value={analytics.femaleCount.toString()} 
           icon={UsersRound} 
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
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
               <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                  <PieChartIcon className="w-5 h-5 text-pink-500" />
                  Komposisi Jantina
               </h3>
               <div className="h-[180px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={chartDataGender} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                           {chartDataGender.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                     </PieChart>
                  </ResponsiveContainer>
                  {/* Centered Ratio badge right in the donut hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                     <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Nisbah</span>
                     <span className="text-sm font-black text-slate-700">{analytics.ratio}</span>
                  </div>
               </div>
            </div>

            {/* Modern Neat Indicators */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
               <div className="bg-blue-50/50 border border-blue-100/30 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                     <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                     <span className="text-[11px] font-bold text-slate-500">Lelaki</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                     <span className="text-xl font-black text-slate-800">{analytics.maleCount}</span>
                     <span className="text-[10px] font-bold text-slate-400">({analytics.total > 0 ? Math.round((analytics.maleCount / analytics.total) * 100) : 0}%)</span>
                  </div>
               </div>

               <div className="bg-pink-50/50 border border-pink-100/30 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5">
                     <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                     <span className="text-[11px] font-bold text-slate-500">Perempuan</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                     <span className="text-xl font-black text-slate-800">{analytics.femaleCount}</span>
                     <span className="text-[10px] font-bold text-slate-400">({analytics.total > 0 ? Math.round((analytics.femaleCount / analytics.total) * 100) : 0}%)</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

       {/* 4. Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
         
         {/* Custom Single Delete Confirm Overlay */}
         <AnimatePresence>
            {studentToDelete && (
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center p-6 text-center"
               >
                  <motion.div 
                    initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }}
                    className="max-w-xs w-full bg-white border border-slate-200 shadow-2xl rounded-3xl p-8"
                  >
                     <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8" />
                     </div>
                     <h3 className="text-lg font-black text-slate-800 mb-2">Padam Rekod?</h3>
                     <p className="text-sm font-bold text-slate-500 mb-6">
                        Adakah anda pasti untuk memadam rekod <span className="text-slate-900">{studentToDelete.name}</span>?
                     </p>
                     <div className="flex flex-col gap-2">
                        <button onClick={confirmDeleteStudent} className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all">Sahkan Padam</button>
                        <button onClick={() => setStudentToDelete(null)} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Batal</button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

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
                        {filterYearsList.map(y => <option key={y} value={y}>{y}</option>)}
                     </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl hidden sm:flex">
                     <FilterIcon className="w-4 h-4 text-slate-400" />
                     <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setCurrentPage(1); }} className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer">
                        <option value="Semua">Semua Kelas</option>
                        {filterClassesList.map(c => (
                           <option key={c} value={c}>
                              {c === 'AMANAH' ? 'AMANAH (PPKI)' : 
                               c === 'PRASEKOLAH' ? 'PRASEKOLAH' : c}
                           </option>
                        ))}
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
                     <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em] w-20">Bil</th>
                     <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em]">
                        Nama Murid
                     </th>
                     <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em]">
                        Kelas
                     </th>
                     <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em]">Jantina</th>
                     {isAdmin && <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em] text-center">Tindakan</th>}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {currentData.length > 0 ? currentData.map((s, idx) => (
                     <tr key={s.id} className="hover:bg-indigo-50/30 transition-all duration-200 group">
                        <td className="px-6 py-4.5 text-xs font-bold text-slate-400">
                           <span className="bg-slate-100 w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors tracking-tighter">
                              {((currentPage - 1) * itemsPerPage + idx + 1).toString().padStart(2, '0')}
                           </span>
                        </td>
                        <td className="px-6 py-4.5">
                           <div className="flex flex-col">
                              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-800 transition-colors uppercase tracking-tight">{s.name}</p>
                           </div>
                        </td>
                        <td className="px-6 py-4.5">
                           <div className="flex flex-col">
                              <span className="text-[13px] font-extrabold text-slate-700">
                                 {(() => {
                                    const digit = s.tahun ? (s.tahun.match(/\d+/) ? s.tahun.match(/\d+/)![0] : '') : '';
                                    let clsName = (s.className || '').toUpperCase();
                                    if (clsName === 'AMANAH') clsName = 'AMANAH (PPKI)';
                                    
                                    if (digit) {
                                       return `${digit} ${clsName}`;
                                    }
                                    return clsName;
                                 })()}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4.5">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${s.gender === 'Lelaki' ? 'bg-blue-50 text-blue-600 border border-blue-100/50' : 'bg-rose-50 text-rose-600 border border-rose-100/50'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.gender === 'Lelaki' ? 'bg-blue-400' : 'bg-rose-400'}`}></span>
                              {s.gender}
                           </span>
                        </td>
                        {isAdmin && (
                           <td className="px-6 py-4.5 text-center">
                              <button onClick={() => deleteStudent(s.id)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-rose-100">
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
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
               <p className="text-xs font-bold text-slate-500">
                  Memaparkan <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> daripada <span className="text-indigo-600">{processedData.length}</span> rekod
               </p>
               <div className="flex items-center gap-2 justify-end sm:ml-auto">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold px-3 bg-white border border-slate-200 rounded-lg py-1.5">Muka {currentPage} / {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
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
            <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 relative">
               
               {/* Custom Delete All Confirm Overlay inside Drawer */}
               <AnimatePresence>
                 {showDeleteAllConfirm && (
                   <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-md flex items-center justify-center p-8 text-center"
                   >
                     <motion.div 
                       initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
                       className="w-full"
                     >
                       <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                         <AlertCircle className="w-10 h-10" />
                       </div>
                       <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">AMARAN KERAS</h3>
                       <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
                         Anda akan memadam <span className="text-rose-600">SEMUA REKOD MURID</span> ({students.length} orang) secara kekal dari pangkalan data. Tindakan ini bersifat muktamad.
                       </p>
                       <div className="space-y-3">
                         <button onClick={confirmDeleteAll} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-lg hover:shadow-rose-200 active:scale-95">Sahkan Padam Kesemua</button>
                         <button onClick={() => setShowDeleteAllConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all">Batalkan Tindakan</button>
                       </div>
                     </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>

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
                           <select value={formClass} onChange={e => setFormClass(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm text-slate-800 cursor-pointer">
                              {['AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA', 'AMANAH', 'PRASEKOLAH'].map(c => (
                                 <option key={c} value={c}>{c === 'AMANAH' ? 'AMANAH (PPKI)' : c}</option>
                              ))}
                           </select>
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
                           <p className="text-[11px] font-bold text-amber-700 mt-2 p-2 bg-amber-100/50 rounded-lg font-mono">Ali Bin Abu | Tahun 1 | AMAN | Lelaki<br/>Siti Nur | Tahun 4 | AMANAH | Perempuan</p>
                        </div>
                        
                        <textarea 
                           className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                           placeholder="Ali Bin Abu | Tahun 1 | AMAN | Lelaki&#10;Siti Nur | Tahun 4 | AMANAH | Perempuan&#10;..."
                           value={pukalText}
                           onChange={e => setPukalText(e.target.value)}
                        />

                        <button onClick={handlePukalParse} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2">
                           Import Teks
                        </button>
                     </div>
                  )}

                  {/* BULK ACTIONS / DANGER ZONE */}
                  <div className="mt-12 pt-8 border-t border-slate-100">
                     <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4">Ruang Bahaya</h4>
                     <button 
                        onClick={handleDeleteAll}
                        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-all border border-rose-100 flex justify-center items-center gap-2 group"
                     >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Padam Semua Rekod Murid
                     </button>
                     <p className="text-[10px] font-bold text-slate-400 mt-3 text-center px-4 leading-relaxed">
                        Tindakan ini akan mengosongkan keseluruhan pangkalan data murid.
                     </p>
                  </div>

               </div>
               
            </div>
         </div>
      )}

    </div>
  );
}
