import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, UserPlus, FileSpreadsheet, Upload, Download, Search, Filter as FilterIcon, 
  Trash2, Edit2, X, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon, Target, UsersRound, Settings, User,
  Building2, GraduationCap, Heart, Shapes
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
  const [formId, setFormId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formTahun, setFormTahun] = useState('Tahun 1');
  const [formClass, setFormClass] = useState('AMAN');
  const [formGender, setFormGender] = useState<'Lelaki' | 'Perempuan'>('Lelaki');
  const [formRace, setFormRace] = useState('Melayu');

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
  const [filterKaum, setFilterKaum] = useState('Semua');
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

  const guessRace = (name: string): string => {
    const lowercaseName = name.toLowerCase();
    
    // Sabah/Sarawak heuristics
    if (lowercaseName.includes(' anak ') || lowercaseName.match(/\b(ak|a\/k)\b/)) return 'Lain-lain';

    // Indian heuristics
    if (lowercaseName.includes(' a/l ') || lowercaseName.includes(' a/p ') || lowercaseName.includes(' a/l') || lowercaseName.includes(' a/p')) return 'India';
    if (lowercaseName.match(/\b(kumar|devi|krish|krishna|raj|rajam|samy|muthu|kavitha|shankar|raman|nair|pillai|singh|kaur)\b/)) return 'India';
    
    // Malay heuristics
    if (lowercaseName.includes(' bin ') || lowercaseName.includes(' binti ') || lowercaseName.includes(' bt ') || lowercaseName.includes(' b. ')) return 'Melayu';
    if (lowercaseName.match(/\b(muhammad|muhamad|mohd|ahmad|nur|nurul|siti|abdul|syed|sharifah|amir|tengku|raja|wan|nik|megat|puteri|awa|dayang|awang)\b/)) return 'Melayu';

    // Chinese heuristics
    const chineseSurnames = [
      'tan', 'lim', 'lee', 'ng', 'ong', 'wong', 'goh', 'chua', 'chan', 'koh', 
      'teo', 'ooi', 'kho', 'foo', 'pang', 'lai', 'yap', 'liew', 'cheah', 'choo', 
      'yeoh', 'kok', 'ho', 'tay', 'ang', 'sim', 'low', 'aw', 'soo', 'khoo', 
      'loh', 'teoh', 'chia', 'chee', 'hew', 'thong', 'loke', 'seow', 'ting', 
      'tie', 'kong', 'chai', 'lau', 'chieng', 'nong', 'kang', 'phua', 'heng',
      'chong', 'cheong', 'yong', 'chin', 'leong', 'gan', 'kua', 'kuok', 'poon',
      'tham', 'tong', 'thiam', 'lum', 'chon', 'teng', 'beh', 'teh',
      'tian', 'chow', 'chuah', 'hoo', 'hor', 'khor', 'law', 'lian', 'mah', 'mak'
    ];
    const parts = lowercaseName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts.length <= 4) {
        if (chineseSurnames.includes(parts[0])) return 'Cina';
    }

    // Default to Lain-lain if not guessed
    return 'Lain-lain';
  };

  // Enhance old records that might not have `tahun` or `race`
  const normalizedStudents = useMemo(() => {
    return students.map(s => {
      let currentRace = s.race;
      // Re-evaluate if it's currently 'Lain-lain' or missing, in case heuristic improved
      if (!currentRace || currentRace === 'Lain-lain') {
         const newGuess = guessRace(s.name);
         if (newGuess !== 'Lain-lain') {
             currentRace = newGuess;
         }
      }
      
      return {
        ...s,
        tahun: s.tahun || getTahunFromStr(s.className),
        className: s.className || 'Tidak Ditetapkan',
        race: currentRace || guessRace(s.name)
      };
    });
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

    let ratio = '0:0';
    if (femaleCount > 0 && maleCount > 0) {
      if (maleCount >= femaleCount) {
        ratio = `${(maleCount / femaleCount).toFixed(1)} : 1`;
      } else {
        ratio = `1 : ${(femaleCount / maleCount).toFixed(1)}`;
      }
    } else if (maleCount > 0) {
      ratio = '1 : 0';
    } else if (femaleCount > 0) {
      ratio = '0 : 1';
    }

    // Added specific counts for requested categories
    const muridAliranPerdanaCount = normalizedStudents.filter(s => 
      ['AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA'].includes(s.className || '')
    ).length;
    const muridPpkiCount = normalizedStudents.filter(s => s.className === 'AMANAH').length;
    const muridPrasekolahCount = normalizedStudents.filter(s => s.className === 'PRASEKOLAH').length;

    // Race counts
    let malayCount = 0;
    let chineseCount = 0;
    let indianCount = 0;
    let othersCount = 0;
    
    normalizedStudents.forEach(s => {
      if (s.race === 'Melayu') malayCount++;
      else if (s.race === 'Cina') chineseCount++;
      else if (s.race === 'India') indianCount++;
      else othersCount++;
    });

    let majorityRace = 'Lain-lain';
    let majorityRaceCount = othersCount;
    if (malayCount > majorityRaceCount) { majorityRace = 'Melayu'; majorityRaceCount = malayCount; }
    if (chineseCount > majorityRaceCount) { majorityRace = 'Cina'; majorityRaceCount = chineseCount; }
    if (indianCount > majorityRaceCount) { majorityRace = 'India'; majorityRaceCount = indianCount; }
    const majorityRacePercentage = total > 0 ? Math.round((majorityRaceCount / total) * 100) : 0;

    return { 
      total, 
      maleCount, 
      femaleCount, 
      activeClasses, 
      avgPerClass, 
      maxYear, 
      maxYearCount, 
      yearCounts, 
      ratio,
      muridAliranPerdanaCount,
      muridPpkiCount,
      muridPrasekolahCount,
      malayCount,
      chineseCount,
      indianCount,
      othersCount,
      majorityRace,
      majorityRacePercentage
    };
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

  const chartDataRace = [
    { name: 'Melayu', value: analytics.malayCount, color: '#3b82f6' },
    { name: 'Cina', value: analytics.chineseCount, color: '#ef4444' },
    { name: 'India', value: analytics.indianCount, color: '#f59e0b' },
    { name: 'Lain-lain', value: analytics.othersCount, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  const chartDataRaceYear = useMemo(() => {
    const standardYears = ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6', 'Prasekolah'];
    return standardYears.map(y => {
      const studs = normalizedStudents.filter(s => s.tahun === y);
      return {
        name: y,
        Melayu: studs.filter(s => s.race === 'Melayu').length,
        Cina: studs.filter(s => s.race === 'Cina').length,
        India: studs.filter(s => s.race === 'India').length,
        'Lain-lain': studs.filter(s => s.race === 'Lain-lain').length,
      };
    });
  }, [normalizedStudents]);

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
      const matchKaum = filterKaum === 'Semua' || s.race === filterKaum;

      return matchSearch && matchTahun && matchKelas && matchGender && matchKaum;
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
  }, [normalizedStudents, searchTerm, filterTahun, filterKelas, filterGender, filterKaum, sortField, sortDirection]);

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

    if (formId) {
      // Edit mode
      const updatedStudents = students.map(s => {
        if (s.id === formId) {
          return {
            ...s,
            name: formName.trim().toUpperCase(),
            className: matchedClass,
            tahun: formTahun,
            gender: formGender,
            race: formRace
          };
        }
        return s;
      });
      saveStudents(updatedStudents);
      setFormId(null);
      setFormName(''); setFormClass('AMAN');
      setAdminTab('individu');
      alert(`Rekod ${formName} berjaya dikemaskini!`);
    } else {
      // Add mode
      const newRec: StudentRecord = {
        id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        idNumber: `ST-${Date.now().toString().slice(-6)}`,
        name: formName.trim().toUpperCase(),
        className: matchedClass,
        tahun: formTahun,
        gender: formGender,
        race: formRace
      };
      saveStudents([newRec, ...students]);
      setFormName(''); setFormClass('AMAN');
      alert(`Rekod ${newRec.name} berjaya ditambah!`);
    }
  };

  const handleEditClick = (student: StudentRecord) => {
    setFormId(student.id);
    setFormName(student.name);
    setFormTahun(student.tahun || 'Tahun 1');
    setFormClass(student.className);
    setFormGender(student.gender as any);
    setFormRace(student.race || 'Melayu');
    setAdminTab('individu');
    setShowAdminDrawer(true);
  };

  const handlePukalParse = () => {
    if (!pukalText.trim()) return;
    const lines = pukalText.split('\n').filter(l => l.trim());
    const newRecs: StudentRecord[] = [];
    const allowedUpper = ['AMANAH', 'PRASEKOLAH', 'AMAN', 'BAHAGIA', 'HARMONI', 'MAKMUR', 'SENTOSA'];

    lines.forEach(line => {
      // Format expected: Nama | Tahun | Kelas | Jantina | Kaum
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
            gender: parts[3].toLowerCase().startsWith('p') ? 'Perempuan' : 'Lelaki',
            race: parts[4] ? parts[4].charAt(0).toUpperCase() + parts[4].slice(1).toLowerCase() : guessRace(parts[0].toUpperCase())
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
            { 'Nama Murid': 'CONTOH PELAJAR SATU', 'Kelas': 'AMAN', 'Jantina': 'Lelaki', 'Kaum': 'Melayu' },
            { 'Nama Murid': 'CONTOH PELAJAR DUA', 'Kelas': 'BAHAGIA', 'Jantina': 'Perempuan', 'Kaum': 'Cina' },
        ]);
        if (sheetName === '4 Amanah (PPKI)') {
            ws['A2'] = { v: 'CONTOH PELAJAR PPKI' };
            ws['B2'] = { v: 'AMANAH' };
        }
        if (sheetName === 'Prasekolah') {
            ws['B2'] = { v: 'PRASEKOLAH' };
        }
        // Set column widths
        const wscols = [ {wch: 40}, {wch: 15}, {wch: 15}, {wch: 15} ];
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
                  const studentName = String(row['Nama Murid'] || row['Nama'] || row['NAMA']).toUpperCase().trim();
                  const rawRace = String(row['Kaum'] || row['KAUM'] || '').trim();
                  allNew.push({
                    id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    idNumber: `ST-${Date.now().toString().slice(-6)}`,
                    name: studentName,
                    className: matchedClass,
                    tahun: sheet.toLowerCase().includes('tahun') ? sheet : 
                          sheet === 'Prasekolah' ? 'Prasekolah' :
                          sheet === '4 Amanah (PPKI)' ? 'Tahun 4' :
                          'Tahun ' + String(row['Tahun'] || '1'),
                    gender: String(row['Jantina'] || row['JANTINA'] || '').toLowerCase().startsWith('p') ? 'Perempuan' : 'Lelaki',
                    race: rawRace ? rawRace.charAt(0).toUpperCase() + rawRace.slice(1).toLowerCase() : guessRace(studentName)
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
    <div className="w-full pb-16 space-y-6 animate-in fade-in duration-500">
      {/* 1. Header Hero */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <UsersRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Enrolmen Murid</h2>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex items-center">
            <button 
              onClick={() => setShowAdminDrawer(true)} 
              className="bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest font-black shadow-sm transition-all flex items-center space-x-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Urus Enrolmen</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Top Analytics Cards - 3x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <MetricCard 
           title="Jumlah Murid" 
           value={analytics.total.toString()} 
           icon={Users} 
           fromColor="from-slate-800" toColor="to-slate-700" 
           bgIconColor="bg-white/10" iconColor="text-white" 
         />
         <MetricCard 
           title="Murid Lelaki" 
           value={analytics.maleCount.toString()} 
           icon={User} 
           fromColor="from-sky-500" toColor="to-sky-400" 
           bgIconColor="bg-sky-300/20" iconColor="text-sky-50" 
         />
         <MetricCard 
           title="Murid Perempuan" 
           value={analytics.femaleCount.toString()} 
           icon={UsersRound} 
           fromColor="from-pink-500" toColor="to-pink-400" 
           bgIconColor="bg-pink-300/20" iconColor="text-pink-50" 
         />
         <MetricCard 
           title="Aliran Perdana" 
           value={analytics.muridAliranPerdanaCount.toString()} 
           icon={GraduationCap} 
           fromColor="from-blue-600" toColor="to-blue-500" 
           bgIconColor="bg-blue-400/20" iconColor="text-blue-50" 
         />
         <MetricCard 
           title="Murid PPKI" 
           value={analytics.muridPpkiCount.toString()} 
           icon={Heart} 
           fromColor="from-emerald-600" toColor="to-emerald-500" 
           bgIconColor="bg-emerald-400/20" iconColor="text-emerald-50" 
         />
         <MetricCard 
           title="Murid Prasekolah" 
           value={analytics.muridPrasekolahCount.toString()} 
           icon={Shapes} 
           fromColor="from-amber-600" toColor="to-amber-500" 
           bgIconColor="bg-amber-400/20" iconColor="text-amber-50" 
         />
      </div>

      {/* Race Info & Insight */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mt-24 -mr-24 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">
          <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">M</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Melayu</p>
                  <p className="text-xl font-black text-slate-800">{analytics.malayCount}</p>
                </div>
             </div>
             <div className="bg-red-50/50 border border-red-100/50 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black">C</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cina</p>
                  <p className="text-xl font-black text-slate-800">{analytics.chineseCount}</p>
                </div>
             </div>
             <div className="bg-amber-50/50 border border-amber-100/50 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black">I</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">India</p>
                  <p className="text-xl font-black text-slate-800">{analytics.indianCount}</p>
                </div>
             </div>
             <div className="bg-purple-50/50 border border-purple-100/50 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black">L</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lain-lain</p>
                  <p className="text-xl font-black text-slate-800">{analytics.othersCount}</p>
                </div>
             </div>
          </div>
          
          <div className="lg:w-1/3 bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-center relative overflow-hidden">
             <div className="absolute -right-4 -bottom-4 opacity-10">
                <PieChartIcon className="w-24 h-24" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Insight Automatik</p>
             <p className="text-sm font-medium leading-relaxed max-w-[250px] relative z-10">
                Kaum majoriti sekolah ialah <span className="font-black text-white">{analytics.majorityRace}</span> ({analytics.majorityRacePercentage}%).
             </p>
          </div>
        </div>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

         {/* Bar Chart: Kaum Mengikut Tahun */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-6">
               <BarChart3 className="w-5 h-5 text-indigo-500" />
               Jumlah Kaum Mengikut Tahun
            </h3>
            <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar pb-2">
               <div className="h-[300px] min-w-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartDataRaceYear} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 'bold', paddingTop: '10px' }} />
                        <Bar dataKey="Melayu" stackId="a" fill="#3b82f6" maxBarSize={40} />
                        <Bar dataKey="Cina" stackId="a" fill="#ef4444" maxBarSize={40} />
                        <Bar dataKey="India" stackId="a" fill="#f59e0b" maxBarSize={40} />
                        <Bar dataKey="Lain-lain" stackId="a" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>

         {/* Pie Chart: Kaum */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
               <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                  <PieChartIcon className="w-5 h-5 text-purple-500" />
                  Statistik Kaum (Peratus)
               </h3>
               <div className="h-[220px] w-full relative mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie data={chartDataRace} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                           {chartDataRace.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }} />
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                     <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Total</span>
                     <span className="text-xl font-black text-slate-700">{analytics.total}</span>
                  </div>
               </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
               {chartDataRace.map((t, idx) => (
                  <div key={idx} className="flex flex-col justify-between p-3 rounded-2xl border bg-slate-50 border-slate-100">
                     <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                        <span className="text-[11px] font-bold text-slate-500">{t.name}</span>
                     </div>
                     <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-800">{t.value}</span>
                        <span className="text-[10px] font-bold text-slate-400">({analytics.total > 0 ? Math.round((t.value / analytics.total) * 100) : 0}%)</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Bar Chart: Tahun */}
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
            <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-6">
               <BarChart3 className="w-5 h-5 text-indigo-500" />
               Jumlah Murid Mengikut Tahun
            </h3>
            <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar pb-2">
               <div className="h-[250px] min-w-[500px] w-full">
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
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/30">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
               <div className="shrink-0">
                  <h3 className="font-black text-slate-800 text-xl tracking-tight">Direktori Enrolmen</h3>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Pengurusan Data Pelajar</p>
               </div>
               
               <div className="flex flex-col lg:flex-row w-full lg:flex-1 lg:justify-end gap-4 lg:items-center lg:flex-wrap">
                  {/* Search Bar */}
                  <div className="relative w-full lg:w-auto">
                     <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                     <input 
                       type="text" 
                       placeholder="Cari nama murid..." 
                       value={searchTerm}
                       onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                       className="w-full lg:w-72 xl:w-96 pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] text-sm font-bold text-slate-700 shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium"
                     />
                  </div>

                  {/* Dropdowns Container */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap items-center lg:justify-end gap-3">
                    <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-[1.25rem] shadow-sm hover:border-blue-300 transition-colors w-full lg:w-auto overflow-hidden group">
                       <FilterIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                       <div className="flex flex-col min-w-0 flex-1">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Tahun</span>
                         <select 
                           value={filterTahun} 
                           onChange={e => { setFilterTahun(e.target.value); setCurrentPage(1); }} 
                           className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer w-full appearance-none pr-4"
                         >
                            <option value="Semua">Semua Tahun</option>
                            {filterYearsList.map(y => <option key={y} value={y}>{y}</option>)}
                         </select>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-[1.25rem] shadow-sm hover:border-blue-300 transition-colors w-full lg:w-auto overflow-hidden group">
                       <FilterIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                       <div className="flex flex-col min-w-0 flex-1">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Kelas</span>
                         <select 
                           value={filterKelas} 
                           onChange={e => { setFilterKelas(e.target.value); setCurrentPage(1); }} 
                           className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer w-full appearance-none pr-4"
                         >
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

                    <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-3 rounded-[1.25rem] shadow-sm hover:border-blue-300 transition-colors w-full lg:w-auto overflow-hidden group">
                       <FilterIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                       <div className="flex flex-col min-w-0 flex-1">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Kaum</span>
                         <select 
                           value={filterKaum} 
                           onChange={e => { setFilterKaum(e.target.value); setCurrentPage(1); }} 
                           className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer w-full appearance-none pr-4"
                         >
                            <option value="Semua">Semua Kaum</option>
                            <option value="Melayu">Melayu</option>
                            <option value="Cina">Cina</option>
                            <option value="India">India</option>
                            <option value="Lain-lain">Lain-lain</option>
                         </select>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>

         {/* The Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
               <thead className="bg-blue-600">
                   <tr className="border-b border-blue-700">
                     <th className="px-2 py-5 text-sm font-black text-white uppercase tracking-[0.1em] text-center w-16 min-w-[64px]">Bil</th>
                     <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em] sticky left-0 z-20 bg-blue-600 shadow-[4px_0_12px_rgba(0,0,0,0.1)] min-w-[160px] md:min-w-[200px] max-w-[240px] md:max-w-[300px]">
                        Nama Murid
                     </th>
                     <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em]">
                        Kelas
                     </th>
                     <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em] text-center w-24">Jantina</th>
                     <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em] text-center w-32">Kaum</th>
                     {isAdmin && <th className="px-6 py-5 text-sm font-black text-white uppercase tracking-[0.1em] text-center">Tindakan</th>}
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {currentData.length > 0 ? currentData.map((s, idx) => (
                     <tr key={s.id} className="hover:bg-indigo-50/30 transition-all duration-200 group">
                        <td className="px-2 py-4.5 text-xs font-bold text-slate-400 text-center">
                           <span className="mx-auto bg-slate-100 w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors tracking-tighter">
                              {((currentPage - 1) * itemsPerPage + idx + 1).toString().padStart(2, '0')}
                           </span>
                        </td>
                        <td className="px-6 py-4.5 sticky left-0 z-10 bg-white group-hover:bg-[#f6f8ff] shadow-[4px_0_12px_rgba(0,0,0,0.05)] min-w-[160px] md:min-w-[200px] max-w-[240px] md:max-w-[280px]">
                           <div className="flex flex-col w-full">
                              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-800 transition-colors uppercase tracking-tight line-clamp-3 whitespace-normal break-words leading-snug" title={s.name}>{s.name}</p>
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
                        <td className="px-6 py-4.5 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${s.gender === 'Lelaki' ? 'bg-blue-50 text-blue-600 border border-blue-100/50' : 'bg-rose-50 text-rose-600 border border-rose-100/50'} justify-center w-12 mx-auto`}>
                              {s.gender === 'Lelaki' ? 'L' : 'P'}
                           </span>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                           {(() => {
                              const raceStr = (s.race || guessRace(s.name)).toLowerCase();
                              let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
                              let displayRace = raceStr.toUpperCase();
                              
                              if (raceStr.includes('melayu')) {
                                 badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                 displayRace = 'MELAYU';
                              } else if (raceStr.includes('cina')) {
                                 badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                                 displayRace = 'CINA';
                              } else if (raceStr.includes('india')) {
                                 badgeClass = 'bg-orange-50 text-orange-700 border-orange-200';
                                 displayRace = 'INDIA';
                              } else {
                                 badgeClass = 'bg-slate-50 text-slate-600 border-slate-200';
                                 displayRace = 'LAIN-LAIN';
                              }

                              return (
                                 <span className={`inline-flex items-center justify-center w-[85px] py-1.5 rounded-xl text-[10px] font-black tracking-wider border ${badgeClass} uppercase`}>
                                    {displayRace}
                                 </span>
                              );
                           })()}
                        </td>
                        {isAdmin && (
                           <td className="px-6 py-4.5 text-center whitespace-nowrap">
                              <button onClick={() => handleEditClick(s)} className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-blue-100 mr-1" title="Kemaskini">
                                 <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteStudent(s.id)} className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-rose-100" title="Padam">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </td>
                        )}
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center">
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
               <div className="flex items-center space-x-1.5 select-none justify-end sm:ml-auto">
                  <button 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                    className={`p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent ${
                        currentPage === 1 ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer px-3 bg-white shadow-sm'
                    }`}
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </button>

                  {(() => {
                     let startPage = Math.max(1, currentPage - 2);
                     let endPage = startPage + 4;
                     if (endPage > totalPages) {
                        endPage = totalPages;
                        startPage = Math.max(1, endPage - 4);
                     }
                     const pagesToShow = Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i);
                     return pagesToShow.map((page) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[36px] h-[36px] flex items-center justify-center text-xs font-black rounded-xl transition-all ${
                            currentPage === page
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                : 'border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 bg-white shadow-sm'
                            }`}
                        >
                            {page}
                        </button>
                      ));
                  })()}

                  <button 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
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
                  <button onClick={() => {setFormId(null); setAdminTab('individu'); setFormName('');}} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${adminTab === 'individu' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{formId ? 'Kemaskini Individu' : 'Tambah Individu'}</button>
                  {!formId && <button onClick={() => setAdminTab('upload')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${adminTab === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Upload (Excel/CSV)</button>}
                  {!formId && <button onClick={() => setAdminTab('pukal')} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${adminTab === 'pukal' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Teks Pukal</button>}
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
                        <div className="space-y-1.5">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Kaum</label>
                           <select value={formRace} onChange={e => setFormRace(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm text-slate-800 cursor-pointer">
                              {['Melayu', 'Cina', 'India', 'Lain-lain'].map(c => (
                                 <option key={c} value={c}>{c}</option>
                              ))}
                           </select>
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
                           <p className="text-[11px] font-bold text-amber-700 mt-2 p-2 bg-amber-100/50 rounded-lg font-mono">Ali Bin Abu | Tahun 1 | AMAN | Lelaki | Melayu<br/>Siti Nur | Tahun 4 | AMANAH | Perempuan | Melayu</p>
                        </div>
                        
                        <textarea 
                           className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                           placeholder="Ali Bin Abu | Tahun 1 | AMAN | Lelaki | Melayu&#10;Siti Nur | Tahun 4 | AMANAH | Perempuan | Cina&#10;..."
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
