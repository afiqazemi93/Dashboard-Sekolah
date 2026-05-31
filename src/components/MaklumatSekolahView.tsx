import React, { useState, useEffect } from 'react';
import { SchoolDetails, Announcement, CalendarEvent, Teacher } from '../types';
import { Users, GraduationCap, Briefcase, Clock, MapPin, Mail, Globe, Phone, Edit2, Save, X, Facebook, Youtube, BookOpen, LayoutDashboard, Map, Calendar, Megaphone, Link as LinkIcon, ChevronLeft, ChevronRight, UserCheck, School, Landmark, Compass, Award, Shield, Maximize2, Layers, Plus, Trash2, Search } from 'lucide-react';

import { StaffListSection } from './StaffListSection';
import { AdminTakwimEditor } from './AdminTakwimEditor';
import { uploadBase64ToStorage } from '../supabase';

interface MaklumatSekolahViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave: (details: SchoolDetails) => void;
}

export function MaklumatSekolahView({ details, isAdmin, onSave }: MaklumatSekolahViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SchoolDetails>(details);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 font-medium shadow-sm";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, prefix: string, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
          alert("Sila muat naik fail audio kurang daripada 5MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const url = await uploadBase64ToStorage(`maklumat/${prefix}_${Date.now()}.mp3`, base64);
          if (!url && base64.length > 500000) {
            alert("Ralat: Fail ini terlalu besar. Pangkalan data (Supabase Storage) diperlukan untuk fail bersaiz ini.");
          }
          callback(url);
        } catch (err) {
          console.error("Upload failed", err);
          alert("Gagal memuat naik fail.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void, maxWidth = 400) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Increased to 5MB before canvas resize 
          alert("Saiz gambar terlalu besar. Sila muat naik gambar kurang dari 5MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
            if (!isPng) {
              // Draw white background in case of transparent non-png or jpeg
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);
            // Default to webp for better compression with transparency support
            let dataUrl = canvas.toDataURL('image/webp', 0.85); 
            // Fallback for browsers that don't support webp encoding
            if (dataUrl.startsWith('data:image/png') && isPng) {
                 // It ignores webp if unsupported, and spits out uncompressed png!
                 // If that happens, maybe shrink dimension for pngs to keep size low?
                 // But for now, we leave as is.
                 dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : 0.85);
            }
            callback(dataUrl);
          } else {
            callback(reader.result as string); // fallback
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const renderAdminInput = (role: 'guruBesar' | 'pkPentadbiran' | 'pkHem' | 'pkKokurikulum', roleLabel: string) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-l-2 border-blue-500 pl-4 py-2">
      <div>
        <label className={labelClass}>Nama {roleLabel}</label>
        <input type="text" value={formData[role].name} onChange={(e) => setFormData({ ...formData, [role]: { ...formData[role], name: e.target.value } })} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Muat Naik Gambar {roleLabel}</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => handleImageUpload(e, (base64) => setFormData({ ...formData, [role]: { ...formData[role], photoUrl: base64 } }))} 
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
        {formData[role].photoUrl && (
          <img loading="lazy" decoding="async" src={formData[role].photoUrl} alt="Preview" className="h-10 mt-2 rounded border" />
        )}
      </div>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-[24px] shadow-sm p-6 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-100 pb-4 gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Kemaskini Sekolah</h2>
          <button onClick={() => setIsEditing(false)} className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center">
            <X className="w-4 h-4 mr-2" />
            Batal
          </button>
        </div>
        
        <form id="settingsForm" onSubmit={handleSubmit} className="space-y-10">
            <section>
              <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Maklumat Asas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nama Sekolah</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Muat Naik Logo Sekolah</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setFormData({ ...formData, logoUrl: base64 }))} 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {formData.logoUrl && (
                    <img loading="lazy" decoding="async" src={formData.logoUrl} alt="Logo" className="w-16 h-16 object-cover mt-3 border-2 border-white rounded-lg shadow-sm" />
                  )}
                </div>
                <div>
                  <label className={labelClass}>Kod Sekolah</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className={inputClass} />
                </div>
                <div>
                   <label className={labelClass}>Sesi Persekolahan</label>
                   <input type="text" value={formData.session} onChange={(e) => setFormData({ ...formData, session: e.target.value })} className={inputClass} />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Data Semasa & Lokasi</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className={labelClass}>Bilangan Murid</label>
                  <input type="number" value={formData.totalStudents || ''} onChange={(e) => setFormData({ ...formData, totalStudents: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bil. Guru</label>
                  <input type="number" value={formData.totalTeachers || ''} onChange={(e) => setFormData({ ...formData, totalTeachers: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                   <label className={labelClass}>Bil. Staf</label>
                   <input type="number" value={formData.totalStaff || ''} onChange={(e) => setFormData({ ...formData, totalStaff: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div>
                   <label className={labelClass}>Bil. Kelas</label>
                   <input type="number" value={formData.totalClasses || ''} onChange={(e) => setFormData({ ...formData, totalClasses: parseInt(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className={labelClass}>Daerah / PPD</label>
                   <input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className={inputClass} />
                 </div>
                 <div>
                   <label className={labelClass}>Negeri</label>
                   <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={inputClass} />
                 </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Maklumat Perhubungan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Alamat Penuh</label>
                  <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>No. Telefon</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Emel Rasmi</label>
                  <input type="text" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                   <label className={labelClass}>Link Facebook</label>
                   <input type="text" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} className={inputClass} placeholder="Contoh: https://facebook.com/skblofficial" />
                </div>
                <div className="sm:col-span-2">
                   <label className={labelClass}>Link Youtube</label>
                   <input type="text" value={formData.youtube || ''} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} className={inputClass} placeholder="Contoh: https://youtube.com/@skbatulanchang" />
                </div>
                <div className="sm:col-span-2">
                   <label className={labelClass}>Link TikTok</label>
                   <input type="text" value={formData.tiktok || ''} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} className={inputClass} placeholder="Contoh: https://tiktok.com/@skbatulanchang" />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Hala Tuju Sekolah</h4>
              <div className="space-y-4">
                <div>
                   <label className={labelClass}>Motto Sekolah</label>
                   <input type="text" value={formData.motto} onChange={(e) => setFormData({ ...formData, motto: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Visi Sekolah</label>
                  <textarea value={formData.vision} onChange={(e) => setFormData({ ...formData, vision: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Misi Sekolah</label>
                  <textarea value={formData.mission} onChange={(e) => setFormData({ ...formData, mission: e.target.value })} rows={2} className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Lagu Sekolah (Lirik)</label>
                  <textarea value={formData.schoolSongLyrics || ''} onChange={(e) => setFormData({ ...formData, schoolSongLyrics: e.target.value })} rows={4} className={`${inputClass} resize-none`} placeholder="Lirik lagu sekolah..." />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Pelan Sekolah (Gambar)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (base64) => setFormData({ ...formData, schoolPlanImageUrl: base64 }), 1200)} 
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {formData.schoolPlanImageUrl && (
                    <img loading="lazy" decoding="async" src={formData.schoolPlanImageUrl} alt="Pelan Sekolah" className="mt-3 max-h-32 object-contain rounded-lg border border-gray-200" />
                  )}
                </div>
              </div>
            </section>
            
            <section>
              <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Pautan Keberadaan</h4>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={labelClass}>Borang Keberadaan (URL)</label>
                  <input 
                    type="text" 
                    value={formData.keberadaanFormUrl || ''} 
                    onChange={(e) => setFormData({ ...formData, keberadaanFormUrl: e.target.value })} 
                    className={inputClass} 
                    placeholder="Contoh: https://forms.gle/..." 
                  />
                  <p className="text-xs text-gray-500 mt-1">Pautan untuk guru mengisi keberadaan (Google Form / Link Luar).</p>
                </div>
                <div>
                  <label className={labelClass}>URL Google Apps Script API (Data Live Keberadaan)</label>
                  <input 
                    type="text" 
                    value={formData.keberadaanGasUrl || ''} 
                    onChange={(e) => setFormData({ ...formData, keberadaanGasUrl: e.target.value })} 
                    className={inputClass} 
                    placeholder="Contoh: https://script.google.com/macros/s/.../exec" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Pautan Web App Apps Script (GET) yang akan mengembalikan rekod keberadaan hari ini dalam format JSON.</p>
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Takwim: Notis & Peristiwa</h4>
              <AdminTakwimEditor 
                events={formData.calendarEvents || []} 
                onChange={(events) => setFormData({...formData, calendarEvents: events})}
              />
            </section>

            <div className="pt-6 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-gray-100">
               <div className="flex gap-3 w-full sm:w-auto">
                 <button
                   type="button"
                   onClick={() => setIsEditing(false)}
                   className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                 >
                   Batal
                 </button>
                 <button
                   type="submit"
                   className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-blue-600 text-white font-bold text-sm py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                 >
                   <Save className="w-5 h-5" />
                   <span>Simpan</span>
                 </button>
               </div>
            </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-0 w-full pb-12 max-w-7xl mx-auto">
      
      {/* 1. KAD HEADER (BANNER DENGAN ALAMAT, TELEFON, EMEL, FB, VISI & MISI DAN MOTTO) */}
      <div className="relative rounded-[24px] overflow-hidden bg-white border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 sm:p-8 transition-all hover:shadow-[0_16px_48px_rgba(0,0,0,0.05)] isolate">
        
        {/* Ambient Glowing Blobs for Glassmorphism Depth */}
        <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none -z-10">
          <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => {
              setFormData(details);
              setIsEditing(true);
            }}
            className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-blue-50/85 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-xl font-bold transition-all shadow-sm text-xs sm:text-sm border border-blue-100/50 backdrop-blur-sm"
          >
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Edit Maklumat</span>
          </button>
        )}
        
        {/* Top/Primary row with logo, name, motto */}
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 pb-6 border-b border-gray-100/80 relative z-10 text-center md:text-left">
          <div className="relative flex items-center justify-center shrink-0 w-[95px] h-[95px] sm:w-[110px] sm:h-[110px] lg:w-[125px] lg:h-[125px] bg-white p-3 rounded-[20px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-transform duration-300 hover:scale-[1.05]">
            <img 
              loading="lazy" decoding="async"
              src={details.logoUrl || "https://ui-avatars.com/api/?name=SK&background=0D8ABC&color=fff&size=128"} 
              alt="Logo Sekolah" 
              className="w-full h-full object-contain rounded-xl select-none"
            />
          </div>
          
          <div className="flex-1 relative z-10 flex flex-col justify-center pt-0">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-700 rounded-full text-[10px] sm:text-[11.5px] font-black mb-3 w-fit mx-auto md:mx-0 tracking-wider uppercase shadow-sm">
              <span>Kod Sekolah: {details.code}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight mb-3 uppercase leading-none select-none">{details.name}</h2>
            <p className="text-gray-500 font-medium italic text-[13px] sm:text-[15px] mx-auto md:mx-0 leading-relaxed pl-0 md:pl-3 border-l-0 md:border-l-2 md:border-blue-500/30">
              "{details.motto}"
            </p>
          </div>
        </div>

        {/* Contact Details (Highly responsive layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10 text-left">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <InfoRow icon={MapPin} label="Alamat" value={`${details.address}, ${details.state}`} />
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <InfoRow icon={Phone} label="Telefon" value={details.phone} />
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <InfoRow icon={Mail} label="Emel Rasmi" value={details.email} />
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">Media Sosial</p>
              <div className="flex flex-wrap items-center gap-3">
                {details.facebook && (
                  <a href={details.facebook.startsWith('http') ? details.facebook : `https://${details.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm transition-all" title="Facebook">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {details.youtube && (
                  <a href={details.youtube.startsWith('http') ? details.youtube : `https://${details.youtube}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-sm transition-all" title="Youtube">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {details.tiktok && (
                  <a href={details.tiktok.startsWith('http') ? details.tiktok : `https://${details.tiktok}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/5 text-gray-900 hover:bg-black hover:text-white shadow-sm transition-all" title="TikTok">
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-5 h-5">
                      <path d="M12.525.02c1.31-.02 2.61 0 3.91.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.8-5.46-.4-2.51.76-5.18 2.85-6.6 2.02-1.36 4.67-1.64 6.96-.83v4.06c-1.12-.48-2.54-.53-3.52-.07-.94.44-1.57 1.34-1.74 2.37-.17 1.05.15 2.15.93 2.9.96.9 2.5 1.11 3.63.48.97-.53 1.59-1.55 1.63-2.67.04-5.63.02-11.26.02-16.89z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Visi & Misi (Side-by-side boxes under contact details) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 relative z-10 text-left">
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-start">
            <h4 className="font-bold text-gray-950 text-xs sm:text-sm mb-2.5 flex items-center space-x-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-3.5 bg-blue-500 rounded-full shrink-0"></span>
              <span>Visi Sekolah</span>
            </h4>
            <p className="text-gray-700 text-[13.5px] leading-relaxed font-bold">{details.vision}</p>
          </div>
          <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-start">
            <h4 className="font-bold text-gray-950 text-xs sm:text-sm mb-2.5 flex items-center space-x-1.5 uppercase tracking-wider">
              <span className="w-1.5 h-3.5 bg-teal-500 rounded-full shrink-0"></span>
              <span>Misi Sekolah</span>
            </h4>
            <p className="text-gray-700 text-[13.5px] leading-relaxed font-bold">{details.mission}</p>
          </div>
        </div>

        {/* Lagu Sekolah & Pelan Sekolah */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 relative z-10 text-left">
          {details.schoolSongLyrics && (
            <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-start">
              <h4 className="font-bold text-gray-950 text-xs sm:text-sm mb-4 flex items-center space-x-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full shrink-0"></span>
                <span>Lagu Sekolah</span>
              </h4>
              <p className="text-gray-700 text-[13.5px] leading-relaxed font-bold whitespace-pre-wrap flex-1">{details.schoolSongLyrics}</p>
            </div>
          )}
          {details.schoolPlanImageUrl && (
            <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-start">
              <h4 className="font-bold text-gray-950 text-xs sm:text-sm mb-2.5 flex items-center space-x-1.5 uppercase tracking-wider">
                <span className="w-1.5 h-3.5 bg-orange-500 rounded-full shrink-0"></span>
                <span>Pelan Sekolah</span>
              </h4>
              <div 
                className="mt-2 rounded-xl overflow-hidden bg-white border border-gray-100 flex-1 flex items-center justify-center min-h-[160px] cursor-pointer group shadow-sm"
                onClick={() => setIsPlanOpen(true)}
              >
                <img loading="lazy" decoding="async" src={details.schoolPlanImageUrl} alt="Pelan Sekolah" className="w-full max-h-[300px] object-cover group-hover:scale-[1.02] transition-all duration-300 rounded-xl shadow-sm" />
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* METRIC COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Murid" subtitle="Jumlah Murid" value={details.totalStudents?.toString() || '0'} fromColor="from-[#1fb2a6]" toColor="to-[#14998d]" iconColor="text-white" bgIconColor="bg-white/20" icon={Users} />
        <MetricCard title="Guru" subtitle="Jumlah Guru" value={details.totalTeachers?.toString() || '0'} fromColor="from-[#8b5cf6]" toColor="to-[#7c3aed]" iconColor="text-white" bgIconColor="bg-white/20" icon={BookOpen} />
        <MetricCard title="Staf" subtitle="Staf Sokongan" value={details.totalStaff?.toString() || '0'} fromColor="from-[#f97316]" toColor="to-[#ea580c]" iconColor="text-white" bgIconColor="bg-white/20" icon={UserCheck} />
        <MetricCard title="Kelas" subtitle="Jumlah Kelas" value={details.totalClasses?.toString() || '0'} fromColor="from-[#3b82f6]" toColor="to-[#2563eb]" iconColor="text-white" bgIconColor="bg-white/20" icon={School} />
      </div>

      {/* 2. KAD INFORMASI SEKOLAH (DI BAWAH KAD HEADER & METRIC - MAKLUMAT TAMBAHAN SAHAJA) */}
      <div className="bg-white rounded-[20px] p-6 lg:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100/80 text-left">
        <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center space-x-2.5">
          <span className="w-1.5 h-5 bg-[#fbbf24] rounded-full"></span>
          <span>Informasi Sekolah</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <InfoRow icon={Clock} label="Sesi Persekolahan" value={details.session} />
          <InfoRow icon={Map} label="Daerah / PPD" value={details.district} />
          <InfoRow icon={Landmark} label="PARLIMEN" value="P050 - JELUTONG" />
          <InfoRow icon={Compass} label="DUN" value="AIR ITAM" />
          <InfoRow icon={Award} label="JENIS BANTUAN" value="SEKOLAH KERAJAAN" />
          <InfoRow icon={Shield} label="GRED" value="A" />
          <InfoRow icon={Maximize2} label="KELUASAN TANAH" value="2.45 EKAR" />
          <InfoRow icon={Layers} label="BILANGAN KELAS" value="30 KELAS , KELAS PPKI & 1 PRASEKOLAH" />
        </div>
      </div>

      {/* 4. KAD NOTIS & TAKWIM (DI BAWAH KAD INFORMASI SEKOLAH - DUA KAD BERSEBELAHAN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <CalendarSection 
          calendarEvents={details.calendarEvents || []} 
          selectedDate={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
        />
        <AnnouncementsSection 
          calendarEvents={details.calendarEvents || []} 
          selectedDate={selectedCalendarDate} 
          onSelectDate={setSelectedCalendarDate} 
        />
      </div>

      <div className="mt-5">
      </div>

      {/* Plan Image Modal */}
      {isPlanOpen && details.schoolPlanImageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsPlanOpen(false)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto transition-transform scale-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-gray-900 text-lg">Pelan Sekolah</h3>
              <button 
                onClick={() => setIsPlanOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-100 flex-1 overflow-auto flex justify-center items-center">
              <img loading="lazy" decoding="async" src={details.schoolPlanImageUrl} alt="Pelan Sekolah" className="max-w-full rounded-xl shadow-sm object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MetricCard({ title, subtitle, value, fromColor, toColor, iconColor, bgIconColor, icon: Icon }: { title: string, subtitle: string, value: string, fromColor: string, toColor: string, iconColor: string, bgIconColor: string, icon: any }) {
  return (
    <div className={`rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all bg-gradient-to-br ${fromColor} ${toColor} relative overflow-hidden flex flex-col justify-center`}>
       <div className="flex items-center space-x-4 relative z-10 w-full">
         <div className={`w-14 h-14 ${bgIconColor} rounded-full flex items-center justify-center shrink-0 shadow-sm backdrop-blur-md`}>
           <Icon className={`w-6 h-6 ${iconColor}`} />
         </div>
         <div className="flex flex-col justify-center text-left">
           <h4 className="text-white/90 text-[14px] font-bold mb-0.5">{title}</h4>
           <div className="text-3xl font-black text-white tracking-tight leading-none mb-1">{value}</div>
           <div className="text-white/80 text-[11px] font-medium">{subtitle}</div>
         </div>
       </div>
       <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
       <div className="absolute top-0 right-0 w-16 h-16 border border-white/10 rounded-full -mr-2 -mt-2 pointer-events-none" />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isLink }: { icon: any, label: string, value: string, isLink?: boolean }) {
  return (
    <div className="flex items-start space-x-3.5">
      <div className="p-2.5 bg-white text-gray-400 rounded-[12px] shrink-0 border border-gray-100 shadow-sm">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {isLink ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold text-blue-600 hover:text-blue-800 break-words leading-tight hover:underline">
            {value}
          </a>
        ) : (
          <p className="text-[14px] font-semibold text-gray-800 break-words leading-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ role, profile, accent }: { role: string, profile: { name: string, photoUrl: string }, accent: string }) {
  return (
    <div className="flex items-center p-3 sm:p-4 rounded-[16px] border border-gray-100/60 hover:border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all bg-white relative overflow-hidden">
      <img 
        loading="lazy" decoding="async"
        src={profile.photoUrl} 
        alt={profile.name} 
        referrerPolicy="no-referrer"
        className="w-[60px] h-[60px] sm:w-[65px] sm:h-[65px] lg:w-[70px] lg:h-[70px] rounded-full object-cover shadow-sm shrink-0 bg-white mr-3 lg:mr-4" 
      />
      <div className="flex flex-col items-start text-left w-full space-y-1.5 min-w-0">
        <div className={`inline-flex px-2.5 py-1 rounded-full text-[9px] lg:text-[10px] font-bold uppercase tracking-widest shadow-sm ${accent}`}>
          {role}
        </div>
        <h4 className="text-[13px] sm:text-[14px] lg:text-[14px] font-black text-gray-900 leading-[1.2] w-full line-clamp-2" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          {profile.name}
        </h4>
      </div>
    </div>
  );
}



function AnnouncementsSection({ calendarEvents, selectedDate, onSelectDate }: { calendarEvents: CalendarEvent[], selectedDate: string, onSelectDate: (d: string) => void }) {
  const filteredEvents = calendarEvents.filter(ev => {
     const datesToCheck = ev.dates || (ev.date ? [ev.date] : []);
     if (datesToCheck.length === 0) return false;

     return datesToCheck.includes(selectedDate);
  }).sort((a,b) => {
      const aDate = a.dates ? a.dates[0] : (a.date || '');
      const bDate = b.dates ? b.dates[0] : (b.date || '');
      return new Date(aDate).getTime() - new Date(bDate).getTime();
  });

  const monthNames = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGO', 'SEP', 'OKT', 'NOV', 'DIS'];

  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100/80 h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2.5">
            <span className="w-1.5 h-5 bg-[#fbbf24] rounded-full"></span>
            <div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight">Aktiviti & Notis</h3>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 mt-0.5">Pilih tarikh di takwim</p>
            </div>
          </div>
          <input 
            type="date"
            value={selectedDate} 
            onChange={(e) => onSelectDate(e.target.value)}
            className="text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
          />
       </div>
       <div className="flex-1 space-y-4">
          {filteredEvents.length > 0 ? filteredEvents.map((item) => {
             const firstDateStr = item.dates && item.dates.length > 0 ? item.dates[0] : (item.date || '');
             const [y, m, d] = firstDateStr.split('-');
             const day = d ? parseInt(d, 10).toString() : '';
             const month = m ? monthNames[parseInt(m, 10) - 1] : '';

             const isMultipleDays = item.dates && item.dates.length > 1;
             const lastDateStr = isMultipleDays ? item.dates![item.dates!.length - 1] : '';
             const [ly, lm, ld] = lastDateStr.split('-');
             const lastDay = ld ? parseInt(ld, 10).toString() : '';
             const lastMonth = lm ? monthNames[parseInt(lm, 10) - 1] : '';

             return (
               <div key={item.id} className="flex items-center space-x-4 flex-wrap sm:flex-nowrap border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className={`flex flex-col items-center justify-center min-w-[42px] px-2 h-[42px] rounded-xl border shrink-0 shadow-sm p-1 ${
                    item.type === 'school_holiday' ? 'bg-green-50 border-green-200 text-green-700' :
                    item.type === 'public_holiday' ? 'bg-red-50 border-red-200 text-red-700' :
                    item.type === 'holiday' ? 'bg-orange-50 border-orange-200 text-orange-600' : 
                    item.type === 'event' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                    'bg-white border-gray-200 text-gray-800 shadow-sm'
                  }`}>
                     <div className="text-[13px] font-black leading-none whitespace-nowrap flex items-center justify-center">
                       {day}
                       {isMultipleDays && <span className="text-[10px] mx-0.5 px-0.5 opacity-50">-</span>}
                       {isMultipleDays && lastDay}
                     </div>
                     {month && <div className="text-[7.5px] font-extrabold uppercase tracking-tight leading-none mt-0.5">{isMultipleDays && month !== lastMonth ? `${month}-${lastMonth}` : month}</div>}
                  </div>
                  <div className="flex flex-col flex-1 pl-1">
                     <h4 className="text-[15px] font-bold text-gray-900 mb-1 leading-tight">{item.title}</h4>
                     {item.desc && <p className="text-[12px] font-medium text-gray-500">{item.desc}</p>}
                  </div>
               </div>
             );
          }) : (
             <div className="text-sm text-gray-400 py-4 text-center">Tiada aktiviti untuk tarikh ini.</div>
          )}
       </div>
    </div>
  );
}

function CalendarSection({ calendarEvents, selectedDate, onSelectDate }: { calendarEvents: CalendarEvent[], selectedDate: string, onSelectDate: (d: string) => void }) {
  const days = ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
  const monthNames = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const [calDate, setCalDate] = useState(() => {
    const now = new Date();
    // Default to May 2026 to stay aligned with current school term data
    if (now.getFullYear() !== 2026 || now.getMonth() !== 4) {
      return new Date(2026, 4, 25);
    }
    return now;
  });

  const year = calDate.getFullYear();
  const month = calDate.getMonth(); // 0-11

  // First day of current month (index 0 = Sun, 1 = Mon ...)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Total days in current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Total days in previous month
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  // Days from previous month to display in first week
  const prevDates = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevDates.push(totalDaysInPrevMonth - i);
  }

  // Days of current month
  const dates = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  // Trailing days from next month
  const occupiedCells = prevDates.length + dates.length;
  const nextDatesCount = occupiedCells % 7 === 0 ? 0 : 7 - (occupiedCells % 7);
  const nextDates = Array.from({ length: nextDatesCount }, (_, i) => i + 1);

  const prevMonth = () => {
    setCalDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCalDate(new Date(year, month + 1, 1));
  };
  
  return (
    <div className="bg-white rounded-[20px] p-6 lg:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-gray-100/80 h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 text-lg flex items-center space-x-2.5">
            <span className="w-1.5 h-5 bg-[#fbbf24] rounded-full"></span>
            <span>Takwim</span>
          </h3>
          <div className="flex items-center space-x-3">
             <span className="font-bold text-[14px] text-gray-900">{monthNames[month]} {year}</span>
             <div className="flex items-center space-x-1">
                <button onClick={prevMonth} className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all" aria-label="Bulan Sebelumnya"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={nextMonth} className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all" aria-label="Bulan Seterusnya"><ChevronRight className="w-4 h-4" /></button>
             </div>
          </div>
       </div>

       <div className="flex-1">
         <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((day, i) => (
              <div key={i} className="text-center font-bold text-[12px] text-gray-500 pb-2">{day}</div>
            ))}
         </div>
         <div className="grid grid-cols-7 gap-y-2 sm:gap-y-3 gap-x-1">
            {prevDates.map(d => (
              <div key={`p${d}`} className="flex justify-center items-center h-8 w-8 sm:h-10 sm:w-10 mx-auto text-[13px] font-semibold text-gray-300">{d}</div>
            ))}
            {dates.map(d => {
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const todayObj = new Date();
              const isToday = d === todayObj.getDate() && month === todayObj.getMonth() && year === todayObj.getFullYear();
              
              const isOriginalMay2026 = year === 2026 && month === 4;
              const evMatch = calendarEvents.find(e => (e.dates && e.dates.includes(dStr)) || e.date === dStr || (isOriginalMay2026 && e.day === d && !e.date));
              
              const isEvent = evMatch && evMatch.type === 'event';
              const isSchoolHoliday = evMatch && evMatch.type === 'school_holiday';
              const isPublicHoliday = evMatch && evMatch.type === 'public_holiday';
              const isGenericHoliday = evMatch && evMatch.type === 'holiday';

              const isSelected = selectedDate === dStr;

              return (
                 <div key={d} className="flex justify-center items-center relative h-8 w-8 sm:h-10 sm:w-10 mx-auto mt-1 group">
                   <button 
                     onClick={() => onSelectDate(dStr)}
                     className={`w-8 h-8 sm:w-9 sm:h-9 flex justify-center items-center rounded-full text-[13px] font-bold z-10 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-400
                     ${isSchoolHoliday ? 'bg-green-500 text-white' : 
                       isPublicHoliday ? 'bg-red-500 text-white' :
                       isEvent ? 'bg-teal-500 text-white' : 
                       isGenericHoliday ? 'bg-orange-400 text-white' : 
                       isToday ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                     ${isSelected ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 shadow-lg' : isToday ? 'shadow-sm' : 'shadow-none'}`}
                   >
                     {d}
                   </button>
                   
                   {/* Tooltip for event title */}
                   {evMatch && evMatch.title && (
                     <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-50">
                       <span className="relative z-10 p-2 text-xs leading-none text-white whitespace-nowrap bg-gray-900 shadow-lg rounded-md font-medium">
                         {evMatch.title}
                       </span>
                       <div className="w-3 h-3 -mt-2 rotate-45 bg-gray-900"></div>
                     </div>
                   )}
                 </div>
              );
            })}
            {nextDates.map(d => (
              <div key={`n${d}`} className="flex justify-center items-center h-8 w-8 sm:h-10 sm:w-10 mx-auto text-[13px] font-semibold text-gray-300">{d}</div>
            ))}
         </div>
       </div>
    </div>
  );
}


