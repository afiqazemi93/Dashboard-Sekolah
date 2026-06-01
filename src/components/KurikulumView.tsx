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
  HandHeart,
  ChevronLeft,
  X,
  MoveUp,
  MoveDown,
  MoveLeft,
  MoveRight,
  Loader2,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SchoolDetails, Panitia, PanitiaMember, KurikulumData } from '../types';
import { uploadBase64ToStorage, uploadRawFileToStorage } from '../supabase';

import { PpkiPemulihanView } from './PpkiPemulihanView';

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
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [memberRoleToAssign, setMemberRoleToAssign] = useState<PanitiaMember['role']>('Guru Panitia');
  
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState<number | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  const allAvailableTeachers = useMemo(() => {
    return [...(details.pentadbirs || []), ...(details.teachers || [])];
  }, [details.pentadbirs, details.teachers]);

  const rawKurikulumData = details.kurikulumData || {
    panitiaList: PANITIA_DEFAULTS.map(p => ({
      id: Math.random().toString(36).substring(2, 9),
      name: p.name,
      slug: p.name.toLowerCase().replace(/\s+/g, '-'),
      color: p.color,
      members: []
    })),
    simpUrl: 'https://simp.moe.gov.my',
    simpButtonLabel: 'Pergi ke Aplikasi'
  };

  const kurikulumData: KurikulumData = {
    ...rawKurikulumData,
    simpButtonLabel: (!rawKurikulumData.simpButtonLabel || rawKurikulumData.simpButtonLabel === 'Buka Sistem SIMP')
      ? 'Pergi ke Aplikasi'
      : rawKurikulumData.simpButtonLabel
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

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingScreenshot(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Ensure original quality by using raw function
        const url = await uploadRawFileToStorage(`kurikulum/uasa_screenshot_${Date.now()}_${i}.${file.type.split('/')[1] || 'jpg'}`, file);
        newUrls.push(url);
      }
      
      const currentScreenshots = kurikulumData.uasaPbdScreenshots || [];
      onSave({
        ...details,
        kurikulumData: { 
          ...kurikulumData, 
          uasaPbdScreenshots: [...currentScreenshots, ...newUrls] 
        }
      });
      setUploadErrorMsg(null);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (errMsg.toLowerCase().includes('security policy')) {
        setUploadErrorMsg("Ralat Sekuriti (RLS). Sila salin skrip SQL di panel utama sistem untuk cipta & benarkan akses kepada Bucket 'school_media' dalam Supabase anda.");
      } else {
        setUploadErrorMsg(`Gagal memuat naik imej: ${errMsg}`);
      }
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  const handleDeleteScreenshot = (index: number) => {
    if (!confirm("Adakah anda pasti untuk memadam imej ini?")) return;
    
    const currentScreenshots = kurikulumData.uasaPbdScreenshots || [];
    const newScreenshots = [...currentScreenshots];
    newScreenshots.splice(index, 1);
    
    onSave({
      ...details,
      kurikulumData: { 
        ...kurikulumData, 
        uasaPbdScreenshots: newScreenshots 
      }
    });
  };

  const handleReorderScreenshot = (index: number, direction: 'up' | 'down') => {
    const currentScreenshots = kurikulumData.uasaPbdScreenshots || [];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentScreenshots.length - 1) return;
    
    const newScreenshots = [...currentScreenshots];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newScreenshots[index];
    newScreenshots[index] = newScreenshots[swapIndex];
    newScreenshots[swapIndex] = temp;
    
    onSave({
      ...details,
      kurikulumData: { 
        ...kurikulumData, 
        uasaPbdScreenshots: newScreenshots 
      }
    });
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
              <div className="absolute top-0 right-0 p-4 flex gap-2 translate-y-0 lg:translate-y-[-10px] lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all">
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
            <div></div>
            
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
              <h4 className="text-xl font-black text-slate-800 mb-2 tracking-tight uppercase">
                Sistem Integrasi Markah & PBD (SIMP)<br />
                <span className="text-blue-600">SK Batu Lanchang</span>
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                Platform digital pintar yang mengintegrasikan pengurusan markah, Tahap Penguasaan (TP) dan analitik prestasi murid dalam satu sistem bersepadu. Sila klik butang di bawah untuk akses terus ke portal.
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
                    placeholder="Contoh: Pergi ke Aplikasi"
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

        {/* Tangkap Layar Aplikasi Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/20"
        >
          <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Tangkap Layar Aplikasi</h3>
            </div>
            
            {isAdmin && (
              <label className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-blue-200 disabled:opacity-50">
                <input type="file" accept="image/jpeg, image/png, image/webp" multiple onChange={handleScreenshotUpload} className="hidden" disabled={isUploadingScreenshot} />
                {isUploadingScreenshot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isUploadingScreenshot ? 'Memuat Naik...' : 'Tambah Imej'}
              </label>
            )}
          </div>

          {uploadErrorMsg && (
            <div className="mx-8 mt-6 p-5 bg-red-50 border border-red-200 rounded-3xl text-red-700 flex flex-col gap-3 shadow-md">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex flex-col gap-1 w-full">
                  <span className="font-bold">{uploadErrorMsg}</span>
                  {uploadErrorMsg.includes('Sekuriti') && (
                    <div className="mt-2 text-xs bg-white border border-red-100 p-4 rounded-xl flex flex-col gap-2">
                       <p className="font-semibold text-slate-700">Skrip Penyelesaian (Salin & laksanakan di SQL Editor Supabase anda):</p>
                       <pre className="font-mono bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto text-[10px] sm:text-xs">
{`insert into storage.buckets (id, name, public) values ('school_media', 'school_media', true) on conflict (id) do update set public = true;
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Insert" on storage.objects;
drop policy if exists "Public Update" on storage.objects;
drop policy if exists "Public Delete" on storage.objects;
create policy "Public Access" on storage.objects for select to public using ( bucket_id = 'school_media' );
create policy "Public Insert" on storage.objects for insert to public with check ( bucket_id = 'school_media' );
create policy "Public Update" on storage.objects for update to public using ( bucket_id = 'school_media' );
create policy "Public Delete" on storage.objects for delete to public using ( bucket_id = 'school_media' );`}
                       </pre>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setUploadErrorMsg(null)}
                  className="ml-auto text-red-400 hover:text-red-700 font-black p-1 hover:bg-red-100 rounded-lg transition-colors"
                >✕</button>
              </div>
            </div>
          )}

          <div className="p-8 sm:p-10 bg-slate-50/50">
            {(!kurikulumData.uasaPbdScreenshots || kurikulumData.uasaPbdScreenshots.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                {isUploadingScreenshot ? (
                  <div className="flex flex-col items-center animate-pulse">
                    <Loader2 className="w-16 h-16 animate-spin mb-4 text-slate-300" />
                    <p className="font-bold text-sm uppercase tracking-widest">Sedang Memuat Naik...</p>
                  </div>
                ) : (
                  <>
                    <ImagePlus className="w-20 h-20 mb-4 opacity-50" />
                    <p className="font-black text-sm uppercase tracking-widest">Tiada tangkap layar aplikasi tersedia</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                 {kurikulumData.uasaPbdScreenshots.map((url, idx) => (
                   <div key={url + idx} className="relative group w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-white">
                     <img 
                       src={url} 
                       alt={`Tangkap Layar ${idx + 1}`} 
                       loading="lazy"
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                     />
                     
                     {/* User Hover to fullscreen */}
                     <button 
                       onClick={() => setActiveScreenshotIndex(idx)}
                       className="absolute inset-0 bg-slate-900/0 hover:bg-slate-900/20 transition-all flex items-center justify-center z-10"
                     >
                       <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                         <Maximize2 className="w-8 h-8" />
                       </div>
                     </button>

                     {/* Admin Controls Layer */}
                     {isAdmin && (
                       <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="flex flex-col gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-slate-200">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleReorderScreenshot(idx, 'up'); }}
                             disabled={idx === 0}
                             className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                           >
                             <MoveLeft className="w-4 h-4 hidden sm:block" />
                             <MoveUp className="w-4 h-4 block sm:hidden" />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleReorderScreenshot(idx, 'down'); }}
                             disabled={idx === kurikulumData.uasaPbdScreenshots!.length - 1}
                             className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                           >
                             <MoveRight className="w-4 h-4 hidden sm:block" />
                             <MoveDown className="w-4 h-4 block sm:hidden" />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteScreenshot(idx); }}
                             className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       </div>
                     )}
                     
                     <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-slate-900/60 font-mono text-[10px] font-bold text-white/90 rounded-full tracking-widest backdrop-blur-md">
                       {idx + 1} / {kurikulumData.uasaPbdScreenshots.length}
                     </div>
                   </div>
                 ))}
                 
                 {isUploadingScreenshot && (
                   <div className="w-full aspect-[4/3] sm:aspect-video rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-white flex flex-col items-center justify-center animate-pulse">
                     <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                     <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center px-4">Memuat Naik...</p>
                   </div>
                 )}
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
          icon: HandHeart,
          colorClasses: 'bg-blue-50 border-blue-100 text-blue-600'
        };
      case 'uasa_pbd':
        return {
          title: 'UASA & PBD',
          icon: BarChart3,
          colorClasses: 'bg-blue-50 border-blue-100 text-blue-600'
        };
      default:
        return {
          title: 'Pengurusan Panitia',
          icon: Library,
          colorClasses: 'bg-blue-50 border-blue-100 text-blue-600'
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <div className="pb-20 w-full">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mb-8">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${headerInfo.colorClasses}`}>
            <HeaderIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{headerInfo.title}</h2>
          </div>
        </div>
      </div>

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
          {activeTab === 'ppki_pemulihan' && <PpkiPemulihanView details={details} isAdmin={isAdmin} onSave={onSave} />}
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
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allAvailableTeachers
                .filter(t => t.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()))
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
                      setTeacherSearchQuery('');
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

       {/* Screenshot Lightbox Modal */}
       <AnimatePresence>
         {activeScreenshotIndex !== null && kurikulumData.uasaPbdScreenshots && kurikulumData.uasaPbdScreenshots.length > 0 && (
           <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 bg-slate-950/95 backdrop-blur-2xl">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="relative w-full h-full max-w-7xl flex flex-col items-center justify-center"
             >
               <button 
                 onClick={() => setActiveScreenshotIndex(null)}
                 className="absolute top-0 right-0 sm:top-4 sm:right-4 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md"
               >
                 <X className="w-6 h-6" />
               </button>

               {/* Prev Button */}
               {activeScreenshotIndex > 0 && (
                 <button 
                   onClick={() => setActiveScreenshotIndex(activeScreenshotIndex - 1)}
                   className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md hidden sm:flex"
                 >
                   <ChevronLeft className="w-6 h-6" />
                 </button>
               )}

               {/* Next Button */}
               {activeScreenshotIndex < kurikulumData.uasaPbdScreenshots.length - 1 && (
                 <button 
                   onClick={() => setActiveScreenshotIndex(activeScreenshotIndex + 1)}
                   className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-md hidden sm:flex"
                 >
                   <ChevronRight className="w-6 h-6" />
                 </button>
               )}

               <div className="w-full h-full max-h-[85vh] flex items-center justify-center relative touch-pan-x cursor-pointer"
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const width = rect.width;
                      if (x < width / 3 && activeScreenshotIndex > 0) {
                        setActiveScreenshotIndex(activeScreenshotIndex - 1);
                      } else if (x > (2 * width) / 3 && activeScreenshotIndex < kurikulumData.uasaPbdScreenshots!.length - 1) {
                        setActiveScreenshotIndex(activeScreenshotIndex + 1);
                      } else {
                        setActiveScreenshotIndex(null);
                      }
                    }}
               >
                 <img 
                   src={kurikulumData.uasaPbdScreenshots[activeScreenshotIndex]} 
                   alt={`Screenshot ${activeScreenshotIndex + 1}`} 
                   className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-2xl select-none"
                 />
               </div>
               
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/60 font-mono text-xs font-bold text-white/70 rounded-full tracking-widest backdrop-blur-md border border-white/10">
                 {activeScreenshotIndex + 1} / {kurikulumData.uasaPbdScreenshots.length}
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
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
          className={`absolute bg-slate-50 text-slate-400 rounded-full flex items-center justify-center lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all ${isSmall ? 'top-2 right-2 w-6 h-6' : 'top-4 right-4 w-8 h-8'}`}
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
