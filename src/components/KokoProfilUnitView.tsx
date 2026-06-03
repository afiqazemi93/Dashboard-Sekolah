import React, { useState, useMemo } from 'react';
import { SchoolDetails, Teacher, KokoUnit, KategoriKoko } from '../types';
import { Plus, Edit2, Trash2, Search, Users, Tent, Medal, Lightbulb, UserCheck, Shield, ChevronDown, Check, MapPin } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave: (details: SchoolDetails) => void;
}

const CATEGORIES: KategoriKoko[] = ['Badan Beruniform', 'Kelab & Persatuan', 'Sukan & Permainan'];

const CategoryIcons: Record<KategoriKoko, React.ElementType> = {
  'Badan Beruniform': Tent,
  'Kelab & Persatuan': Lightbulb,
  'Sukan & Permainan': Medal,
};

export function KokoProfilUnitView({ details, isAdmin, onSave }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<KategoriKoko>('Badan Beruniform');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingUnit, setEditingUnit] = useState<KokoUnit | null>(null);

  const units = details.kokoUnits || [];
  const allStaff = [...(details.pentadbirs || []), ...(details.teachers || [])]; 

  // Filter units
  const filteredUnits = units.filter(u => {
    const matchCat = u.kategori === activeCategory;
    const matchSearch = u.nama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const getStaff = (id?: string) => allStaff.find(s => s.id === id);

  const handleSaveUnit = (unit: KokoUnit) => {
    let newUnits = [...units];
    if (editingUnit && units.find(u => u.id === unit.id)) {
      newUnits = newUnits.map(u => u.id === unit.id ? unit : u);
    } else {
      newUnits.push(unit);
    }
    onSave({ ...details, kokoUnits: newUnits });
    setIsEditing(false);
    setEditingUnit(null);
  };

  const handleDeleteUnit = (id: string) => {
    if (confirm("Adakah anda pasti untuk memadam unit ini?")) {
      const newUnits = units.filter(u => u.id !== id);
      onSave({ ...details, kokoUnits: newUnits });
    }
  };

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center sm:items-center bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Profil Unit Kokurikulum
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingUnit({
                    id: String(Date.now()),
                    kategori: activeCategory,
                    nama: '',
                    ketuaId: '',
                    penolongId: '',
                    ahliIds: [],
                    tempatPerjumpaan: ''
                  });
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Unit
              </button>
            )}
          </div>
        </div>

        {/* Tab & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200/60 p-1 shrink-0 overflow-x-auto hide-scrollbar">
            {CATEGORIES.map(cat => {
              const Icon = CategoryIcons[cat];
              const isCatActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    isCatActive 
                      ? "bg-[#bc1437] text-white shadow-md shadow-[#bc1437]/10" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon className={clsx("w-4 h-4", isCatActive ? "text-white" : "text-slate-400")} />
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Cari nama unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200/60 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUnits.length > 0 ? (
            filteredUnits.map(unit => {
              const ketua = getStaff(unit.ketuaId);
              const penolong = getStaff(unit.penolongId);
              const ahli = unit.ahliIds.map(id => getStaff(id)).filter(Boolean) as Teacher[];
              const CatIcon = CategoryIcons[unit.kategori];

              return (
                <div key={unit.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 relative group hover:shadow-md transition-all">
                  
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingUnit(unit); setIsEditing(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteUnit(unit.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4 pr-16">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {unit.logoUrl ? (
                        <img src={unit.logoUrl} alt="Logo" className="w-full h-full object-contain bg-white p-1" />
                      ) : (
                        <CatIcon className="w-6 h-6 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight line-clamp-2">{unit.nama}</h3>
                      {unit.tempatPerjumpaan && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate">{unit.tempatPerjumpaan}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">Ketua Guru Penasihat</div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {ketua?.photoUrl ? (
                            <img src={ketua.photoUrl} alt="Ketua" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                              <Shield className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-700 truncate">{ketua?.name || <span className="text-slate-400 italic font-medium">Belum Ditetapkan</span>}</div>
                      </div>
                    </div>

                    {unit.penolongId && (
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">Penolong</div>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                            {penolong?.photoUrl ? (
                              <img src={penolong.photoUrl} alt="Penolong" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="text-xs font-semibold text-slate-600 truncate">{penolong?.name || "-"}</div>
                        </div>
                      </div>
                    )}

                    {ahli.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">Guru Penasihat ({ahli.length})</div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {ahli.map(a => (
                            <div key={a.id} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 rounded-lg p-1.5 transition-colors hover:bg-slate-100">
                              <div className="w-7 h-7 rounded-md bg-white overflow-hidden border border-slate-200 shrink-0">
                                {a.photoUrl ? (
                                  <img src={a.photoUrl} alt={a.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-slate-700 leading-tight block">{a.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Tent className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-500">Tiada rekod {activeCategory.toLowerCase()} ditemui.</p>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingUnit({
                      id: String(Date.now()),
                      kategori: activeCategory,
                      nama: '',
                      ketuaId: '',
                      penolongId: '',
                      ahliIds: [],
                      tempatPerjumpaan: ''
                    });
                    setIsEditing(true);
                  }}
                  className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  + Tambah Rekod Baru
                </button>
              )}
            </div>
          )}
        </div>

      {isEditing && editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          onClose={() => { setIsEditing(false); setEditingUnit(null); }}
          onSave={handleSaveUnit}
          allStaff={allStaff}
        />
      )}
    </div>
  );
}

function EditUnitModal({
  unit, onClose, onSave, allStaff
}: {
  unit: KokoUnit; onClose: () => void; onSave: (u: KokoUnit) => void; allStaff: Teacher[];
}) {
  const [formData, setFormData] = useState<KokoUnit>(unit);
  const [searchGuru, setSearchGuru] = useState('');

  const toggleAhli = (id: string) => {
    const isSelected = formData.ahliIds.includes(id);
    if (isSelected) {
      setFormData({ ...formData, ahliIds: formData.ahliIds.filter(v => v !== id) });
    } else {
      setFormData({ ...formData, ahliIds: [...formData.ahliIds, id] });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredStaff = allStaff.filter(s => s.name.toLowerCase().includes(searchGuru.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 tracking-tight">
            {unit.nama ? 'Kemaskini Unit' : 'Tambah Unit Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200/50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Kategori</label>
            <select
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value as KategoriKoko })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Nama Unit</label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
              placeholder="Cth: Kelab Robotik"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Tempat Perjumpaan (Pilihan)</label>
            <input
              type="text"
              value={formData.tempatPerjumpaan || ''}
              onChange={(e) => setFormData({ ...formData, tempatPerjumpaan: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
              placeholder="Cth: Makmal Komputer"
            />
          </div>

          {formData.kategori === 'Badan Beruniform' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Logo (Pilihan)</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative group">
                  {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain bg-white p-1" />
                  ) : (
                    <Tent className="w-6 h-6 text-slate-300" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {!formData.logoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white text-[10px] font-bold">
                      Upload
                    </div>
                  )}
                </div>
                {formData.logoUrl && (
                  <button onClick={() => setFormData({ ...formData, logoUrl: '' })} className="text-xs text-rose-600 hover:text-rose-700 font-bold shrink-0">
                    Buang Logo
                  </button>
                )}
                <div className="text-xs text-slate-500 font-medium">Klik pada petak untuk muat naik logo beruniform.</div>
              </div>
            </div>
          )}

          <div className="h-px bg-slate-100 my-4" />

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Ketua Guru Penasihat</label>
            <select
              value={formData.ketuaId}
              onChange={(e) => setFormData({ ...formData, ketuaId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-sm font-medium text-slate-800"
            >
              <option value="">-- Pilih Guru --</option>
              {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Penolong Guru Penasihat (Pilihan)</label>
            <select
              value={formData.penolongId}
              onChange={(e) => setFormData({ ...formData, penolongId: e.target.value })}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 text-sm font-medium text-slate-800"
            >
              <option value="">-- Pilih Guru --</option>
              {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Guru Penasihat Lanjut (Pilihan)</label>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari guru..."
                value={searchGuru}
                onChange={(e) => setSearchGuru(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden max-h-[160px] overflow-y-auto">
              {filteredStaff.map(s => {
                const isSelected = formData.ahliIds.includes(s.id);
                return (
                  <div key={s.id} onClick={() => toggleAhli(s.id)} className={clsx(
                    "flex items-center gap-3 px-3 py-2 cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors",
                    isSelected ? "bg-indigo-50/50" : ""
                  )}>
                    <div className={clsx(
                      "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  </div>
                );
              })}
              {filteredStaff.length === 0 && (
                <div className="p-3 text-center text-sm text-slate-500 italic">Tiada guru ditemui.</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl shadow-sm">
            Batal
          </button>
          <button 
            disabled={!formData.nama.trim()} 
            onClick={() => onSave(formData)} 
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-xl shadow-sm transition-colors"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
