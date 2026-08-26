import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { isOfflineRunPending, verifyRunBriefing, verifySavedObjective } from '../../lib/offlineRun';
import { soundFx } from '../../lib/sound';

export function OfflineLifecycleModal({ isOpen, onClose, onBriefingUpdated, onRunStatusChanged, memoryState, resumeRun = null }) {
  const [step, setStep] = useState(0);
  const [runId, setRunId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [runStatusDetails, setRunStatusDetails] = useState(null);
  const [executionMode, setExecutionMode] = useState('QSTASH_BACKGROUND_JOB');
  const [briefingData, setBriefingData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [noRelevantUpdate, setNoRelevantUpdate] = useState(false);
  const [offlineSeconds, setOfflineSeconds] = useState(0);
  const backgroundedRef = useRef(false);

  const creatorName = memoryState?.creator_name || 'ALEX RIVERA';
  const niche = memoryState?.niche || 'Developer Tools & AI Automation';
  const currentObjective = memoryState?.creator_objectives?.[0] || null;

  useEffect(() => {
    let timer;
    if (step >= 3 && step <= 5) {
      timer = setInterval(() => {
        setOfflineSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setOfflineSeconds(0);
    }
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (!isOpen || !resumeRun?.run_id) return;
    backgroundedRef.current = false;
    setRunId(resumeRun.run_id);
    setJobStatus(resumeRun.status);
    setRunStatusDetails(resumeRun);
    setErrorMessage(resumeRun.status === 'FAILED' ? (resumeRun.error || "GreenRoom couldn't complete this run.") : null);
    if (['NO_RELEVANT_UPDATE', 'UNSUPPORTED_DOMAIN'].includes(resumeRun.status)) {
      setNoRelevantUpdate(true);
      setStep(8);
    } else if (resumeRun.status === 'COMPLETED') {
      api.getRunBriefing(resumeRun.run_id).then((response) => {
        const briefing = verifyRunBriefing(response?.briefing, resumeRun.run_id, resumeRun.objective_id);
        setBriefingData(briefing);
        onBriefingUpdated?.(briefing);
        setStep(8);
      }).catch((error) => {
        setErrorMessage(error.message || 'The run-specific briefing could not be loaded.');
        setStep(0);
      });
    } else {
      setStep(5);
    }
  }, [isOpen, resumeRun?.run_id, resumeRun?.status]);

  if (!isOpen) return null;

  const handleStartLiveRun = async () => {
    backgroundedRef.current = false;
    soundFx.playSynapsePulse();
    setErrorMessage(null);
    setNoRelevantUpdate(false);

    let activeRunId = null;
    let activeObjectiveId = null;
    try {
      const durableState = await api.getMemoryState();
      const savedObjective = verifySavedObjective(durableState, currentObjective);
      setStep(1); // Step 1: Objective Persisted

      await new Promise((r) => setTimeout(r, 600));
      setStep(2); // Step 2: Triggering Job

      const res = await api.triggerBriefing(savedObjective.id);
      if (!res.run_id) throw new Error('The queue did not return a run ID.');
      if (res.objective?.objective_id !== savedObjective.id) {
        throw new Error('The queued run is not bound to the selected objective.');
      }
      const rid = res.run_id;
      activeRunId = rid;
      activeObjectiveId = savedObjective.id;
      setRunId(rid);
      setJobStatus(res.job_status || 'QUEUED');
      setRunStatusDetails({ status: res.job_status || 'QUEUED' });
      setExecutionMode(res.execution_mode || 'QSTASH_BACKGROUND_JOB');
      onRunStatusChanged?.({ run_id: rid, objective_id: savedObjective.id, status: res.job_status || 'QUEUED' });

      await new Promise((r) => setTimeout(r, 800));
      setStep(3); // Step 3: Creator Offline

      await new Promise((r) => setTimeout(r, 1200));
      setStep(4); // Step 4: Worker Executing (QStash webhook)

      // Poll durable run state until a truthful terminal state is reached.
      let attempts = 0;
      let completed = false;
      let latestStatus = 'RUNNING';

      // The browser polls durable state only; the signed worker owns live retrieval.
      while (attempts < 660 && !completed) {
        attempts++;
        await new Promise((r) => setTimeout(r, 1000));
        if (backgroundedRef.current) return;
        try {
          const statusRes = await api.getBriefingStatus(rid);
          latestStatus = statusRes.status || 'RUNNING';
          setJobStatus(latestStatus);
          setRunStatusDetails(statusRes);
          if (isOfflineRunPending(latestStatus)) {
            setStep(5);
          }
          if (latestStatus === 'COMPLETED') {
            completed = true;
          }
          if (['NO_RELEVANT_UPDATE', 'UNSUPPORTED_DOMAIN'].includes(latestStatus)) {
            completed = true;
          }
          if (latestStatus === 'FAILED') {
            throw new Error(statusRes.error || 'Background run failed.');
          }
        } catch (pollErr) {
          if (latestStatus === 'FAILED') throw pollErr;
          console.warn('[OfflineModal] Polling error:', pollErr);
        }
      }

      if (!completed) {
        throw new Error('Background run did not reach a terminal state before the polling window ended. You can safely close this window and return later.');
      }

      setStep(6); // Step 6: Result Persisted
      await new Promise((r) => setTimeout(r, 800));

      if (['NO_RELEVANT_UPDATE', 'UNSUPPORTED_DOMAIN'].includes(latestStatus)) {
        setNoRelevantUpdate(true);
        onRunStatusChanged?.({ run_id: rid, objective_id: savedObjective.id, status: latestStatus });
        setStep(7);
        await new Promise((r) => setTimeout(r, 500));
        setStep(8);
        return;
      }

      const briefingRes = await api.getRunBriefing(rid);
      const briefing = verifyRunBriefing(briefingRes?.briefing, rid, savedObjective.id);
      setBriefingData(briefing);
      if (onBriefingUpdated) {
        onBriefingUpdated(briefing);
      }
      onRunStatusChanged?.({ run_id: rid, objective_id: savedObjective.id, status: 'COMPLETED' });

      setStep(7); // Step 7: Creator Returns
      soundFx.playSuccessChime();
      await new Promise((r) => setTimeout(r, 800));

      setStep(8); // Step 8: Briefing Ready ("While You Were Away...")
    } catch (err) {
      console.error('[OfflineModal] Error in offline chain:', err);
      setErrorMessage(err.message || 'Error executing background job chain.');
      if (activeRunId) {
        onRunStatusChanged?.({
          run_id: activeRunId,
          objective_id: activeObjectiveId,
          status: 'FAILED',
          error: err.message || 'Background run failed.',
        });
      }
      setStep(0);
    }
  };

  const handleReset = () => {
    setStep(0);
    setRunId(null);
    setJobStatus(null);
    setRunStatusDetails(null);
    setBriefingData(null);
    setErrorMessage(null);
    setNoRelevantUpdate(false);
  };

  const handleContinue = () => {
    backgroundedRef.current = true;
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="noir-card p-6 md:p-8 w-full max-w-3xl bg-[#0e1014] border border-primary-fixed/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-outline-variant/60 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary-fixed text-xl">cloud_done</span>
                <span className="font-mono text-[10px] text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  BACKGROUND WORK
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight">
                GreenRoom works while you are away
              </h2>
              <p className="text-xs font-sans text-zinc-300 mt-1 font-medium">
                Start the objective, leave this screen if you need to, and return when the decision briefing is ready.
              </p>
            </div>

            <button onClick={handleContinue} className="text-zinc-400 hover:text-white p-1 transition">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono rounded flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Stepper Progress Bar */}
          <div className="space-y-4">
            <div className="creator-technical-detail grid grid-cols-4 md:grid-cols-8 gap-1.5 font-mono text-[10px] text-center font-bold">
              {[
                '1. Objective',
                '2. Enqueue',
                '3. Offline',
                '4. Worker',
                '5. Live evidence',
                '6. Persisted',
                '7. Return',
                '8. Delivery',
              ].map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isPassed = step > stepNum;
                return (
                  <div
                    key={idx}
                    className={`py-2 px-1 rounded border transition ${
                      isActive
                        ? 'bg-primary-fixed text-black border-primary-fixed font-black shadow-[0_0_10px_#72ff70]'
                        : isPassed
                        ? 'bg-[#142616] text-primary-fixed border-[#234d28]'
                        : 'bg-[#0a0c0e] text-zinc-500 border-outline-variant/60'
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>

            {/* Stage 0: Initial State & Trigger Button */}
            {step === 0 && (
              <div className="noir-card p-6 space-y-4 bg-[#0a0c0e] border-dashed border-outline-variant text-center">
                <div className="w-12 h-12 rounded-full bg-[#142616] border border-[#234d28] flex items-center justify-center mx-auto text-primary-fixed">
                  <span className="material-symbols-outlined text-2xl animate-pulse">power_settings_new</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-display font-bold text-white uppercase">Ready for background work</h3>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                    GreenRoom will hold this objective in the background. A result appears only after the run completes successfully.
                  </p>
                </div>
                <button
                  onClick={handleStartLiveRun}
                  className="px-6 py-3 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition shadow-lg shadow-primary-container/20 flex items-center gap-2 mx-auto"
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  <span>Start background work</span>
                </button>
              </div>
            )}

            {/* Stages 1-7: Execution Animation & Status Box */}
            {step >= 1 && step <= 7 && (
              <div className="noir-card p-6 space-y-4 bg-[#0a0c0e] border border-primary-fixed/30 relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-primary-fixed">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-ping" />
                    <span className="font-bold uppercase">
                      {jobStatus === 'FAILED' ? 'RUN FAILED' : 'WORKING'}
                    </span>
                  </div>

                  <span className="text-zinc-400 font-bold">
                    OFFLINE TIMER: <strong className="text-primary-fixed">00:0{offlineSeconds}s</strong>
                  </span>
                </div>

                {/* Job Ticket Details */}
                <div className="creator-technical-detail grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-2.5 bg-[#111115] rounded border border-outline-variant">
                    <span className="text-[10px] text-zinc-400 block font-bold">RUN ID</span>
                    <span className="text-primary-fixed font-bold">{runId || 'GENERATING...'}</span>
                  </div>
                  <div className="p-2.5 bg-[#111115] rounded border border-outline-variant">
                    <span className="text-[10px] text-zinc-400 block font-bold">JOB STATUS</span>
                    <span className="text-amber-400 font-bold uppercase">{jobStatus || 'QUEUED'}</span>
                  </div>
                  <div className="p-2.5 bg-[#111115] rounded border border-outline-variant">
                    <span className="text-[10px] text-zinc-400 block font-bold">DISPATCH MODE</span>
                    <span className="text-cyan-400 font-bold">{executionMode}</span>
                  </div>
                  <div className="p-2.5 bg-[#111115] rounded border border-outline-variant">
                    <span className="text-[10px] text-zinc-400 block font-bold">DECISION ENGINE</span>
                    <span className="text-white font-bold text-[11px]">LIVE CORE</span>
                  </div>
                </div>

                {/* Visual Description Card */}
                <div className="creator-technical-detail p-4 bg-[#142616]/40 border border-[#234d28] rounded font-mono text-xs text-zinc-200 leading-relaxed">
                  {step === 1 && `Creator "${creatorName}" identity rules & $45 CPM benchmark verified in memory store.`}
                  {step === 2 && `POST /api/briefing/trigger called. Background job enqueued with status QUEUED.`}
                  {step === 3 && `The creator can close this view while GreenRoom keeps the durable run active.`}
                  {step === 4 && `QStash worker endpoint /api/briefing-worker triggered via signed webhook.`}
                  {step === 5 && (jobStatus === 'FAILED'
                    ? (errorMessage || `GreenRoom couldn't complete this run.`)
                    : `GreenRoom is retrieving and validating current first-party AI-video evidence.`)}
                  {step === 6 && `Ranking result. Executive Briefing and provenance metadata durably saved to its run-specific Upstash Redis record.`}
                  {step === 7 && `Creator re-opens dashboard. Polling confirms job completion.`}
                </div>
                {step === 5 && isOfflineRunPending(jobStatus) && <button onClick={handleContinue} className="px-5 py-3 bg-primary-container text-on-primary-container font-mono text-xs font-bold uppercase rounded hover:bg-primary-fixed-dim transition self-start">Continue in GreenRoom</button>}
              </div>
            )}

            {/* Stage 8: Briefing Ready ("While You Were Away...") */}
            {step === 8 && noRelevantUpdate && <div className="density-empty"><strong>{jobStatus === 'UNSUPPORTED_DOMAIN' ? 'NO LIVE PROVIDER' : 'NO RELEVANT UPDATE'}</strong><p>{jobStatus === 'UNSUPPORTED_DOMAIN' ? 'GreenRoom does not yet have a live evidence provider for this objective domain. No unrelated evidence was substituted.' : 'No current evidence passed GreenRoom’s strict relevance and freshness filters. Previous results were not reused.'}</p><button onClick={handleReset}>Check again later</button></div>}
            {step === 8 && !noRelevantUpdate && (
              <div className="space-y-4">
                <div className="p-4 bg-[#142616] border border-[#234d28] rounded-xl flex justify-between items-center font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-fixed text-2xl">check_circle</span>
                    <div>
                      <span className="text-primary-fixed font-bold uppercase block">
                        OFFLINE JOB COMPLETE — BRIEFING PERSISTED & DELIVERED
                      </span>
                      <span className="text-zinc-200">
                        Run ID: <strong className="text-white">{runId}</strong> • Mode: <strong className="text-cyan-300">{executionMode}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 bg-[#111115] border border-outline-variant text-zinc-300 hover:text-white font-bold rounded"
                  >
                    Test Again
                  </button>
                </div>

                {/* Delivered "While You Were Away" Executive Card */}
                <div className="noir-card p-6 space-y-4 bg-[#0e1014] border-l-4 border-l-primary-fixed shadow-xl">
                  <div className="flex justify-between items-start border-b border-outline-variant/60 pb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-primary-fixed uppercase tracking-wider bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                        WHILE YOU WERE AWAY... BRIEFING
                      </span>
                      <h3 className="text-lg font-display font-bold text-white mt-1">
                        {briefingData?.items?.[0]?.title || briefingData?.script_concept?.title || 'Ranked briefing ready'}
                      </h3>
                    </div>

                    <span className="font-mono text-[10px] text-emerald-400 font-bold bg-[#142616] px-2.5 py-1 rounded border border-[#234d28]">
                      GREENROOM LIVE CORE · MINDS NOT USED
                    </span>
                  </div>

                  <p className="font-mono text-xs text-zinc-300 leading-relaxed bg-[#0a0c0e] p-3.5 rounded border border-outline-variant whitespace-pre-wrap">
                    {briefingData?.items?.[0]?.recommended_action || briefingData?.script_concept?.concept || 'The completed briefing is available on the main dashboard.'}
                  </p>

                  <div className="flex justify-between items-center pt-2 font-mono text-xs">
                    <span className="text-zinc-400">Provenance: Run #{runId} • Stored Durably</span>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-primary-container text-on-primary-container font-bold uppercase rounded hover:bg-primary-fixed-dim transition shadow-md shadow-primary-container/20"
                    >
                      View on Main Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default OfflineLifecycleModal;
