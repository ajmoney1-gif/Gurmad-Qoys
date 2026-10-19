import React, { useState } from 'react';
import { HeartHandshake, ShieldCheck, Share2, Search, ArrowRight, ArrowLeft, CheckCircle2, UserPlus, LogIn, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const { openAuthModal } = useAuth();

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSignInDirectly = () => {
    onComplete();
    openAuthModal('login');
  };

  const handleSignUpDirectly = () => {
    onComplete();
    openAuthModal('signup');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto transition-all">
        {/* Top bar with progress dots & Skip */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? 'w-6 bg-[#FFD200]'
                    : currentStep > step
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {currentStep < 4 && (
            <button
              type="button"
              onClick={onComplete}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 py-1 px-2.5 rounded-lg transition"
            >
              Ka bood (Skip)
            </button>
          )}
        </div>

        {/* Step Content */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="text-center animate-fade-in space-y-5">
              <div className="w-20 h-20 rounded-3xl bg-[#FFD200] mx-auto flex items-center justify-center shadow-md transform hover:rotate-6 transition">
                <HeartHandshake className="w-12 h-12 text-slate-950 stroke-[2.2]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 inline-block mb-2">
                  QOF WALBA WAA QOYS
                </span>
                <h2 id="onboarding-title" className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Ku soo dhowow GURMAD QOYS
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Madal bulsho oo Soomaaliyeed oo loogu talagalay in lagu caawiyo raadinta dadka maqan iyo dib-u-mideynta qoysaska si nabadgelyo iyo masuuliyad leh.
                </p>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/50 rounded-2xl p-3.5 text-left text-xs text-amber-900 flex items-start gap-3">
                <span className="text-lg">🤝</span>
                <p className="leading-tight">
                  Isku duubnida bulshadeena ayaa ah awoodda ugu weyn ee qof kasta oo maqan loogu soo celin karo ehelkiisa.
                </p>
              </div>

              <div className="pt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 px-4 bg-[#FFD200] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <span>Bilow</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>

                <button
                  type="button"
                  onClick={handleSignInDirectly}
                  className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
                >
                  Horey ma u leedahay akoon? <span className="text-slate-900 font-bold underline">Gal akoonkayga</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: HOW IT WORKS */}
          {currentStep === 2 && (
            <div className="animate-fade-in space-y-5">
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-block mb-1">
                  Sida ay u shaqeyso
                </span>
                <h2 id="onboarding-title" className="text-xl font-extrabold text-slate-900">
                  Saddex tallaabo oo fudud
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Wada shaqeyntu waxay badbaadisaa nolosha qoysas badan.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Soo gudbi xogta qofka maqan (BAAFI)</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      Geli magaca, sawirka, da'da, goobta iyo waqtiga ugu dambeysay si sahlan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-sm">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Bulshada ayaa wadaageysa</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      Warbixintu waxay gaareysaa kumanaan qof oo bulshada ka tirsan iyo baraha bulshada.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Xaqiijin & Dib-u-mideyn</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      Haddii qofka la arko, qoyska waxaa si toos ah oo nabadgelyo leh loogu soo wargeliyaa xogta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-3 px-4 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 px-4 bg-[#FFD200] hover:bg-amber-400 font-bold text-slate-950 rounded-2xl flex items-center justify-center gap-2 transition"
                >
                  <span>Sii wad</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SAFETY & PRIVACY */}
          {currentStep === 3 && (
            <div className="animate-fade-in space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 id="onboarding-title" className="text-xl font-extrabold text-slate-900">
                  Badbaadada & Masuuliyadda
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Xog sax ah waxay badbaadisaa nolosha; xog khaldanna way dhibtaa qoysaska.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <div className="text-xs text-emerald-950">
                    <strong className="block font-bold">Xog dhab ah oo la xaqiijiyey</strong>
                    Ha faafin warar been ah ama malo-awaal ah. Soo gudbi xog aad shakhsiyan u hubto.
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                  <span className="text-slate-600 font-bold">✓</span>
                  <div className="text-xs text-slate-700">
                    <strong className="block font-bold">Ixtiraam xogta gaarka ah</strong>
                    Ha gelin faahfaahin xasaasi ah ama lacag dalbasho aan sharciga waafaqsanayn.
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-2xl flex items-start gap-3">
                  <span className="text-amber-700 font-bold">✓</span>
                  <div className="text-xs text-amber-950">
                    <strong className="block font-bold">Soo sheeg xogta khaldan (Dacwo)</strong>
                    Haddii aad aragto warbixin been abuur ah ama laga been sheegay, taabo badhanka dacwada.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-3 px-4 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition flex items-center justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-3 px-4 bg-[#FFD200] hover:bg-amber-400 font-bold text-slate-950 rounded-2xl flex items-center justify-center gap-2 transition"
                >
                  <span>Waan fahmay</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: GET STARTED */}
          {currentStep === 4 && (
            <div className="animate-fade-in space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center">
                <Compass className="w-8 h-8" />
              </div>

              <div>
                <h2 id="onboarding-title" className="text-xl font-extrabold text-slate-900">
                  Diyaar ma u tahay?
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Dooro sida aad rabto inaad u bilowdo. Waxaad bilaabi kartaa isla hadda.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSignUpDirectly}
                  className="w-full py-3 px-4 bg-[#FFD200] hover:bg-amber-400 font-bold text-slate-950 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.2]" />
                  <span>Samee Akoon Cusub</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignInDirectly}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <LogIn className="w-4 h-4 stroke-[2.2]" />
                  <span>Gal Akoonkaaga Hore</span>
                </button>

                <button
                  type="button"
                  onClick={onComplete}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-2xl transition"
                >
                  Fiiri Warbixinnada Bulshada (Marti ahaan)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
