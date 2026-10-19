import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageSquare, Share2, Phone, AlertTriangle, CheckCircle2, Send, Loader2, Sparkles, User, Clock, MapPin, Calendar, Check, ExternalLink } from 'lucide-react';
import { PersonReport, Comment } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface ReportDetailModalProps {
  report: PersonReport;
  onClose: () => void;
  onStatusToggled: (updatedReport: PersonReport) => void;
  onNavigateToPromote: (report: PersonReport) => void;
  onOpenAbuseReport: (reportId: string) => void;
}

export function ReportDetailModal({
  report,
  onClose,
  onStatusToggled,
  onNavigateToPromote,
  onOpenAbuseReport,
}: ReportDetailModalProps) {
  const { user, openAuthModal } = useAuth();

  const [currentReport, setCurrentReport] = useState<PersonReport>(report);
  const [likesCount, setLikesCount] = useState<number>(report.likesCount || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOwner = user && currentReport.ownerId === user.id;

  // Load latest social info on mount
  useEffect(() => {
    async function loadSocial() {
      try {
        const data = await api.getSocial(report.id);
        setLikesCount(data.likesCount);
        setIsLiked(data.liked);
        setComments(data.comments || []);
      } catch (e) {
        console.warn('Could not load social data', e);
      }
    }
    loadSocial();
  }, [report.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleLike = async () => {
    // Optimistic update
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      const res = await api.toggleLike(report.id);
      setIsLiked(res.liked);
      setLikesCount(res.likesCount);
    } catch {
      // Revert if failed
      setIsLiked(!nextLiked);
      setLikesCount(likesCount);
      showToast('Like-ka lama kaydin. Fadlan mar kale isku day.');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const newComment = await api.addComment(report.id, {
        text: commentText.trim(),
        authorName: user.name,
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      showToast('Faalladaada si guul leh ayaa loo daabacay.');
    } catch (err: any) {
      showToast(err.message || 'Faallada lama gudbin karo.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `BAAFI: ${currentReport.name}`,
      text: `GURMAD QOYS: Fadlan caawi helidda ${currentReport.name}, da'diisa ${currentReport.age}. Goobta: ${currentReport.location}.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${window.location.href}`);
      showToast('Xiriiriyaha waa la koobiyeeyay!');
    }
  };

  const handleToggleFoundStatus = async () => {
    if (!isOwner) return;
    setIsTogglingStatus(true);
    try {
      const res = await api.togglePersonStatus(currentReport.id);
      setCurrentReport(res.report);
      onStatusToggled(res.report);
      showToast(
        res.report.status === 'found'
          ? 'Alxamdulillaah! Waxaa loo calaamadeeyay in qofka la helay.'
          : 'Xaaladda qofka waxaa dib loogu celiyey baafin furan.'
      );
    } catch (err: any) {
      showToast(err.message || 'Cilad ayaa dhacday.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const isFound = currentReport.status === 'found';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Faahfaahinta warbixinta: ${currentReport.name}`}
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-lg min-h-screen sm:min-h-0 sm:my-auto sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col transition-all">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              aria-label="Dib ugu noqo"
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-extrabold text-base text-slate-900">
              Faahfaahinta warbixinta
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              aria-label="Wadaag warbixinta"
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenAbuseReport(currentReport.id)}
              aria-label="Soo sheeg xog khaldan ama dacwo"
              className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
              title="Soo sheeg dacwo"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Status Alert Banner */}
          {isFound ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="text-xs text-emerald-950">
                <strong className="block font-bold">ALXAMDULILLAAH — QOFKAAN WAA LA HELAY!</strong>
                Warbixintan waxay ku jirtaa xaalad dib-u-mideyn. Mahadsanid dhammaan bulshada gacan ka geysatay.
              </div>
            </div>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-900">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
              <span><strong>BAAFIN FURAN:</strong> Qofkan waa la la'yahay, fadlan gacan ka geeyso raadintiisa.</span>
            </div>
          )}

          {/* Photo & Identity Section */}
          <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100 space-y-4">
            {currentReport.photoDataUrl ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs bg-slate-100 aspect-[4/3] relative flex items-center justify-center">
                <img
                  src={currentReport.photoDataUrl}
                  alt={currentReport.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-44 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex flex-col items-center justify-center text-emerald-800">
                <User className="w-16 h-16 stroke-[1.5]" />
                <p className="text-xs font-bold mt-1">Sawir laguma darin warbixintan</p>
                <p className="text-[10px] text-emerald-700">Qoysku waxay ku tiirsan yihiin astaamaha qoran</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
                  WARBIXIN BULSHO
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900">
                  {currentReport.category}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                {currentReport.name}
              </h1>

              <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-100">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Da'da: <strong>{String(currentReport.age).includes('sano') ? currentReport.age : `${currentReport.age} sano`}</strong></span>
                </div>

                <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{currentReport.location}</span>
                </div>

                <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-100 col-span-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>La soo geliyey: <strong>{currentReport.lastSeen}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Distinguishing details */}
          {currentReport.description && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Faahfaahin iyo Astaamo
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {currentReport.description}
              </p>
            </div>
          )}

          {/* Safe Contact & Emergency Actions */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Xiriirka Degdegga ah ee Qoyska
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Haddii aad qofkan aragtay ama xog dhab ah hayso, fadlan isla markiiba la xiriir:
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentReport.phone ? (
                <a
                  href={`tel:${currentReport.phone}`}
                  className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>Wac: {currentReport.phone}</span>
                </a>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  Lambarka taleefanka lama cayimin
                </div>
              )}

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`GURMAD QOYS: Fadlan caawi helidda ${currentReport.name}: ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Owner Management Controls (if owner) */}
          {isOwner && (
            <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Awoodaha Qofka Leh Warbixinta
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleToggleFoundStatus}
                  disabled={isTogglingStatus}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    isFound
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {isTogglingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isFound ? 'Dib ugu celi Baafin' : 'Calaamadee in la helay'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPromote(currentReport);
                  }}
                  className="flex-1 py-2 px-3 bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Kor u qaad (Promote)</span>
                </button>
              </div>
            </div>
          )}

          {/* Social Action Bar (Like, Faallo, Share) */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition ${
                isLiked
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isLiked ? 'Waad ka heshay' : 'Like'}</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-[10px]">
                {likesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('comment-input');
                input?.focus();
              }}
              className="flex-1 py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Faallo</span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded-full text-[10px]">
                {comments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 bg-[#FFD200] hover:bg-amber-400 text-slate-950 shadow-xs transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">
                Faallooyinka ({comments.length})
              </h3>
              <span className="text-[11px] text-slate-400">
                La wadaag xog kasta oo lagu kalsoonaan karo
              </span>
            </div>

            {/* Comment Submission Form (Authenticated) */}
            {!user ? (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-700">Fadlan gal akoonkaaga si aad faallo ama xog ugu darto.</span>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-bold rounded-xl shrink-0 shadow-2xs transition active:scale-95"
                >
                  Gal akoon
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddComment} className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id="comment-input"
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Qor faallo ama xog aad ogtahay..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Dir</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-2.5 pt-1">
              {comments.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                  Weli faallooyin laguma darin. Noqo qofka ugu horreeya ee faallo reeba.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{c.authorName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
