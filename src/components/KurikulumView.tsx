import React from 'react';
import { BookOpen, TableProperties, BarChart3 } from 'lucide-react';

export function KurikulumView() {
  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Title section */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-11 h-11 bg-white border border-gray-200 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <BookOpen className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kurikulum</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 pb-10">
          <TableProperties className="w-8 h-8 text-blue-600 bg-blue-50 p-1.5 rounded-lg mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Jadual Waktu</h3>
          <p className="text-sm text-gray-500 mb-6 line-clamp-2">Akses ke jadual waktu kelas, guru ganti, dan jadual peperiksaan.</p>
          <a href="#" className="text-sm font-semibold text-blue-600 hover:underline">Lihat Direktori &rarr;</a>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 pb-10">
          <BookOpen className="w-8 h-8 text-teal-600 bg-teal-50 p-1.5 rounded-lg mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Panitia Mata Pelajaran</h3>
          <p className="text-sm text-gray-500 mb-6 line-clamp-2">Akses bahan PDP, RPT, dan minit mesyuarat bagi setiap panitia.</p>
          <a href="#" className="text-sm font-semibold text-teal-600 hover:underline">Urus Dokumen &rarr;</a>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 pb-10">
          <BarChart3 className="w-8 h-8 text-purple-600 bg-purple-50 p-1.5 rounded-lg mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Analisis PBD</h3>
          <p className="text-sm text-gray-500 mb-6 line-clamp-2">Laporan Pentaksiran Bilik Darjah (PBD) tahap penguasaan murid.</p>
          <a href="#" className="text-sm font-semibold text-purple-600 hover:underline">Buka Analisis &rarr;</a>
        </div>
      </div>
    </div>
  );
}
