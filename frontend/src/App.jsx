import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGreenroomState } from './hooks/useGreenroomState';
import { greenroomStore } from './stores/greenroomStore';
import { api } from './lib/api';
import { CURRENT_OFFLINE_RUN_STORAGE_KEY, restoreCurrentOfflineRun, selectCurrentRunForRefresh, shouldPollOfflineRun, verifyRunBriefing } from './lib/offlineRun';
import { createAndStartObjective } from './lib/objectiveRun';

import { ManusHeader } from './components/layout/ManusHeader';
import { CreatorOnboardingModal } from './components/onboarding/CreatorOnboardingModal';
import { OfflineLifecycleModal } from './components/activity/OfflineLifecycleModal';


import { HomePage } from './pages/HomePage';
import { MemoryPage } from './pages/MemoryPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { DocsPage } from './pages/DocsPage';

export function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [currentOfflineRun, setCurrentOfflineRun] = useState(null);
  const [resumeOfflineRun, setResumeOfflineRun] = useState(null);

  // Subscribe to Centralized Store State
  const {
    mindsStatus,
    memoryState,
  } = useGreenroomState();

  // Load Real Data from REST API
  const loadInitialData = async () => {
    try {
      const [mState, mStatus, recentRuns] = await Promise.all([
        api.getMemoryState().catch(() => null),
        api.getMindsStatus().catch(() => null),
        api.getRecentBriefingRuns().catch(() => null),
      ]);

      let rememberedRunId = null;
      try { rememberedRunId = window.localStorage.getItem(CURRENT_OFFLINE_RUN_STORAGE_KEY); } catch { /* storage unavailable */ }
      const restoredRun = restoreCurrentOfflineRun(recentRuns, rememberedRunId);
      const currentRun = selectCurrentRunForRefresh(recentRuns, restoredRun);
      let authoritativeBriefing = null;
      if (currentRun?.status === 'COMPLETED') {
        try {
          const response = await api.getRunBriefing(currentRun.run_id);
          authoritativeBriefing = verifyRunBriefing(response?.briefing, currentRun.run_id, currentRun.objective_id);
        } catch { /* current results require successful run-specific verification */ }
      }
      if (mState) {
        greenroomStore.setMemoryState({
          ...mState,
          latest_briefing: authoritativeBriefing,
          latest_offline_run: currentRun,
        });
      }
      if (currentRun) setCurrentOfflineRun(currentRun);
      if (mStatus) {
        const executionVerified = authoritativeBriefing?.minds_verified === true
          && authoritativeBriefing?.provenance?.mind_verified === true;
        greenroomStore.setMindsStatus(executionVerified ? {
          ...mStatus,
          connected: true,
          verification_state: 'VERIFIED_BY_COMPLETED_RUN',
        } : mStatus);
      }
    } catch (err) {
      console.warn('[GreenroomApp] REST fetch error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!shouldPollOfflineRun(currentOfflineRun)) return undefined;
    let disposed = false;
    const refresh = async () => {
      try {
        const status = await api.getBriefingStatus(currentOfflineRun.run_id);
        if (!disposed) setCurrentOfflineRun((previous) => ({
          ...previous,
          ...status,
          objective_id: status.objective_snapshot?.objective_id || previous?.objective_id,
        }));
      } catch (error) {
        console.warn('[GreenroomApp] Background run status refresh failed:', error);
      }
    };
    refresh();
    const timer = setInterval(refresh, 1000);
    return () => { disposed = true; clearInterval(timer); };
  }, [currentOfflineRun?.run_id, currentOfflineRun?.status]);

  const openCurrentOfflineRun = async () => {
    if (!currentOfflineRun?.run_id) return;
    if (currentOfflineRun.status === 'COMPLETED') {
      try {
        const response = await api.getRunBriefing(currentOfflineRun.run_id);
        const briefing = verifyRunBriefing(response?.briefing, currentOfflineRun.run_id, currentOfflineRun.objective_id);
        const current = greenroomStore.getState().memoryState;
        greenroomStore.setMemoryState({ ...current, latest_briefing: briefing, latest_offline_run: currentOfflineRun });
        try { window.localStorage.removeItem(CURRENT_OFFLINE_RUN_STORAGE_KEY); } catch { /* storage unavailable */ }
        setCurrentOfflineRun(null);
        setActiveTab('home');
        setTimeout(() => document.querySelector('.return-story')?.scrollIntoView({ behavior: 'smooth' }), 0);
      } catch (error) {
        setResumeOfflineRun({ ...currentOfflineRun, status: 'FAILED', error: error.message });
        setIsOfflineModalOpen(true);
      }
      return;
    }
    setResumeOfflineRun(currentOfflineRun);
    setIsOfflineModalOpen(true);
  };

  // Onboarding Save Handler
  const handleSaveOnboarding = async (data) => {
    setIsExecuting(true);
    try {
      const res = await api.onboardCreator(data);
      if (res.state) greenroomStore.setMemoryState(res.state);
      if (res.minds_status) greenroomStore.setMindsStatus(res.minds_status);
    } catch (err) {
      console.error('[GreenroomApp] Onboarding save error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // User Feedback / Learning Handler
  const handleSubmitFeedback = async (feedbackText) => {
    setIsExecuting(true);
    try {
      const res = await api.rememberPreference(feedbackText);
      if (res.state) greenroomStore.setMemoryState(res.state);
      return res;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreateObjective = async (title, details = '') => {
    setIsExecuting(true);
    try {
      const result = await createAndStartObjective(api, title, details);
      const { created, run } = result;
      if (created.state) {
        greenroomStore.setMemoryState({
          ...created.state,
          latest_briefing: null,
          latest_offline_run: run,
        });
      }
      try { window.localStorage.setItem(CURRENT_OFFLINE_RUN_STORAGE_KEY, run.run_id); } catch { /* storage unavailable */ }
      setCurrentOfflineRun(run);
      return result;
    } finally {
      setIsExecuting(false);
    }
  };

  // Render Active Page
  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            key="home"
            memoryState={memoryState}
            mindsStatus={mindsStatus}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenOfflineModal={(run = null) => { setResumeOfflineRun(run); setIsOfflineModalOpen(true); }}
            onCreateObjective={handleCreateObjective}
            isExecuting={isExecuting}
          />
        );

      case 'memory':
        return (
          <MemoryPage
            key="memory"
            memoryState={memoryState}
            onSubmitFeedback={handleSubmitFeedback}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            isExecuting={isExecuting}
          />
        );
      case 'intelligence':
        return (
          <IntelligencePage
            key="intelligence"
            memoryState={memoryState}
          />
        );
      case 'docs':
        return <DocsPage key="docs" />;
      default:
        return (
          <HomePage
            key="home"
            memoryState={memoryState}
            mindsStatus={mindsStatus}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            isExecuting={isExecuting}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <ManusHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="app-main">
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </main>

      <footer className="site-footer">
        <button type="button" className="footer-brand" onClick={() => setActiveTab('home')}><span aria-hidden="true" /><strong>GreenRoom</strong></button>
        <p>GreenRoom watches so you can focus on what you do best.</p>
        <span>© 2026 GreenRoom</span>
        <button type="button" onClick={() => setActiveTab('docs')}>Product docs</button>
      </footer>

      {/* Real Creator Onboarding Modal */}
      <CreatorOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSave={handleSaveOnboarding}
        initialData={memoryState}
      />

      {/* Offline Story Lifecycle Proof Modal */}
      <OfflineLifecycleModal
        isOpen={isOfflineModalOpen}
        onClose={() => {
          setIsOfflineModalOpen(false);
          if (['COMPLETED', 'NO_RELEVANT_UPDATE', 'UNSUPPORTED_DOMAIN', 'FAILED'].includes(currentOfflineRun?.status)) {
            try { window.localStorage.removeItem(CURRENT_OFFLINE_RUN_STORAGE_KEY); } catch { /* storage unavailable */ }
            setCurrentOfflineRun(null);
            const current = greenroomStore.getState().memoryState;
            greenroomStore.setMemoryState({ ...current, latest_offline_run: null });
          }
        }}
        memoryState={memoryState}
        resumeRun={resumeOfflineRun?.run_id === currentOfflineRun?.run_id ? currentOfflineRun : resumeOfflineRun}
        onBriefingUpdated={(briefing) => {
          const current = greenroomStore.getState().memoryState;
          greenroomStore.setMemoryState({ ...current, latest_briefing: briefing });
        }}
        onRunStatusChanged={(latestOfflineRun) => {
          try { window.localStorage.setItem(CURRENT_OFFLINE_RUN_STORAGE_KEY, latestOfflineRun.run_id); } catch { /* storage unavailable */ }
          setCurrentOfflineRun((previous) => ({ ...previous, ...latestOfflineRun }));
          const current = greenroomStore.getState().memoryState;
          greenroomStore.setMemoryState({ ...current, latest_offline_run: latestOfflineRun });
        }}
      />

    </div>
  );
}

export default App;
