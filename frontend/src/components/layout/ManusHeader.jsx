import React, { useState } from 'react';

const items = [['HOME', 'home'], ['MIND', 'mind'], ['MEMORY', 'memory'], ['INTELLIGENCE', 'intelligence'], ['ACTIONS', 'actions'], ['SYSTEM', 'system'], ['DOCS', 'docs']];

export function ManusHeader({ activeTab, onTabChange, runIndicator, onRunIndicatorClick }) {
  const [open, setOpen] = useState(false);
  const go = (tab) => { onTabChange(tab); setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <>
    <header className="site-header">
      <button type="button" className="brand-lockup" onClick={() => go('home')} aria-label="Greenroom home"><span className="greenroom-mark" aria-hidden="true"><i /></span><span>GREENROOM</span></button>
      <nav className="desktop-nav" aria-label="Primary navigation">{items.slice(0, 4).map(([label, tab]) => <button type="button" key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => go(tab)}>{label}</button>)}</nav>
      <div className="header-actions">{runIndicator && <button type="button" className={`header-run-indicator is-${runIndicator.toLowerCase().replaceAll(' ', '-')}`} onClick={onRunIndicatorClick}><span aria-hidden="true">●</span>{runIndicator}</button>}<button type="button" className="header-docs" onClick={() => go('docs')}>DOCS</button><button type="button" className="menu-control" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label="Toggle navigation">{open ? '×' : '☰'}</button></div>
    </header>
    <div className={`mobile-nav ${open ? 'is-open' : ''}`}><nav>{items.map(([label, tab]) => <button type="button" key={tab} className={activeTab === tab ? 'is-active' : ''} onClick={() => go(tab)}>{label}</button>)}</nav></div>
  </>;
}
