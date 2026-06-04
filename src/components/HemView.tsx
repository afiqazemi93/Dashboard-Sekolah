import React from 'react';
import { UserCheck, Heart, AlertTriangle, Users } from 'lucide-react';

export function HemView() {
  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Title section */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-11 h-11 bg-white border border-gray-200 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Hal Ehwal Murid (HEM)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 pb-10">
          <AlertTriangle className="w-8 h-8 text-orange-600 bg-orange-50 p-1.5 rounded-lg mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">SSDM / Disiplin</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">Rumusan laporan Sistem Sahsiah Diri Murid, rekod amalan baik dan kes salah laku.</p>
          <a href="#" className="text-sm font-semibold text-orange-600 hover:underline">Akses SSDM &rarr;</a>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 pb-10">
          <Heart className="w-8 h-8 text-red-600 bg-red-50 p-1.5 rounded-lg mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Kebajikan (RMT & KWAPM)</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">Pengurusan senarai penerima Rancangan Makanan Tambahan dan bantuan kewangan.</p>
          <a href="#" className="text-sm font-semibold text-red-600 hover:underline">Semak Data Bantuan &rarr;</a>
        </div>
      </div>
    </div>
  );
}
