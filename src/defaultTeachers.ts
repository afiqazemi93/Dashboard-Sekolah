import { Teacher } from './types';

const MALAY_FIRST_NAMES = [
  'Ahmad', 'Muhammad', 'Siti', 'Nor', 'Nur', 'Abdul', 'Mohd', 'Aiman', 'Syamil', 'Farhan',
  'Nazmi', 'Zulkifli', 'Khairul', 'Amin', 'Hakim', 'Faris', 'Safwan', 'Adli', 'Haziq', 'Amirul',
  'Aisha', 'Fatin', 'Syamimi', 'Anis', 'Nabilah', 'Athirah', 'Adlin', 'Zaharah', 'Faridah', 'Rosnah',
  'Halimah', 'Azizah', 'Maznah', 'Salmah', 'Aminah', 'Kamariah', 'Suhaila', 'Zarina', 'Rohana', 'Ruziah'
];

const MALAY_LAST_NAMES = [
  'bin Abdullah', 'bin Mohd', 'bin Ahmad', 'bin Ibrahim', 'bin Ismail', 'bin Yusuf', 'bin Ali', 'bin Ramli', 'bin Hashim', 'bin Rahman',
  'binti Abdullah', 'binti Mohd', 'binti Ahmad', 'binti Ibrahim', 'binti Ismail', 'binti Yusuf', 'binti Ali', 'binti Ramli', 'binti Hashim', 'binti Rahman'
];

const SUBJECTS = [
  'Bahasa Melayu', 'Bahasa Inggeris', 'Matematik', 'Sains', 'Sejarah',
  'Pendidikan Islam', 'Pendidikan Moral', 'Pendidikan Seni Visual',
  'Reka Bentuk dan Teknologi', 'Pendidikan Jasmani & Kesihatan', 'Muzik'
];

const GRADES = ['DG41', 'DG44', 'DG48', 'DG52', 'DG54'];

export function generateDefaultTeachers(): Teacher[] {
  const teachers: Teacher[] = [];
  
  // Realistic core teachers for the initial grid representation
  const coreTeachers = [
    { id: '1', name: 'Cg. Mohd Azlan bin Ramli', subject: 'Matematik', grade: 'DG48', photoUrl: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Cg. Siti Aminah binti Ahmad', subject: 'Bahasa Melayu', grade: 'DG44', photoUrl: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', name: 'Cg. Subramaniam a/l Murugan', subject: 'Sains', grade: 'DG52', photoUrl: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', name: 'Cg. Tan Bee Lee', subject: 'Bahasa Inggeris', grade: 'DG44', photoUrl: 'https://i.pravatar.cc/150?img=4' },
    { id: '5', name: 'Cg. Farhan bin Ismail', subject: 'Pendidikan Islam', grade: 'DG41', photoUrl: 'https://i.pravatar.cc/150?img=15' },
    { id: '6', name: 'Cg. Nurul Afiqah binti Ali', subject: 'Sejarah', grade: 'DG41', photoUrl: 'https://i.pravatar.cc/150?img=6' },
    { id: '7', name: 'Cg. Zulkifli bin Rahman', subject: 'Reka Bentuk dan Teknologi', grade: 'DG48', photoUrl: 'https://i.pravatar.cc/150?img=7' },
    { id: '8', name: 'Cg. Sarah Wong binti Abdullah', subject: 'Pendidikan Seni Visual', grade: 'DG44', photoUrl: 'https://i.pravatar.cc/150?img=9' },
    { id: '9', name: 'Cg. Thinesh a/l Raman', subject: 'Pendidikan Jasmani & Kesihatan', grade: 'DG41', photoUrl: 'https://i.pravatar.cc/150?img=13' },
  ];

  teachers.push(...coreTeachers);

  // Generate remaining up to 69 teachers
  for (let i = 10; i <= 69; i++) {
    const isFemale = i % 2 === 0;
    const firstName = MALAY_FIRST_NAMES[i % MALAY_FIRST_NAMES.length];
    
    let lastName = MALAY_LAST_NAMES[i % MALAY_LAST_NAMES.length];
    if (isFemale && lastName.startsWith('bin ')) {
      lastName = lastName.replace('bin ', 'binti ');
    } else if (!isFemale && lastName.startsWith('binti ')) {
      lastName = lastName.replace('binti ', 'bin ');
    }
    
    const subject = SUBJECTS[i % SUBJECTS.length];
    const grade = GRADES[i % GRADES.length];
    // Create random-ish profile image index avoiding typical breaks
    const imgIndex = ((i * 3) % 40) + 1;
    
    teachers.push({
      id: i.toString(),
      name: `Cg. ${firstName} ${lastName}`,
      subject,
      grade,
      photoUrl: `https://i.pravatar.cc/150?img=${imgIndex}`
    });
  }

  return teachers;
}
