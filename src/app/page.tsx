'use client';
import { useCallback, useEffect, useState } from 'react';
import { Calculator, BrainCircuit, FlaskConical, History, Activity, Trash2, RefreshCcw, Copy, Check, Terminal, ArrowRight } from 'lucide-react';
import { Calculation, Mode, Version, request, prettify } from '@/lib/api';
type Tab = Mode | 'history' | 'status';
const keys=['C','(',')','⌫','7','8','9','÷','4','5','6','×','1','2','3','−','0','.','%','+','='];
const modes: {id:Tab; label:string; icon:React.ReactNode}[]=[
 {id:'basic',label:'Basic',icon:<Calculator size={17}/>}, {id:'scientific',label:'Scientific',icon:<FlaskConical size={17}/>},
 {id:'ai',label:'AI Assistant',icon:<BrainCircuit size={17}/>},{id:'history',label:'History',icon:<History size={17}/>},{id:'status',label:'Status',icon:<Activity size={17}/>}
];
export default function Home(){
 const [tab,setTab]=useState<Tab>('basic');
 const [expression,setExpression]=useState('');
 const [prompt,setPrompt]=useState('');
 const [result,setResult]=useState<Calculation|null>(null);
 const [items,setItems]=useState<Calculation[]>([]);
 const [version,setVersion]=useState<Version|null>(null);
 const [online,setOnline]=useState(false);
 const [operation,setOperation]=useState('sqrt');
 const [angle,setAngle]=useState('degrees');
 const [second,setSecond]=useState('2');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [copied,setCopied]=useState(false);
 const refresh=useCallback(async()=>{
   const [history,ver,health]=await Promise.allSettled([request<Calculation[]>('api/v1/history'),request<Version>('api/v1/version'),request<{status:string}>('health/ready')]);
   if(history.status==='fulfilled')setItems(history.value);
   if(ver.status==='fulfilled')setVersion(ver.value);
   setOnline(health.status==='fulfilled'&&health.value.status==='ready');
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const perform=async()=>{
   setBusy(true);setError('');try {
     let response:Calculation;
     if(tab==='basic') response=await request('api/v1/calculate',{method:'POST',body:JSON.stringify({expression:expression.replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replaceAll('%','/100')})});
     else if(tab==='scientific') response=await request('api/v1/scientific',{method:'POST',body:JSON.stringify({operation,value:Number(expression),second:Number(second),angle_mode:angle})});
     else response=await request('api/v1/ai/calculate',{method:'POST',body:JSON.stringify({prompt})});
     setResult(response);void refresh();
   }catch(e){setError(e instanceof Error?e.message:'Unexpected error')}finally{setBusy(false)}
 };
 const press=(key:string)=>{setError('');if(key==='='){void perform();return}if(key==='C'){setExpression('');setResult(null);return}if(key==='⌫'){setExpression(s=>s.slice(0,-1));return}setExpression(s=>s+key)};
 const clear=async()=>{if(!confirm('Delete all calculation history?'))return;try{await request('api/v1/history',{method:'DELETE'});await refresh()}catch(e){setError(String(e))}};
 const copy=async()=>{if(result){await navigator.clipboard.writeText(String(result.result));setCopied(true);setTimeout(()=>setCopied(false),1200)}};
 return <div className="shell">
   <aside className="sidebar"><div className="identity"><div className="identity-mark"><Calculator size={23}/></div><div><strong>INTELLIGENT</strong><span>CALCULATOR LAB</span></div></div>
   <p className="nav-caption">WORKSPACE</p><nav aria-label="Main navigation">{modes.map(m=><button key={m.id} className={'nav-item '+(tab===m.id?'active':'')} onClick={()=>{setTab(m.id);setError('');setResult(null)}}>{m.icon}<span>{m.label}</span>{tab===m.id&&<ArrowRight size={15} className="nav-arrow"/>}</button>)}</nav>
   <div className="sidebar-foot"><div className={'status-dot '+(online?'ok':'')}></div><div><strong>{online?'System operational':'Backend offline'}</strong><small>FastAPI + Jenkins demo</small></div></div></aside>
   <main className="main"><header className="topbar"><span>WORKSPACE <span className="crumb">/ {modes.find(m=>m.id===tab)?.label}</span></span><div className="env-tag">{version?.environment?.toUpperCase()||'DEVELOPMENT'} <span>·</span> {version?.version||'local'}</div></header>
   <section className="content"><div className="eyebrow">INTERACTIVE LAB / 111</div><h1>{tab==='history'?'Calculation history':tab==='status'?'System status':tab==='ai'?'Ask the calculator':tab==='scientific'?'Scientific workspace':'Calculate anything.'}</h1><p className="subtitle">{tab==='ai'?'Natural-language mathematics, verified by a deterministic calculation engine.':tab==='history'?'Review, reuse, and manage previous calculations.':tab==='status'?'Deployment identity, readiness and the running backend.':'A beautifully simple calculator built to demonstrate professional software delivery.'}</p>
   {error&&<div role="alert" className="error">{error}</div>}
   {(tab==='basic'||tab==='scientific')&&<div className="workspace-grid"><div className="panel calc-panel"><div className="panel-heading"><span>{tab==='basic'?'STANDARD MODE':'SCIENTIFIC MODE'}</span><span className="live-indicator">● LIVE</span></div>
    <div className="calc-display"><label htmlFor="expression">EXPRESSION</label><input id="expression" aria-label="Mathematical expression" placeholder="0" value={expression} onChange={e=>setExpression(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void perform()}}/><div className="answer">{result?prettify(result.result):'—'}</div></div>
    {tab==='basic'?<div className="keypad">{keys.map((key,i)=><button key={i} onClick={()=>press(key)} className={'key '+(key==='='?'equals':'+−×÷'.includes(key)?'operator':'')}>{key}</button>)}</div>:
     <div className="scientific-controls"><label>OPERATION<select value={operation} onChange={e=>setOperation(e.target.value)}>{['sqrt','power','percent','sin','cos','tan','log10','ln','factorial'].map(v=><option key={v}>{v}</option>)}</select></label><label>ANGLE MODE<select value={angle} onChange={e=>setAngle(e.target.value)}><option value="degrees">Degrees</option><option value="radians">Radians</option></select></label>{['power','percent'].includes(operation)&&<label>SECOND VALUE<input type="number" value={second} onChange={e=>setSecond(e.target.value)}/></label>}<button className="primary" disabled={busy||!expression} onClick={()=>void perform()}>{busy?'Calculating...':'Run calculation'} <ArrowRight size={18}/></button></div>}
    {result&&<div className="result-foot"><span>Result validated by FastAPI</span><button onClick={()=>void copy()}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copied':'Copy'}</button></div>}</div>
    <div className="right-rail"><div className="insight-card"><div className="insight-icon"><Terminal size={20}/></div><h3>Built for CI/CD</h3><p>Every calculation travels through a separately deployed Next.js frontend and FastAPI service.</p><div className="mini-chain"><span>UI</span><ArrowRight size={15}/><span>REST</span><ArrowRight size={15}/><span>API</span></div></div><div className="help-card"><h3>Quick tips</h3><p>Use parentheses for precedence and the scientific mode for advanced mathematical functions.</p><button onClick={()=>setTab('status')}>View deployment status <ArrowRight size={15}/></button></div></div></div>}
   {tab==='ai'&&<div className="panel ai-panel"><div className="ai-symbol"><BrainCircuit size={29}/></div><h2>Math in your own words.</h2><p>Try “What is 15% of 200?”, “Divide 850 among 5”, or “20% discount on $150”.</p><textarea aria-label="Natural language math request" value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4} placeholder="Ask a mathematical question..."/><button className="primary" disabled={busy||!prompt.trim()} onClick={()=>void perform()}>{busy?'Working...':'Calculate with agent'} <ArrowRight size={18}/></button>{result&&<div className="ai-result"><small>VALIDATED ANSWER</small><strong>{prettify(result.result)}</strong><p>{result.explanation}</p></div>}<p className="note">Offline rules mode is included; FastMCP tools are exposed by the backend for compatible agents.</p></div>}
   {tab==='history'&&<div className="panel history-panel"><div className="section-head"><strong>Recent calculations <span className="muted">({items.length})</span></strong><div><button className="secondary" onClick={()=>void refresh()}><RefreshCcw size={16}/> Refresh</button><button className="secondary danger" onClick={()=>void clear()}><Trash2 size={16}/> Clear all</button></div></div><div className="history-list">{items.length?items.map(item=><button key={item.id} className="history-item" onClick={()=>{setTab(item.mode==='ai'?'ai':item.mode);setExpression(item.expression);setPrompt(item.original_input||'');setResult(item)}}><div><small>{item.mode.toUpperCase()} · {new Date(item.created_at).toLocaleString()}</small><span>{item.expression}</span></div><strong>{prettify(item.result)}</strong></button>):<div className="empty-state">No calculations yet. Complete your first calculation to create history.</div>}</div></div>}
   {tab==='status'&&<div className="status-grid"><div className="panel status-panel"><h3>API health</h3><div className={'status-large '+(online?'healthy':'unhealthy')}>{online?'● READY':'● UNAVAILABLE'}</div><p>Endpoint: /health/ready</p><button className="secondary" onClick={()=>void refresh()}><RefreshCcw size={16}/> Recheck backend</button></div><div className="panel status-panel"><h3>Deployment metadata</h3><dl><dt>Version</dt><dd>{version?.version||'Unavailable'}</dd><dt>Commit</dt><dd>{version?.commit||'—'}</dd><dt>Environment</dt><dd>{version?.environment||'—'}</dd><dt>Last checked</dt><dd>{new Date().toLocaleString()}</dd></dl></div></div>}
   <footer className="footer">INTELLIGENT CALCULATOR <span>·</span> FULL-STACK DELIVERY LAB <span>·</span> NEXT.JS + FASTAPI + FASTMCP + JENKINS</footer>
   </section></main></div>;
}
