import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function ActionsBackground() {
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

    const mouse = { x: width / 2, y: height / 2, radius: 240 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Dynamic executive action vectors & particles
    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -Math.random() * 1.5 - 0.5, // Upward executive flow
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.3,
        color: i % 4 === 0 ? '#72ff70' : i % 4 === 1 ? '#34d399' : '#10b981',
      });
    }

    // Dynamic energy ripples generated on mouse movement
    const shockwaves = [];
    const handleMouseClick = (e) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 160,
        alpha: 0.8,
      });
    };
    window.addEventListener('click', handleMouseClick);

    let animationFrameId;
    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, width, height);

      // Render Upward Kinetic Stream Lines
      ctx.strokeStyle = 'rgba(114, 255, 112, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 30; x < width; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x, 0);
        ctx.stroke();
      }

      // Render Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0 || p.x > width) p.vx *= -1;

        // Cursor deflection & acceleration
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const factor = (mouse.radius - dist) / mouse.radius;
          p.x -= (dx / dist) * factor * 3;
          p.y -= (dy / dist) * factor * 3;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render Shockwave Energy Circles
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 4;
        sw.alpha -= 0.02;

        if (sw.alpha <= 0) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(114, 255, 112, ${sw.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070e0a]"
    >
      <canvas ref={canvasRef} className="w-full h-full block opacity-75" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10b981]/10 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}
