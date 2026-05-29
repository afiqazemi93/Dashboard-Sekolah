import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Archive, 
  ExternalLink, 
  ImagePlus,
  LayoutGrid,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Mars,
  Venus,
  ArrowRight,
  Monitor,
  Library,
  HandHeart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SchoolDetails, Panitia, PanitiaMember, KurikulumData } from '../types';
import { uploadBase64ToStorage } from '../supabase';

interface KurikulumViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave: (details: SchoolDetails) => void;
  activeTab?: SubTabId;
}

type SubTabId = 'panitia' | 'ppki_pemulihan' | 'uasa_pbd';

const PANITIA_DEFAULTS = [
  { name: 'Bahasa Melayu', color: '#3b82f6' },
  { name: 'Bahasa Inggeris', color: '#10b981' },
  { name: 'Matematik', color: '#f59e0b' },
  { name: 'Sains', color: '#6366f1' },
  { name: 'Pendidikan Islam', color: '#16a34a' },
  { name: 'Pendidikan Moral', color: '#ec4899' },
  { name: 'Sejarah', color: '#9333ea' },
  { name: 'RBT', color: '#f97316' },
  { name: 'Pendidikan Seni Visual', color: '#ef4444' },
  { name: 'Pendidikan Muzik', color: '#14b8a6' },
  { name: 'Pendidikan Jasmani & Kesihatan', color: '#06b6d4' },
  { name: 'Bahasa Arab', color: '#8b5cf6' },
  { name: 'Bahasa Cina', color: '#be123c' },
  { name: 'Bahasa Tamil', color: '#4338ca' },
];

export function KurikulumView({ details, isAdmin, onSave, activeTab = 'panitia' }: KurikulumViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'archived'>('active');
  
  // Modals state
  const [isPanitiaModalOpen, setIsPanitiaModalOpen] = useState(false);
  const [editingPanitia, setEditingPanitia] = useState<Panitia | null>(null);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [selectedPanitiaForOrg, setSelectedPanitiaForOrg] = useState<Panitia | null>(null);
  const [isTeacherSelectModalOpen, setIsTeacherSelectModalOpen] = useState(false);
  const [memberRoleToAssign, setMemberRoleToAssign] = useState<PanitiaMember['role']>('Guru Panitia');

  const allAvailableTeachers = useMemo(() => {
    return [...(details.pentadbirs || []), ...(details.teachers || [])];
  }, [details.pentadbirs, details.teachers]);

  const kurikulumData: KurikulumData = details.kurikulumData || {
    panitiaList: PANITIA_DEFAULTS.map(p => ({
      id: Math.random().toString(36).substring(2, 9),
      name: p.name,
      slug: p.name.toLowerCase().replace(/\s+/g, '-'),
      color: p.color,
      members: []
    })),
    simpUrl: 'https://simp.moe.gov.my',
    simpButtonLabel: 'Buka Sistem SIMP'
  };

  const filteredPanitia = useMemo(() => {
    return kurikulumData.panitiaList.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' 
        ? true 
        : filterType === 'archived' ? p.isArchived : !p.isArchived;
      return matchesSearch && matchesFilter;
    });
  }, [kurikulumData.panitiaList, searchQuery, filterType]);

  const stats = useMemo(() => {
    const active = kurikulumData.panitiaList.filter(p => !p.isArchived);
    const totalMembers = active.reduce((acc, p) => acc + p.members.length, 0);
    const ketuaCount = active.reduce((acc, p) => acc + p.members.filter(m => m.role === 'Ketua Panitia').length, 0);
    
    return {
      totalPanitia: active.length,
      totalMembers,
      ketuaCount
    };
  }, [kurikulumData.panitiaList]);

  const handleSavePanitia = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    let newList = [...kurikulumData.panitiaList];
    if (editingPanitia) {
      newList = newList.map(p => p.id === editingPanitia.id ? { ...p, name, color, slug } : p);
    } else {
      newList.push({
        id: Math.random().toString(36).substring(2, 9),
        name,
        slug,
        color,
        members: []
      });
    }

    onSave({
      ...details,
      kurikulumData: { ...kurikulumData, panitiaList: newList }
    });
    setIsPanitiaModalOpen(false);
    setEditingPanitia(null);
  };

  const handleDeletePanitia = (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam panitia ini?')) return;
    const newList = kurikulumData.panitiaList.filter(p => p.id !== id);
    onSave({
      ...details,
      kurikulumData: { ...kurikulumData, panitiaList: newList }
    });
  };

  const handleArchivePanitia = (id: string) => {
    const newList = kurikulumData.panitiaList.map(p => 
      p.id === id ? { ...p, isArchived: !p.isArchived } : p
    );
    onSave({
      ...details,
      kurikulumData: { ...kurikulumData, panitiaList: newList }
    });
  };

  const handleUpdateOrg = (panitiaId: string, members: PanitiaMember[]) => {
    const newList = kurikulumData.panitiaList.map(p => 
      p.id === panitiaId ? { ...p, members } : p
    );
    onSave({
      ...details,
      kurikulumData: { ...kurikulumData, panitiaList: newList }
    });
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const url = await uploadBase64ToStorage(`kurikulum/uasa_banner_${Date.now()}.webp`, base64);
      onSave({
        ...details,
        kurikulumData: { ...kurikulumData, uasaPbdBannerUrl: url }
      });
    };
    reader.readAsDataURL(file);
  };

  const renderPanitiaTab = () => (
    <div className="space-y-8">
      {/* Analytics Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-200/50 relative overflow-hidden group"
        >
          <div className="absolute top-[-10%] right-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-500">
            <LayoutGrid className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Jumlah Panitia</p>
              <h3 className="text-4xl font-black">{stats.totalPanitia}</h3>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
              <TrendingUp className="w-3 h-3" />
              <span>AKTIF</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden group"
        >
          <div className="absolute top-[-10%] right-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-500">
            <UserCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Jumlah Ketua Panitia</p>
              <h3 className="text-4xl font-black">{stats.ketuaCount}</h3>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
              <Users className="w-3 h-3" />
              <span>DILANTIK</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-[2rem] p-6 text-white shadow-xl shadow-purple-200/50 relative overflow-hidden group"
        >
          <div className="absolute top-[-10%] right-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Jumlah Guru Panitia</p>
              <h3 className="text-4xl font-black">{stats.totalMembers}</h3>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
              <TrendingUp className="w-3 h-3" />
              <span>BERDAFTAR</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-sm z-20">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari panitia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsPanitiaModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <Plus className="w-5 h-5" />
            Tambah Panitia
          </button>
        )}
      </div>

      {/* Panitia Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPanitia.map((p) => (
            <motion.div
              layout
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5 }}
              className="group bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-blue-500/10 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                {isAdmin && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingPanitia(p); setIsPanitiaModalOpen(true); }}
                      className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleArchivePanitia(p.id); }}
                      className="w-8 h-8 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center hover:bg-amber-600 hover:text-white transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform border-4 border-white"
                style={{ backgroundColor: p.color }}
              >
                <BookOpen className="w-7 h-7 text-white" />
              </div>

              <h4 className="text-lg font-black text-slate-800 mb-1 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.name}</h4>
              <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">{p.slug}</p>

              <div className="space-y-4 mb-6">
                {(p.members.filter(m => m.role === 'Ketua Panitia') as PanitiaMember[]).map(m => (
                  <div key={m.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-white shrink-0">
                      {m.photoUrl ? (
                         <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600">
                           <Users className="w-5 h-5" />
                         </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Ketua Panitia</p>
                      <p className="text-xs font-black text-slate-800 uppercase truncate">{m.name}</p>
                    </div>
                  </div>
                ))}

                {(p.members.filter(m => m.role === 'Setiausaha') as PanitiaMember[]).map(m => (
                  <div key={m.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-white shrink-0">
                      {m.photoUrl ? (
                         <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                           <Users className="w-5 h-5" />
                         </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Setiausaha</p>
                      <p className="text-xs font-black text-slate-800 uppercase truncate">{m.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { setSelectedPanitiaForOrg(p); setIsOrgModalOpen(true); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all group/btn"
              >
                Lihat Organisasi
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredPanitia.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <LayoutGrid className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">Tiada Panitia Dijumpai</h3>
          <p className="text-slate-400 max-w-xs text-sm">Sila cuba carian lain atau tambah panitia baharu.</p>
        </motion.div>
      )}
    </div>
  );

  const renderPpkiTab = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-white/50 border border-white/20 backdrop-blur-xl rounded-[3rem] shadow-xl shadow-slate-200/20">
      <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse border-8 border-white">
        <Users className="w-10 h-10" />
      </div>
      <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Data Murid PPKI & Pemulihan</h3>
      <p className="text-slate-500 max-w-md mx-auto leading-relaxed px-6">
        Bahagian ini akan dikemaskini dengan maklumat terperinci mengenai program pendidikan khas integrasi dan kelas pemulihan khas.
      </p>
    </div>
  );

  const renderUasaTab = () => {
    const banner = kurikulumData.uasaPbdBannerUrl;
    
    return (
      <div className="space-y-8">
        {/* Banner Section - Full width for all */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/20"
        >
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {isAdmin && (
              <label className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer">
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                <ImagePlus className="w-4 h-4" />
                Tukar Banner
              </label>
            )}
          </div>

          <div className="relative group bg-slate-50 min-h-[300px] flex items-center justify-center">
            {banner ? (
              <img src={banner} alt="Banner UASA & PBD" className="w-full h-auto object-contain max-h-[600px]" />
            ) : (
              <div className="flex flex-col items-center gap-4 py-20 text-slate-300">
                <ImagePlus className="w-20 h-20" />
                <p className="font-black text-sm uppercase tracking-widest">Tiada Banner Ditetapkan</p>
              </div>
            )}
          </div>

          <div className="p-10 bg-slate-50/50 flex flex-col items-center gap-6 border-t border-slate-100">
            <div className="text-center max-w-2xl">
              <h4 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Sistem Integrasi Pengurusan Akademik (SIMP)</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Platform berpusat untuk pengurusan data Ujian Akhir Sesi Akademik (UASA) dan Pentaksiran Bilik Darjah (PBD). Sila klik butang di bawah untuk akses terus ke portal.
              </p>
            </div>
            
            <a 
              href={kurikulumData.simpUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 py-5 px-12 bg-slate-900 hover:bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-[0.15em] transition-all transform hover:-translate-y-1 active:translate-y-0 shadow-2xl shadow-slate-400/30 group"
            >
              {kurikulumData.simpButtonLabel}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            {isAdmin && (
              <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label Butang</label>
                  <input 
                    type="text" 
                    value={kurikulumData.simpButtonLabel}
                    onChange={(e) => onSave({
                      ...details,
                      kurikulumData: { ...kurikulumData, simpButtonLabel: e.target.value }
                    })}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Contoh: Buka Sistem SIMP"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Pautan</label>
                  <input 
                    type="text" 
                    value={kurikulumData.simpUrl}
                    onChange={(e) => onSave({
                      ...details,
                      kurikulumData: { ...kurikulumData, simpUrl: e.target.value }
                    })}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'ppki_pemulihan':
        return {
          title: 'PPKI & Pemulihan',
          subtitle: 'PENGURUSAN PENDIDIKAN KHAS & PEMULIHAN KHAS',
          icon: HandHeart
        };
      case 'uasa_pbd':
        return {
          title: 'UASA & PBD',
          subtitle: 'PENTAKSIRAN BILIK DARJAH & AKADEMIK',
          icon: BarChart3
        };
      default:
        return {
          title: 'Pengurusan Panitia',
          subtitle: 'HUB PENGURUSAN AKADEMIK & PANITIA',
          icon: Library
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <div className="pb-20 w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 mt-2">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-[1.75rem] flex items-center justify-center shadow-xl shadow-slate-200/50">
            <HeaderIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{headerInfo.title}</h1>
            <p className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
              {headerInfo.subtitle}
            </p>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.3 }}
          className="min-h-[500px]"
        >
          {activeTab === 'panitia' && renderPanitiaTab()}
          {activeTab === 'ppki_pemulihan' && renderPpkiTab()}
          {activeTab === 'uasa_pbd' && renderUasaTab()}
        </motion.div>
      </AnimatePresence>

      {/* Panitia Add/Edit Modal */}
      {isPanitiaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingPanitia ? 'Edit Panitia' : 'Tambah Panitia'}</h3>
              <button 
                onClick={() => { setIsPanitiaModalOpen(false); setEditingPanitia(null); }}
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all font-bold"
              >✕</button>
            </div>
            <form onSubmit={handleSavePanitia} className="p-10 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Panitia</label>
                <input 
                  name="name"
                  defaultValue={editingPanitia?.name || ''}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="Contoh: Bahasa Melayu"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warna Tema</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', 
                    '#06b6d4', '#14b8a6', '#f97316', '#6366f1', '#16a34a', '#be123c'
                  ].map(color => (
                    <label key={color} className="relative cursor-pointer group">
                      <input type="radio" name="color" value={color} defaultChecked={editingPanitia?.color === color} className="sr-only peer" />
                      <div 
                        className="w-full h-10 rounded-xl border-4 border-transparent peer-checked:border-slate-800 peer-checked:scale-110 transition-all shadow-sm group-hover:scale-105"
                        style={{ backgroundColor: color }}
                      ></div>
                    </label>
                  ))}
                </div>
              </div>
              <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-200 mt-4">
                {editingPanitia ? 'SIMPAN PERUBAHAN' : 'TAMBAH SEKARANG'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Organization Modal */}
      {isOrgModalOpen && selectedPanitiaForOrg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#f9fafb] rounded-[3rem] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white relative">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3" style={{ backgroundColor: selectedPanitiaForOrg.color }}>
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase">{selectedPanitiaForOrg.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">JUMLAH AHLI: {selectedPanitiaForOrg.members.length}</p>
                  </div>
               </div>
              <button 
                onClick={() => { setIsOrgModalOpen(false); setSelectedPanitiaForOrg(null); }}
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all font-bold"
              >✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
               {/* Org Chart Area */}
               <section>
                  <div className="flex flex-col items-center gap-6">
                    {/* Ketua */}
                    <div className="w-full flex justify-center">
                       {(selectedPanitiaForOrg.members.filter(m => m.role === 'Ketua Panitia') as PanitiaMember[]).length > 0 ? (
                         (selectedPanitiaForOrg.members.filter(m => m.role === 'Ketua Panitia') as PanitiaMember[]).map(m => (
                            <OrgCard key={m.id} member={m} panitiaColor={selectedPanitiaForOrg.color} onRemove={() => {
                              const newMembers = selectedPanitiaForOrg.members.filter(mem => mem.id !== m.id);
                              handleUpdateOrg(selectedPanitiaForOrg.id, newMembers);
                              setSelectedPanitiaForOrg({...selectedPanitiaForOrg, members: newMembers});
                            }} isAdmin={isAdmin} />
                         ))
                       ) : (
                         <div className="p-6 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center w-full max-w-xs bg-slate-50/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ketua Panitia</p>
                            <p className="text-[10px] text-slate-300 font-bold uppercase transition-spacing tracking-tighter">BELUM DITETAPKAN</p>
                         </div>
                       )}
                    </div>

                    <div className="h-6 w-0.5 bg-slate-200"></div>

                    {/* Setiausaha */}
                    <div className="w-full flex justify-center">
                       {(selectedPanitiaForOrg.members.filter(m => m.role === 'Setiausaha') as PanitiaMember[]).length > 0 ? (
                         (selectedPanitiaForOrg.members.filter(m => m.role === 'Setiausaha') as PanitiaMember[]).map(m => (
                            <OrgCard key={m.id} member={m} panitiaColor={selectedPanitiaForOrg.color} onRemove={() => {
                              const newMembers = selectedPanitiaForOrg.members.filter(mem => mem.id !== m.id);
                              handleUpdateOrg(selectedPanitiaForOrg.id, newMembers);
                              setSelectedPanitiaForOrg({...selectedPanitiaForOrg, members: newMembers});
                            }} isAdmin={isAdmin} />
                         ))
                       ) : (
                         <div className="p-6 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center w-full max-w-xs bg-slate-50/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Setiausaha</p>
                            <p className="text-[10px] text-slate-300 font-bold uppercase transition-spacing tracking-tighter">BELUM DITETAPKAN</p>
                         </div>
                       )}
                    </div>

                    <div className="h-6 w-0.5 bg-slate-200"></div>

                    {/* AJK / Guru */}
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                        {(selectedPanitiaForOrg.members.filter(m => !['Ketua Panitia', 'Setiausaha'].includes(m.role)) as PanitiaMember[]).map(m => (
                          <OrgCard key={m.id} member={m} panitiaColor={selectedPanitiaForOrg.color} onRemove={() => {
                            const newMembers = selectedPanitiaForOrg.members.filter(mem => mem.id !== m.id);
                            handleUpdateOrg(selectedPanitiaForOrg.id, newMembers);
                            setSelectedPanitiaForOrg({...selectedPanitiaForOrg, members: newMembers});
                          }} isAdmin={isAdmin} isSmall />
                        ))}
                        {isAdmin && (
                            (['Ketua Panitia', 'Setiausaha', 'Guru Panitia'] as const)
                              .filter(role => {
                                if (role === 'Guru Panitia') return true;
                                return !selectedPanitiaForOrg.members.some(m => m.role === role);
                              })
                              .map(role => (
                                <button 
                                  key={role}
                                  onClick={() => {
                                    setMemberRoleToAssign(role);
                                    setIsTeacherSelectModalOpen(true);
                                  }}
                                  className="p-4 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-[2rem] text-center flex flex-col items-center justify-center gap-1 hover:bg-blue-50/30 transition-all cursor-pointer group w-32 sm:w-40"
                                >
                                  <div className="w-6 h-6 bg-slate-100 group-hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                                    <Plus className="w-3 h-3 text-slate-400 group-hover:text-white" />
                                  </div>
                                  <p className="text-[8px] font-black text-slate-400 group-hover:text-blue-600 uppercase tracking-widest leading-tight">Tambah {role}</p>
                                </button>
                              ))
                        )}
                    </div>
                  </div>
               </section>
            </div>
          </motion.div>
        </div>
      )}
      {/* Teacher Selection Modal */}
      {isTeacherSelectModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Pilih Guru</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Jawatan: {memberRoleToAssign}</p>
              </div>
              <button 
                onClick={() => { setIsTeacherSelectModalOpen(false); }}
                className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all font-bold"
              >✕</button>
            </div>
            
            <div className="p-6 border-b border-slate-100 bg-white">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Cari nama guru..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-sm"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allAvailableTeachers
                .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (!selectedPanitiaForOrg) return;
                      const newMember: PanitiaMember = {
                        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        name: t.name,
                        role: memberRoleToAssign as any,
                        gender: 'Lelaki', 
                        photoUrl: t.photoUrl
                      };
                      const newMembers = [...selectedPanitiaForOrg.members, newMember];
                      handleUpdateOrg(selectedPanitiaForOrg.id, newMembers);
                      setSelectedPanitiaForOrg({...selectedPanitiaForOrg, members: newMembers});
                      setIsTeacherSelectModalOpen(false);
                    }}
                    className="flex items-center gap-4 p-4 rounded-[2.5rem] border border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md group-hover:scale-110 transition-transform bg-slate-100">
                      {t.photoUrl ? (
                        <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight uppercase line-clamp-1">{t.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{t.subject || 'GURU'}</p>
                    </div>
                  </button>
                ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

interface OrgCardProps {
  key?: string;
  member: PanitiaMember;
  panitiaColor: string;
  onRemove: () => void;
  isAdmin: boolean;
  isSmall?: boolean;
}

function OrgCard({ member, panitiaColor, onRemove, isAdmin, isSmall }: OrgCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white shadow-xl shadow-slate-200/20 border border-slate-100 flex flex-col items-center text-center relative group ${isSmall ? 'rounded-[2rem] p-4 w-32 sm:w-40' : 'rounded-[2.5rem] p-6 w-full max-w-xs'}`}
    >
      {isAdmin && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className={`absolute bg-slate-50 text-slate-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all ${isSmall ? 'top-2 right-2 w-6 h-6' : 'top-4 right-4 w-8 h-8'}`}
        >
          <Trash2 className={isSmall ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </button>
      )}
      
      <div 
        className={`rounded-3xl overflow-hidden shadow-lg border-4 border-white flex items-center justify-center bg-slate-100 ${isSmall ? 'w-14 h-14 mb-2' : 'w-20 h-20 mb-4'}`}
      >
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <Users className={isSmall ? "w-8 h-8 text-slate-300" : "w-10 h-10 text-slate-300"} />
        )}
      </div>

      <h5 className={`${isSmall ? 'text-[11px]' : 'text-sm'} font-black text-slate-800 leading-tight mb-1 uppercase tracking-tight line-clamp-2`}>{member.name}</h5>
      <div className="flex flex-col gap-1 items-center">
        <span 
          className={`${isSmall ? 'text-[8px] px-2 py-0.5' : 'text-[10px] px-3 py-1'} font-black uppercase tracking-widest rounded-full border`}
          style={{ borderColor: `${panitiaColor}30`, color: panitiaColor, backgroundColor: `${panitiaColor}10` }}
        >
          {member.role}
        </span>
      </div>
    </motion.div>
  );
}
