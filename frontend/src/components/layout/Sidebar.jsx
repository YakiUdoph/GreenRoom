import React from 'react';
import { motion } from 'framer-motion';
import { Home, Disc, Brain, Sparkles, Zap, Sliders, FileText, HelpCircle } from 'lucide-react';
import { MagneticHover } from '../motion/MagneticHover';

export function Sidebar({ activeTab, onTabChange }) {
  const mainNavItems = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'mind', label: 'MIND', icon: Disc },
    { id: 'memory', label: 'MEMORY', icon: Brain },
    { id: 'intelligence', label: 'INTELLIGENCE', icon: Sparkles },
    { id: 'actions', label: 'ACTIONS', icon: Zap },
    { id: 'system', label: 'SYSTEM', icon: Sliders },
  ];

  const secondaryNavItems = [
    { id: 'docs', label: 'DOCS', icon: FileText },
    { id: 'support', label: 'SUPPORT', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-[#09090b] border-r border-[#18181b] flex flex-col justify-between p-6 select-none shrink-0 min-h-screen z-20">
      {/* Top Branding */}
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-0.5"
        >
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100 font-sans">
            Greenroom
          </h1>
          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            AI OS V1.0 • MOTION DESIGN
          </p>
        </motion.div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <MagneticHover key={item.id} strength={0.15}>
                <motion.button
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onTabChange(item.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-200 group relative ${
                    isActive
                      ? 'text-zinc-100 font-semibold bg-[#121215]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#121215]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Indicator Dot */}
                    <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-transparent group-hover:bg-zinc-700'
                    }`} />
                    <Icon className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`} />
                    <span>{item.label}</span>
                  </div>

                  {/* Active Right Green Line Accent with Motion LayoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabAccent"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute right-0 top-0 bottom-0 w-0.5 bg-emerald-500 rounded-l"
                    />
                  )}
                </motion.button>
              </MagneticHover>
            );
          })}
        </nav>
      </div>

      {/* Bottom Secondary Links */}
      <div className="space-y-1 border-t border-[#18181b] pt-4">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => alert(`${item.label} documentation`)}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-mono tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Icon className="w-4 h-4 text-zinc-500" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
