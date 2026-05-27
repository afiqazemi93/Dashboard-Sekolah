import React from 'react';
import { Trophy, Activity, Medal } from 'lucide-react';

export function KokurikulumView() {
  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Title section */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-11 h-11 bg-white border border-gray-200 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <Trophy className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kokurikulum</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center pb-8 border-t-4 border-t-yellow-400">
          <Medal className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Hall of Fame</h3>
          <p className="text-sm text-gray-500 line-clamp-2">Pencapaian cemerlang murid dalam sukan dan unit beruniform peringkat PPD/Negeri.</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 pb-10 xl:col-span-2">
          <Activity className="w-8 h-8 text-blue-600 bg-blue-50 p-1.5 rounded-lg mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Jadual Aktiviti Mingguan</h3>
          <p className="text-sm text-gray-500 mb-6">Penjadualan rumah sukan, kelab/persatuan, dan badan beruniform.</p>
          <ul className="space-y-3">
             <li className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="font-semibold text-gray-700">Rabu, 2:00 PM</span>
                <span className="text-gray-500">Aktiviti Unit Beruniform</span>
             </li>
             <li className="flex justify-between items-center text-sm pb-2">
                <span className="font-semibold text-gray-700">Khamis, 4:00 PM</span>
                <span className="text-gray-500">Latihan Rumah Sukan</span>
             </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
