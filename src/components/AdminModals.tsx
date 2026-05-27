import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

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
      setError('Log masuk tidak berjaya. Sila cuba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm pt-12 md:pt-4">
      <div className="bg-white rounded-[24px] shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 bg-white">
          <div className="flex items-center space-x-2">
             <Lock className="w-5 h-5 text-gray-500" />
             <h3 className="font-bold text-gray-900 text-lg">Log Masuk Admin</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl text-center border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 ml-1">ID Pengguna</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 font-medium"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 ml-1">Katalaluan</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 font-medium"
                placeholder="••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold text-sm py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors shadow-sm mt-2"
            >
              Log Masuk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
