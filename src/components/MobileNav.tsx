import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  FileText, 
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { UserRole, UserAccount } from '../types';

interface MobileNavProps {
  activeTab: string;
  userRole?: UserRole;
  currentUser?: UserAccount;
  urgentCount?: number;
  eventsCount?: number;
  onSelectTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  onOpenMoreMenu?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  userRole,
  currentUser,
  urgentCount,
  eventsCount,
  onSelectTab,
  setActiveTab,
  onOpenMoreMenu
}) => {
  const role = currentUser?.role || userRole || 'tim_pemenangan';
  const isOwner = role === 'owner' || role === 'admin';
  const count = urgentCount ?? eventsCount ?? 0;

  const handleSelect = (tab: string) => {
    if (onSelectTab) onSelectTab(tab);
    else if (setActiveTab) setActiveTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-t border-white/10 px-2 py-1.5 shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1.5 text-center">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => handleSelect('dashboard')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-amber-500 bg-amber-500/10 font-bold border border-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Dasbor</span>
        </button>

        {/* Tab 2: Data Pemilih */}
        <button
          onClick={() => handleSelect('voters')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'voters'
              ? 'text-amber-500 bg-amber-500/10 font-bold border border-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Pemilih</span>
        </button>

        {/* Tab 3: Laporan Kegiatan */}
        <button
          onClick={() => handleSelect('activities')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            activeTab === 'activities'
              ? 'text-amber-500 bg-amber-500/10 font-bold border border-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Kegiatan</span>
        </button>

        {/* Tab 4: AI Advisor / Emergency Events */}
        {isOwner ? (
          <button
            onClick={() => handleSelect('ai_advisor')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
              activeTab === 'ai_advisor' || activeTab === 'ai-advisor'
                ? 'text-indigo-400 bg-indigo-500/10 font-bold border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] leading-tight">AI Advisor</span>
          </button>
        ) : (
          <button
            onClick={() => handleSelect('events')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
              activeTab === 'events' || activeTab === 'urgent-events'
                ? 'text-rose-400 bg-rose-500/10 font-bold border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Kejadian</span>
            {count > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
        )}

        {/* Tab 5: Menu Lainnya */}
        <button
          onClick={() => {
            if (onOpenMoreMenu) onOpenMoreMenu();
            else handleSelect('users');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
            ['command-center', 'commands', 'opponents', 'users', 'export', 'reports', 'backup'].includes(activeTab)
              ? 'text-amber-500 bg-amber-500/10 font-bold border border-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
