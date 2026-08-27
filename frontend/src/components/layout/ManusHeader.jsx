import React, { useState } from 'react';

const items = [['HOME', 'home'], ['MY MEMORY', 'memory'], ['RESULTS', 'intelligence']];

export function ManusHeader({ activeTab, onTabChange }) {
  const [open, setOpen] = useState(false);
  const go = (tab) => { onTabChange(tab); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <>
    <header className="site-header">
      <button type="button" className="brand-lockup" onClick={() => go('home')} aria-label="GreenRoom home"><span className="brand-logo" aria-hidden="true"><img src="/greenroom-logo.png" alt="" /></span><span>GREENROOM</span></button>
      <nav className="desktop-nav" aria-label="Primary navigation">{items.map(([label, tab]) => <button type="button" key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => go(tab)}>{label}</button>)}</nav>
      <div className="header-actions"><button type="button" className="menu-control" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Toggle navigation">{open ? '×' : '☰'}</button></div>
    </header>
    <div className={`mobile-nav ${open ? 'is-open' : ''}`}><nav>{items.map(([label, tab]) => <button type="button" key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => go(tab)}>{label}</button>)}</nav></div>
  </>;
}

export default ManusHeader;
