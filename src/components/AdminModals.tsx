import React, { useState } from 'react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'adminskbl' && password === 'pbb1014') {
      onSuccess();
      setError('');
      setUsername('');
      setPassword('');
    } else {
      setError('Akses ditolak. ID Admin atau Katalaluan tidak tepat.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl transition-all">
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-[400px] overflow-hidden animate-in fade-in zoom-in-[0.98] duration-300 ring-1 ring-white/20">
        
        {/* Header Section */}
        <div className="relative pt-10 pb-6 px-8 bg-slate-50/50 flex flex-col items-center border-b border-slate-100">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors bg-white hover:bg-slate-100 p-2 rounded-full shadow-sm ring-1 ring-slate-200">
            <X className="w-4 h-4 text-slate-500" />
          </button>
          
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-5 relative group">
             <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <ShieldCheck className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          
          <h3 className="font-extrabold text-slate-900 text-2xl tracking-tight text-center">Log Masuk Pentadbir</h3>
          <p className="text-[13px] text-slate-500 mt-2 font-medium text-center">Sahkan akses ID Admin untuk mengurus konfigurasi sekolah.</p>
        </div>
        
        {/* Form Section */}
        <div className="px-8 pt-8 pb-10 bg-white">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 text-[13px] font-bold rounded-2xl text-center border border-rose-100/50 flex items-center justify-center gap-2 mb-2 animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <div className="space-y-1.5 relative">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">ID Admin</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                   <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  placeholder="Masukkan ID Admin"
                />
              </div>
            </div>
            
            <div className="space-y-1.5 relative">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Katalaluan</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                   <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-slate-900 text-white font-bold text-[15px] py-4 px-6 rounded-2xl hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20 active:scale-[0.98] transition-all shadow-md mt-6 flex justify-center items-center gap-2"
            >
              <span>Log Masuk</span>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
