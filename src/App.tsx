import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav, TabType } from './components/BottomNav.tsx';
import { HomeView } from './components/HomeView.tsx';
import { BaafiView } from './components/BaafiView.tsx';
import { PromoteView } from './components/PromoteView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ReportDetailModal } from './components/ReportDetailModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { AbuseReportModal } from './components/AbuseReportModal.tsx';
import { SupportModal } from './components/SupportModal.tsx';
import { PersonReport } from './types/index.ts';
import { api } from './services/api.ts';

const ONBOARDING_KEY = 'gurmad_onboarding_completed';

function MainApp() {
  const { user, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [reports, setReports] = useState<PersonReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Modals & detail views
  const [selectedReportForDetail, setSelectedReportForDetail] = useState<PersonReport | null>(null);
  const [selectedReportForPromote, setSelectedReportForPromote] = useState<PersonReport | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [abuseReportTargetId, setAbuseReportTargetId] = useState<string | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(1);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    // Check if ?autostart=1 query param is set (skips onboarding for automated verification)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autostart') === '1') {
      return false;
    }
    return localStorage.getItem(ONBOARDING_KEY) !== 'true';
  });

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const res = await api.getPeople();
      setReports(res.items || []);
    } catch (err) {
      console.warn('Could not fetch reports', err);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    loadReports();

    // Check notifications count
    api.getNotifications()
      .then((res) => {
        const unread = (res.items || []).filter((n) => !n.read).length;
        setUnreadNotificationsCount(unread);
      })
      .catch(() => {});
  }, [loadReports]);

  const handleCompleteOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleLikeReport = async (reportId: string) => {
    // Optimistic like update
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const wasLiked = (r as any).isLocallyLiked;
          return {
            ...r,
            likesCount: wasLiked ? Math.max(0, r.likesCount - 1) : r.likesCount + 1,
            isLocallyLiked: !wasLiked,
          };
        }
        return r;
      })
    );

    try {
      const res = await api.toggleLike(reportId);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, likesCount: res.likesCount } : r))
      );
    } catch (e) {
      console.warn('Like sync failed', e);
    }
  };

  const handleNewReportCreated = (newReport: PersonReport) => {
    setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
  };

  const handleReportStatusToggled = (updatedReport: PersonReport) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updatedReport.id ? updatedReport : r))
    );
    if (selectedReportForDetail?.id === updatedReport.id) {
      setSelectedReportForDetail(updatedReport);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start text-slate-900 font-sans">
      {/* Mobile-first App Container (Responsive) */}
      <div className="w-full max-w-md min-h-screen bg-white shadow-xl flex flex-col relative">
        {/* Navbar */}
        <Navbar
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadCount={unreadNotificationsCount}
          onNavigateToProfile={() => setActiveTab('profile')}
        />

        {/* Main View Area */}
        <main className="flex-1 px-3.5 pt-2 pb-20">
          {activeTab === 'home' && (
            <HomeView
              reports={reports}
              loading={loadingReports}
              onRefresh={loadReports}
              onOpenReport={(report) => setSelectedReportForDetail(report)}
              onNavigateToBaafi={() => setActiveTab('baafi')}
              onLikeReport={handleLikeReport}
            />
          )}

          {activeTab === 'baafi' && (
            <BaafiView
              onBackToHome={() => setActiveTab('home')}
              onSuccessSubmitted={handleNewReportCreated}
            />
          )}

          {activeTab === 'promote' && (
            <PromoteView
              initialReport={selectedReportForPromote}
              onNavigateToBaafi={() => setActiveTab('baafi')}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              onOpenReport={(report) => setSelectedReportForDetail(report)}
              onNavigateToPromote={(report) => {
                if (report) setSelectedReportForPromote(report);
                setActiveTab('promote');
              }}
              onNavigateToBaafi={() => setActiveTab('baafi')}
              onOpenSupportModal={() => setIsSupportModalOpen(true)}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Modals */}
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={handleCompleteOnboarding}
        />

        <AuthModal />

        {selectedReportForDetail && (
          <ReportDetailModal
            report={selectedReportForDetail}
            onClose={() => setSelectedReportForDetail(null)}
            onStatusToggled={handleReportStatusToggled}
            onNavigateToPromote={(report) => {
              setSelectedReportForPromote(report);
              setActiveTab('promote');
            }}
            onOpenAbuseReport={(reportId) => setAbuseReportTargetId(reportId)}
          />
        )}

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => {
            setIsNotificationsOpen(false);
            setUnreadNotificationsCount(0);
          }}
          onSelectNotificationLink={(linkId) => {
            if (linkId) {
              const matched = reports.find((r) => r.id === linkId);
              if (matched) {
                setSelectedReportForDetail(matched);
              }
            }
          }}
        />

        <AbuseReportModal
          reportId={abuseReportTargetId}
          onClose={() => setAbuseReportTargetId(null)}
        />

        <SupportModal
          isOpen={isSupportModalOpen}
          onClose={() => setIsSupportModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
