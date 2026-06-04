import React, { useState } from 'react';
import { SchoolDetails, HemKehadiranRecord } from '../types';
import { CalendarDays, Save, Trash2, Edit2, TrendingUp, TrendingDown, Minus, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HemKehadiranViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave: (details: SchoolDetails) => void;
}

const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

export function HemKehadiranView({ details, isAdmin, onSave }: HemKehadiranViewProps) {
  const records = details.kehadiranMonthly || [];
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [formMonth, setFormMonth] = useState(MONTHS[0]);
  const [formHadir, setFormHadir] = useState<number | ''>('');
  const [formSepatutnya, setFormSepatutnya] = useState<number | ''>('');

  const handleEdit = (rec: HemKehadiranRecord) => {
    setFormId(rec.id);
    setFormMonth(rec.month);
    setFormHadir(rec.hadir);
    setFormSepatutnya(rec.sepatutnya);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Adakah anda pasti mahu memadam rekod ini?')) {
      const updated = records.filter(r => r.id !== id);
      onSave({ ...details, kehadiranMonthly: updated });
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (formHadir === '' || formSepatutnya === '') return;
    
    // Validate number
    const hadirNum = Number(formHadir);
    const spatutnyaNum = Number(formSepatutnya);
    
    const newRec: HemKehadiranRecord = {
      id: formId || `khd_${Date.now()}`,
      month: formMonth,
      hadir: hadirNum,
      sepatutnya: spatutnyaNum
    };

    let updated = [...records];
    if (formId) {
      updated = updated.map(r => r.id === formId ? newRec : r);
    } else {
      // Prevent duplicate month? Or just replace
      const existingIdx = updated.findIndex(r => r.month === formMonth);
      if (existingIdx !== -1) {
        updated[existingIdx] = newRec;
      } else {
        updated.push(newRec);
      }
    }
    
    // Sort by month
    updated.sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));

    onSave({ ...details, kehadiranMonthly: updated });
    
    setIsFormOpen(false);
    setFormId(null);
    setFormHadir('');
    setFormSepatutnya('');
  };

  // Calculations
  const totalHadir = records.reduce((sum, r) => sum + r.hadir, 0);
  const totalSepatutnya = records.reduce((sum, r) => sum + r.sepatutnya, 0);
  const peratusTahunan = totalSepatutnya > 0 ? (totalHadir / totalSepatutnya) * 100 : 0;
  
  const getIndicatorColor = (percent: number) => {
    if (percent >= 95) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (percent >= 90) return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-rose-500 bg-rose-50 border-rose-200';
  };

  const getIndicatorFill = (percent: number) => {
    if (percent >= 95) return '#10b981'; // emerald
    if (percent >= 90) return '#f59e0b'; // amber
    return '#f43f5e'; // rose
  };

  const chartData = records.map(r => ({
    name: r.month.substring(0, 3), // short name
    fullMonth: r.month,
    peratus: r.sepatutnya > 0 ? Number(((r.hadir / r.sepatutnya) * 100).toFixed(2)) : 0,
    hadir: r.hadir,
    sepatutnya: r.sepatutnya
  }));

  // Find trend
  let trendIcon = <Minus className="w-5 h-5 text-gray-400" />;
  if (chartData.length >= 2) {
    const last = chartData[chartData.length - 1].peratus;
    const prev = chartData[chartData.length - 2].peratus;
    if (last > prev) trendIcon = <TrendingUp className="w-5 h-5 text-emerald-500" />;
    else if (last < prev) trendIcon = <TrendingDown className="w-5 h-5 text-rose-500" />;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300 w-full">
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Kehadiran Murid</h2>
          </div>
        </div>
        {isAdmin && !isFormOpen && (
          <div className="flex items-center">
            <button 
              onClick={() => {
                setFormId(null);
                setFormMonth(MONTHS[records.length % 12]);
                setFormHadir('');
                setFormSepatutnya('');
                setIsFormOpen(true);
              }} 
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-blue-600/10 hover:scale-[1.03] active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              + Tambah Rekod Bulan
            </button>
          </div>
        )}
      </div>

      {isAdmin && isFormOpen && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              {formId ? 'Kemaskini Rekod Kehadiran' : 'Tambah Rekod Kehadiran'}
            </h3>
            <button onClick={() => setIsFormOpen(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Batal</button>
          </div>
          <form onSubmit={handleSaveForm} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Bulan</label>
              <select value={formMonth} onChange={e => setFormMonth(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700">
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Jumlah Hadir</label>
              <input type="number" required value={formHadir} onChange={e => setFormHadir(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 placeholder:text-slate-400" placeholder="Contoh: 12500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Kehadiran Sepatutnya</label>
              <input type="number" required value={formSepatutnya} onChange={e => setFormSepatutnya(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 placeholder:text-slate-400" placeholder="Contoh: 13000" />
            </div>
            <div className="sm:col-span-3 flex justify-end mt-2">
              <button type="submit" className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all">
                <Save className="w-4 h-4" />
                Simpan Data
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tahunan Peratusan Widget */}
        <div className="lg:col-span-1 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-50 rounded-full -ml-10 -mb-10 opacity-50 blur-2xl"></div>

          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative z-10">
             <Percent className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Peratus Tahunan Automatik</h3>
          
          <div className={`text-6xl font-black tracking-tighter mb-4 relative z-10 ${totalSepatutnya === 0 ? 'text-slate-300' : getIndicatorColor(peratusTahunan).split(' ')[0]}`}>
            {totalSepatutnya > 0 ? peratusTahunan.toFixed(2) : '0.00'}%
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-full border text-xs font-bold shadow-sm relative z-10 ${totalSepatutnya === 0 ? 'bg-slate-50 text-slate-400 border-slate-200' : getIndicatorColor(peratusTahunan)}`}>
             <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
             {totalSepatutnya === 0 ? 'Tiada Data' : peratusTahunan >= 95 ? 'Cemerlang' : peratusTahunan >= 90 ? 'Baik / Sederhana' : 'Kritikal'}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 w-full text-left relative z-10">
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">J. Hadir</p>
                <p className="text-lg font-black text-slate-700 text-center">{totalHadir.toLocaleString()}</p>
             </div>
             <div className="w-px h-8 bg-slate-200"></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Sepatutnya</p>
                <p className="text-lg font-black text-slate-700 text-center">{totalSepatutnya.toLocaleString()}</p>
             </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-left relative z-10 w-full">
            <p className="text-[10px] text-slate-500 leading-normal font-medium">
              <span className="font-extrabold text-blue-600 uppercase tracking-wider block mb-1">Sasaran KPI KPM:</span>
              Peratusan kehadiran murid secara amnya ditetapkan pada KPI minimum 93% hingga 95% oleh Kementerian Pendidikan Malaysia (KPM).
            </p>
          </div>
        </div>

        {/* Graf Bulanan */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Trend Kehadiran Bulanan</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Peratusan Mengikut Bulan Tahun Ini</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center" title="Trend Bulan Terkini">
              {trendIcon}
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dx={-10} />
                  <Tooltip 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700">
                            <p className="font-bold text-sm mb-2">{data.fullMonth}</p>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getIndicatorFill(data.peratus) }}></div>
                              <span className="text-lg font-black">{data.peratus}%</span>
                            </div>
                            <div className="text-xs text-slate-400 font-medium">Hadir: {data.hadir.toLocaleString()}</div>
                            <div className="text-xs text-slate-400 font-medium">Sepatutnya: {data.sepatutnya.toLocaleString()}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="peratus" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle 
                          key={`dot-${payload.name}`} 
                          cx={cx} 
                          cy={cy} 
                          r={5} 
                          fill={getIndicatorFill(payload.peratus)} 
                          stroke="#fff" 
                          strokeWidth={2} 
                        />
                      );
                    }}
                    activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                 <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
                 <p className="text-sm font-bold">Tiada data rekod kehadiran untuk dipaparkan.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Jadual Rekod */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mt-6">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              Senarai Data Bulanan
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4 font-black">Bulan</th>
                <th className="px-6 py-4 font-black">Jumlah Hadir</th>
                <th className="px-6 py-4 font-black">Sepatutnya</th>
                <th className="px-6 py-4 font-black">Peratusan</th>
                <th className="px-6 py-4 font-black">Status</th>
                {isAdmin && <th className="px-6 py-4 font-black text-right">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {records.length > 0 ? records.map(rec => {
                const perc = rec.sepatutnya > 0 ? (rec.hadir / rec.sepatutnya) * 100 : 0;
                const indColors = getIndicatorColor(perc);
                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{rec.month}</td>
                    <td className="px-6 py-4">{rec.hadir.toLocaleString()}</td>
                    <td className="px-6 py-4">{rec.sepatutnya.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border ${indColors}`}>
                        {perc.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {perc >= 95 ? (
                        <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> HIJAU</span>
                      ) : perc >= 90 ? (
                        <span className="text-amber-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> KUNING</span>
                      ) : (
                        <span className="text-rose-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> MERAH</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(rec)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(rec.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-400 text-sm font-bold bg-slate-50/50">
                    Sistem belum mempunyai sebarang rekod kehadiran untuk tahun ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
