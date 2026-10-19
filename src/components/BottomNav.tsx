import React from 'react';
import { Home, Plus, Megaphone, User } from 'lucide-react';

export type TabType = 'home' | 'baafi' | 'promote' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-100 py-1.5 px-4 shadow-md"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 items-center">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
            activeTab === 'home' ? 'text-slate-950 font-extrabold' : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5] text-slate-950 fill-slate-950' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] leading-tight mt-0.5">Home</span>
          {activeTab === 'home' && (
            <span className="w-1 h-1 bg-[#FFD200] rounded-full mt-0.5" />
          )}
        </button>

        {/* 2. BAAFI */}
        <button
          type="button"
          onClick={() => onChangeTab('baafi')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
            activeTab === 'baafi' ? 'text-slate-950 font-extrabold' : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="w-5 h-5 rounded-md bg-slate-700 text-white flex items-center justify-center shadow-2xs">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="text-[11px] leading-tight mt-0.5">BAAFI</span>
          {activeTab === 'baafi' && (
            <span className="w-1 h-1 bg-[#FFD200] rounded-full mt-0.5" />
          )}
        </button>

        {/* 3. Promote */}
        <button
          type="button"
          onClick={() => onChangeTab('promote')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
            activeTab === 'promote' ? 'text-slate-950 font-extrabold' : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Megaphone className={`w-5 h-5 ${activeTab === 'promote' ? 'stroke-[2.5] text-slate-950 fill-slate-950' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] leading-tight mt-0.5">Promote</span>
          {activeTab === 'promote' && (
            <span className="w-1 h-1 bg-[#FFD200] rounded-full mt-0.5" />
          )}
        </button>

        {/* 4. Profile */}
        <button
          type="button"
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
            activeTab === 'profile' ? 'text-slate-950 font-extrabold' : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5] text-slate-950' : 'stroke-[1.8]'}`} />
          <span className="text-[11px] leading-tight mt-0.5">Profile</span>
          {activeTab === 'profile' && (
            <span className="w-1 h-1 bg-[#FFD200] rounded-full mt-0.5" />
          )}
        </button>
      </div>
    </nav>
  );
}
