import React, { useState, useEffect } from 'react';
import { useGreenroomState } from './hooks/useGreenroomState';
import { useGreenroomSocket } from './hooks/useGreenroomSocket';
import { greenroomStore } from './stores/greenroomStore';
import { api } from './lib/api';

import { Navigation } from './components/layout/Navigation';
import { DemoBanner } from './components/layout/DemoBanner';
import { PayloadModal } from './components/ui/PayloadModal';

import { Home } from './pages/Home';
import { Mind } from './pages/Mind';
import { Memory } from './pages/Memory';
import { Intelligence } from './pages/Intelligence';
import { Actions } from './pages/Actions';
import { System } from './pages/System';

export function App() {
  // Active Navigation Tab ('home' | 'mind' | 'memory' | 'intelligence' | 'actions' | 'system')
  const [activeTab, setActiveTab] = useState('home');
  const [isExecuting, setIsExecuting] = useState(false);

  // Initialize WebSocket Lifecycle
  useGreenroomSocket();

  // Subscribe to Centralized Store State
  const {
    mindsStatus,
    memoryState,
    impMessages,
    selectedPayload,
    isModalOpen,
    demoProgress,
    activeCards,
  } = useGreenroomState();

  // Initial Data Load via REST API
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

  // Demo Step Runner Handler
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
      }, 800);
    } catch (err) {
      console.error(`[GreenroomApp] Step ${stepId} error:`, err);
      greenroomStore.clearDemoProgress();
      setIsExecuting(false);
    }
  };

  // Full 5-Minute Demo Runner Handler
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

  // Reset State Handler
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

  // Action Approval Handler
  const handleApproveSponsorship = async (sponsorName = 'TechBrand Inc.') => {
    try {
      const actionName = `Sponsorship Outreach Pitch for ${sponsorName}`;
      await api.approveAction(actionName);
    } catch (err) {
      console.error('[GreenroomApp] Error approving sponsorship:', err);
    }
  };

  // Creator Voice Feedback Handler
  const handleSubmitFeedback = async (feedbackText) => {
    await handleRunStep(5, feedbackText);
  };

  // Render Active Page Component
  const renderActivePage = () => {
    switch (activeTab) {
      case 'mind':
        return (
          <Mind
            mindsStatus={mindsStatus}
            impMessages={impMessages}
            onRunStep={handleRunStep}
            isExecuting={isExecuting}
          />
        );

      case 'memory':
        return (
          <Memory
            memoryState={memoryState}
            onSubmitFeedback={handleSubmitFeedback}
            isExecuting={isExecuting}
          />
        );

      case 'intelligence':
        return (
          <Intelligence
            impMessages={impMessages}
            onInspectPayload={(msg) => greenroomStore.openPayloadModal(msg)}
            onRunStep={handleRunStep}
            isExecuting={isExecuting}
          />
        );

      case 'actions':
        return (
          <Actions
            activeCards={activeCards}
            onApproveSponsorship={handleApproveSponsorship}
            isExecuting={isExecuting}
          />
        );

      case 'system':
        return (
          <System
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

      case 'home':
      default:
        return (
          <Home
            memoryState={memoryState}
            activeCards={activeCards}
            mindsStatus={mindsStatus}
            onNavigate={(tab) => setActiveTab(tab)}
            onRunFullDemo={handleRunFullDemo}
            isExecuting={isExecuting}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Persistent Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        mindsStatus={mindsStatus}
      />

      {/* Main Container */}
      <main className="flex-1 p-4 md:p-8">
        {/* Progress Banner */}
        <div className="max-w-[1400px] mx-auto mb-6">
          <DemoBanner progress={demoProgress} />
        </div>

        {/* Dynamic Page Render */}
        {renderActivePage()}
      </main>

      {/* Raw Payload Modal Inspector */}
      <PayloadModal
        isOpen={isModalOpen}
        message={selectedPayload}
        onClose={() => greenroomStore.closePayloadModal()}
      />
    </div>
  );
}

export default App;
