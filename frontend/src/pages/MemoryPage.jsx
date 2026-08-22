import React, { useState } from 'react';
import { api } from '../lib/api';

export function MemoryPage({ memoryState, onSubmitFeedback, onOpenOnboarding, onOpenMemoryProofModal, onOpenNinetySecProof, isExecuting }) {
  const [feedback,setFeedback]=useState(''); const [comparison,setComparison]=useState(null); const [comparing,setComparing]=useState(false);
  const nodes=memoryState?.memory_nodes||[]; const rules=memoryState?.learned_voice_rules||[]; const memories=[...rules,...nodes.map(n=>n?.content).filter(Boolean)]; const objective=memoryState?.creator_objectives?.[0];
  const submit=async e=>{e.preventDefault();if(!feedback.trim())return;await onSubmitFeedback(feedback.trim());setFeedback('');};
  const compare=async()=>{setComparing(true);try{setComparison(await api.compareRecommendations());}finally{setComparing(false);}};
  return <div className="rich-route memory-route">
    <section className="route-visual-hero"><img src="/assets/greenroom-creator-night.png" alt="Creator at work"/><div className="route-visual-copy"><p>Memory / creator context</p><h1>What Greenroom remembers.</h1><span>Useful understanding, held in human language and available whenever the work begins.</span></div><div className="route-visual-meta"><span>{String(memories.length).padStart(2,'0')} saved memories</span></div></section>
    <section className="density-shell"><div className="density-band"><article><small>CURRENT THREAD / 01</small><h2>{objective?.title||'An objective is waiting.'}</h2><p>The creator context Greenroom carries between sessions.</p></article><article><small>LEARNED RULES / 02</small><strong>{String(memories.length).padStart(2,'0')}</strong><p>{memories.length?'Human-readable context is available for the next run.':'No learned rules have been saved yet.'}</p></article></div>
    <div className="route-image-ribbon"><img src="/assets/greenroom-away-workspace.png" alt="Creator workspace"/><span>Context is the input to better work</span></div>
    {memories.length?<ul className="density-list">{memories.map((m,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{m}</p><small>MEMORY</small></li>)}</ul>:<div className="density-empty">Creator preferences and learned rules will appear here once they are saved by a completed workflow.</div>}
    <form className="memory-teach" onSubmit={submit}><p>TEACH GREENROOM</p><input value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="A preference Greenroom should remember"/><button disabled={isExecuting}>Remember this ↗</button></form>
    {comparison&&<details open className="memory-comparison"><summary>Personalization comparison</summary><div><p>{comparison.before_memory}</p><p>{comparison.after_memory}</p></div></details>}
    <div className="route-cta-row"><button disabled={comparing} onClick={compare}>{comparing?'Comparing…':'Run live comparison'}</button><button onClick={onOpenOnboarding}>Edit creator context</button><button onClick={onOpenMemoryProofModal}>Prove adaptation</button><button onClick={onOpenNinetySecProof}>Run memory proof</button></div></section>
  </div>;
}
export default MemoryPage;
