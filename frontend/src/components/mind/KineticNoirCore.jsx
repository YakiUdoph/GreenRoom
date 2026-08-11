import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles, Activity, ShieldCheck, Zap } from 'lucide-react';

export function KineticNoirCore({ onCoreClick }) {
  const [isPulseActive, setIsPulseActive] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  // Dynamic Mouse Tracking Spring Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [15, -15]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-15, 15]), { stiffness: 200, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleClick = () => {
    setIsPulseActive(true);
    setPulseCount((prev) => prev + 1);
    if (onCoreClick) onCoreClick();
    setTimeout(() => setIsPulseActive(false), 1200);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative w-full h-[320px] bg-[#0b0c10] border border-[#1a1c23] rounded-2xl overflow-hidden flex flex-col justify-between p-6 cursor-pointer select-none group transition-colors hover:border-[#00ff87]/40 shadow-2xl"
    >
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff87]/10 via-transparent to-transparent pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-start z-10 font-mono text-xs">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
            SYSTEM CORE V2.0
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-ping" />
            <h4 className="text-zinc-100 font-bold tracking-wider uppercase font-sans">
              INTELLIGENCE FIELD
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-[#12141c] border border-[#222633] text-[#00ff87] rounded text-[10px] font-bold uppercase tracking-widest">
            {isPulseActive ? 'EMISSION PULSE ACTIVE' : 'REACTIVE VECTOR CORE'}
          </span>
          <span className="text-zinc-500 font-mono">PULSES: {pulseCount}</span>
        </div>
      </div>

      {/* Center Geometric Circular AI Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          className="relative w-56 h-56 flex items-center justify-center"
        >
          {/* Outer Ring 1 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-[#00ff87]/20 border-dashed"
          />

          {/* Outer Ring 2 (Counter Rotation) */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-3 rounded-full border border-[#00ff87]/40 border-t-[#00ff87]"
          />

          {/* Concentric Ring 3 */}
          <motion.div
            animate={{ rotate: 360, scale: isPulseActive ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-8 rounded-full border-2 border-[#00ff87]/60 border-r-transparent border-l-transparent shadow-[0_0_20px_rgba(0,255,135,0.3)]"
          />

          {/* Inner Glowing Core Sphere */}
          <motion.div
            animate={{
              scale: isPulseActive ? [1, 1.25, 1] : [1, 1.06, 1],
              boxShadow: isPulseActive
                ? [
                    '0 0 30px rgba(0, 255, 135, 0.6)',
                    '0 0 80px rgba(0, 255, 135, 0.9)',
                    '0 0 30px rgba(0, 255, 135, 0.6)',
                  ]
                : [
                    '0 0 20px rgba(0, 255, 135, 0.4)',
                    '0 0 40px rgba(0, 255, 135, 0.7)',
                    '0 0 20px rgba(0, 255, 135, 0.4)',
                  ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-full bg-[#00ff87]/20 border border-[#00ff87] flex items-center justify-center backdrop-blur-md"
          >
            <div className="w-10 h-10 rounded-full bg-[#00ff87] flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-[#00ff87]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          </motion.div>

          {/* Radial Pulse Wave Animation on Click */}
          {isPulseActive && (
            <motion.div
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2.5 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2 border-[#00ff87]"
            />
          )}
        </motion.div>
      </div>

      {/* Footer Instructions */}
      <div className="flex justify-between items-center z-10 text-[11px] font-mono text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#00ff87]" />
          REALTIME KINETIC NOIR FIELD
        </span>
        <span className="text-zinc-500 group-hover:text-[#00ff87] transition-colors">
          [ CLICK FIELD TO DISPATCH PULSE SIGNAL ]
        </span>
      </div>
    </div>
  );
}
