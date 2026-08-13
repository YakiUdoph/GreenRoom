import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundFx } from '../../lib/sound';

export function MobileNavbar({ activeTab, onTabChange, onInitialize }) {
  const [isOpen, setIsOpen] = useState(false);

  const mainNavItems = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'mind', label: 'Mind', icon: 'psychology' },
    { id: 'memory', label: 'Memory', icon: 'database' },
    { id: 'intelligence', label: 'Intelligence', icon: 'neurology' },
    { id: 'actions', label: 'Actions', icon: 'bolt' },
    { id: 'system', label: 'System', icon: 'terminal' },
    { id: 'docs', label: 'Documentation', icon: 'menu_book' },
  ];

  const handleSelectTab = (tabId) => {
    soundFx.playSynapsePulse();
    onTabChange(tabId);
    setIsOpen(false);
  };

  const currentItem = mainNavItems.find((item) => item.id === activeTab) || mainNavItems[0];

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0e1014]/95 backdrop-blur-xl border-b border-[#72ff70]/20 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded border border-[#72ff70]/40 flex items-center justify-center bg-[#142616]">
            <span className="material-symbols-outlined text-primary-fixed text-xl animate-pulse">all_inclusive</span>
          </div>
          <div>
            <h1 className="font-sans font-black text-primary-fixed text-base tracking-tighter">GREENROOM</h1>
            <p className="font-mono text-zinc-400 text-[10px] uppercase font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed" />
              <span>{currentItem.label}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-[#142616] border border-[#234d28] text-primary-fixed rounded-lg focus:outline-none flex items-center justify-center shadow-md active:scale-95 transition"
          aria-label="Toggle Navigation Drawer"
        >
          <span className="material-symbols-outlined text-xl">
            {isOpen ? 'close' : 'menu'}
          </span>
        </button>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Sliding Drawer Panel */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-4/5 max-w-xs bg-[#0e1014] border-r border-[#72ff70]/30 h-full flex flex-col justify-between py-6 px-4 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded border border-[#72ff70]/40 flex items-center justify-center bg-[#142616]">
                      <span className="material-symbols-outlined text-primary-fixed text-xl">all_inclusive</span>
                    </div>
                    <div>
                      <h2 className="font-sans font-black text-primary-fixed text-lg tracking-tighter">GREENROOM</h2>
                      <p className="font-mono text-zinc-400 text-[10px] font-bold">AI Chief of Staff</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-zinc-400 hover:text-white p-1"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="space-y-1.5 font-mono text-xs">
                  <span className="text-[10px] text-primary-fixed font-bold uppercase tracking-wider block px-2 mb-2">
                    NAVIGATION DOMAINS
                  </span>
                  {mainNavItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-bold text-left ${
                          isActive
                            ? 'bg-[#142616] text-primary-fixed border border-[#234d28] shadow-md'
                            : 'text-zinc-300 hover:bg-[#15171c] hover:text-white border border-transparent'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-xl ${isActive ? 'text-primary-fixed' : 'text-zinc-400'}`}>
                          {item.icon}
                        </span>
                        <span className="uppercase tracking-wide">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer Status */}
              <div className="pt-4 border-t border-outline-variant/60 space-y-3 font-mono text-xs">
                <div className="p-3 bg-[#142616]/40 border border-[#234d28] rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse" />
                  <span className="text-primary-fixed text-[11px] font-bold">System Online & Monitoring</span>
                </div>
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileNavbar;
