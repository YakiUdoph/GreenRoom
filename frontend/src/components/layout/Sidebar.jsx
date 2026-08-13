import React from 'react';
import { motion } from 'framer-motion';
import { MagneticHover } from '../motion/MagneticHover';

export function Sidebar({ activeTab, onTabChange, onInitialize }) {
  const mainNavItems = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'mind', label: 'Mind', icon: 'psychology' },
    { id: 'memory', label: 'Memory', icon: 'database' },
    { id: 'intelligence', label: 'Intelligence', icon: 'neurology' },
    { id: 'actions', label: 'Actions', icon: 'bolt' },
    { id: 'system', label: 'System', icon: 'terminal' },
  ];

  const footerNavItems = [
    { id: 'connection', label: 'Connection', icon: 'sensors' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <nav className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 h-screen py-6 bg-[#0e1014]/95 backdrop-blur-xl border-r border-[#72ff70]/20 z-40 shrink-0 select-none shadow-2xl justify-between">
      {/* Header & Brand */}
      <div className="px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded border border-[#72ff70]/40 flex items-center justify-center bg-[#142616]">
            <span className="material-symbols-outlined text-primary-fixed text-2xl animate-pulse">all_inclusive</span>
          </div>
          <div>
            <h1 className="font-sans font-black text-primary-fixed text-xl tracking-tighter drop-shadow-[0_0_10px_rgba(114,255,112,0.3)]">
              GREENROOM
            </h1>
            <p className="font-mono text-zinc-400 text-xs mt-0.5 font-bold">AI Chief of Staff</p>
          </div>
        </div>

        <MagneticHover strength={0.15}>
          <button
            onClick={onInitialize}
            className="w-full py-2.5 px-4 border border-[#234d28] bg-[#142616]/40 text-primary-fixed text-xs font-mono font-bold hover:border-primary-fixed hover:bg-primary-container hover:text-on-primary-container transition-all duration-200 uppercase tracking-wider rounded shadow-md"
          >
            Initialize Protocol
          </button>
        </MagneticHover>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 flex flex-col gap-1.5 my-6 overflow-y-auto">
        {mainNavItems.map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <MagneticHover key={item.id} strength={0.1}>
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: index * 0.03 }}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-mono transition-all duration-150 relative ${
                  isActive
                    ? 'bg-[#142616] text-primary-fixed font-bold border-l-4 border-primary-fixed translate-x-1 shadow-md'
                    : 'text-zinc-400 hover:bg-[#15171c] hover:text-white border-l-4 border-transparent'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${isActive ? 'icon-fill text-primary-fixed' : ''}`}>
                  {item.icon}
                </span>
                <span className="tracking-wide uppercase font-bold">{item.label}</span>
              </motion.button>
            </MagneticHover>
          );
        })}
      </div>

      {/* Footer Navigation Links */}
      <div className="flex flex-col gap-1 border-t border-outline-variant/60 pt-4 px-4">
        {footerNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id === 'connection' ? 'system' : 'home')}
            className="flex items-center gap-3 text-zinc-400 px-3 py-2 hover:bg-[#15171c] hover:text-white transition-all text-xs font-mono rounded font-bold"
          >
            <span className="material-symbols-outlined text-base text-zinc-400">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Sidebar;
