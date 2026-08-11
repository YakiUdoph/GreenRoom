import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function MindBackground() {
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

    // Particle nodes for neural synapse network
    const nodeCount = 55;
    const nodes = [];
    const mouse = { x: width / 2, y: height / 2, radius: 180 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.5 + 1.5,
        baseRadius: Math.random() * 2.5 + 1.5,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulse: Math.random() * Math.PI * 2,
        color: i % 3 === 0 ? '#72ff70' : i % 3 === 1 ? '#00ff87' : '#06b6d4',
      });
    }

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint neural mesh grid lines
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];

        // Motion update
        n1.x += n1.vx;
        n1.y += n1.vy;
        n1.pulse += n1.pulseSpeed;

        if (n1.x < 0 || n1.x > width) n1.vx *= -1;
        if (n1.y < 0 || n1.y > height) n1.vy *= -1;

        // Mouse interaction physics: attract / swell
        const dxMouse = mouse.x - n1.x;
        const dyMouse = mouse.y - n1.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < mouse.radius) {
          const force = (mouse.radius - distMouse) / mouse.radius;
          n1.x -= (dxMouse / distMouse) * force * 2.5;
          n1.y -= (dyMouse / distMouse) * force * 2.5;
          n1.radius = n1.baseRadius + force * 4;
        } else {
          n1.radius = Math.max(n1.baseRadius, n1.radius - 0.1);
        }

        // Draw node
        const glow = Math.sin(n1.pulse) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
        ctx.fillStyle = n1.color;
        ctx.shadowColor = n1.color;
        ctx.shadowBlur = 12 * glow;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby nodes with glowing synapse filaments
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.35 * glow;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(114, 255, 112, ${alpha})`;
            ctx.lineWidth = 1;
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
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#070b10]"
    >
      <canvas ref={canvasRef} className="w-full h-full block opacity-70" />
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ff87]/10 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}
