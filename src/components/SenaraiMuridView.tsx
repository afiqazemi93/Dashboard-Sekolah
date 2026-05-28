import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Plus, Trash2, Edit2, Check, X, ShieldAlert, Users, HelpCircle, User, Filter } from 'lucide-react';
import { SchoolDetails, ClassHeadcount, StudentRecord } from '../types';

interface SenaraiMuridViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave?: (updatedDetails: SchoolDetails) => void;
}

export function SenaraiMuridView({ details, isAdmin, onSave }: SenaraiMuridViewProps) {
  // 1. Class headcounts data
  const [classData, setClassData] = useState<ClassHeadcount[]>(() => details.classData || []);

  // 2. Student lists
  const [students, setStudents] = useState<StudentRecord[]>(() => details.students || []);

  // React to prop updates from Firestore
  useEffect(() => {
    if (details.classData && details.classData.length > 0) {
      setClassData(details.classData);
    }
  }, [details.classData]);

  useEffect(() => {
    if (details.students && details.students.length > 0) {
      setStudents(details.students);
    }
  }, [details.students]);

  // Editing headcount states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMales, setEditMales] = useState<number>(0);
  const [editFemales, setEditFemales] = useState<number>(0);

  // Student Adding layout state
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('6 Bestari');
  const [newStudentGender, setNewStudentGender] = useState<'Lelaki' | 'Perempuan'>('Lelaki');

  // Search and Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('semua');

  // Helper values
  const totalStudentsFromClasses = classData.reduce((sum, c) => sum + c.males + c.females, 0);
  const totalMales = classData.reduce((sum, c) => sum + c.males, 0);
  const totalFemales = classData.reduce((sum, c) => sum + c.females, 0);

  const startEditing = (c: ClassHeadcount) => {
    setEditingId(c.id);
    setEditMales(c.males);
    setEditFemales(c.females);
  };

  const saveHeadingEdit = (id: string) => {
    const updated = classData.map(c => c.id === id ? { ...c, males: editMales, females: editFemales } : c);
    setClassData(updated);
    setEditingId(null);
    if (onSave) {
      onSave({
        ...details,
        classData: updated,
        students: students
      });
    }
  };

  const addStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const newRecord: StudentRecord = {
      id: `s_${Date.now()}`,
      name: newStudentName.trim(),
      idNumber: `SKBL-2026-${String(students.length + 1).padStart(3, '0')}`,
      className: newStudentClass,
      gender: newStudentGender
    };
    const updated = [newRecord, ...students];
    setStudents(updated);
    setNewStudentName('');
    setIsAddingStudent(false);
    if (onSave) {
      onSave({
        ...details,
        classData: classData,
        students: updated
      });
    }
  };

  const deleteStudent = (id: string) => {
    if (confirm('Adakah anda pasti untuk pemadam rekod murid ini?')) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      if (onSave) {
        onSave({
          ...details,
          classData: classData,
          students: updated
        });
      }
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'semua' || student.className === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 bg-white border border-gray-200 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Senarai Murid & Analisis Enrolmen</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Maklumat Enrolmen Murid SK Batu Lanchang</p>
          </div>
        </div>
        {isAdmin && (
          <div className="shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Urus Enrolmen: Admin
            </span>
          </div>
        )}
      </div>

      {/* METRIC CARD STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Jumlah Murid Terkini</span>
            <span className="text-2xl font-extrabold text-gray-950 mt-1 block">{totalStudentsFromClasses} orang</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bilangan Lelaki (L)</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{totalMales} orang</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-11 h-11 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Bilangan Perempuan (P)</span>
            <span className="text-2xl font-extrabold text-pink-600 mt-1 block">{totalFemales} orang</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Headcount breakdown per class */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center space-x-2">
              <span className="w-1.5 h-3.5 bg-blue-500 rounded-full shrink-0"></span>
              <span>Enrolmen Mengikut Kelas</span>
            </h3>
            {isAdmin && (
              <span className="text-[11px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                * Klik mana-mana butang untuk edit bilangan murid
              </span>
            )}
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Kelas</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Lelaki</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Perempuan</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Jumlah</th>
                  {isAdmin && <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Tindakan</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold">
                {classData.map((c) => {
                  const isEditing = editingId === c.id;
                  const classTotal = c.males + c.females;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/40 text-xs sm:text-sm text-gray-800">
                      <td className="px-4 py-3 text-gray-950 font-bold">{c.className}</td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editMales}
                            onChange={(e) => setEditMales(parseInt(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-center bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 font-semibold text-gray-900"
                            min="0"
                          />
                        ) : (
                          <span className="text-emerald-700">{c.males}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input 
                            type="number"
                            value={editFemales}
                            onChange={(e) => setEditFemales(parseInt(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-center bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 font-semibold text-gray-900"
                            min="0"
                          />
                        ) : (
                          <span className="text-pink-700">{c.females}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-blue-600 font-extrabold">{isEditing ? editMales + editFemales : classTotal}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="inline-flex space-x-1">
                              <button 
                                onClick={() => saveHeadingEdit(c.id)}
                                className="p-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm"
                                title="Simpan data"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all shadow-sm"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEditing(c)}
                              className="px-2.5 py-1 text-[11px] rounded bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-all shadow-sm font-semibold"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Search student roster database */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center space-x-2">
              <span className="w-1.5 h-3.5 bg-orange-500 rounded-full shrink-0"></span>
              <span>Daftar Murid Pilihan</span>
            </h3>
            {isAdmin && !isAddingStudent && (
              <button 
                onClick={() => setIsAddingStudent(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-[1.02] transition-all shadow-sm font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftar Murid</span>
              </button>
            )}
          </div>

          {/* Form Create Student */}
          {isAddingStudent && (
            <form onSubmit={addStudent} className="p-4 bg-white border border-gray-200 rounded-2xl space-y-3 mb-4 text-left animate-in slide-in-from-top-2 duration-200 shadow-sm">
              <div className="flex justify-between items-center pb-1">
                <span className="text-xs font-bold text-gray-700">Daftar Rekod Murid Baharu</span>
                <button type="button" onClick={() => setIsAddingStudent(false)} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block">Nama Murid</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Muhammad Adam"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block">Kelas</label>
                  <select 
                    value={newStudentClass}
                    onChange={(e) => setNewStudentClass(e.target.value)}
                    className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    {classData.map(c => (
                      <option key={c.className} value={c.className}>{c.className}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block">Jantina</label>
                  <select 
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as any)}
                    className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Lelaki">Lelaki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs hover:bg-blue-700 font-bold transition-all shadow-sm text-center"
              >
                Simpan & Daftar
              </button>
            </form>
          )}

          {/* Search roster */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Cari nama / ID murid..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 font-semibold shadow-sm"
              />
            </div>

            <div>
              <select 
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 font-semibold cursor-pointer shadow-sm"
              >
                <option value="semua">Semua Urus Kelas</option>
                {classData.map(c => (
                  <option key={c.className} value={c.className}>{c.className}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student list render */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((std) => (
                <div key={std.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between text-left hover:bg-gray-50 transition-all duration-150 shadow-sm sm:shadow-none">
                  <div>
                    <h5 className="font-bold text-gray-900 text-xs sm:text-sm">{std.name}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 flex items-center space-x-1.5">
                      <span>{std.idNumber}</span>
                      <span>•</span>
                      <span className="text-blue-500 font-extrabold">{std.className}</span>
                      <span>•</span>
                      <span className={std.gender === 'Lelaki' ? 'text-emerald-600' : 'text-pink-600'}>{std.gender}</span>
                    </p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => deleteStudent(std.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-semibold"
                      title="Padam rekod"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-12 text-center rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-xs font-bold font-mono">Tiada rekod ditemui.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
