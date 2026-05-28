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
  return [];
}
