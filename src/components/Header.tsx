import React, { useState } from 'react';
import { 
  UserAccount, 
  CampaignConfig, 
  AppNotification 
} from '../types';
import { 
  ShieldCheck, 
  User, 
  Bell, 
  Database, 
  CheckCircle, 
  ChevronDown, 
  LogOut, 
  RefreshCw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  config: CampaignConfig;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  notifications: AppNotification[];
  isSupabaseConnected: boolean;
  onSwitchUser: (user: UserAccount) => void;
  onOpenDatabaseModal: () => void;
  onOpenLoginModal: () => void;
  onSelectTab: (tab: string) => void;
  onClearNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentUser,
  allUsers = [],
  notifications = [],
  isSupabaseConnected = false,
  onSwitchUser = (_u: UserAccount) => {},
  onOpenDatabaseModal = () => {},
  onOpenLoginModal = () => {},
  onSelectTab = (_t: string) => {},
  onClearNotifications = () => {}
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const safeNotifs = notifications || [];
  const safeUsers = allUsers || [];
  const unreadCount = safeNotifs.filter(n => !n.read).length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">ADMIN</span>;
      case 'owner':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">OWNER / KANDIDAT</span>;
      case 'tim_pemenangan':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">TIM PEMENANGAN</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left Section: Bento Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0">
            <ShieldCheck className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
              {config.candidateName || 'PANTAUAN PEMENANGAN'}
            </h1>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span>Candidate Command Center v2.0</span>
              <span className="hidden sm:inline-block text-slate-500">•</span>
              <span className="hidden sm:inline-block text-slate-400 font-normal">{config.electionRegion}</span>
            </p>
          </div>
        </div>

        {/* Right Section: Access Mode & Profile Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Database Sync Badge */}
          <button
            onClick={onOpenDatabaseModal}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${
              isSupabaseConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
            title="Pengaturan Database & Supabase"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>{isSupabaseConnected ? 'Supabase Realtime' : 'Lokal Mode'}</span>
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </button>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors relative"
              aria-label="Pemberitahuan"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black font-bold text-[10px] rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-xs text-slate-200">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                  <span className="font-bold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    Pemberitahuan ({safeNotifs.length})
                  </span>
                  {safeNotifs.length > 0 && (
                    <button
                      onClick={onClearNotifications}
                      className="text-[10px] text-slate-400 hover:text-amber-400"
                    >
                      Tandai Dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {safeNotifs.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Belum ada notifikasi baru.</p>
                  ) : (
                    safeNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (notif.linkTab) onSelectTab(notif.linkTab);
                          setShowNotifMenu(false);
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          notif.type === 'urgent'
                            ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20'
                            : notif.type === 'command'
                            ? 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-semibold text-white flex items-center gap-1">
                            {notif.type === 'urgent' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                            {notif.type === 'command' && <Sparkles className="w-3 h-3 text-indigo-400" />}
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge & Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-3 text-right hover:opacity-95 transition-opacity"
            >
              <div className="hidden sm:block">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Mode Akses</p>
                <p className="text-xs sm:text-sm font-bold text-amber-500 uppercase tracking-tight">
                  {currentUser.role === 'owner' ? 'OWNER / KANDIDAT' : currentUser.role.toUpperCase()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full border-2 border-amber-500/50 p-0.5 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-xs">
                <div className="pb-3 mb-3 border-b border-white/10">
                  <p className="font-bold text-white text-sm">{currentUser.name}</p>
                  <p className="text-slate-400 text-[11px]">{currentUser.email}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {getRoleBadge(currentUser.role)}
                    <span className="text-[10px] text-slate-400">
                      {currentUser.assignedRegion || 'Akses Nasional'}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider mb-2">
                  Ganti Akun Demo / Test User
                </p>

                <div className="space-y-1">
                  {safeUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSwitchUser(user);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        currentUser.id === user.id
                          ? 'bg-amber-500/10 border border-amber-500/30 text-white'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.role.toUpperCase()} • {user.assignedRegion || 'Semua Wilayah'}</p>
                      </div>
                      {currentUser.id === user.id && <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                    </button>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onOpenLoginModal();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-1 text-slate-300 hover:text-white py-1 px-2.5 rounded-lg hover:bg-white/5"
                  >
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Login Akun Lain</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenDatabaseModal();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-amber-400 py-1 px-2.5 rounded-lg hover:bg-white/5"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Database</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
