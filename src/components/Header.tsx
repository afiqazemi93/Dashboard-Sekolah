import React from 'react';
import { Menu } from 'lucide-react';
import { SchoolDetails } from '../types';

interface HeaderProps {
  schoolDetails: SchoolDetails;
  onMenuClick?: () => void;
}

export function Header({ schoolDetails, onMenuClick }: HeaderProps) {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 sm:px-6 bg-white/40 backdrop-blur-md border-b border-gray-100 w-full py-4 relative z-40">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick} 
          className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
        >
           <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}
