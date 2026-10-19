import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Smile,
  User,
  PersonStanding,
  MapPin,
  ShieldCheck,
  RefreshCw,
  MoreHorizontal,
  Cake,
  Calendar,
  Heart,
  MessageSquare,
  Share2,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  X,
  Loader2
} from 'lucide-react';
import { PersonReport } from '../types/index.ts';

interface HomeViewProps {
  reports: PersonReport[];
  loading: boolean;
  onRefresh: () => void;
  onOpenReport: (report: PersonReport) => void;
  onNavigateToBaafi: () => void;
  onLikeReport: (reportId: string) => void;
}

export function HomeView({
  reports,
  loading,
  onRefresh,
  onOpenReport,
  onNavigateToBaafi,
  onLikeReport,
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Dhammaan');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'likes'>('newest');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [showSafetyNotice, setShowSafetyNotice] = useState(true);

  // Debounce search input to keep filtering silky smooth
  React.useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 220);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Four approved categories as strictly specified: Dhammaan, Ilmo, Qof weyn, Waayeel
  const categories = [
    { id: 'Dhammaan', label: 'Dhammaan', icon: LayoutGrid },
    { id: 'Ilmo', label: 'Ilmo', icon: Smile },
    { id: 'Qof weyn', label: 'Qof weyn', icon: User },
    { id: 'Waayeel', label: 'Waayeel', icon: PersonStanding },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategory('Dhammaan');
  };

  const filteredReports = reports
    .filter((report) => {
      // Category filter
      if (selectedCategory !== 'Dhammaan') {
        if (report.category !== selectedCategory) return false;
      }

      // Search query filter (using debounced query)
      if (debouncedQuery.trim()) {
        const q = debouncedQuery.toLowerCase().trim();
        const matchName = report.name.toLowerCase().includes(q);
        const matchLoc = report.location.toLowerCase().includes(q);
        const matchDesc = report.description?.toLowerCase().includes(q);
        const matchAge = String(report.age).toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchDesc && !matchAge) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'likes') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // Newest: promoted first if active, otherwise chronologically by date
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleShare = async (e: React.MouseEvent, report: PersonReport) => {
    e.stopPropagation();
    const shareData = {
      title: `BAAFI: ${report.name}`,
      text: `GURMAD QOYS: Fadlan caawi helidda ${report.name}, da'diisa ${report.age}. Goobta: ${report.location}.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Ignored or cancelled by user
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${window.location.href}`);
      setCopyToast('Xiriiriyaha warbixinta waa la koobiyeeyay!');
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  return (
    <div className="space-y-2.5 pb-24 animate-fade-in pt-0">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* 1. SEARCH BAR — Immediately below header */}
      <div className="relative flex items-center">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Raadi magac, goob, ama da'..."
            aria-label="Raadi warbixinaha"
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFD200] focus:border-transparent transition shadow-2xs"
          />
          {isSearching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            </div>
          ) : searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              aria-label="Tirtir qoraalka"
            >
              ✕
            </button>
          ) : (
            <button
              type="button"
              aria-label="Xulashooyinka shaandhada"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. COMPACT, HORIZONTALLY SCROLLABLE CATEGORY FILTERS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition whitespace-nowrap shrink-0 shadow-2xs ${
                isSelected
                  ? 'bg-[#FFD200] border-amber-300 text-slate-950 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[2.5]' : 'stroke-[1.8] text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. COMPACT, UNOBTRUSIVE SAFETY NOTICE CARD */}
      {showSafetyNotice && (
        <section className="bg-emerald-50/90 border border-emerald-200/70 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-[11px] text-slate-700 truncate">
              <strong className="text-emerald-950 font-bold">Xusuusin:</strong> Fadlan la wadaag xog sugan si loo caawiyo qoysaska.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSafetyNotice(false)}
            aria-label="Xir ogeysiiska badbaadada"
            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* 4. SECTION HEADER: "Warbixinaha bulshada" + count + sort + refresh */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">
            Warbixinaha bulshada
          </h2>
          <span className="px-1.5 py-0.5 rounded-full bg-[#FFD200] text-slate-950 text-[10px] font-black leading-none shadow-2xs">
            {filteredReports.length}
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg transition"
            >
              <span>{sortOrder === 'newest' ? 'Ugu cusub' : sortOrder === 'oldest' ? 'Ugu horreeyay' : 'Ugu like-ka badan'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder('newest');
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold ${sortOrder === 'newest' ? 'text-amber-800 bg-amber-50/50' : 'text-slate-700'}`}
                >
                  Ugu cusub
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder('oldest');
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold ${sortOrder === 'oldest' ? 'text-amber-800 bg-amber-50/50' : 'text-slate-700'}`}
                >
                  Ugu horreeyay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortOrder('likes');
                    setIsSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold ${sortOrder === 'likes' ? 'text-amber-800 bg-amber-50/50' : 'text-slate-700'}`}
                >
                  Ugu like-ka badan
                </button>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Cusbooneysii liiska"
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 5. COMMUNITY REPORT CARDS */}
      {loading && reports.length === 0 ? (
        <div className="space-y-2.5 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl p-3 border border-slate-200/60 bg-white flex items-start gap-3">
              <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-3.5 bg-slate-100 rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center space-y-2.5 border border-slate-200/90 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">Lama helin warbixino ku habboon</h3>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Isku day inaad beddesho ereyada raadinta ama dib u dejiso shaandhada.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {(debouncedQuery || selectedCategory !== 'Dhammaan') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Dib u deji shaandhada
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateToBaafi}
              className="py-1.5 px-3.5 bg-[#FFD200] hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-2xs transition active:scale-95"
            >
              Soo gudbi warbixin (BAAFI)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredReports.map((report) => {
            const isSponsored = !!report.isPromoted;
            const isFound = report.status === 'found';

            return (
              <div
                key={report.id}
                onClick={() => onOpenReport(report)}
                className={`rounded-2xl p-3 border transition-all cursor-pointer relative group ${
                  isSponsored
                    ? 'bg-[#FFFDE8] border-amber-300/80 shadow-2xs ring-1 ring-amber-300/40'
                    : 'bg-white border-slate-200/85 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Main Card Content */}
                <div className="flex items-start gap-3">
                  {/* Portrait Photograph */}
                  <div className="relative shrink-0">
                    {report.photoDataUrl ? (
                      <img
                        src={report.photoDataUrl}
                        alt={report.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-200/70 shadow-2xs"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col items-center justify-center text-amber-900">
                        <span className="text-xl font-black">{report.name.charAt(0)}</span>
                        <span className="text-[9px] font-bold text-amber-700 tracking-wider">GURMAD</span>
                      </div>
                    )}
                  </div>

                  {/* Details Column */}
                  <div className="flex-1 min-w-0">
                    {/* Top line: Name + Sponsored Badge + Relative Time */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-[13px] sm:text-sm text-slate-950 leading-snug">
                            {report.name}
                          </h3>
                          {isSponsored && (
                            <span className="bg-[#FFD200] text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded tracking-wide shrink-0">
                              SPONSORED
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          {report.relativeTime || 'Dhowaan'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReport(report);
                          }}
                          aria-label="Xulashooyin dheeraad ah"
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata rows with icons */}
                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <Cake className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Da'da: <strong className="text-slate-800">{report.age}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{report.lastSeen}</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="mt-1.5">
                      {isFound ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black bg-emerald-600 text-white tracking-wide uppercase shadow-2xs">
                          LA HELAY
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black bg-[#ef4444] text-white tracking-wide uppercase shadow-2xs">
                          WAA LA RAADINAYAA
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom engagement & action bar */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Like Action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLikeReport(report.id);
                      }}
                      className="flex items-center gap-1 text-slate-600 hover:text-rose-600 transition"
                      aria-label={`Like warbixinta ${report.name}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${(report as any).isLocallyLiked ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500'}`} />
                      <span className="text-xs font-semibold text-slate-700">{report.likesCount || 0}</span>
                    </button>

                    {/* Comment Action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReport(report);
                      }}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition"
                      aria-label={`Faallooyinka warbixinta ${report.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">{report.commentsCount || 0}</span>
                    </button>

                    {/* Share Action */}
                    <button
                      type="button"
                      onClick={(e) => handleShare(e, report)}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition"
                      aria-label={`Wadaag warbixinta ${report.name}`}
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700">Wadaag</span>
                    </button>
                  </div>

                  {/* Faahfaahin → Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenReport(report);
                    }}
                    className="flex items-center gap-1 bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-full text-xs shadow-2xs transition active:scale-95"
                  >
                    <span>Faahfaahin</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
