import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGreenroomState } from './hooks/useGreenroomState';
import { useGreenroomSocket } from './hooks/useGreenroomSocket';
import { useMousePosition } from './hooks/useMousePosition';
import { greenroomStore } from './stores/greenroomStore';
import { api } from './lib/api';

import { Sidebar } from './components/layout/Sidebar';
import { CursorSpotlight } from './components/motion/CursorSpotlight';
import { PayloadModal } from './components/ui/PayloadModal';
import { CreatorOnboardingModal } from './components/onboarding/CreatorOnboardingModal';

import { HomeBackground } from './components/motion/HomeBackground';
import { MindBackground } from './components/motion/MindBackground';
import { MemoryBackground } from './components/motion/MemoryBackground';
import { IntelligenceBackground } from './components/motion/IntelligenceBackground';
import { ActionsBackground } from './components/motion/ActionsBackground';
import { SystemBackground } from './components/motion/SystemBackground';

import { HomePage } from './pages/HomePage';
import { MindPage } from './pages/MindPage';
import { MemoryPage } from './pages/MemoryPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { ActionsPage } from './pages/ActionsPage';
import { SystemPage } from './pages/SystemPage';

export function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Enable Mouse Position Physics Hook
  useMousePosition();

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
      const [mState, mStatus, impHist, sigs] = await Promise.all([
        api.getMemoryState().catch(() => null),
        api.getMindsStatus().catch(() => null),
        api.getImpHistory().catch(() => null),
        api.getSignals().catch(() => null),
      ]);

      if (mState) greenroomStore.setMemoryState(mState);
      if (mStatus) greenroomStore.setMindsStatus(mStatus);
      if (impHist) greenroomStore.setImpHistory(impHist);
      if (sigs && sigs.signals) greenroomStore.setSignals(sigs.signals);
    } catch (err) {
      console.warn('[GreenroomApp] REST fetch error:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

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
      const res = await api.submitActionFeedback(feedbackText);
      if (res.state) greenroomStore.setMemoryState(res.state);
      if (res.minds_status) greenroomStore.setMindsStatus(res.minds_status);
    } catch (err) {
      console.error('[GreenroomApp] Error submitting feedback:', err);
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
            activeCards={activeCards}
            signals={signals}
            onNavigate={(tab) => setActiveTab(tab)}
            onRunFullDemo={handleRunFullDemo}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            isExecuting={isExecuting}
          />
        );
      case 'mind':
        return (
          <MindPage
            key="mind"
            mindsStatus={mindsStatus}
            onRunStep={handleRunStep}
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
            impMessages={impMessages}
            onInspectPayload={(msg) => greenroomStore.openPayloadModal(msg)}
            onRunStep={handleRunStep}
            isExecuting={isExecuting}
          />
        );
      case 'actions':
        return (
          <ActionsPage
            key="actions"
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
      default:
        return (
          <HomePage
            key="home"
            memoryState={memoryState}
            activeCards={activeCards}
            onNavigate={(tab) => setActiveTab(tab)}
            onRunFullDemo={handleRunFullDemo}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            isExecuting={isExecuting}
          />
        );
    }
  };

  // Render Dynamic Thematic Motion Background based on activeTab
  const renderBackground = () => {
    switch (activeTab) {
      case 'home':
        return <HomeBackground key="bg-home" />;
      case 'mind':
        return <MindBackground key="bg-mind" />;
      case 'memory':
        return <MemoryBackground key="bg-memory" />;
      case 'intelligence':
        return <IntelligenceBackground key="bg-intelligence" />;
      case 'actions':
        return <ActionsBackground key="bg-actions" />;
      case 'system':
        return <SystemBackground key="bg-system" />;
      default:
        return <HomeBackground key="bg-default" />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#131313] text-[#e5e2e1] font-sans selection:bg-[#72ff70] selection:text-[#002203] relative overflow-hidden">
      {/* Dynamic Thematic Motion Background based on Active Domain */}
      <AnimatePresence mode="wait">
        {renderBackground()}
      </AnimatePresence>

      {/* Cursor Spotlight Physics */}
      <CursorSpotlight />

      {/* Desktop Side Navigation (Fixed Full-Height Sidebar) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onInitialize={loadInitialData}
      />

      {/* Main Content View Container */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10 min-w-0 md:ml-64">
        {/* Mobile Navigation Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#0e1014] border-b border-[#72ff70]/20 z-30 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed">all_inclusive</span>
            <span className="font-sans font-black text-primary-fixed text-lg">GREENROOM</span>
          </div>
          <div className="flex gap-1 overflow-x-auto font-mono text-[10px]">
            {['home', 'mind', 'memory', 'intelligence', 'actions', 'system'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded font-bold uppercase transition ${
                  activeTab === tab
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

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
    </div>
  );
}

export default App;
