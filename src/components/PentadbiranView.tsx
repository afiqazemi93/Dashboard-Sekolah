import React from 'react';
import { Users, Network, BookOpen, UserCheck, GraduationCap, Briefcase, Mars, Venus } from 'lucide-react';
import { SchoolDetails, Teacher } from '../types';
import { StaffListSection } from './StaffListSection';

interface PentadbiranViewProps {
  details: SchoolDetails;
  isAdmin: boolean;
  onSave: (details: SchoolDetails) => void;
}

export function PentadbiranView({ details, isAdmin, onSave }: PentadbiranViewProps) {
  const pentadbirs = details.pentadbirs || [];
  const teachers = details.teachers || [];
  const akpStaffs = details.akpStaffs || [];

  // Helper function to match genders helper based on name pattern rules:
  // - nama ada bin : Lelaki
  // - nama ada binti : Perempuan
  // - nama ada A/L : Lelaki
  // - nama ada A/P : Perempuan
  const getGender = (name: string): 'L' | 'P' => {
    const u = name.toUpperCase();
    if (u.includes('BINTI') || u.includes('BINTI ') || u.includes(' BT ') || u.includes(' BT.') || u.includes('A/P') || u.includes('AP ')) {
      return 'P';
    }
    if (u.includes('BIN') || u.includes('BIN ') || u.includes('A/L') || u.includes('AL ')) {
      return 'L';
    }
    // Safeguards & generic heuristics for common Malaysian prefixes / titles
    if (u.startsWith('PN.') || u.includes('PN ') || u.includes('PUAN') || u.includes('SITI') || u.includes('FATIMAH') || u.includes('NOR ') || u.includes('NUR ')) {
      return 'P';
    }
    if (u.startsWith('EN.') || u.includes('EN ') || u.includes('ENCIK')) {
      return 'L';
    }
    return 'L'; // Safe default
  };

  // Barisan Pentadbir also counted as teachers as requested ("Barisan Pentadbir juga mereka itu guru.")
  let guruLelaki = 0;
  let guruPerempuan = 0;
  let akpLelaki = 0;
  let akpPerempuan = 0;

  pentadbirs.forEach(p => {
    if (getGender(p.name) === 'L') {
      guruLelaki++;
    } else {
      guruPerempuan++;
    }
  });

  teachers.forEach(t => {
    if (getGender(t.name) === 'L') {
      guruLelaki++;
    } else {
      guruPerempuan++;
    }
  });

  akpStaffs.forEach(a => {
    if (getGender(a.name) === 'L') {
      akpLelaki++;
    } else {
      akpPerempuan++;
    }
  });

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto">
      {/* Title section */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-11 h-11 bg-white border border-gray-200 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <Network className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Organisasi Sekolah</h2>
      </div>

      {/* Dynamic Gender Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Guru Lelaki"
          subtitle=""
          value={guruLelaki.toString()}
          fromColor="from-[#3b82f6]"
          toColor="to-[#2563eb]"
          iconColor="text-white"
          bgIconColor="bg-white/20"
          icon={Mars}
        />
        <MetricCard 
          title="Guru Perempuan"
          subtitle=""
          value={guruPerempuan.toString()}
          fromColor="from-[#ec4899]"
          toColor="to-[#db2777]"
          iconColor="text-white"
          bgIconColor="bg-white/20"
          icon={Venus}
        />
        <MetricCard 
          title="Staf AKP Lelaki"
          subtitle=""
          value={akpLelaki.toString()}
          fromColor="from-[#1fb2a6]"
          toColor="to-[#14998d]"
          iconColor="text-white"
          bgIconColor="bg-white/20"
          icon={Mars}
        />
        <MetricCard 
          title="Staf AKP Perempuan"
          subtitle=""
          value={akpPerempuan.toString()}
          fromColor="from-[#f97316]"
          toColor="to-[#ea580c]"
          iconColor="text-white"
          bgIconColor="bg-white/20"
          icon={Venus}
        />
      </div>

      <div className="space-y-6">
        <StaffListSection
          title="Barisan Pentadbir"
          items={details.pentadbirs || []}
          isAdmin={isAdmin}
          onUpdateItems={(updated) => onSave({ ...details, pentadbirs: updated })}
          maxItems={30}
          subjectLabel="Peranan"
          subjectPlaceholder="Contoh: PK Pentadbiran"
          gradeLabel="Gred Jawatan"
          gradePlaceholder="Contoh: DG48"
          searchPlaceholder="Cari pentadbir..."
          addButtonText="Tambah Pentadbir"
          emptyMessage="Tiada barisan maklumat."
          filterAllText="Semua Peranan"
          sortFn={(a, b) => {
            const roleOrder: Record<string, number> = {
              "Guru Besar": 1,
              "PK Pentadbiran": 2,
              "PK Hal Ehwal Murid": 3,
              "PK HEM": 3,
              "PK Kokurikulum": 4,
              "PK Petang": 5,
              "PK Pendidikan Khas": 6
            };
            const roleA = a.subject || '';
            const roleB = b.subject || '';
            const orderA = roleOrder[roleA] || 99;
            const orderB = roleOrder[roleB] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name);
          }}
          badgePosition="top"
        />

        <StaffListSection
          title="Barisan Guru"
          items={details.teachers || []}
          isAdmin={isAdmin}
          onUpdateItems={(updated) => onSave({ ...details, teachers: updated })}
          maxItems={100}
          subjectLabel="Opsyen / Subjek"
          subjectPlaceholder="Contoh: Bahasa Melayu"
          gradeLabel="Gred"
          gradePlaceholder="Contoh: DG44"
          searchPlaceholder="Cari guru..."
          addButtonText="Tambah Guru"
          emptyMessage="Tiada senarai guru ditemui."
          filterAllText="Semua Opsyen"
          showGradeFilter={true}
        />

        <div className="pb-10">
          <StaffListSection
            title="Barisan Staf AKP"
            items={details.akpStaffs || []}
            isAdmin={isAdmin}
            onUpdateItems={(updated) => onSave({ ...details, akpStaffs: updated })}
            maxItems={30}
            subjectLabel="Jawatan"
            subjectPlaceholder="Contoh: Pembantu Tadbir"
            gradeLabel="Gred Gaji"
            gradePlaceholder="Contoh: N19"
            searchPlaceholder="Cari staf..."
            addButtonText="Tambah Staf AKP"
            emptyMessage="Tiada senarai staf ditemui."
            filterAllText="Semua Jawatan"
            sortFn={(a, b) => {
              const getRoleRank = (subject: string): number => {
                const subStr = subject.trim().toLowerCase();
                if (subStr.includes("ketua pembantu tadbir") || subStr === "kpt") return 1;
                if (subStr.includes("pembantu tadbir") || subStr === "pt") return 2;
                if (subStr.includes("pembantu operasi") || subStr === "po") return 3;
                if (subStr.includes("pembantu pengurusan murid") || subStr.includes("ppm")) return 4;
                return 99;
              };

              const rankA = getRoleRank(a.subject || '');
              const rankB = getRoleRank(b.subject || '');

              if (rankA !== rankB) return rankA - rankB;
              return a.name.localeCompare(b.name);
            }}
          />
        </div>
      </div>
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
           <h4 className="text-white/90 text-[14px] font-bold mb-0.5 leading-none">{title}</h4>
           <div className="text-3xl font-black text-white tracking-tight leading-none mb-1 mt-1.5">{value}</div>
           <div className="text-white/80 text-[11px] font-medium leading-none">{subtitle}</div>
         </div>
       </div>
       <div className="absolute top-4 right-4 flex items-start justify-end opacity-50 z-0">
          <div className="flex space-x-1">
             <div className="w-1 h-1 rounded-full bg-white"></div>
             <div className="w-1 h-1 rounded-full bg-white"></div>
             <div className="w-1 h-1 rounded-full bg-white"></div>
          </div>
       </div>
    </div>
  );
}
