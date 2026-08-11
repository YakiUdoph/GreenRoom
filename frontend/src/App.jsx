import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGreenroomState } from './hooks/useGreenroomState';
import { useGreenroomSocket } from './hooks/useGreenroomSocket';
import { useMousePosition } from './hooks/useMousePosition';
import { greenroomStore } from './stores/greenroomStore';
import { api } from './lib/api';

import { Sidebar } from './components/layout/Sidebar';
import { CursorSpotlight } from './components/motion/CursorSpotlight';
import { PayloadModal } from './components/ui/PayloadModal';

import { HomePage } from './pages/HomePage';
import { MindPage } from './pages/MindPage';
import { MemoryPage } from './pages/MemoryPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { ActionsPage } from './pages/ActionsPage';
import { SystemPage } from './pages/SystemPage';

export function App() {
  const [activeTab, setActiveTab] = useState('memory');
  const [isExecuting, setIsExecuting] = useState(false);

  // Enable Cursor-Aware Spotlight Physics
  useMousePosition();

  // Initialize WebSocket Lifecycle
  useGreenroomSocket();

  // Subscribe to Centralized Store State
  const {
    mindsStatus,
    memoryState,
    impMessages,
    selectedPayload,
    isModalOpen,
    activeCards,
  } = useGreenroomState();

  // Initial Data Fetch via REST API
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [mState, mStatus, impHist] = await Promise.all([
          api.getMemoryState().catch(() => null),
          api.getMindsStatus().catch(() => null),
          api.getImpHistory().catch(() => null),
        ]);

        if (mState) greenroomStore.setMemoryState(mState);
        if (mStatus) greenroomStore.setMindsStatus(mStatus);
        if (impHist) greenroomStore.setImpHistory(impHist);
      } catch (err) {
        console.warn('[GreenroomApp] Initial REST fetch error:', err);
      }
    }

    loadInitialData();
  }, []);

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

  // Render Page Selection with AnimatePresence
  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            key="home"
            memoryState={memoryState}
            activeCards={activeCards}
            onNavigate={(tab) => setActiveTab(tab)}
            onRunFullDemo={handleRunFullDemo}
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
      case 'memory':
      default:
        return <MemoryPage key="memory" memoryState={memoryState} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 relative overflow-hidden">
      {/* Dynamic Ambient Cursor Spotlight */}
      <CursorSpotlight />

      {/* Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* Main Content Area with AnimatePresence Tab Transitions */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10">
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
    </div>
  );
}

export default App;
