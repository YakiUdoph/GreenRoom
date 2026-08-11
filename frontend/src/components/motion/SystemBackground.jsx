import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function SystemBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: width / 2, y: height / 2 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Terminal IMP Matrix protocol streams
    const columns = Math.floor(width / 24);
    const drops = new Array(columns).fill(1);
    const systemTokens = [
      'IMP_v1.0',
      'BUS_ACK',
      '0x8208',
      'STATE_STORE',
      'MINDS_SDK',
      'MEMORY_NODE',
      'PING_OK',
      'WS_CONNECTED',
      '0x72FF70',
      'EXECUTE',
      'DECAY_720H',
    ];

    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.05;
      ctx.fillStyle = 'rgba(6, 9, 14, 0.25)'; // Slow trail fading
      ctx.fillRect(0, 0, width, height);

      // Draw Grid Lines
      const cellSize = 60;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Cursor Proximity Grid Glow
      const gridMouseX = Math.floor(mouse.x / cellSize) * cellSize;
      const gridMouseY = Math.floor(mouse.y / cellSize) * cellSize;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fillRect(gridMouseX - cellSize, gridMouseY - cellSize, cellSize * 3, cellSize * 3);

      // Draw Terminal Protocol Streams
      ctx.font = '10px monospace';
      for (let i = 0; i < drops.length; i++) {
        const text = systemTokens[Math.floor(Math.random() * systemTokens.length)];
        const x = i * 24;
        const y = drops[i] * 18;

        const isGreen = i % 3 === 0;
        ctx.fillStyle = isGreen ? 'rgba(114, 255, 112, 0.5)' : 'rgba(56, 189, 248, 0.45)';
        ctx.fillText(text.charAt(0), x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#06090e]"
    >
      <canvas ref={canvasRef} className="w-full h-full block opacity-70" />
      {/* Scanline Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.3)_50%,rgba(0,0,0,0.3))] bg-[length:100%_4px] pointer-events-none opacity-40" />
    </motion.div>
  );
}
