import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function IntelligenceBackground() {
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

    // Multi-Mind Reasoning Nodes (Scout, Community, Business, Core)
    const minds = [
      { name: 'CoreMind', x: width * 0.5, y: height * 0.35, color: '#72ff70' },
      { name: 'ScoutMind', x: width * 0.25, y: height * 0.65, color: '#22d3ee' },
      { name: 'CommunityMind', x: width * 0.5, y: height * 0.75, color: '#fbbf24' },
      { name: 'BusinessMind', x: width * 0.75, y: height * 0.65, color: '#34d399' },
    ];

    // Pulsing IMP communication rays along mind pathways
    const pulses = [];
    const createPulse = () => {
      const sourceIdx = Math.floor(Math.random() * minds.length);
      let targetIdx = Math.floor(Math.random() * minds.length);
      while (targetIdx === sourceIdx) targetIdx = Math.floor(Math.random() * minds.length);

      pulses.push({
        source: minds[sourceIdx],
        target: minds[targetIdx],
        progress: 0,
        speed: Math.random() * 0.015 + 0.008,
      });
    };

    let pulseTimer = 0;
    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Recalculate mind positions dynamically relative to screen width
      minds[0].x = width * 0.5;
      minds[0].y = height * 0.35;
      minds[1].x = width * 0.25;
      minds[1].y = height * 0.65;
      minds[2].x = width * 0.5;
      minds[2].y = height * 0.75;
      minds[3].x = width * 0.75;
      minds[3].y = height * 0.65;

      // Draw faint intelligence grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw mind node connections
      for (let i = 0; i < minds.length; i++) {
        for (let j = i + 1; j < minds.length; j++) {
          ctx.beginPath();
          ctx.moveTo(minds[i].x, minds[i].y);
          ctx.lineTo(minds[j].x, minds[j].y);
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Spawn periodic inter-mind IMP pulses
      pulseTimer++;
      if (pulseTimer % 45 === 0) createPulse();

      // Render & update pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.progress += p.speed;

        const currX = p.source.x + (p.target.x - p.source.x) * p.progress;
        const currY = p.source.y + (p.target.y - p.source.y) * p.progress;

        ctx.beginPath();
        ctx.arc(currX, currY, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.source.color;
        ctx.shadowColor = p.source.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.progress >= 1) pulses.splice(i, 1);
      }

      // Draw Mind Node Anchors with glowing aura
      minds.forEach((m) => {
        const glow = Math.sin(time + m.x) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 16 * glow, 0, Math.PI * 2);
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = m.color;
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillText(m.name, m.x - 25, m.y + 28);
      });

      // Mouse reactive intelligence spotlight
      const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 250);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

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
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#060a10]"
    >
      <canvas ref={canvasRef} className="w-full h-full block opacity-75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#06b6d4]/10 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}
