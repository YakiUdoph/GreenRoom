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
    <nav className="hidden md:flex flex-col h-screen sticky top-0 py-6 bg-surface-container-low left-0 w-64 border-r border-outline-variant flat z-40 shrink-0 select-none">
      {/* Header */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded border border-outline-variant flex items-center justify-center bg-background">
            <span className="material-symbols-outlined text-primary-fixed text-2xl">all_inclusive</span>
          </div>
          <div>
            <h1 className="font-sans font-black text-primary-fixed text-xl tracking-tighter">GREENROOM</h1>
            <p className="font-mono text-on-surface-variant text-xs mt-0.5">AI Chief of Staff</p>
          </div>
        </div>

        <MagneticHover strength={0.15}>
          <button
            onClick={onInitialize}
            className="w-full py-2.5 px-4 border border-outline-variant text-on-surface text-xs font-mono font-medium hover:border-primary-fixed hover:text-primary-fixed transition-all duration-200 uppercase tracking-wider rounded"
          >
            Initialize Protocol
          </button>
        </MagneticHover>
      </div>

      {/* Main Links */}
      <div className="flex-1 flex flex-col gap-1">
        {mainNavItems.map((item, index) => {
          const isActive = activeTab === item.id;
          return (
            <MagneticHover key={item.id} strength={0.1}>
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-6 py-3 text-xs font-mono transition-all duration-150 relative ${
                  isActive
                    ? 'bg-surface-container-high text-primary-fixed font-bold border-l-2 border-primary-fixed translate-x-1'
                    : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface border-l-2 border-transparent'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${isActive ? 'icon-fill text-primary-fixed' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </motion.button>
            </MagneticHover>
          );
        })}
      </div>

      {/* Footer Links */}
      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant pt-4 px-2">
        {footerNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id === 'connection' ? 'system' : 'home')}
            className="flex items-center gap-3 text-on-surface-variant px-4 py-2.5 hover:bg-surface-variant hover:text-on-surface transition-all text-xs font-mono rounded"
          >
            <span className="material-symbols-outlined text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
