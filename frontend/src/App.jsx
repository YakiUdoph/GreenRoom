import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGreenroomState } from './hooks/useGreenroomState';
import { useGreenroomSocket } from './hooks/useGreenroomSocket';
import { useMousePosition } from './hooks/useMousePosition';
import { greenroomStore } from './stores/greenroomStore';
import { api } from './lib/api';

import { Sidebar } from './components/layout/Sidebar';
import { MobileNavbar } from './components/layout/MobileNavbar';
import { CursorSpotlight } from './components/motion/CursorSpotlight';
import { PayloadModal } from './components/ui/PayloadModal';
import { CreatorOnboardingModal } from './components/onboarding/CreatorOnboardingModal';
import { OfflineLifecycleModal } from './components/activity/OfflineLifecycleModal';
import { MemoryBehaviorProofModal } from './components/memory/MemoryBehaviorProofModal';
import { SpecialistMindsProofModal } from './components/mind/SpecialistMindsProofModal';

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
import { DocsPage } from './pages/DocsPage';

export function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [isMemoryProofModalOpen, setIsMemoryProofModalOpen] = useState(false);
  const [isSpecialistProofModalOpen, setIsSpecialistProofModalOpen] = useState(false);

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
            onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
            onOpenMemoryProofModal={() => setIsMemoryProofModalOpen(true)}
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
            onOpenMemoryProofModal={() => setIsMemoryProofModalOpen(true)}
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
            onOpenSpecialistProofModal={() => setIsSpecialistProofModalOpen(true)}
            isExecuting={isExecuting}
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
      case 'docs':
        return <SystemBackground key="bg-docs" />;
      default:
        return <HomeBackground key="bg-[#default]" />;
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
        {/* Mobile Navigation Bar & Drawer */}
        <MobileNavbar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onInitialize={loadInitialData}
        />

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
        onClose={() => setIsOfflineModalOpen(false)}
        memoryState={memoryState}
        onBriefingUpdated={() => {
          loadInitialData();
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

      {/* Specialist Minds Multi-Agent Architecture Proof Modal */}
      <SpecialistMindsProofModal
        isOpen={isSpecialistProofModalOpen}
        onClose={() => setIsSpecialistProofModalOpen(false)}
      />
    </div>
  );
}

export default App;
