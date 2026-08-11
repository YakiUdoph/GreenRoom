import React from 'react';
import { motion } from 'framer-motion';

export function MindPage({ mindsStatus, onRunStep, isExecuting }) {
  const realMind = mindsStatus?.real_platform_mind || {};

  return (
    <div className="flex-1 p-8 md:p-12 space-y-12 max-w-container-max mx-auto text-on-background">
      <div className="border-b border-outline-variant pb-8 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary-fixed">psychology</span>
            <span className="font-mono text-xs text-primary-fixed uppercase tracking-widest font-bold">
              MIND ARCHITECTURE
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-on-surface uppercase">
            Chief of Staff & Specialist Minds
          </h1>
          <p className="text-sm font-sans text-on-surface-variant mt-2">
            Animoca Brands Minds Builder Platform Integration (`8208493e-f36b-1410-8466-00039ce7df11`).
          </p>
        </div>

        <div className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded font-mono text-xs text-primary-fixed flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
          <span>CONNECTED TO MINDS GATEWAY</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mind Credentials */}
        <div className="bg-surface-container-low border border-outline-variant p-8 rounded space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant pb-4">
            <h3 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified</span>
              PLATFORM MIND IDENTITY
            </h3>
            <span className="font-mono text-xs text-on-surface-variant">IMP v1.0</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-background border border-outline-variant rounded flex justify-between">
              <span className="text-on-surface-variant">Platform UUID</span>
              <span className="text-primary-fixed font-bold">{realMind.mindId || '8208493e-f36b-1410-8466-00039ce7df11'}</span>
            </div>

            <div className="p-4 bg-background border border-outline-variant rounded flex justify-between">
              <span className="text-on-surface-variant">Mind Email</span>
              <span className="text-on-surface font-medium">{realMind.email || 'udophia@hellominds.ai'}</span>
            </div>

            <div className="p-4 bg-background border border-outline-variant rounded flex justify-between">
              <span className="text-on-surface-variant">Wallet Address</span>
              <span className="text-on-surface-variant font-mono truncate max-w-[200px]">{realMind.walletAddress || '0xB675Ec9857776678aE540cF3248d898f015987Cb'}</span>
            </div>
          </div>
        </div>

        {/* Specialist Skills Execution */}
        <div className="bg-surface-container-low border border-outline-variant p-8 rounded space-y-6">
          <div className="flex justify-between items-center border-b border-outline-variant pb-4">
            <h3 className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">neurology</span>
              SPECIALIST SKILL ORCHESTRATION
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 bg-background border border-outline-variant rounded flex justify-between items-center">
              <div>
                <span className="block font-bold text-on-surface">ScoutMind</span>
                <span className="text-on-surface-variant text-[11px]">Skill: search_trends (Fit Score: 0.92)</span>
              </div>
              <button
                onClick={() => onRunStep(2)}
                disabled={isExecuting}
                className="px-4 py-2 bg-primary-container text-on-primary-container font-bold rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
              >
                Execute
              </button>
            </div>

            <div className="p-4 bg-background border border-outline-variant rounded flex justify-between items-center">
              <div>
                <span className="block font-bold text-on-surface">CommunityMind</span>
                <span className="text-on-surface-variant text-[11px]">Skill: analyze_comments (Demand: 88%)</span>
              </div>
              <button
                onClick={() => onRunStep(3)}
                disabled={isExecuting}
                className="px-4 py-2 bg-primary-container text-on-primary-container font-bold rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
              >
                Execute
              </button>
            </div>

            <div className="p-4 bg-background border border-outline-variant rounded flex justify-between items-center">
              <div>
                <span className="block font-bold text-on-surface">BusinessMind</span>
                <span className="text-on-surface-variant text-[11px]">Skill: score_deal ($5,400 Pitch)</span>
              </div>
              <button
                onClick={() => onRunStep(4)}
                disabled={isExecuting}
                className="px-4 py-2 bg-primary-container text-on-primary-container font-bold rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
