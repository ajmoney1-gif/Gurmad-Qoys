import React, { useState, useEffect } from 'react';
import { User as UserIcon, Edit3, FileText, Megaphone, CreditCard, Headphones, Settings, LogOut, CheckCircle2, ChevronRight, Sparkles, X, Loader2, ShieldCheck, Phone, Mail, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { PersonReport, Campaign } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ProfileViewProps {
  onOpenReport: (report: PersonReport) => void;
  onNavigateToPromote: (report?: PersonReport) => void;
  onNavigateToBaafi: () => void;
  onOpenSupportModal: () => void;
}

export function ProfileView({
  onOpenReport,
  onNavigateToPromote,
  onNavigateToBaafi,
  onOpenSupportModal,
}: ProfileViewProps) {
  const { user, logout, openAuthModal, updateProfile } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'campaigns' | 'payments' | 'settings'>('reports');
  const [myReports, setMyReports] = useState<PersonReport[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit Profile Modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || '');
      setEditBio(user.bio || '');

      setLoading(true);
      Promise.all([api.getMyPeople(), api.getCampaigns()])
        .then(([repRes, campRes]) => {
          setMyReports(repRes.items || []);
          setMyCampaigns(campRes.items || []);
        })
        .catch((e) => console.warn('Failed to load profile resources', e))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
      });
      setIsEditProfileOpen(false);
      showToast('Xogta akoonkaaga si guul leh ayaa loo cusbooneysiiyey.');
    } catch (err: any) {
      showToast(err.message || 'Cilad ayaa dhacday intii profile-ka la kaydinayey.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleReportFound = async (reportId: string) => {
    try {
      const res = await api.togglePersonStatus(reportId);
      setMyReports((prev) =>
        prev.map((r) => (r.id === reportId ? res.report : r))
      );
      showToast(
        res.report.status === 'found'
          ? 'Waxaa loo calaamadeeyay in la helay!'
          : 'Dib loogu celiyey baafin furan.'
      );
    } catch (err: any) {
      showToast(err.message || 'Cilad ayaa dhacday.');
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-center space-y-4 my-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <UserIcon className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Akoonkaaga GURMAD QOYS
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Gal akoonkaaga si aad u maamusho warbixinaha aad soo gudbisay, ololayaashaada, iyo xogtaada gaarka ah.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="w-full py-3.5 px-4 bg-[#FFD200] hover:bg-amber-400 font-extrabold text-slate-950 rounded-2xl shadow-sm transition"
        >
          Gal / Samee Akoon
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-fade-in space-y-4">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-60 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD200] text-slate-950 font-black text-xl flex items-center justify-center shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                <span>{user.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </h2>
              <p className="text-xs text-slate-500">{user.email}</p>
              {user.phone && <p className="text-[11px] text-slate-400 mt-0.5">{user.phone}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1 shadow-2xs transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {user.bio && (
          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {user.bio}
          </p>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
          <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100">
            <span className="text-[10px] text-amber-800 font-bold uppercase block">Warbixino</span>
            <strong className="text-base font-extrabold text-amber-950">{myReports.length}</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Ololayaal</span>
            <strong className="text-base font-extrabold text-emerald-950">{myCampaigns.length}</strong>
          </div>
          <div className="p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <span className="text-[10px] text-blue-800 font-bold uppercase block">Xaaladda</span>
            <strong className="text-xs font-extrabold text-blue-950 mt-1 block">Xaqiijisan</strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-sections Menu */}
      <div className="bg-white rounded-3xl p-2 border border-slate-200/90 shadow-sm space-y-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('reports')}
          className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition ${
            activeSubTab === 'reports' ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-amber-600" />
            <span className="text-xs">Warbixinnaha aan soo geliyey ({myReports.length})</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('campaigns')}
          className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition ${
            activeSubTab === 'campaigns' ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <Megaphone className="w-4 h-4 text-amber-600" />
            <span className="text-xs">Ololeyaashayda Promote ({myCampaigns.length})</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('payments')}
          className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition ${
            activeSubTab === 'payments' ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span className="text-xs">Lacagta & Bixinta</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={onOpenSupportModal}
          className="w-full p-3 rounded-2xl text-left flex items-center justify-between hover:bg-slate-50 text-slate-700 transition"
        >
          <div className="flex items-center gap-3">
            <Headphones className="w-4 h-4 text-amber-600" />
            <span className="text-xs">Lahadal Maamulka (Support)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition ${
            activeSubTab === 'settings' ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="text-xs">Settings & Amniga</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full p-3 rounded-2xl text-left flex items-center justify-between text-rose-600 hover:bg-rose-50 transition"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold">Ka bax (Logout)</span>
          </div>
        </button>
      </div>

      {/* SUB-TAB CONTENTS (Clean and non-redundant) */}
      {/* 1. MY REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
              Warbixinnaha aad adigu soo gudbisay
            </h3>
            <button
              type="button"
              onClick={onNavigateToBaafi}
              className="text-xs font-bold text-amber-800 hover:underline"
            >
              + Soo gudbi cusub
            </button>
          </div>

          {myReports.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center text-xs text-slate-400 border border-slate-200">
              Weli ma aadan soo gudbin wax warbixin ah.
            </div>
          ) : (
            myReports.map((report) => (
              <div key={report.id} className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{report.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{report.location} · {report.lastSeen}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    report.status === 'found' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {report.status === 'found' ? 'La helay' : 'Baafin furan'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleToggleReportFound(report.id)}
                    className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                  >
                    {report.status === 'found' ? 'Dib ugu celi Baafin' : 'Calaamadee in la helay'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToPromote(report)}
                    className="py-1.5 px-3 rounded-xl bg-[#FFD200] hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Promote</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenReport(report)}
                    className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    Fiiri
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. CAMPAIGNS */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            Taariikhda Ololayaashaada Xayaysiinta
          </h3>
          {myCampaigns.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center text-xs text-slate-400 border border-slate-200">
              Weli ma haysatid olole aad bilaawday.
            </div>
          ) : (
            myCampaigns.map((c) => (
              <div key={c.id} className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <strong className="text-slate-900">{c.reportName}</strong>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    ${c.budget} USD · {c.durationDays} Maalmood
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Deegaanada: {c.locations.join(', ')}</p>
                <div className="text-[11px] text-slate-600 flex justify-between pt-1 border-t border-slate-100">
                  <span>Dadka arkay: <strong>{c.actualImpressions}</strong></span>
                  <span>Gujiyeen: <strong>{c.actualClicks}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. PAYMENTS */}
      {activeSubTab === 'payments' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            Taariikhda Lacag-bixinta
          </h3>
          <p className="text-xs text-slate-500">
            Dhammaan lacag-bixinnada ku saabsan xayaysiinta warbixinaha waxaa lagula xiriiriyaa risiidh rasmi ah.
          </p>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 flex items-center justify-between">
            <div>
              <strong>EVC Plus / ZAAD / Sahal</strong>
              <p className="text-[11px] text-slate-400">Merchant Gateway Direct Verification</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
              Amni & Xaqiijisan
            </span>
          </div>
        </div>
      )}

      {/* 4. SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
            Settings & Amniga
          </h3>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <strong className="block">Luqadda Madasha</strong>
                <span className="text-slate-500">Af-Soomaali (Standard)</span>
              </div>
              <span className="text-xs font-bold text-slate-900">SOM</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <strong className="block">Ogeysiisyada Taleefanka</strong>
                <span className="text-slate-500">Faallooyinka iyo wararka cusub</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-amber-500 focus:ring-amber-400" />
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <strong className="block">Ilaalinta Xogta Gaarka ah</strong>
                <span className="text-slate-500">Lama wadaagayo macluumaadkaaga shirkado kale</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                Wax ka beddel Profile-ka
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Magaca oo buuxa *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lambarka Taleefanka
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bio / Faahfaahin kooban
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                >
                  Ka noqo
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-2 rounded-xl bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Kaydi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
