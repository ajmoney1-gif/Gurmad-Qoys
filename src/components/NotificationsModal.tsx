import React, { useEffect, useState } from 'react';
import { X, Bell, Check, MessageSquare, Sparkles, Shield, Clock } from 'lucide-react';
import { NotificationItem } from '../types/index.ts';
import { api } from '../services/api.ts';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNotificationLink?: (linkId?: string) => void;
}

export function NotificationsModal({ isOpen, onClose, onSelectNotificationLink }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getNotifications()
        .then((res) => {
          setNotifications(res.items || []);
          api.markNotificationsRead().catch(() => {});
        })
        .catch((e) => console.warn('Could not load notifications', e))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ogeysiisyada"
      className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4 my-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center">
              <Bell className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Ogeysiisyada (Notifications)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Xir daaqadda ogeysiisyada"
            className="p-1 rounded-full text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2.5">
          {loading ? (
            <p className="text-center py-6 text-xs text-slate-400">Waxaa la soo gelinayaa...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-xs text-slate-500 font-medium">Ma jiraan ogeysiisyo cusub.</p>
              <p className="text-[10px] text-slate-400">Wararka ku saabsan warbixinahaaga ayaa halkan ka muuqan doona.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.linkId && onSelectNotificationLink) {
                    onSelectNotificationLink(n.linkId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  n.read ? 'bg-white border-slate-100 text-slate-700' : 'bg-amber-50/60 border-amber-200 text-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {n.type === 'comment' && <MessageSquare className="w-3.5 h-3.5 text-blue-600" />}
                    {n.type === 'campaign' && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                    {n.type === 'status_change' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    <h4 className="text-xs font-bold">{n.title}</h4>
                  </div>
                  <span className="text-[9px] text-slate-400 shrink-0">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">{n.message}</p>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
        >
          Xir
        </button>
      </div>
    </div>
  );
}
