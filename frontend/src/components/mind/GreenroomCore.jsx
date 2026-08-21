import React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';

const STATE_MAP = {
  IDLE: { label: 'WATCHING', phase: 1, note: 'Quietly monitoring the objective and its surrounding signals.' },
  RECEIVING: { label: 'REMEMBERING', phase: 0, note: 'Bringing creator history and boundaries into view.' },
  LEARNING: { label: 'REMEMBERING', phase: 0, note: 'Persisting the reason behind each decision.' },
  THINKING: { label: 'WORKING', phase: 2, note: 'Comparing live evidence with remembered context.' },
  COLLABORATING: { label: 'WORKING', phase: 2, note: 'Specialist minds are resolving the strongest next move.' },
  ACTING: { label: 'RANKING', phase: 3, note: 'Ordering completed work by fit, evidence, and value.' },
  RETURNED: { label: 'RETURNED', phase: 4, note: 'The ranked briefing is ready for a decision.' },
};

export function GreenroomCore({ stateName = 'IDLE', subtitle, compact = false }) {
  const reducedMotion = useReducedMotion();
  const state = STATE_MAP[stateName.toUpperCase()] || STATE_MAP.IDLE;
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 80, damping: 24, mass: 0.8 });
  const springY = useSpring(pointerY, { stiffness: 80, damping: 24, mass: 0.8 });
  const rotateX = useTransform(springY, [-1, 1], [1.5, -1.5]);
  const rotateY = useTransform(springX, [-1, 1], [-1.5, 1.5]);
  const translateX = useTransform(springX, [-1, 1], [-3, 3]);
  const translateY = useTransform(springY, [-1, 1], [-3, 3]);

  const handlePointerMove = (event) => {
    if (reducedMotion || event.pointerType === 'touch' || !window.matchMedia('(pointer: fine)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  if (compact) {
    return (
      <div className="mind-compact" aria-label={`Greenroom Mind: ${state.label}`}>
        <span className="mind-compact__mark" aria-hidden="true" />
        <div><span className="oryzo-label">{state.label}</span><p>{subtitle || state.note}</p></div>
      </div>
    );
  }

  return (
    <section className="greenroom-mind" onPointerMove={handlePointerMove} onPointerLeave={resetPointer} aria-label={`Greenroom Mind is ${state.label.toLowerCase()}`}>
      <div className="greenroom-mind__index" aria-hidden="true">0{state.phase + 1} / 05</div>
      <motion.div
        className={`greenroom-mind__object greenroom-mind__object--${state.phase}`}
        style={reducedMotion ? undefined : { rotateX, rotateY, x: translateX, y: translateY }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden="true"
      >
        <span className="mind-orbit mind-orbit--outer" />
        <span className="mind-orbit mind-orbit--inner" />
        <span className="mind-plane mind-plane--one" />
        <span className="mind-plane mind-plane--two" />
        <span className="mind-center"><span className="mind-center__memory" /><span className="mind-center__signal" /></span>
      </motion.div>
      <div className="greenroom-mind__caption"><span className="oryzo-label">GREENROOM MIND · {state.label}</span><p>{subtitle || state.note}</p></div>
      <ol className="greenroom-mind__states" aria-label="Greenroom processing states">
        {['REMEMBERING', 'WATCHING', 'WORKING', 'RANKING', 'RETURNED'].map((label, index) => (
          <li key={label} className={index === state.phase ? 'is-active' : index < state.phase ? 'is-complete' : ''}><span>0{index + 1}</span>{label}</li>
        ))}
      </ol>
    </section>
  );
}

export default GreenroomCore;
