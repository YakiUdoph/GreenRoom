import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CreatorOnboardingModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    creator_name: initialData?.creator_name || 'Alex Rivera',
    niche: initialData?.niche || 'Developer Tools & AI Automation',
    audience_description:
      initialData?.audience_description ||
      'Software engineers and builders entering local AI setup for the first time.',
    preferred_tone: initialData?.preferred_tone || 'Conversational, direct and practical',
    main_goal: initialData?.main_goal || 'Grow a high-trust technical developer audience',
    long_term_objective:
      initialData?.long_term_objective ||
      'Build the premier channel for open-source AI agent workflows',
    content_wanted: initialData?.content_wanted
      ? initialData.content_wanted.join(', ')
      : 'Beginner local setup walkthroughs, Open-source GitHub repos',
    content_not_wanted: initialData?.rejected_topics
      ? initialData.rejected_topics.join(', ')
      : 'Crypto trading bots, Generic AI news clickbait',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        creator_name: formData.creator_name.trim(),
        niche: formData.niche.trim(),
        audience_description: formData.audience_description.trim(),
        preferred_tone: formData.preferred_tone.trim(),
        main_goal: formData.main_goal.trim(),
        long_term_objective: formData.long_term_objective.trim(),
        content_wanted: formData.content_wanted
          ? formData.content_wanted.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        content_not_wanted: formData.content_not_wanted
          ? formData.content_not_wanted.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('[OnboardingModal] Save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="noir-card p-6 md:p-8 w-full max-w-2xl bg-[#0e1014] border border-[#72ff70]/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-outline-variant/60 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary-fixed text-xl">badge</span>
                <span className="font-mono text-[10px] text-primary-fixed uppercase tracking-widest font-bold bg-[#142616] px-2.5 py-0.5 rounded border border-[#234d28]">
                  REAL CREATOR IDENTITY ONBOARDING
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight">
                Establish Your Creator Context
              </h2>
              <p className="text-xs font-sans text-zinc-300 mt-1 font-medium">
                Greenroom will persist these identity rules permanently into long-term memory.
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 transition"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {/* Grid Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold uppercase block">Creator Name</label>
                <input
                  type="text"
                  value={formData.creator_name}
                  onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })}
                  className="w-full bg-[#0a0c0e] border border-outline-variant rounded p-3 text-white focus:border-primary-fixed focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold uppercase block">Creator Niche</label>
                <input
                  type="text"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  className="w-full bg-[#0a0c0e] border border-outline-variant rounded p-3 text-white focus:border-primary-fixed focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Audience Description */}
            <div className="space-y-1.5">
              <label className="text-zinc-300 font-bold uppercase block">Audience Description</label>
              <textarea
                value={formData.audience_description}
                onChange={(e) => setFormData({ ...formData, audience_description: e.target.value })}
                rows={2}
                className="w-full bg-[#0a0c0e] border border-outline-variant rounded p-3 text-white focus:border-primary-fixed focus:outline-none leading-relaxed"
                required
              />
            </div>

            {/* Grid Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold uppercase block">Preferred Tone</label>
                <input
                  type="text"
                  value={formData.preferred_tone}
                  onChange={(e) => setFormData({ ...formData, preferred_tone: e.target.value })}
                  className="w-full bg-[#0a0c0e] border border-outline-variant rounded p-3 text-white focus:border-primary-fixed focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-bold uppercase block">Main Creator Goal</label>
                <input
                  type="text"
                  value={formData.main_goal}
                  onChange={(e) => setFormData({ ...formData, main_goal: e.target.value })}
                  className="w-full bg-[#0a0c0e] border border-outline-variant rounded p-3 text-white focus:border-primary-fixed focus:outline-none"
                />
              </div>
            </div>

            {/* Content Wanted */}
            <div className="space-y-1.5">
              <label className="text-primary-fixed font-bold uppercase block">
                ✓ Content Formats You Want (Comma Separated)
              </label>
              <input
                type="text"
                value={formData.content_wanted}
                onChange={(e) => setFormData({ ...formData, content_wanted: e.target.value })}
                className="w-full bg-[#0a0c0e] border border-[#234d28] rounded p-3 text-white focus:border-primary-fixed focus:outline-none"
              />
            </div>

            {/* Content NOT Wanted (Constraints) */}
            <div className="space-y-1.5">
              <label className="text-rose-400 font-bold uppercase block">
                ✕ Content You Rejection/Avoid (Constraints)
              </label>
              <input
                type="text"
                value={formData.content_not_wanted}
                onChange={(e) => setFormData({ ...formData, content_not_wanted: e.target.value })}
                className="w-full bg-[#0a0c0e] border border-rose-900/60 rounded p-3 text-rose-200 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-outline-variant/60 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#111115] border border-outline-variant text-zinc-400 font-bold uppercase rounded hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-primary-container text-on-primary-container font-bold uppercase rounded hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 shadow-lg shadow-primary-container/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base font-bold">save</span>
                <span>{isSubmitting ? 'Persisting...' : 'Persist Profile Memory'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CreatorOnboardingModal;
