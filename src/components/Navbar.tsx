import React from 'react';
import { Bell, HeartHandshake, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  onOpenNotifications: () => void;
  unreadCount?: number;
  onNavigateToProfile: () => void;
}

export function Navbar({ onOpenNotifications, unreadCount = 0, onNavigateToProfile }: NavbarProps) {
  const { user, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3.5 py-2 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#FFD200] flex items-center justify-center shadow-2xs text-slate-950 font-bold shrink-0">
            <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-[15px] leading-none tracking-tight text-slate-950">
              GURMAD QOYS
            </h1>
            <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
              Bulshada raadinta dadka maqan
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Notifications Button */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Ogaysiisyada"
            className="relative p-2 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Status / Login */}
          {user ? (
            <button
              type="button"
              onClick={onNavigateToProfile}
              aria-label={`Profile: ${user.name}`}
              className="relative p-0.5 rounded-full hover:ring-2 hover:ring-amber-400 transition"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#FFD200] text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-2xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#FFD200] text-slate-950 hover:bg-amber-400 active:scale-95 transition shadow-2xs"
            >
              Gal akoon
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
