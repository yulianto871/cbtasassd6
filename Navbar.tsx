import React from 'react';
import { ShieldCheck, UserCheck, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'register_exam' | 'leaderboard' | 'download_pdf' | 'admin';
  onSelectTab: (tab: 'dashboard' | 'register_exam' | 'leaderboard' | 'download_pdf' | 'admin') => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  onOpenAdminLogin: () => void;
  logoUrl?: string;
  schoolName: string;
  isOnlineSupabase?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isAdminLoggedIn,
  onAdminLogout,
  onOpenAdminLogin,
  logoUrl,
  schoolName,
  isOnlineSupabase,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title, one line */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 text-left cursor-pointer group whitespace-nowrap shrink-0"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-9 h-9 rounded-lg object-contain border border-slate-200 p-0.5"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-xs">
              SD
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors tracking-tight">
              CBT ASAS {schoolName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">
                Jenjang SD · Kelas 6
              </span>
              {isOnlineSupabase ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Database Supabase Online Terkoneksi">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200" title="Mode Lokal Browser (Offline)">
                  Lokal
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Zone 2: 4-5 nav links, 1-2 word labels, single line */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 font-semibold ${
              currentTab === 'dashboard'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('register_exam')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 font-semibold ${
              currentTab === 'register_exam'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Daftar & Kerjakan
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('leaderboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 font-semibold ${
              currentTab === 'leaderboard'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Leaderboard
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('download_pdf')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 font-semibold ${
              currentTab === 'download_pdf'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Unduh Hasil PDF
          </button>
          {isAdminLoggedIn && (
            <button
              type="button"
              onClick={() => onSelectTab('admin')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 font-semibold ${
                currentTab === 'admin'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin CMS
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectTab('admin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Panel Admin
              </button>
              <button
                type="button"
                onClick={onAdminLogout}
                title="Keluar Admin"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" /> Login Admin
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav links */}
      <div className="md:hidden border-t border-slate-200 bg-slate-50/90 px-4 py-2 flex items-center justify-around text-xs font-semibold">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`py-1 ${currentTab === 'dashboard' ? 'text-red-700 font-bold' : 'text-slate-600'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('register_exam')}
          className={`py-1 ${currentTab === 'register_exam' ? 'text-red-700 font-bold' : 'text-slate-600'}`}
        >
          Kerjakan Tes
        </button>
        <button
          onClick={() => onSelectTab('leaderboard')}
          className={`py-1 ${currentTab === 'leaderboard' ? 'text-red-700 font-bold' : 'text-slate-600'}`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => onSelectTab('download_pdf')}
          className={`py-1 ${currentTab === 'download_pdf' ? 'text-red-700 font-bold' : 'text-slate-600'}`}
        >
          Unduh PDF
        </button>
      </div>
    </header>
  );
};
