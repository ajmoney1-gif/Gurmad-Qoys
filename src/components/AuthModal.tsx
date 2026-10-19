import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, User, Phone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { validateEmail, validatePhone, validatePassword } from '../utils/validation.ts';
import { api } from '../services/api.ts';

export function AuthModal() {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, signup, openAuthModal } = useAuth();

  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>(authModalTab || 'login');

  // Sync tab with context if changed externally
  React.useEffect(() => {
    if (authModalTab) setTab(authModalTab);
  }, [authModalTab]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleResetState = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSwitchTab = (newTab: 'login' | 'signup' | 'forgot') => {
    handleResetState();
    setTab(newTab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleResetState();

    if (!validateEmail(email)) {
      setErrorMessage('Fadlan geli email sax ah.');
      return;
    }
    if (!password) {
      setErrorMessage('Fadlan geli furaha sirta ah.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // login method automatically closes modal and triggers callback
    } catch (err: any) {
      setErrorMessage(err.message || 'Email-ka ama furaha sirta ah ma saxna.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleResetState();

    if (!name.trim()) {
      setErrorMessage('Fadlan geli magacaaga oo buuxa.');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Fadlan geli email sax ah.');
      return;
    }
    if (phone) {
      const phoneCheck = validatePhone(phone);
      if (!phoneCheck.valid) {
        setErrorMessage(phoneCheck.error || 'Lambarka taleefanka ma saxna.');
        return;
      }
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      setErrorMessage(pwCheck.error || 'Furaha sirta ah waa inuu ugu yaraan ka koobnaadaa 6 xaraf.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Labada fure sir isma laha. Fadlan hubi.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Fadlan aqbal shuruudaha adeegga iyo ilaalinta xogta gaarka ah.');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Diiwaangelintu ma suuroobin. Fadlan mar kale isku day.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleResetState();

    if (!validateEmail(email)) {
      setErrorMessage('Fadlan geli email sax ah.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSuccessMessage(res.message || 'Fariinta dib-u-dejinta furaha waxaa loo diray email-kaaga.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Cilad ayaa dhacday.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col transition-all">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 id="auth-modal-title" className="text-lg font-extrabold text-slate-900">
              {tab === 'login' && 'Gal Akoonkaaga'}
              {tab === 'signup' && 'Samee Akoon Cusub'}
              {tab === 'forgot' && 'Ilowday Furaha Sirta ah?'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tab === 'login' && 'Ku soo dhowow GURMAD QOYS'}
              {tab === 'signup' && 'Ku biir bulshada caawisa helidda dadka maqan'}
              {tab === 'forgot' && 'Geli email-kaaga si aan kuugu soo dirno tilmaamo'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Xir daaqadda"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch buttons (Login / Signup) */}
        {tab !== 'forgot' && (
          <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 m-4 rounded-2xl">
            <button
              type="button"
              onClick={() => handleSwitchTab('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                tab === 'login'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Gal (Sign In)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('signup')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                tab === 'signup'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Samee Akoon (Sign Up)
            </button>
          </div>
        )}

        <div className="p-6 pt-2">
          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tusaale@email.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Furaha Sirta ah (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('forgot')}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    Ma ilowday furaha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Qari furaha' : 'Muuji furaha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#FFD200] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fadlan sug...</span>
                  </>
                ) : (
                  <span>Gal Akoonka</span>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">
                  Akoon ma lihi?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('signup')}
                    className="font-bold text-slate-900 hover:underline"
                  >
                    Hadda is-diiwaangeli
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {tab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Magacaaga oo Buuxa *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Magacaaga iyo aabbahaa"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="emailkaaga@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lambarka Taleefanka (Ikhtiyaari)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+252 61..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Furaha Sirta *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ugu yaraan 6"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xaqiiji Furaha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Mar kale geli"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="terms" className="text-[11px] text-slate-600 leading-tight cursor-pointer">
                  Waxaan aqbalay{' '}
                  <span className="font-bold text-slate-800 underline">shuruudaha adeegga</span> iyo{' '}
                  <span className="font-bold text-slate-800 underline">ilaalinta xogta gaarka ah</span> ee GURMAD QOYS.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#FFD200] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fadlan sug...</span>
                  </>
                ) : (
                  <span>Diiwaangeli Akoonka</span>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">
                  Horey ma u leedahay akoon?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchTab('login')}
                    className="font-bold text-slate-900 hover:underline"
                  >
                    Gal halkan
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email-kaaga
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Geli email-kaagii hore"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fadlan sug...</span>
                  </>
                ) : (
                  <span>Soo Dir Tilmaamaha Furaha</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('login')}
                  className="text-xs font-bold text-slate-700 hover:underline"
                >
                  ← Dib ugu noqo Galitaanka
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
