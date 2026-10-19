import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Info,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Lightbulb,
  X
} from 'lucide-react';
import { PersonReport, ReportCategory } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api, compressImage } from '../services/api.ts';
import { validateReportSubmission } from '../utils/validation.ts';

interface BaafiViewProps {
  onBackToHome: () => void;
  onSuccessSubmitted: (newReport: PersonReport) => void;
}

export function BaafiView({ onBackToHome, onSuccessSubmitted }: BaafiViewProps) {
  const { user } = useAuth();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [category, setCategory] = useState<ReportCategory>('Ilmo');
  const [location, setLocation] = useState('');
  
  // Native date and time pickers (distinct from report creation time)
  const [lastSeenDate, setLastSeenDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [lastSeenTime, setLastSeenTime] = useState('10:00');
  
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [relationship, setRelationship] = useState('Waalid');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);

  // Submission & Processing states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submissionSuccess, setSubmissionSuccess] = useState<PersonReport | null>(null);

  // AI Form Assistance & Duplicate Detection states
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiGuidance, setAiGuidance] = useState<{
    suggestions: string[];
    missingPrompts: string[];
    clarityScore: number;
    aiPowered: boolean;
  } | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<Array<any>>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  // Check for duplicate reports when name changes (debounced)
  useEffect(() => {
    if (!name || name.trim().length < 4) {
      setDuplicateMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingDuplicates(true);
      try {
        const res = await api.checkDuplicateReport({
          name: name.trim(),
          age,
          location,
        });
        setDuplicateMatches(res.matches || []);
      } catch (err) {
        console.warn('Duplicate check skipped', err);
      } finally {
        setIsCheckingDuplicates(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [name, age, location]);

  // Request AI guidance for description & report clarity
  const handleRequestAiGuidance = async () => {
    setIsLoadingAi(true);
    try {
      const guidance = await api.getAiFormGuidance({
        name,
        age,
        category,
        location,
        lastSeen: `${lastSeenDate} ${lastSeenTime}`,
        description,
      });
      setAiGuidance(guidance);
    } catch (err) {
      console.warn('AI form guidance failed', err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Format date and time for Somali presentation
  const formatSomaliDateTime = (dateStr: string, timeStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const months = [
        'Jan', 'Feb', 'Mar', 'Abriil', 'May', 'Juun',
        'Luuliyo', 'Ogost', 'Seb', 'Okt', 'Nof', 'Dis'
      ];
      const monthName = months[parseInt(month, 10) - 1] || month;
      return `${parseInt(day, 10)} ${monthName} ${year}, ${timeStr}`;
    } catch {
      return `${dateStr} ${timeStr}`;
    }
  };

  // Handle photo selection (Camera or Gallery)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setValidationErrors((prev) => ({
        ...prev,
        photo: 'Cabirka sawirku waa inuu ka yaraadaa 8 MB.',
      }));
      return;
    }

    // Check mime type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
      setValidationErrors((prev) => ({
        ...prev,
        photo: 'Fadlan dooro sawir noociisu yahay JPG, PNG ama WebP.',
      }));
      return;
    }

    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy.photo;
      return copy;
    });

    setIsCompressing(true);
    try {
      const compressed = await compressImage(file, 1000, 0.85);
      setPhotoDataUrl(compressed);
      setPhotoName(file.name);
    } catch (err) {
      console.error('Image compression failed', err);
      setValidationErrors((prev) => ({
        ...prev,
        photo: 'Sawirka lama akhrin karo. Fadlan mid kale isku day.',
      }));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl(null);
    setPhotoName(null);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const formattedLastSeen = formatSomaliDateTime(lastSeenDate, lastSeenTime);

    const check = validateReportSubmission({
      name,
      location,
      lastSeen: formattedLastSeen,
      age,
      phone,
    });

    if (!check.valid) {
      setValidationErrors(check.errors);
      return;
    }

    if (!accuracyConfirmed) {
      setValidationErrors({
        accuracy: 'Fadlan xaqiiji in xogta aad soo gudbinayso ay dhab tahay oo sax tahay.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createPerson({
        name: name.trim(),
        age: age ? Number(age) : 'Lama yaqaan',
        category,
        location: location.trim(),
        lastSeen: formattedLastSeen,
        description: description.trim(),
        phone: phone.trim(),
        relationship,
        reportType: 'Warbixin la soo gudbiyey',
        photoDataUrl: photoDataUrl || undefined,
      });

      setSubmissionSuccess(created);
      onSuccessSubmitted(created);
    } catch (err: any) {
      setValidationErrors({
        form: err.message || 'Cilad ayaa dhacday intii la kaydinayey warbixinta. Fadlan mar kale isku day.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionSuccess) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-center space-y-4 animate-fade-in my-3">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-2xs">
          <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-1">
            Si guul leh ayaa loo kaydiyay
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">
            Warbixinta Baafinta waa la faafiyey!
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
            Warbixintaada ku saabsan <strong className="text-slate-900">{submissionSuccess.name}</strong> hadda waxay ka muuqataa bogga hore ee GURMAD QOYS.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs text-slate-700 space-y-1">
          <p>📍 <strong>Goobta:</strong> {submissionSuccess.location}</p>
          <p>⏰ <strong>Waqtiga:</strong> {submissionSuccess.lastSeen}</p>
          <p>📞 <strong>Xiriirka:</strong> {submissionSuccess.phone || 'Lama cayimin'}</p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-full py-3 px-4 bg-[#FFD200] hover:bg-amber-400 text-slate-950 font-extrabold rounded-2xl shadow-sm transition active:scale-95"
          >
            Ku noqo Bogga Hore (Home)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-fade-in space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBackToHome}
          aria-label="Dib ugu noqo"
          className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 leading-tight">
            BAAFI — Soo gudbi qof maqan
          </h2>
          <p className="text-[11px] text-slate-500">
            Bixi xog cad oo la xaqiijin karo si bulshada looga caawiyo raadinta.
          </p>
        </div>
      </div>

      {validationErrors.form && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{validationErrors.form}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
        
        {/* Name input with real-time duplicate check */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Magaca oo buuxa ee qofka maqan *
            </label>
            {isCheckingDuplicates && (
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Hubinaya warbixinada kale...
              </span>
            )}
          </div>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tusaale: Axmed Cali Maxamed"
            className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] focus:border-transparent transition ${
              validationErrors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'
            }`}
          />
          {validationErrors.name && (
            <p className="text-[11px] text-red-600 mt-1">{validationErrors.name}</p>
          )}

          {/* Duplicate detection warning notice */}
          {duplicateMatches.length > 0 && (
            <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Digniin: Waxaa jira warbixin u dhow tan aad qoreyso</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Fadlan hubi haddii qofkaan horay loogu soo daray si looga fogaado warbixino isku mid ah:
              </p>
              {duplicateMatches.map((m) => (
                <div key={m.id} className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-800 flex items-center justify-between">
                  <div>
                    <strong>{m.name}</strong> ({m.age}) · 📍 {m.location}
                    <div className="text-[10px] text-slate-500">{m.matchReason}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Age & Category in 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Da'da (Sano)
            </label>
            <input
              type="number"
              min="0"
              max="130"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Tusaale: 18"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] focus:border-transparent transition bg-slate-50/50"
            />
            {validationErrors.age && (
              <p className="text-[11px] text-red-600 mt-1">{validationErrors.age}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nooca / Qaybta
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReportCategory)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] focus:border-transparent transition bg-white"
            >
              <option value="Ilmo">Ilmo (Carruur)</option>
              <option value="Qof weyn">Qof weyn (Dhalinyaro/Qaan-gaar)</option>
              <option value="Waayeel">Waayeel</option>
              <option value="Baahi gaar ah qaba">Baahi gaar ah qaba</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Goobtii ugu dambeysay *
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Degmada iyo Magaalada (Tusaale: Deyniile, Muqdisho)"
            className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] focus:border-transparent transition ${
              validationErrors.location ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'
            }`}
          />
          {validationErrors.location && (
            <p className="text-[11px] text-red-600 mt-1">{validationErrors.location}</p>
          )}
        </div>

        {/* Native Date and Time Pickers (Distinct from report creation/publication time) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Taariikhda iyo Waqtiga ugu dambeysay ee la arkay *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="date"
                required
                value={lastSeenDate}
                onChange={(e) => setLastSeenDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] bg-slate-50/50 text-slate-800"
              />
            </div>
            <div className="relative">
              <input
                type="time"
                required
                value={lastSeenTime}
                onChange={(e) => setLastSeenTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] bg-slate-50/50 text-slate-800"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Waqtiga la doortay: <strong>{formatSomaliDateTime(lastSeenDate, lastSeenTime)}</strong> (way ka duwan tahay waqtiga soo gelinta).
          </p>
        </div>

        {/* Description & Distinguishing details with AI Form Assistant */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Faahfaahin iyo Astaamo
            </label>
            <button
              type="button"
              onClick={handleRequestAiGuidance}
              disabled={isLoadingAi}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 transition"
            >
              {isLoadingAi ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>Talooyinka Caawiyaha (AI)</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Midabka iyo nooca dharka uu xirnaa, dhererka, hadalka, xaalad caafimaad ama astaamo u gaar ah..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] focus:border-transparent transition bg-slate-50/50"
          />

          {/* AI Guidance Box */}
          {aiGuidance && (
            <div className="mt-2 p-3 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-2 text-xs animate-fade-in relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Tilmaamaha Caddeynta Xogta {aiGuidance.aiPowered ? '(Gemini AI)' : '(Nidaamka)'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiGuidance(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Clarity score meter */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-600 mb-0.5">
                  <span>Heerka caddeynta xogta</span>
                  <span className="font-bold text-slate-800">{aiGuidance.clarityScore}%</span>
                </div>
                <div className="w-full bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#FFD200] h-full rounded-full transition-all duration-500"
                    style={{ width: `${aiGuidance.clarityScore}%` }}
                  />
                </div>
              </div>

              {aiGuidance.suggestions.map((s, idx) => (
                <p key={idx} className="text-[11px] text-slate-700 leading-snug">
                  💡 {s}
                </p>
              ))}

              {aiGuidance.missingPrompts.map((m, idx) => (
                <p key={idx} className="text-[11px] text-amber-900 font-medium">
                  ⚠️ {m}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Professional Image Upload: Camera & Gallery selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Sawirka qofka (Kamarad ama Gallery)
            </label>
            {photoDataUrl && (
              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Diyaar
              </span>
            )}
          </div>

          {/* Hidden inputs for Gallery and Camera */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            className="hidden"
            id="baafi-gallery-input"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelect}
            className="hidden"
            id="baafi-camera-input"
          />

          {photoDataUrl ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 flex items-center gap-3">
              <img
                src={photoDataUrl}
                alt="Sawirka qofka la doortay"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {photoName || 'Sawirka qofka'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Waa la cadaadiyay oo loo diyaariyay faafinta
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Beddel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Tirtir</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                Ku dar sawir si bulshadu si fudud ugu garato
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>Kamarad</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <span>Gallery</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                JPG, PNG ama WebP · Ugu badnaan 8 MB
              </p>
            </div>
          )}

          {validationErrors.photo && (
            <p className="text-[11px] text-red-600">{validationErrors.photo}</p>
          )}
        </div>

        {/* Contact Phone & Relationship */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lambarka xiriirka degdegga ah *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+252 61..."
              className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] focus:border-transparent transition ${
                validationErrors.phone ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'
              }`}
            />
            {validationErrors.phone && (
              <p className="text-[11px] text-red-600 mt-1">{validationErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Xiriirka aad la leedahay qofka
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#FFD200] focus:border-transparent transition bg-white"
            >
              <option value="Waalid">Waalid (Aabbe / Hooyo)</option>
              <option value="Walaal">Walaal</option>
              <option value="Qaraabo">Qaraabo kale</option>
              <option value="Deris / Bulsho">Deris ama Xubin Bulshada</option>
            </select>
          </div>
        </div>

        {/* Accuracy and safety acknowledgement */}
        <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/50 flex items-start gap-2">
          <input
            type="checkbox"
            id="baafi-accuracy"
            checked={accuracyConfirmed}
            onChange={(e) => setAccuracyConfirmed(e.target.checked)}
            className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
          />
          <label htmlFor="baafi-accuracy" className="text-[11px] text-amber-950 leading-snug cursor-pointer">
            Waxaan xaqiijinayaa in xogta kor ku xusan ay tahay mid dhab ah oo sax ah. Ma faafinayo xog been abuur ah.
          </label>
        </div>
        {validationErrors.accuracy && (
          <p className="text-[11px] text-red-600 -mt-1">{validationErrors.accuracy}</p>
        )}

        {/* Submit Button (Must read exactly 'BAAFI') */}
        <button
          type="submit"
          disabled={isSubmitting || isCompressing}
          className="w-full py-3.5 px-4 bg-[#FFD200] hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black rounded-2xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm tracking-wide"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Fadlan sug...</span>
            </>
          ) : (
            <span>BAAFI</span>
          )}
        </button>
      </form>
    </div>
  );
}
