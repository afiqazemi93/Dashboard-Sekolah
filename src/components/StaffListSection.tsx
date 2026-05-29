import React, { useState, useEffect } from 'react';
import { Teacher } from '../types';
import { Edit2, Trash2, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface StaffListSectionProps {
  title: string;
  items: Teacher[];
  isAdmin: boolean;
  onUpdateItems: (items: Teacher[]) => void;
  maxItems: number;
  subjectLabel: string;
  subjectPlaceholder: string;
  gradeLabel: string;
  gradePlaceholder: string;
  searchPlaceholder: string;
  addButtonText: string;
  emptyMessage: string;
  filterAllText: string;
  sortFn?: (a: Teacher, b: Teacher) => number;
  showGradeFilter?: boolean;
  badgePosition?: 'top' | 'bottom';
}

const badgeColors = [
  "bg-red-50 text-red-600 border-red-100",
  "bg-orange-50 text-orange-600 border-orange-100",
  "bg-amber-50 text-amber-600 border-amber-100",
  "bg-green-50 text-green-600 border-green-100",
  "bg-emerald-50 text-emerald-600 border-emerald-100",
  "bg-teal-50 text-teal-600 border-teal-100",
  "bg-cyan-50 text-cyan-600 border-cyan-100",
  "bg-blue-50 text-blue-600 border-blue-100",
  "bg-indigo-50 text-indigo-600 border-indigo-100",
  "bg-violet-50 text-violet-600 border-violet-100",
  "bg-purple-50 text-purple-600 border-purple-100",
  "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
  "bg-pink-50 text-pink-600 border-pink-100",
  "bg-rose-50 text-rose-600 border-rose-100",
];

const getBadgeColor = (subject: string) => {
  if (!subject) return "bg-white text-gray-500 border-gray-100 shadow-sm";
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % badgeColors.length;
  return badgeColors[index];
};

export function StaffListSection({ 
  title, 
  items, 
  isAdmin, 
  onUpdateItems,
  maxItems,
  subjectLabel,
  subjectPlaceholder,
  gradeLabel,
  gradePlaceholder,
  searchPlaceholder,
  addButtonText,
  emptyMessage,
  filterAllText,
  sortFn,
  showGradeFilter,
  badgePosition = 'bottom'
}: StaffListSectionProps) {
  const [editingItem, setEditingItem] = useState<Teacher | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [tName, setTName] = useState('');
  const [tSubject, setTSubject] = useState('');
  const [tGrade, setTGrade] = useState('');
  const [tPhoto, setTPhoto] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const uniqueSubjects = Array.from(new Set(items.map(t => t.subject))).filter(Boolean);
  const uniqueGrades = Array.from(new Set(items.map(t => t.grade)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const startEdit = (item: Teacher) => {
    setEditingItem(item);
    setTName(item.name);
    setTSubject(item.subject);
    setTGrade(item.grade);
    setTPhoto(item.photoUrl);
    setIsAdding(false);
  };

  const startAdd = () => {
    if (items.length >= maxItems) {
      alert(`Maklumat had maksimum ${maxItems} orang dalam sistem telah dicapai.`);
      return;
    }
    setEditingItem(null);
    setTName('');
    setTSubject('');
    setTGrade('');
    setTPhoto('https://i.pravatar.cc/150?img=' + (Math.floor(Math.random() * 40) + 1));
    setIsAdding(true);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleImageUploadLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Saiz gambar terlalu besar. Sila muat naik gambar kurang dari 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setTPhoto(dataUrl);
          } else {
            setTPhoto(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const saveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName || !tSubject || !tGrade) {
      alert("Sila isi semua maklumat.");
      return;
    }

    if (isAdding) {
      const newItem: Teacher = {
        id: Date.now().toString(),
        name: tName,
        subject: tSubject,
        grade: tGrade,
        photoUrl: tPhoto
      };
      onUpdateItems([...items, newItem].slice(0, maxItems));
    } else if (editingItem) {
      const updated = items.map(t => 
        t.id === editingItem.id 
          ? { ...t, name: tName, subject: tSubject, grade: tGrade, photoUrl: tPhoto }
          : t
      );
      onUpdateItems(updated);
    }

    setIsAdding(false);
    setEditingItem(null);
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = () => {
    if (deleteConfirmId) {
      const updated = items.filter(t => t.id !== deleteConfirmId);
      onUpdateItems(updated);
      setDeleteConfirmId(null);
    }
  };

  const filteredItems = items.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.grade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject ? t.subject === selectedSubject : true;
    const matchesGrade = selectedGrade ? t.grade === selectedGrade : true;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  if (sortFn) {
    filteredItems.sort(sortFn);
  } else {
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedItems = filteredItems.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100/80 mb-5">
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 flex-wrap">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2.5 flex-wrap">
              <span className="w-1.5 h-5 bg-[#fbbf24] rounded-full animate-pulse"></span>
              <span>{title} ({filteredItems.length})</span>
            </h3>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
              />
            </div>
            
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 w-full sm:w-auto"
            >
              <option value="">{filterAllText}</option>
              {uniqueSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
            
            {showGradeFilter && (
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-800 w-full sm:w-auto cursor-pointer"
              >
                <option value="">Gred: Semua</option>
                {uniqueGrades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            )}
            
            {isAdmin && (
              <button 
                type="button"
                onClick={startAdd}
                className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors border border-blue-100 shadow-sm w-full sm:w-auto"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>{addButtonText}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
          {displayedItems.map((tc) => (
            <div key={tc.id} className="bg-white border border-gray-100/60 hover:border-gray-200 rounded-[16px] p-4 flex items-center space-x-4 relative group shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all">
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 shrink-0 select-none">
                <img 
                  loading="lazy" decoding="async"
                  src={tc.photoUrl || "https://ui-avatars.com/api/?name=Staff&background=EBF4FF&color=3B82F6"} 
                  alt={tc.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full shadow-md border-2 border-white" 
                />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-[12px] font-black bg-blue-600 text-white rounded-full leading-none border-2 border-white shadow-md z-10 whitespace-nowrap">
                  {tc.grade}
                </span>
              </div>

              <div className="min-w-0 flex-1 text-left">
                {badgePosition === 'top' && (
                  <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest border px-2.5 py-0.5 rounded-full inline-block mb-1.5 ${getBadgeColor(tc.subject)}`}>
                    {tc.subject || "Tiada Maklumat"}
                  </p>
                )}
                <h5 className="font-extrabold text-[13px] sm:text-[14px] text-gray-950 line-clamp-2 leading-snug mb-1" title={tc.name}>
                  {tc.name}
                </h5>
                {badgePosition === 'bottom' && (
                  <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest border px-2.5 py-0.5 rounded-full inline-block ${getBadgeColor(tc.subject)}`}>
                    {tc.subject || "Tiada Maklumat"}
                  </p>
                )}
              </div>

              {isAdmin && (
                <div className="absolute top-2 right-2 flex items-center space-x-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-30">
                  <button 
                    type="button"
                    onClick={() => startEdit(tc)} 
                    className="p-1.5 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg border border-gray-250 shadow-sm transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => confirmDelete(tc.id)} 
                    className="p-1.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg border border-gray-255 shadow-sm transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full text-center text-sm py-12 text-gray-400">{emptyMessage}</div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center sm:justify-end mt-8 pt-6 border-t border-gray-100 relative z-10">
          <div className="flex items-center space-x-1.5 select-none">
            <button
              type="button"
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
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 bg-white shadow-sm'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

      {(isAdding || editingItem) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100">
            <h4 className="font-bold text-lg text-gray-950 mb-4">{isAdding ? addButtonText : 'Kemaskini Maklumat'}</h4>
            <form onSubmit={saveItem} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Nama</label>
                <input 
                  type="text" 
                  value={tName} 
                  onChange={(e) => setTName(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                  placeholder="Contoh: En. Ahmad"
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{subjectLabel}</label>
                  <input 
                    type="text" 
                    value={tSubject} 
                    onChange={(e) => setTSubject(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    placeholder={subjectPlaceholder}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">{gradeLabel}</label>
                  <input 
                    type="text" 
                    value={tGrade} 
                    onChange={(e) => setTGrade(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                    placeholder={gradePlaceholder}
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Gambar Pekerja</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUploadLocal} 
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <div className="flex items-center space-x-3 mt-3">
                  <img loading="lazy" decoding="async" src={tPhoto} alt="Review Avatar" className="w-12 h-12 rounded-full object-cover border" />
                  <span className="text-[11px] font-medium text-gray-400">Gambar yang dimuat naik atau auto-rawak</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t mt-4">
                <button 
                  type="button" 
                  onClick={cancelForm}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h4 className="font-bold text-lg text-gray-950 mb-2">Padam Rekod rekod</h4>
            <p className="text-sm text-gray-600 mb-6">Adakah anda pasti mahu memadam maklumat ini secara kekal? Tindakan ini tidak boleh diundur.</p>
            <div className="flex items-center justify-center space-x-3 w-full">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-sm shadow-red-600/20"
              >
                Padam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
