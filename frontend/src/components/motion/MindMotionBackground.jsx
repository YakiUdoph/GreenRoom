import React from 'react';
import { MindBackground } from './MindBackground';

export function MindMotionBackground({ children }) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#070b10]">
      <MindBackground />
      {/* Foreground Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
