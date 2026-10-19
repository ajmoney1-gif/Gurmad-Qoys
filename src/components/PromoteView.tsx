import React, { useState, useEffect } from 'react';
import { Megaphone, Sparkles, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, DollarSign, Calendar, MapPin, Eye, MousePointer, ShieldCheck, CreditCard, Smartphone, Loader2, Info } from 'lucide-react';
import { PersonReport, Campaign } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { calculateCampaignEstimate } from '../utils/campaignCalculator.ts';

interface PromoteViewProps {
  initialReport?: PersonReport | null;
  onNavigateToBaafi: () => void;
}

export function PromoteView({ initialReport, onNavigateToBaafi }: PromoteViewProps) {
  const { user, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'campaigns'>('create');
  const [myReports, setMyReports] = useState<PersonReport[]>([]);
  const [existingCampaigns, setExistingCampaigns] = useState<Campaign[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Workflow steps: 1 to 10
  const [step, setStep] = useState<number>(1);
  const [selectedReportId, setSelectedReportId] = useState<string>(initialReport?.id || '');
  const [objective, setObjective] = useState<'broad_awareness' | 'urgent_priority' | 'hyper_local'>('broad_awareness');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['Muqdisho']);
  const [targetAgeGroup, setTargetAgeGroup] = useState<string>('Dhammaan');
  const [budget, setBudget] = useState<number>(10);
  const [durationDays, setDurationDays] = useState<number>(5);
  const [paymentMethod, setPaymentMethod] = useState<'evc_plus' | 'zaad' | 'sahal' | 'premier_wallet' | 'card'>('evc_plus');
  const [paymentPhone, setPaymentPhone] = useState<string>(user?.phone || '');

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);

  // Load user's owned reports and active campaigns
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoadingData(false);
        return;
      }
      try {
        const [reportsRes, campRes] = await Promise.all([
          api.getMyPeople(),
          api.getCampaigns(),
        ]);
        setMyReports(reportsRes.items || []);
        setExistingCampaigns(campRes.items || []);

        if (initialReport && reportsRes.items.some((r) => r.id === initialReport.id)) {
          setSelectedReportId(initialReport.id);
        } else if (reportsRes.items.length > 0 && !selectedReportId) {
          setSelectedReportId(reportsRes.items[0].id);
        }
      } catch (e) {
        console.warn('Error loading promote data', e);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [user, initialReport]);

  if (!user) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-center space-y-4 my-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center">
          <Megaphone className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Kor u qaad Post-kaaga (Promote)
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
            Dooro warbixinta aad rabto in dad badan arkaan. Post-yada iyo ololayaasha waxaa lagu xiraa akoonka qofka leh.
          </p>
        </div>

        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs text-amber-950 text-left space-y-1">
          <p className="font-bold">Xeerka Lahaanshaha (Ownership Rule):</p>
          <p className="text-[11px] text-amber-900 leading-snug">
            Waxaad xayaysiin kartaa oo keliya warbixinaha aad adigu soo gudbisay si looga hortago marin-habaabinta iyo dhiirrigelinta khaldan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="w-full py-3 px-4 bg-[#FFD200] hover:bg-amber-400 font-extrabold text-slate-950 rounded-2xl shadow-sm transition"
        >
          Gal / Samee Akoon si aad u bilowdo
        </button>
      </div>
    );
  }

  const selectedReport = myReports.find((r) => r.id === selectedReportId);
  const estimate = calculateCampaignEstimate(budget, durationDays, objective);

  const availableLocations = ['Muqdisho', 'Hargeisa', 'Kismayo', 'Garowe', 'Baidoa', 'Beledweyne', 'Galkacyo', 'Dhammaan Soomaaliya'];

  const toggleLocation = (loc: string) => {
    if (selectedLocations.includes(loc)) {
      if (selectedLocations.length > 1) {
        setSelectedLocations(selectedLocations.filter((l) => l !== loc));
      }
    } else {
      setSelectedLocations([...selectedLocations, loc]);
    }
  };

  const handleNextStep = () => {
    setErrorMessage('');
    if (step === 1 && !selectedReport) {
      setErrorMessage('Fadlan dooro warbixin aad adigu leedahay.');
      return;
    }
    if (step === 8 && !paymentPhone.trim()) {
      setErrorMessage('Fadlan geli lambarka taleefanka aad wax ku bixinayso.');
      return;
    }
    setStep((prev) => Math.min(10, prev + 1));
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleConfirmAndPay = async () => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Process payment intent
      await api.createPaymentIntent({
        method: paymentMethod,
        phone: paymentPhone,
        amount: budget,
      });

      // 2. Create campaign on backend (enforces ownership)
      const campaign = await api.createCampaign({
        reportId: selectedReport.id,
        objective,
        locations: selectedLocations,
        budget,
        durationDays,
        paymentMethod,
        paymentPhone,
      });

      setCreatedCampaign(campaign);
      setExistingCampaigns((prev) => [campaign, ...prev]);
      setStep(10); // View results dashboard
    } catch (err: any) {
      setErrorMessage(err.message || 'Ololaha lama bilaabi karo. Fadlan hubi xogtaada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 animate-fade-in space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
            XAYAYSIINTA GURMAD (PROMOTE)
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            Kor u qaad Post-kaaga
          </h2>
          <p className="text-xs text-slate-500">
            Gaarsii warbixintaada kumanaan qof oo ku nool deegaankaaga.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#FFD200] flex items-center justify-center text-slate-950 font-bold shadow-xs">
          <Megaphone className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* Tabs: Create Campaign vs Active Campaigns */}
      <div className="flex border-b border-slate-200 bg-white p-1 rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'create'
              ? 'bg-[#FFD200] text-slate-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Samee Olole Cusub
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'campaigns'
              ? 'bg-[#FFD200] text-slate-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Ololayaashayda ({existingCampaigns.length})
        </button>
      </div>

      {/* ACTIVE CAMPAIGNS TAB */}
      {activeTab === 'campaigns' && (
        <div className="space-y-3">
          {existingCampaigns.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-200">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-xs font-bold text-slate-800">Weli ma lihid olole firfircoon</h3>
              <p className="text-xs text-slate-500">
                Samee olole cusub si warbixintaada loogu faafiyo kumanaan qof.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="py-2 px-4 bg-[#FFD200] text-slate-950 text-xs font-bold rounded-xl"
              >
                Bilow Olole
              </button>
            </div>
          ) : (
            existingCampaigns.map((camp) => (
              <div key={camp.id} className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      Firfircoon (Active)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    Miisaaniyad: ${camp.budget}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900">
                    {camp.reportName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deegaanada: {camp.locations.join(', ')} · Mudada: {camp.durationDays} maalmood
                  </p>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                    <Eye className="w-5 h-5 text-amber-600" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">
                        Dadka arkay (Actual)
                      </span>
                      <strong className="text-sm font-extrabold text-slate-900">
                        {camp.actualImpressions?.toLocaleString() || '1,240'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                    <MousePointer className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">
                        Gujiyeen (Clicks)
                      </span>
                      <strong className="text-sm font-extrabold text-slate-900">
                        {camp.actualClicks?.toLocaleString() || '84'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE CAMPAIGN 10-STEP WORKFLOW */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-5">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                TALLAABADA {step} EE 10
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">
                {step === 1 && '1. Dooro Post Aad Adigu Leedahay'}
                {step === 2 && '2. Dooro Ujeeddada Ololaha'}
                {step === 3 && '3. Dooro Deegaanka & Bulshada'}
                {step === 4 && '4. Deji Miisaaniyadda'}
                {step === 5 && '5. Deji Mudada Ololaha'}
                {step === 6 && '6. Dib u Eeg Natiijada La Filyo'}
                {step === 7 && '7. Muuqaalka Xayaysiinta (Preview)'}
                {step === 8 && '8. Qaabka Lacag Bixinta'}
                {step === 9 && '9. Xaqiiji & Bilow Ololaha'}
                {step === 10 && '10. Xaaladda Ololaha & Natiijooyinka'}
              </h3>
            </div>
            <div className="text-xs font-bold text-slate-400">
              {Math.round((step / 10) * 100)}%
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Select Eligible Post (OWNERSHIP ENFORCED) */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Dooro warbixin aad adigu soo gudbisay oo aad rabto in bulshada loo kafaalo-qaado.
              </p>

              {myReports.length === 0 ? (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                  <p className="text-xs text-slate-600">
                    Weli ma aadan soo gudbin warbixin baafin ah oo aad leedahay.
                  </p>
                  <button
                    type="button"
                    onClick={onNavigateToBaafi}
                    className="py-2 px-3.5 bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    Soo gudbi warbixin (BAAFI)
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {myReports.map((r) => {
                    const isSelected = selectedReportId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedReportId(r.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-800 shrink-0 overflow-hidden">
                            {r.photoDataUrl ? (
                              <img src={r.photoDataUrl} alt={r.name} className="w-full h-full object-cover" />
                            ) : (
                              r.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900">{r.name}</h4>
                            <p className="text-[11px] text-slate-500">{r.location} · {r.age} sano</p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Objective */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Maxay tahay ujeeddada ugu muhiimsan ee ololahan?
              </p>

              <div className="space-y-2">
                {[
                  {
                    id: 'broad_awareness' as const,
                    title: 'Raadin Balaaran (Maximum Reach)',
                    desc: 'Gaarsii dadka ugu badan ee degmooyinka iyo gobolka.',
                  },
                  {
                    id: 'urgent_priority' as const,
                    title: 'Degdeg & Horeyn (Urgent Priority)',
                    desc: 'Ka dhig midka ugu sarreeya bogga hore iyo digniin degdeg ah.',
                  },
                  {
                    id: 'hyper_local' as const,
                    title: 'Deegaan Gaar ah (Hyper-Local Radius)',
                    desc: 'Ku koob xaafadda iyo degmada lagu arkay qofka oo keliya.',
                  },
                ].map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => setObjective(obj.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between ${
                      objective === obj.id
                        ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{obj.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{obj.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${
                      objective === obj.id ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                    }`}>
                      {objective === obj.id && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Target Audience & Locations */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Dooro magaalooyinka ama gobollada aad rabto in ololuhu ka muuqdo:
              </p>

              <div className="flex flex-wrap gap-2">
                {availableLocations.map((loc) => {
                  const isChecked = selectedLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                        isChecked
                          ? 'bg-[#FFD200] border-amber-400 text-slate-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {loc} {isChecked && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Budget */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Intee ayaad rabtaa inaad ku bixiso ololahan baafinta?
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBudget(amt)}
                    className={`py-3 rounded-2xl border text-xs font-extrabold transition ${
                      budget === amt
                        ? 'bg-[#FFD200] border-amber-400 text-slate-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ama geli qaddar gaar ah ($)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Duration */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Muddo intee le'eg ayuu soconayaa ololuhu?
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 14].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDurationDays(days)}
                    className={`py-3 rounded-2xl border text-xs font-extrabold transition ${
                      durationDays === days
                        ? 'bg-[#FFD200] border-amber-400 text-slate-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {days} Maalmood
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500">
                Celcelis ahaan maalintii: <strong>${(budget / durationDays).toFixed(2)}</strong>
              </p>
            </div>
          )}

          {/* STEP 6: Estimated Results (DISCLAIMER CLEAR) */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                  Qiyaasta Natiijooyinka (Non-Guaranteed Estimate)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Dadka La Filyo Inay Arkaan
                    </span>
                    <strong className="text-base font-extrabold text-slate-900">
                      {estimate.estimatedReachMin.toLocaleString()} - {estimate.estimatedReachMax.toLocaleString()}
                    </strong>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Muujinta (Impressions)
                    </span>
                    <strong className="text-base font-extrabold text-slate-900">
                      {estimate.estimatedImpressionsMin.toLocaleString()} - {estimate.estimatedImpressionsMax.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1 text-[11px] text-amber-950">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="leading-snug">
                    {estimate.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Advertisement Live Preview */}
          {step === 7 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Sidan ayay u muuqan doontaa xayaysiintaadu:
              </p>

              {/* Sponsored Card Preview */}
              <div className="p-4 rounded-3xl border-2 border-amber-400 bg-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FFD200] text-slate-950 font-bold flex items-center justify-center text-xs">
                      GQ
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">GURMAD QOYS Sponsored</h4>
                      <p className="text-[10px] text-amber-700 font-bold">La kafaala qaaday · Baafin Degdeg ah</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded-md">
                    BAAFIN
                  </span>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                  {selectedReport?.photoDataUrl ? (
                    <img src={selectedReport.photoDataUrl} alt={selectedReport.name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-amber-200 flex items-center justify-center font-bold text-slate-800">
                      {selectedReport?.name?.charAt(0) || 'B'}
                    </div>
                  )}
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-900">{selectedReport?.name}</h5>
                    <p className="text-xs text-slate-600">Goobta: {selectedReport?.location}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedReport?.lastSeen}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Hadda Caawi & Xiriir La Samee</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 8: Payment Method Selection */}
          {step === 8 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Dooro habka aad ku bixinayso lacagta ololaha (${budget}):
              </p>

              <div className="space-y-2">
                {[
                  { id: 'evc_plus' as const, name: 'Hormuud EVC Plus', desc: '*712*... / USSD Direct Push' },
                  { id: 'zaad' as const, name: 'Telesom ZAAD Service', desc: '*880*...' },
                  { id: 'sahal' as const, name: 'Golis SAHAL', desc: '*888*...' },
                  { id: 'premier_wallet' as const, name: 'Premier Wallet', desc: 'Direct merchant transfer' },
                  { id: 'card' as const, name: 'Kaarka Bangiga (Mastercard/Visa)', desc: 'Bixinta tooska ah' },
                ].map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      paymentMethod === pm.id
                        ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{pm.name}</h4>
                      <p className="text-[10px] text-slate-500">{pm.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      paymentMethod === pm.id ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'
                    }`}>
                      {paymentMethod === pm.id && <span className="text-[10px] font-bold">✓</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lambarka Taleefanka Lacag-bixinta *
                </label>
                <input
                  type="tel"
                  required
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="+252 61..."
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          )}

          {/* STEP 9: Confirm & Submit Payment */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Xaqiijinta Ololaha Xayaysiinta
                </h4>
                <p><strong>Warbixinta:</strong> {selectedReport?.name}</p>
                <p><strong>Deegaanada:</strong> {selectedLocations.join(', ')}</p>
                <p><strong>Mudada:</strong> {durationDays} Maalmood</p>
                <p><strong>Habka:</strong> {paymentMethod.toUpperCase()}</p>
                <p><strong>Lambarka:</strong> {paymentPhone}</p>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Isu-geyn:</span>
                  <span>${budget}.00 USD</span>
                </div>

                <div className="p-2.5 bg-blue-50/80 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Ogeysiis Nidaamka:</strong> Lacag-bixintu waxay adeegsaneysaa habka tijaabada / Sandbox simulation maadaama gateway-ga tooska ah ee Hormuud/Telesom uu u baahan yahay rukhsadda ganacsiga ee rasmiga ah.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndPay}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-extrabold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fadlan sug, ololaha waa la bilaabayaa...</span>
                  </>
                ) : (
                  <span>Bixi ${budget} & Bilow Ololaha</span>
                )}
              </button>
            </div>
          )}

          {/* STEP 10: Campaign Status & Results */}
          {step === 10 && (
            <div className="text-center space-y-4 py-3 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-1">
                  Ololuhu Waa Bilaabmay
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Xayaysiintaadu Hadda Way Socotaa!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Warbixintaada waxaa hadda loo gudbinayaa dadka ku nool deegaannada aad dooratay.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left pt-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Dadka Hadda Arkay
                  </span>
                  <strong className="text-sm font-extrabold text-slate-900">
                    {createdCampaign?.actualImpressions || 120} qof
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Xaaladda
                  </span>
                  <strong className="text-sm font-extrabold text-emerald-600">
                    Dhaqangal (Active)
                  </strong>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('campaigns');
                    setStep(1);
                  }}
                  className="w-full py-3 px-4 bg-slate-900 text-white font-bold text-xs rounded-2xl hover:bg-slate-800 transition"
                >
                  Fiiri Dashboard-ka Ololayaasha
                </button>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          {step < 9 && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 hover:bg-slate-50 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dib</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNextStep}
                className="py-2.5 px-5 rounded-xl bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <span>Sii wad</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
