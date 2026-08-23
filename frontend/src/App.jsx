import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGreenroomState } from './hooks/useGreenroomState';
import { useGreenroomSocket } from './hooks/useGreenroomSocket';
import { greenroomStore } from './stores/greenroomStore';
import { api } from './lib/api';
import { CURRENT_OFFLINE_RUN_STORAGE_KEY, restoreCurrentOfflineRun, shouldPollOfflineRun, verifyRunBriefing } from './lib/offlineRun';

import { ManusHeader } from './components/layout/ManusHeader';
import { PayloadModal } from './components/ui/PayloadModal';
import { CreatorOnboardingModal } from './components/onboarding/CreatorOnboardingModal';
import { OfflineLifecycleModal } from './components/activity/OfflineLifecycleModal';
import { MemoryBehaviorProofModal } from './components/memory/MemoryBehaviorProofModal';
import { NinetySecondProofModal } from './components/memory/NinetySecondProofModal';


import { HomePage } from './pages/HomePage';
import { MindPage } from './pages/MindPage';
import { MemoryPage } from './pages/MemoryPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { ActionsPage } from './pages/ActionsPage';
import { SystemPage } from './pages/SystemPage';
import { DocsPage } from './pages/DocsPage';

export function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isMemoryProofModalOpen, setIsMemoryProofModalOpen] = useState(false);
  const [isNinetySecProofOpen, setIsNinetySecProofOpen] = useState(false);
  const [currentOfflineRun, setCurrentOfflineRun] = useState(null);
  const [resumeOfflineRun, setResumeOfflineRun] = useState(null);

  // Initialize Real WebSocket Gateway
  useGreenroomSocket();

  // Subscribe to Centralized Store State
  const {
    mindsStatus,
    memoryState,
    impMessages,
    selectedPayload,
    isModalOpen,
    activeCards,
    signals,
  } = useGreenroomState();

  // Load Real Data from REST API
  const loadInitialData = async () => {
    try {
      const [mState, mStatus, impHist, sigs, latestBriefing, recentRuns] = await Promise.all([
        api.getMemoryState().catch(() => null),
        api.getMindsStatus().catch(() => null),
        api.getImpHistory().catch(() => null),
        api.getSignals().catch(() => null),
        api.getLatestBriefing().catch(() => null),
        api.getRecentBriefingRuns().catch(() => null),
      ]);

      let rememberedRunId = null;
      try { rememberedRunId = window.localStorage.getItem(CURRENT_OFFLINE_RUN_STORAGE_KEY); } catch { /* storage unavailable */ }
      const restoredRun = restoreCurrentOfflineRun(recentRuns, rememberedRunId);
      if (mState) {
        greenroomStore.setMemoryState({
          ...mState,
          latest_briefing: latestBriefing?.briefing || mState.latest_briefing || null,
          latest_offline_run: restoredRun,
        });
      }
      if (restoredRun) setCurrentOfflineRun(restoredRun);
      if (mStatus) {
        const executionVerified = latestBriefing?.briefing?.minds_verified === true
          && latestBriefing?.briefing?.provenance?.mind_verified === true;
        greenroomStore.setMindsStatus(executionVerified ? {
          ...mStatus,
          connected: true,
          verification_state: 'VERIFIED_BY_COMPLETED_RUN',
        } : mStatus);
      }
      if (impHist) greenroomStore.setImpHistory(impHist);
      if (sigs && sigs.signals) greenroomStore.setSignals(sigs.signals);
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

  // Step Runner
  const handleRunStep = async (stepId, feedback = null) => {
    setIsExecuting(true);
    greenroomStore.setDemoProgress(stepId, true);

    try {
      const response = await api.runDemoStep(stepId, feedback);
      if (response.state) greenroomStore.setMemoryState(response.state);
      if (response.minds_status) greenroomStore.setMindsStatus(response.minds_status);

      setTimeout(() => {
        greenroomStore.clearDemoProgress();
        setIsExecuting(false);
      }, 600);
    } catch (err) {
      console.error(`[GreenroomApp] Step ${stepId} error:`, err);
      greenroomStore.clearDemoProgress();
      setIsExecuting(false);
    }
  };

  // Full Demo Runner
  const handleRunFullDemo = async () => {
    setIsExecuting(true);
    try {
      for (let i = 1; i <= 5; i++) {
        await handleRunStep(i);
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch (err) {
      console.error('[GreenroomApp] Error running full demo:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset State
  const handleResetState = async () => {
    setIsExecuting(true);
    try {
      const res = await api.resetDemoState();
      greenroomStore.resetStoreState(res.state);
      if (res.minds_status) greenroomStore.setMindsStatus(res.minds_status);
    } catch (err) {
      console.error('[GreenroomApp] Error resetting state:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  // Action Approval
  const handleApproveSponsorship = async (sponsorName = 'TechBrand Inc.') => {
    try {
      const actionName = `Sponsorship Outreach Pitch for ${sponsorName}`;
      await api.approveAction(actionName);
    } catch (err) {
      console.error('[GreenroomApp] Error approving sponsorship:', err);
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
      const res = await api.createObjective(title, details);
      if (res.state) greenroomStore.setMemoryState(res.state);
      return res;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunObjective = async (objectiveId) => {
    setIsExecuting(true);
    try {
      const res = await api.runObjective(objectiveId);
      if (res.state) greenroomStore.setMemoryState(res.state);
      if (res.result && res.result.script_concept) {
        greenroomStore.setActiveCard('script', {
          trend_name: 'Beginner AI Workflows & Automation',
          script_concept: res.result.script_concept,
          is_punchy_voice: true,
        });
      }
    } catch (err) {
      console.error('[GreenroomApp] Error running objective:', err);
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
            activeCards={activeCards}
            signals={signals}
            onNavigate={(tab) => setActiveTab(tab)}
            onRunFullDemo={handleRunFullDemo}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenOfflineModal={() => { setResumeOfflineRun(null); setIsOfflineModalOpen(true); }}
            onOpenMemoryProofModal={() => setIsMemoryProofModalOpen(true)}
            onOpenNinetySecProof={() => setIsNinetySecProofOpen(true)}
            onCreateObjective={handleCreateObjective}
            onRunObjective={handleRunObjective}
            isExecuting={isExecuting}
          />
        );
      case 'mind':
        return (
          <MindPage
            key="mind"
            mindsStatus={mindsStatus}
            memoryState={memoryState}
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
      case 'actions':
        return (
          <ActionsPage
            key="actions"
            memoryState={memoryState}
            activeCards={activeCards}
            onApproveSponsorship={handleApproveSponsorship}
            isExecuting={isExecuting}
          />
        );
      case 'system':
        return (
          <SystemPage
            key="system"
            mindsStatus={mindsStatus}
            memoryState={memoryState}
            impMessages={impMessages}
            onInspectPayload={(msg) => greenroomStore.openPayloadModal(msg)}
            onRunStep={handleRunStep}
            onRunFullDemo={handleRunFullDemo}
            onResetState={handleResetState}
            isExecuting={isExecuting}
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
            activeCards={activeCards}
            signals={signals}
            onNavigate={(tab) => setActiveTab(tab)}
            onRunFullDemo={handleRunFullDemo}
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

      {/* Payload Modal Inspector */}
      <PayloadModal
        isOpen={isModalOpen}
        message={selectedPayload}
        onClose={() => greenroomStore.closePayloadModal()}
      />

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
          if (['COMPLETED', 'FAILED'].includes(currentOfflineRun?.status)) {
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

      {/* Memory Behavioral Adaptation Proof Modal */}
      <MemoryBehaviorProofModal
        isOpen={isMemoryProofModalOpen}
        onClose={() => setIsMemoryProofModalOpen(false)}
        onMemoryUpdated={() => {
          loadInitialData();
        }}
      />

      {/* 90-Second Unavoidable Memory Proof Modal */}
      <NinetySecondProofModal
        isOpen={isNinetySecProofOpen}
        onClose={() => setIsNinetySecProofOpen(false)}
        onMemoryUpdated={() => {
          loadInitialData();
        }}
      />
    </div>
  );
}

export default App;
