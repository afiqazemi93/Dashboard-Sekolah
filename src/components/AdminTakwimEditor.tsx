import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react';

interface AdminTakwimEditorProps {
  events: CalendarEvent[];
  onChange: (events: CalendarEvent[]) => void;
}

export function AdminTakwimEditor({ events, onChange }: AdminTakwimEditorProps) {
  const days = ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
  const monthNames = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const [calDate, setCalDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // Format: YYYY-MM-DD
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [evTitle, setEvTitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evType, setEvType] = useState<'event' | 'holiday' | 'school_holiday' | 'public_holiday'>('event');

  const year = calDate.getFullYear();
  const month = calDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const prevDates = Array.from({ length: firstDayIndex }).map((_, i) => prevMonthDays - firstDayIndex + i + 1);
  const dates = Array.from({ length: daysInMonth }).map((_, i) => i + 1);
  
  const totalSlots = firstDayIndex + daysInMonth;
  const nextDates = Array.from({ length: Math.ceil(totalSlots / 7) * 7 - totalSlots }).map((_, i) => i + 1);

  const prevMonth = () => setCalDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalDate(new Date(year, month + 1, 1));

  const toggleDateSelection = (d: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (selectedDates.includes(dStr)) {
      setSelectedDates(selectedDates.filter(sd => sd !== dStr));
    } else {
      setSelectedDates([...selectedDates, dStr]);
      setShowForm(true);
    }
  };

  const handleSaveEvents = () => {
    if (!evTitle) return;
    
    selectedDates.sort();

    const newEvent: CalendarEvent = {
      id: Date.now().toString() + Math.random().toString(),
      type: evType,
      title: evTitle,
      desc: evDesc,
      date: selectedDates[0],
      dates: selectedDates,
      day: parseInt(selectedDates[0].split('-')[2])
    };

    onChange([...events, newEvent]);
    
    // Reset form
    setEvTitle('');
    setEvDesc('');
    setEvType('event');
    setSelectedDates([]);
    setShowForm(false);
  };

  const removeEvent = (id: string) => {
    onChange(events.filter(e => e.id !== id));
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar View */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-[14px] text-gray-900">{monthNames[month]} {year}</span>
            <div className="flex items-center space-x-1">
               <button type="button" onClick={prevMonth} className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all" aria-label="Bulan Sebelumnya"><ChevronLeft className="w-4 h-4" /></button>
               <button type="button" onClick={nextMonth} className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all" aria-label="Bulan Seterusnya"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((day, i) => (
              <div key={i} className="text-center font-bold text-[11px] text-gray-500 pb-1">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {prevDates.map(d => (
              <div key={`p${d}`} className="flex justify-center items-center h-8 text-[12px] text-gray-300">
                {d}
              </div>
            ))}
            
            {dates.map(d => {
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = selectedDates.includes(dStr);
              // Find if event exists for this exact date OR if it's legacy matching the day logic precisely for May 2026.
              const isLegacyMatch = year === 2026 && month === 4 && events.find(e => e.day === d && !e.date);
              const eventMatch = events.find(e => (e.dates && e.dates.includes(dStr)) || e.date === dStr) || isLegacyMatch;
              
              const isEvent = eventMatch && eventMatch.type === 'event';
              const isSchoolHoliday = eventMatch && eventMatch.type === 'school_holiday';
              const isPublicHoliday = eventMatch && eventMatch.type === 'public_holiday';
              const isGenericHoliday = eventMatch && eventMatch.type === 'holiday';

              return (
                <button 
                  key={d} 
                  type="button"
                  onClick={() => toggleDateSelection(d)}
                  className={`flex justify-center items-center h-8 rounded-lg text-[13px] font-bold transition-all border
                    ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 
                      isSchoolHoliday ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                      isPublicHoliday ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' :
                      isEvent ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' :
                      isGenericHoliday ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' :
                      'bg-white text-gray-700 border-gray-100 hover:bg-gray-50 hover:border-gray-200 shadow-sm'
                    }`}
                >
                  {d}
                </button>
              );
            })}

            {nextDates.map(d => (
              <div key={`n${d}`} className="flex justify-center items-center h-8 text-[12px] text-gray-300">
                {d}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-center text-gray-400 mt-3 italic">
            Klik tarikh pada jadual di atas untuk tambah aktiviti/cuti
          </div>
        </div>

        {/* Right side form */}
        {showForm && selectedDates.length > 0 && (
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-bold text-gray-800 text-sm">
                Tambah ke {selectedDates.length} Tarikh
              </h5>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                 <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tajuk Aktiviti</label>
                 <input type="text" value={evTitle} onChange={e => setEvTitle(e.target.value)} placeholder="Contoh: Perkhemahan Sekolah" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
              </div>
              <div>
                 <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Butiran / Penerangan</label>
                 <textarea value={evDesc} onChange={e => setEvDesc(e.target.value)} placeholder="Opsional" rows={2} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-sm" />
              </div>
              <div>
                 <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Jenis Aktiviti</label>
                 <select value={evType} onChange={e => setEvType(e.target.value as 'event' | 'holiday' | 'school_holiday' | 'public_holiday')} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
                   <option value="event">Peristiwa Sekolah</option>
                   <option value="school_holiday">Cuti Sekolah (Hijau)</option>
                   <option value="public_holiday">Cuti Umum (Merah)</option>
                   <option value="holiday">Cuti/Rehat (Oren)</option>
                 </select>
              </div>
              
              <button type="button" onClick={handleSaveEvents} disabled={!evTitle} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors">
                Simpan Jadual
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List of currently scheduled events for this month */}
      {events.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h5 className="font-bold text-gray-800 text-sm mb-3">Senarai Takwim</h5>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {events.slice().sort((a,b) => (a.date || '').localeCompare(b.date || '') || (a.day || 0) - (b.day || 0)).map((ev) => (
              <div key={ev.id} className="flex justify-between items-center text-sm border border-gray-100 p-2.5 rounded-lg bg-white shadow-sm">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800">
                    {ev.dates && ev.dates.length > 1 ? `${formatDateDisplay(ev.dates[0])} hingga ${formatDateDisplay(ev.dates[ev.dates.length - 1])}` : (ev.date ? formatDateDisplay(ev.date) : `Mei ${ev.day}`)} - {ev.title || 'Tiada Tajuk'}
                  </span>
                  {ev.desc && <span className="text-xs text-gray-500">{ev.desc}</span>}
                  <span className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-md inline-block w-fit ${
                    ev.type === 'school_holiday' ? 'bg-green-100 text-green-700' :
                    ev.type === 'public_holiday' ? 'bg-red-100 text-red-700' :
                    ev.type === 'event' ? 'bg-teal-100 text-teal-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {ev.type === 'school_holiday' ? 'Cuti Sekolah' :
                     ev.type === 'public_holiday' ? 'Cuti Umum' :
                     ev.type === 'event' ? 'Peristiwa' : 'Cuti'}
                  </span>
                </div>
                <button type="button" onClick={() => removeEvent(ev.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
