import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function MemoryBackground() {
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

    const mouse = { x: width / 2, y: height / 2, radius: 220 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Floating memory nodes with decay rings
    const memoryNodes = [];
    const memoryTags = ['RECALL', 'PERSIST', 'DNA_NODE', 'VOICE_RULES', '720h_DECAY', 'PROFILE_STATE', 'CTX_STORE'];

    for (let i = 0; i < 35; i++) {
      memoryNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 3 + 2,
        ringSize: Math.random() * 25 + 12,
        pulse: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.008,
        tag: i % 5 === 0 ? memoryTags[Math.floor(Math.random() * memoryTags.length)] : null,
        isAmber: i % 2 === 0,
      });
    }

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < memoryNodes.length; i++) {
        const m = memoryNodes[i];
        m.x += m.vx;
        m.y += m.vy;
        m.pulse += m.speed;

        if (m.x < 0 || m.x > width) m.vx *= -1;
        if (m.y < 0 || m.y > height) m.vy *= -1;

        // Cursor attraction & swelling
        const dx = mouse.x - m.x;
        const dy = mouse.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let scale = 1;
        if (dist < mouse.radius) {
          const factor = (mouse.radius - dist) / mouse.radius;
          m.x -= (dx / dist) * factor * 1.8;
          m.y -= (dy / dist) * factor * 1.8;
          scale = 1 + factor * 0.8;
        }

        const color = m.isAmber ? '#fbbf24' : '#72ff70';
        const ringAlpha = (Math.sin(m.pulse) * 0.2 + 0.25) * scale;

        // Draw Expanding Memory Ring
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.ringSize * (0.8 + Math.sin(m.pulse) * 0.2) * scale, 0, Math.PI * 2);
        ctx.strokeStyle = m.isAmber ? `rgba(251, 191, 36, ${ringAlpha})` : `rgba(114, 255, 112, ${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw Node Core
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Render Memory Tag Label if present
        if (m.tag) {
          ctx.font = '9px monospace';
          ctx.fillStyle = m.isAmber ? 'rgba(251, 191, 36, 0.65)' : 'rgba(114, 255, 112, 0.65)';
          ctx.fillText(m.tag, m.x + 10, m.y + 3);
        }

        // Draw memory connection lines
        for (let j = i + 1; j < memoryNodes.length; j++) {
          const m2 = memoryNodes[j];
          const dist2 = Math.hypot(m2.x - m.x, m2.y - m.y);
          if (dist2 < 180) {
            const lineAlpha = (1 - dist2 / 180) * 0.25;
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(m2.x, m2.y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
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
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0c0a07]"
    >
      <canvas ref={canvasRef} className="w-full h-full block opacity-75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f59e0b]/10 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}
