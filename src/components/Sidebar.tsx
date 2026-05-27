import React from 'react';
import { TabId } from '../types';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  Trophy,
  LogIn,
  LogOut,
  School,
  Network,
  UserCheck,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onOpenLogin: () => void;
  isAdmin: boolean;
  onLogoutAction: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  logoUrl?: string; // Added logoUrl
}

export function Sidebar({ activeTab, onTabChange, onOpenLogin, isAdmin, onLogoutAction, isOpen, onClose, logoUrl }: SidebarProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (['pentadbiran', 'organisasi', 'keberadaan', 'senarai_murid'].includes(activeTab)) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [activeTab]);

  const tabs = [
    { id: 'maklumat' as TabId, label: 'Maklumat Sekolah', icon: School },
    { 
      id: 'pentadbiran' as TabId, 
      label: 'Pentadbiran', 
      icon: Building2,
      subTabs: [
        { id: 'organisasi' as TabId, label: 'Organisasi Sekolah', icon: Network },
        { id: 'keberadaan' as TabId, label: 'Keberadaan', icon: UserCheck },
        { id: 'senarai_murid' as TabId, label: 'Senarai Murid', icon: GraduationCap },
      ]
    },
    { id: 'kurikulum' as TabId, label: 'Kurikulum', icon: BookOpen },
    { id: 'hem' as TabId, label: 'HEM', icon: Users },
    { id: 'kokurikulum' as TabId, label: 'Kokurikulum', icon: Trophy },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      <div 
        className={clsx(
          "w-[260px] bg-[#0c111d] border-r border-slate-800/50 h-[100dvh] flex flex-col pt-5 pb-4 lg:pt-7 lg:pb-6 fixed lg:sticky top-0 shrink-0 z-50 transition-transform duration-300 ease-in-out overflow-hidden self-start",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Subtle background glow blobs */}
        <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
        <div className="absolute right-[-80px] top-1/3 w-36 h-36 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
 
        {/* Brand */}
        <div className="px-5 flex items-center justify-between mb-5 lg:mb-9 mt-1 relative z-10 shrink-0 gap-1.5">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="relative group transition-transform duration-300 hover:scale-[1.03] shrink-0">
              {logoUrl ? (
                 <img loading="lazy" decoding="async" src={logoUrl} alt="Logo" className="w-[34px] h-[34px] lg:w-[38px] lg:h-[38px] object-contain bg-white/5 rounded-xl border border-white/10 p-1 shrink-0 shadow-sm" />
               ) : (
                 <div className="w-[34px] h-[34px] lg:w-[38px] lg:h-[38px] bg-blue-600/10 border border-blue-500/20 rounded-xl shrink-0 shadow-sm flex items-center justify-center text-blue-400 font-extrabold text-xs font-mono">SK</div>
               )}
              <div className="absolute inset-0 bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm pointer-events-none" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="font-extrabold text-white text-[13px] lg:text-[14px] tracking-tight leading-none truncate">Dashboard SKBL</h1>
            </div>
          </div>
        </div>
 
        {/* Navigation */}
        <nav className="flex-1 px-3.5 space-y-1 lg:space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (tab.subTabs && tab.subTabs.some(s => s.id === activeTab));
            
            return (
              <div key={tab.id} className="space-y-1">
                <button
                  onClick={() => {
                    if (tab.subTabs) {
                      const isParentOrSubtabActive = activeTab === tab.id || tab.subTabs.some(s => s.id === activeTab);
                      if (isParentOrSubtabActive) {
                        setIsExpanded(!isExpanded);
                      } else {
                        onTabChange('organisasi' as TabId);
                        setIsExpanded(true);
                      }
                    } else {
                      onTabChange(tab.id);
                    }
                  }}
                  className={twMerge(
                    clsx(
                      'w-full flex items-center space-x-3 px-3.5 py-2.5 lg:px-4 lg:py-3 rounded-xl text-[13px] lg:text-[13.5px] font-semibold transition-all duration-200 relative group',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/10 to-indigo-600/10 text-blue-400 border border-blue-500/20 shadow-[0_4px_12px_rgba(37,99,235,0.03)]'
                        : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-100'
                    )
                  )}
                >
                  {/* Micro-glow Active Lightbar */}
                  {isActive && (
                    <span className="absolute left-0 w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                  )}
                  <Icon className={clsx("w-4.5 h-4.5 transition-colors duration-200 shrink-0", isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200")} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.subTabs && (
                    <ChevronDown className={clsx("w-4.5 h-4.5 transition-transform duration-250 shrink-0", isExpanded ? "rotate-180" : "", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                  )}
                </button>
                
                <AnimatePresence initial={false}>
                  {isExpanded && tab.subTabs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="pl-7 pr-2 py-0.5 space-y-0.5 overflow-hidden"
                    >
                      {tab.subTabs.map(subTab => {
                        const isSubActive = activeTab === subTab.id;
                        const SubIcon = subTab.icon;
                        return (
                          <button
                            key={subTab.id}
                            onClick={() => onTabChange(subTab.id)}
                            className={clsx(
                              "w-full flex items-center space-x-2.5 px-3 py-1.5 text-[11.5px] lg:text-[12px] font-medium rounded-lg transition-all duration-200 group/sub",
                              isSubActive 
                                ? "text-blue-400 bg-blue-500/10 font-semibold shadow-[0_2px_8px_rgba(59,130,246,0.05)] border border-blue-500/10"
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                            )}
                          >
                            <SubIcon className={clsx("w-4 h-4 shrink-0 transition-colors duration-200", isSubActive ? "text-blue-400" : "text-slate-500 group-hover/sub:text-slate-400")} />
                            <span>{subTab.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
 
        {/* Admin Login / Logout Action */}
        <div className="px-3.5 mt-auto pt-4 border-t border-slate-800/40 relative z-10 shrink-0">
           {isAdmin ? (
             <button
                onClick={onLogoutAction}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold text-red-400 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-500/40 hover:text-red-300 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Log Keluar</span>
              </button>
           ) : (
             <button
                onClick={onOpenLogin}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 shadow-sm"
              >
                <LogIn className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Login Admin</span>
              </button>
           )}
        </div>
      </div>
    </>
  );
}
