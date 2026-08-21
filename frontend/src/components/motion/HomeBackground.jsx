import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function HomeBackground() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070a08]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-[0.18] bg-[linear-gradient(90deg,transparent_0,transparent_calc(100%-1px),#25362b_calc(100%-1px)),linear-gradient(0deg,transparent_0,transparent_calc(100%-1px),#25362b_calc(100%-1px))] bg-[size:96px_96px]" />
      <div className="absolute -right-[12vw] top-[8vh] h-[52vw] w-[52vw] max-h-[760px] max-w-[760px] rounded-full border border-[#25362b] opacity-30" />
      <div className="absolute right-[5vw] top-[24vh] h-[26vw] w-[26vw] max-h-[380px] max-w-[380px] rounded-full border border-dashed border-[#4b6655] opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_36%,rgba(114,255,112,0.045),transparent_28%)]" />
    </motion.div>
  );
}

export default HomeBackground;
