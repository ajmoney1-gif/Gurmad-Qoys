import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';

interface AbuseReportModalProps {
  reportId: string | null;
  onClose: () => void;
}

export function AbuseReportModal({ reportId, onClose }: AbuseReportModalProps) {
  const [reason, setReason] = useState<string>('inaccurate_info');
  const [notes, setNotes] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!reportId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.submitAbuseReport({
        reportId,
        reason,
        notes: notes.trim(),
        reporterContact: reporterContact.trim(),
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Dacwada lama gudbin karo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Soo sheeg xog khaldan"
      className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Soo sheeg Dacwo ama Xog Khaldan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Mahadsanid</h4>
            <p className="text-xs text-slate-600">
              Dacwadaada waxaa loo gudbiyey maamulka GURMAD QOYS si loo xaqiijiyo loona saxo.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Xir
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-xl">{errorMessage}</p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sababta dacwada *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="inaccurate_info">Xogta qoran ma saxna / been abuur</option>
                <option value="person_found_unresolved">Qofka waa la helay laakiin lama xirin</option>
                <option value="inappropriate_image">Sawirka la geliyey ma habboona</option>
                <option value="fraud_scam">Lacag dalbasho ama khiyaano</option>
                <option value="other">Sabab kale</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Faahfaahin dheeraad ah
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fadlan faahfaahi sababta aad u soo sheegayso xogtan..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Taleefankaaga ama email (Ikhtiyaari)
              </label>
              <input
                type="text"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                placeholder="Si maamulku kuula soo xiriiro"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
              >
                Ka noqo
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Gudbi Dacwada</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
