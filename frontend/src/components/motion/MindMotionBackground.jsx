import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function MindMotionBackground({ children }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [6, -6]), { stiffness: 150, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-6, 6]), { stiffness: 150, damping: 25 });
  const bgScale = useSpring(useTransform(mouseY, [-300, 300], [1.02, 1.06]), { stiffness: 150, damping: 25 });

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

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-screen overflow-hidden bg-[#0a0c0e]"
    >
      {/* Dynamic Animated Synapse Motion Image Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          style={{ rotateX, rotateY, scale: bgScale, transformStyle: 'preserve-3d' }}
          className="absolute inset-0 w-full h-full flex items-center justify-center opacity-35"
        >
          <motion.img
            src="/mind_page_background.png"
            alt="AI Mind Synapse Background"
            animate={{
              rotate: [0, 2, 0, -2, 0],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-full h-full object-cover mix-blend-screen filter brightness-125 contrast-125"
          />
        </motion.div>

        {/* Ambient Radial Green Synapse Pulse Layer */}
        <motion.div
          animate={{
            opacity: [0.3, 0.65, 0.3],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#72ff70]/15 via-transparent to-transparent pointer-events-none"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
