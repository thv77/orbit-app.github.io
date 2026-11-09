import { useEffect, useMemo, useRef, useState } from 'react'
import MissionControlScreen from './screens/MissionControlScreen'
import HealthMonitoringScreen from './screens/HealthMonitoringScreen'
import CrewStatusScreen from './screens/CrewStatusScreen'
import MedicalBayScreen from './screens/MedicalBayScreen'
import CrewAdminHub from './screens/CrewAdminHub'
import { CommunicationComposer, CrewSyncPanel, DeliveryConcept, HealthModules, MissionExtras } from './features'
import OrbitAIScreen from './screens/OrbitAIScreen'
import BiometricScanScreen from './screens/BiometricScanScreen'
import EmergencyCenterScreen from './screens/EmergencyCenterScreen'
import useLocalDemoState from './useLocalDemoState'
import { useAuth } from './context/AuthContext'
import { useCrew } from './context/CrewContext'
import AuthModals from './components/auth/AuthModals'
import AuthGatewayScreen from './screens/AuthGatewayScreen'
import { Activity, AlertTriangle, ArrowUpRight, Bell, BrainCircuit, Check, ChevronDown, ChevronRight, ClipboardList, Crosshair, HeartPulse, Home, LifeBuoy, Menu, Microscope, Moon, Orbit, Pill, Radio, ScanFace, Settings, Shield, ShieldCheck, Sparkles, Stethoscope, Thermometer, Users, Waves, Wind, X, Zap } from 'lucide-react'

const nav = [
  { id: 'mission', label: 'Mission Control', icon: Home, group: 'Flight deck' },
  { id: 'health', label: 'Health Monitoring', icon: HeartPulse, group: 'Flight deck' },
  { id: 'crew', label: 'Crew Status', icon: Users, group: 'Flight deck' },
  { id: 'medical', label: 'Medical Bay', icon: Stethoscope, group: 'Medical systems' },
  { id: 'ai', label: 'Orbit AI', icon: BrainCircuit, group: 'Medical systems' },
  { id: 'scan', label: 'Biometric Scan', icon: ScanFace, group: 'Medical systems' },
  { id: 'emergency', label: 'Emergency Center', icon: LifeBuoy, group: 'Mission support' },
]
const crew = [
  { name: 'Elena Vasquez', role: 'Mission commander', initials: 'EV', state: 'Nominal', hr: 68, oxygen: 98, sleep: '7h 42m', color: 'violet', note: 'All systems nominal' },
  { name: 'Dr. Marcus Chen', role: 'Flight surgeon', initials: 'MC', state: 'Monitor', hr: 82, oxygen: 97, sleep: '6h 18m', color: 'blue', note: 'Elevated workload' },
  { name: 'Amara Okafor', role: 'Mission specialist', initials: 'AO', state: 'Nominal', hr: 71, oxygen: 99, sleep: '8h 05m', color: 'amber', note: 'All systems nominal' },
  { name: 'Luca Moretti', role: 'Systems engineer', initials: 'LM', state: 'Nominal', hr: 64, oxygen: 98, sleep: '7h 11m', color: 'teal', note: 'All systems nominal' },
]
const demoVitals = [
  { label: 'Heart rate', value: '68', unit: 'BPM', icon: HeartPulse, color: 'cyan', data: [32,48,40,58,43,66,51,62,47,68,55,72,58,65,50,67,56,69] },
  { label: 'Blood oxygen', value: '98', unit: '% SpO₂', icon: Waves, color: 'blue', data: [55,62,52,69,58,72,64,77,62,70,59,76,68,82,70,77,67,80] },
  { label: 'Body temperature', value: '36.8', unit: '°C', icon: Thermometer, color: 'amber', data: [48,50,49,53,51,52,50,54,52,55,53,52,56,54,55,53,54,55] },
]

function Starfield() {
  const ref = useRef(null)
  useEffect(() => {
    let cancelled = false, cleanup
    import('./threeScenes').then(({ mountStarfield }) => {
      if (!cancelled) cleanup = mountStarfield(ref.current)
    }).catch(() => { /* The CSS atmosphere remains visible if the 3D scene fails. */ })
    return () => { cancelled = true; cleanup?.() }
  }, [])
  return <canvas className="starfield" ref={ref} aria-hidden="true" />
}
function Sparkline({ data, color = 'cyan' }) { return <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - v}`).join(' ')} className={`line-${color}`} /></svg> }
function Tag({ children, tone = 'good' }) { return <span className={`pill-tag ${tone}`}><i />{children}</span> }
function PageHeading({ title, subtitle }) { return <header className="page-heading"><div><div className="eyebrow">Orbit Health / {title}</div><h1>{title}</h1><p>{subtitle}</p></div><span className="demo-label">Simulated demonstration data</span></header> }
function Metric({ item }) { const Icon = item.icon; return <article className={`metric-card ${item.color}`}><div className="metric-top"><span className="metric-label">{item.label}</span><Icon size={18}/></div><div className="metric-value">{item.value}<small>{item.unit}</small></div><div className="metric-bottom"><Tag>Demo sample</Tag><div className="metric-chart"><Sparkline data={item.data} color={item.color}/></div></div></article> }

function MissionPage({ setPage }) {
  return <div className="mission-page">
    <section className="mission-hero"><Starfield/><div className="hero-gridlines"/><div className="bridge-frame"><span/><span/><span/><span/></div>
      <div className="hero-content"><div className="eyebrow"><span className="live-dot"/> Expedition 07 · Low Earth orbit</div><h1>Earth, in view.<br/><em>Humanity, in focus.</em></h1><p className="hero-copy">A quiet window onto the planet. A clear view of the crew aboard.</p><button className="primary-button" onClick={() => setPage('health')}>Open crew monitor <ChevronRight size={17}/></button></div>
      <div className="orbit-label"><span>Orbital altitude</span><b>408 KM</b><small>Low Earth orbit</small></div><div className="hero-coordinates">ISS · 51.6° N / 0.0° E<br/>Mission elapsed 126D 08H 42M</div><div className="hero-side-readout"><span>Velocity</span><strong>7.66 <small>KM/S</small></strong><span>Crew on board</span><strong>04 <small>Personnel</small></strong></div>
      <div className="window-reflection"/><div className="demo-ribbon">Simulated mission environment</div>
    </section>
    <div className="mission-lower"><div className="section-title"><div><span className="eyebrow">Flight deck / Overview</span><h2>Mission at a glance</h2></div><span className="data-note">Demonstration values</span></div>
      <div className="mission-stats"><div className="stat-panel"><span className="stat-icon cyan"><Users size={18}/></span><div><small>Crew status</small><strong>03 <em>/ 04 nominal</em></strong><span className="stat-foot">One simulated observation</span></div></div><div className="stat-panel"><span className="stat-icon green"><ShieldCheck size={18}/></span><div><small>Medical bay</small><strong>98<em>% readiness</em></strong><span className="stat-foot">Sample inventory status</span></div></div><div className="stat-panel"><span className="stat-icon amber"><Activity size={18}/></span><div><small>Mission day</small><strong>126 <em>in orbit</em></strong><span className="stat-foot">Expedition 07 · demo timeline</span></div></div></div>
      <div className="mission-context-strip"><div><span className="eyebrow">MISSION HEALTH INTELLIGENCE · DEMO</span><strong>4 crew · 1 sample observation</strong><small>Illustrative trend: within personal reference bands</small></div><div><span className="eyebrow">SPACE RISK RADAR · DEMO</span><strong>1.2 mSv cumulative sample</strong><small>Cabin 22.1 °C · 101.3 kPa · not telemetry</small></div><button className="text-button" onClick={()=>setPage('health')}>OPEN HEALTH SYSTEMS <ChevronRight size={14}/></button></div>
      <div className="mission-bottom-grid"><div className="panel activity-panel"><div className="panel-head"><div><span className="eyebrow">FLIGHT LOG / SAMPLE</span><h3>Recent mission notes</h3></div><span className="data-note">NOT LIVE</span></div><div className="activity-row"><span className="activity-mark cyan-mark"><HeartPulse size={16}/></span><div><b>Wellness check recorded</b><small>Commander Elena Vasquez · simulated sample</small></div><time>09:42</time></div><div className="activity-row"><span className="activity-mark amber-mark"><BrainCircuit size={16}/></span><div><b>Workload note added</b><small>Dr. Marcus Chen · sample observation</small></div><time>09:18</time></div><div className="activity-row"><span className="activity-mark blue-mark"><Pill size={16}/></span><div><b>Care schedule checked</b><small>Amara Okafor · prototype log</small></div><time>08:55</time></div></div>
        <div className="panel orbit-panel"><div className="panel-head"><div><span className="eyebrow">CREW / QUICK VIEW</span><h3>People aboard</h3></div><button className="text-button" onClick={() => setPage('crew')}>OPEN ROSTER <ChevronRight size={14}/></button></div>{crew.slice(0,3).map(c=><div className="crew-mini" key={c.initials}><div className={`crew-avatar ${c.color}`}>{c.initials}</div><div><b>{c.name}</b><small>{c.role}</small></div><Tag tone={c.state === 'MONITOR' ? 'warn' : 'good'}>{c.state}</Tag></div>)}</div>
      </div>
    </div>
    <MissionExtras />
  </div>
}
function HealthPage() {
  return <div className="content-page health-page"><PageHeading title="Health Monitoring" subtitle="A visual review of sample wellness signals for the mission crew."/>
    <div className="health-layout"><section className="body-stage panel"><div className="panel-head"><div><span className="eyebrow">SUBJECT 01 / COMMANDER</span><h3>Human systems · demo visualization</h3></div><Tag>SIMULATED</Tag></div>
        <div className="body-visual"><div className="body-halo"/><div className="scan-orbit orbit-one"/><div className="scan-orbit orbit-two"/><div className="human-silhouette"><div className="human-head"/><div className="human-neck"/><div className="human-torso"><span className="heart-glow"><HeartPulse size={27}/></span></div><div className="human-arm left"/><div className="human-arm right"/><div className="human-leg left"/><div className="human-leg right"/></div><div className="body-callout heart-call"><span>♥ CARDIAC SAMPLE</span><b>68 BPM</b></div><div className="body-callout oxygen-call"><span>◉ OXYGEN SAMPLE</span><b>98% SpO₂</b></div><div className="body-callout temp-call"><span>⌁ TEMP SAMPLE</span><b>36.8 °C</b></div><div className="body-scanline"/></div>
        <div className="body-footer"><span><i className="legend-dot cyan-dot"/> Visualization only · no sensor link</span><span>SAMPLE WINDOW · 09:42 UTC</span></div>
      </section><section className="vitals-column"><div className="vitals-intro"><div><span className="eyebrow">DEMO BIOMETRICS</span><strong>Commander Elena Vasquez</strong></div><span className="demo-label">NOT LIVE READINGS</span></div>{demoVitals.map(v=><Metric item={v} key={v.label}/>)}<div className="panel wellness-card"><div className="wellness-icon"><Moon size={18}/></div><div><small>SLEEP / SAMPLE DAY</small><strong>7h 42m</strong><span>Illustrative value</span></div><div className="sleep-bars">{[20,34,24,48,36,62,40,70,52,76,43,62,35,50,28,45,23,37,18].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div></div></section></div>
    <div className="health-bottom"><div className="panel trend-panel"><div className="panel-head"><div><span className="eyebrow">SAMPLE TREND</span><h3>Heart rate · illustrative 6-hour window</h3></div><span className="data-note">DEMO VALUES</span></div><div className="wide-chart"><Sparkline data={[36,43,40,49,45,56,51,62,47,59,52,67,56,60,49,63,53,72,57,66,51,69,60,74,57,68,55,72,61,69,56,70,62,75,59,68]}/><div className="chart-axis"><span>06:00</span><span>08:00</span><span>10:00</span><span>12:00</span></div></div></div><div className="panel observation-panel"><span className="eyebrow">INTERPRETATION</span><div className="observation-icon"><ShieldCheck size={19}/></div><h3>Prototype visualization</h3><p>Values shown here are fabricated examples. They do not represent a person’s actual health or support a diagnosis.</p></div></div>
    <HealthModules />
  </div>
}
function CrewPage({ setPage }) {
  return <div className="content-page crew-page"><PageHeading title="Crew Status" subtitle="Four fictional astronaut profiles for a mission wellness concept."/><div className="crew-intro-banner"><div><span className="eyebrow">EXPEDITION 07 / CREW PORTRAITS</span><h2>Different paths.<br/><em>One shared horizon.</em></h2></div><div className="crew-summary"><strong>04</strong><span>SIMULATED CREW</span><Tag>DEMO ROSTER</Tag></div></div><CrewSyncPanel crew={crew} onOpen={setPage}/><div className="crew-gallery">{crew.map((c,i)=><article className={`crew-card ${c.color}`} key={c.initials}><div className="crew-card-top"><span>0{i+1} / CREW PROFILE</span><span className="profile-mark">ORBITAL PERSONNEL</span></div><div className={`portrait portrait-${c.color}`}><div className="portrait-glow"/><div className="portrait-stars"/><div className="portrait-head"/><div className="portrait-body"/><span className="portrait-initials">{c.initials}</span><span className="portrait-index">CREW · 0{i+1}</span></div><div className="crew-card-info"><Tag tone={c.state === 'MONITOR' ? 'warn' : 'good'}>{c.state} · DEMO</Tag><h3>{c.name}</h3><span className="crew-role">{c.role}</span><div className="crew-card-metrics"><div><small>HEART RATE</small><b>{c.hr}<em> BPM</em></b></div><div><small>SpO₂</small><b>{c.oxygen}<em>%</em></b></div><div><small>SLEEP</small><b>{c.sleep}</b></div></div><div className="crew-note"><span className="live-dot"/>{c.note} · sample</div></div></article>)}</div></div>
}
function MedicalPage() {
  const [tab,setTab]=useState('inventory')
  const [notice,setNotice]=useState('')
  const stock=[['Portable ultrasound','Diagnostic','02','READY'],['Pulse oximeter','Monitoring','04','READY'],['ECG sensor patch','Monitoring','12','READY'],['Emergency oxygen kit','Life support','02','CHECK'],['Medical consumables','Supplies','08','READY']]
  return <div className="content-page medical-page"><PageHeading title="Medical Bay" subtitle="A clinical operations room concept with sample inventory and care records."/><div className="medical-lab-scene"><div className="lab-lights"/><div className="medical-banner"><div className="medical-symbol"><Crosshair size={30}/></div><div><span className="eyebrow">MODULE 03 / CLINICAL LABORATORY</span><h2>Care, prepared for the unexpected.</h2><p>Sample equipment readiness and fictional care records in a simulated environment.</p></div><div className="readiness"><strong>98<span>%</span></strong><small>DEMO READINESS</small></div></div><div className="lab-counter"><span>STERILE WORK SURFACE</span><span>MEDICAL SYSTEMS · SIMULATION</span></div></div><div className="tabs" role="tablist" aria-label="Medical bay sections">{[['inventory','Equipment inventory'],['records','Care records'],['schedule','Care schedule']].map(([id,label])=><button role="tab" aria-selected={tab===id} className={tab===id?'active':''} key={id} onClick={()=>setTab(id)}>{label}</button>)}</div>{notice&&<div className="prototype-notice" role="status">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss notice"><X size={15}/></button></div>}{tab==='inventory'?<div className="panel inventory-panel"><div className="panel-head"><div><span className="eyebrow">STORAGE BAY / A-01</span><h3>Equipment inventory</h3></div><span className="demo-label">SIMULATED INVENTORY</span></div><div className="inventory-table"><div className="inventory-row table-head"><span>ITEM</span><span>TYPE</span><span>QTY</span><span>STATUS</span></div>{stock.map(s=><div className="inventory-row" key={s[0]}><b>{s[0]}</b><span>{s[1]}</span><strong>{s[2]}</strong><Tag tone={s[3]==='CHECK'?'warn':'good'}>{s[3]}</Tag></div>)}</div></div>:<div className="panel inventory-panel"><div className="panel-head"><div><span className="eyebrow">{tab==='records'?'SAMPLE MEDICAL LOG':'UPCOMING CHECK-INS'}</span><h3>{tab==='records'?'Recent care records':'Crew care schedule'}</h3></div><span className="demo-label">PROTOTYPE DATA</span></div>{(tab==='records'?[['09:42','Vitals check','Elena Vasquez'],['08:55','Medication confirmation','Amara Okafor'],['Yesterday','Routine wellness check','Luca Moretti']]:[['14:00 UTC','Daily health check','All crew'],['16:30 UTC','Sleep quality review','Dr. Marcus Chen'],['Tomorrow','Medical inventory audit','Flight surgeon']]).map(x=><div className="activity-row" key={`${x[0]}-${x[1]}`}><span className="activity-mark cyan-mark"><ClipboardList size={16}/></span><div><b>{x[1]}</b><small>{x[2]}</small></div><time>{x[0]}</time></div>)}</div>}<button className="lab-action" onClick={()=>setNotice('Prototype control · equipment actions are not connected to real medical inventory.')}> <Microscope size={17}/> RUN EQUIPMENT CHECK <span>PROTOTYPE CONTROL</span></button><DeliveryConcept /></div>
}
function AIPage() {
  const [messages,setMessages]=useLocalDemoState('orbit.ai-conversation',[{from:'ai',text:'Good day, Commander. I’m ORBIT, a scripted mission health assistant. I can demonstrate how wellness trends or a medical handover might be summarized.',at:new Date().toISOString()}])
  const [value,setValue]=useState('')
  const [thinking,setThinking]=useState(false)
  const thinkingTimer=useRef(null)
  useEffect(()=>()=>clearTimeout(thinkingTimer.current),[])
  const answer=q=>{const t=q.toLowerCase();if(t.includes('summary')||t.includes('handover')||t.includes('report'))return 'DEMO HANDOVER: sample heart rate 68 bpm, oxygen 98%, temperature 36.8 C. Values are simulated. Review with the flight surgeon; this assistant cannot triage or recommend treatment.';if(t.includes('routine')||t.includes('exercise')||t.includes('sleep')||t.includes('water'))return 'Routine example: follow mission-approved exercise, hydration, rest and nutrition schedules. Confirm individual plans with the flight surgeon. This demo cannot approve medical routines.';if(t.includes('oxygen')||t.includes('heart')||t.includes('glucose')||t.includes('reading'))return 'This sample is fictional interface data. Compare it with the astronaut personal baseline and clinical safety limits, then ask the flight surgeon to interpret concerns. No diagnosis is provided.';return 'I can demonstrate sample-reading explanations, routine reminders and medical-team summaries. All values and replies are scripted. For health concerns, contact the flight surgeon.'}
  const send=()=>{if(!value.trim()||thinking)return;const q=value.trim();setMessages(m=>[...m,{from:'user',text:q,at:new Date().toISOString()}]);setValue('');setThinking(true);thinkingTimer.current=setTimeout(()=>{setMessages(m=>[...m,{from:'ai',text:answer(q),at:new Date().toISOString()}]);setThinking(false)},650)}
  return <div className="content-page ai-page"><PageHeading title="ORBIT AI" subtitle="An immersive conversation space for a scripted health information demo."/><div className="ai-environment"><div className="ai-atmosphere"/><aside className={`ai-aside ${thinking?'ai-thinking':''}`}><div className="ai-orb"><div className="orb-core"><BrainCircuit size={37}/></div><span className="orb-ring ring-a"/><span className="orb-ring ring-b"/><span className="orb-ring ring-c"/></div><span className="eyebrow">ONBOARD ASSISTANT / SIMULATION</span><h2>{thinking?'Reviewing the':'Listen to the'}<br/><em>{thinking?'sample data.':'quiet signals.'}</em></h2><p>Explore example wellness summaries and see how a handover can be organized.</p><div className="ai-capabilities"><span><Activity size={15}/> Trend summaries</span><span><ClipboardList size={15}/> Medical handovers</span><span><Sparkles size={15}/> Scripted responses</span></div><div className="ai-mode">MODE <b>{thinking?'THINKING · DEMO':'DEMO ONLY'}</b></div></aside><section className="chat-panel"><div className="chat-head"><div><span className={`ai-signal ${thinking?'thinking':''}`}/> ORBIT ASSISTANT <small>{thinking?'GENERATING SCRIPTED RESPONSE':'OFFLINE PROTOTYPE'}</small></div><span className="encrypted"><ShieldCheck size={14}/> NO REAL DATA</span></div><div className="chat-messages" aria-live="polite">{messages.map((m,i)=><div className={`chat-message ${m.from}`} key={`${m.at||i}-${i}`}><div className="chat-avatar">{m.from==='ai'?<Orbit size={16}/>: 'EV'}</div><div><small>{m.from==='ai'?'ORBIT AI':'YOU'} · {m.from==='ai'?'SCRIPTED ASSISTANT':'COMMANDER'}{m.at&&<time className="chat-time">{new Date(m.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time>}</small><p>{m.text}</p></div></div>)}{thinking&&<div className="chat-message ai typing" role="status"><div className="chat-avatar"><Orbit size={16}/></div><div><small>ORBIT AI · DEMO RESPONSE</small><p>Reviewing sample context<span>…</span></p></div></div>}<div className="suggestion-chips">{['Summarize crew wellness','Explain demo alerts','Prepare a sample handover'].map(s=><button key={s} disabled={thinking} onClick={()=>setValue(s)}>{s}<ChevronRight size={14}/></button>)}</div></div><div className="chat-compose"><input aria-label="Message ORBIT demo" value={value} disabled={thinking} onChange={e=>setValue(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask ORBIT to demonstrate a summary…"/><button disabled={thinking||!value.trim()} onClick={send} aria-label="Send demo message"><ArrowUpRight size={19}/></button></div><div className="chat-disclaimer">SCRIPTED DEMONSTRATION · NOT MEDICAL ADVICE OR DIAGNOSIS · TRANSCRIPT STORED LOCALLY</div></section></div></div>
}
function ScanPage() {
  const [scanning,setScanning]=useState(false)
  const [compared,setCompared]=useState(false)
  const [history,setHistory]=useLocalDemoState('orbit.face-scan-history',[])
  useEffect(()=>{if(!scanning)return;const id=setTimeout(()=>{setHistory(items=>[{id:Date.now(),time:new Date().toISOString(),result:'Animation completed · no biometric result generated'},...items].slice(0,8));setScanning(false)},3200);return()=>clearTimeout(id)},[scanning,setHistory])
  return <div className="content-page scan-page"><PageHeading title="Biometric Scan" subtitle="An animated scan concept. No camera, sensor, or biometric analysis is connected."/><div className="scan-layout"><section className="scan-stage"><div className="scan-stage-top"><span className="eyebrow">FACE SCAN AI / VISUAL DEMO</span><span className="scan-status"><i/>{scanning?'ANIMATION RUNNING':'STANDBY'}</span></div><div className={`scan-frame ${scanning?'scanning':''}`}><div className="scan-corner tl"/><div className="scan-corner tr"/><div className="scan-corner bl"/><div className="scan-corner br"/><div className="scan-face"><div className="face-head"><div className="face-eye left-eye"/><div className="face-eye right-eye"/><div className="face-nose"/><div className="face-mouth"/></div><div className="face-neck"/></div><div className="face-grid"/><div className="scan-line"/></div><div className="scan-stage-bottom"><span>CAMERA: NOT CONNECTED</span><span>BIOMETRIC ANALYSIS: DISABLED</span></div></section><section className="scan-details"><span className="eyebrow">VISUAL PROTOTYPE</span><h2>A scan sequence,<br/><em>without a sensor.</em></h2><p>This button starts a decorative animation only. It does not access the camera, identify a person, or measure health values.</p><div className="scan-steps"><div className="scan-step active"><b>01</b><span><strong>Visual alignment</strong><small>Static illustration in the scan frame</small></span><Check size={15}/></div><div className="scan-step"><b>02</b><span><strong>Animation sequence</strong><small>Purely decorative scan line</small></span></div><div className="scan-step"><b>03</b><span><strong>No results generated</strong><small>No measurements or identity data</small></span></div></div><button className="primary-button" onClick={()=>setScanning(s=>!s)}>{scanning?'STOP SCAN ANIMATION':'PLAY SCAN ANIMATION'} <ScanFace size={16}/></button><div className="scan-warning"><AlertTriangle size={16}/> No real biometric values are collected or produced.</div><div className="face-baseline"><div><span className="eyebrow">PERSONAL BASELINE / DEMO</span><button className="text-button" onClick={()=>setCompared(v=>!v)}>{compared?'RESET COMPARISON':'COMPARE TO BASELINE'} <ChevronRight size={13}/></button></div>{compared&&<div className="visible-changes"><span><i/>Face position - aligned</span><span><i/>Expression - visible difference example</span><span><i/>Skin appearance - no change marked</span></div>}<small>Illustrative comparison only. No camera, face analysis, or health inference is active.</small></div>{history.length>0&&<div className="scan-history"><span className="eyebrow">LOCAL SCAN HISTORY · ANIMATION ONLY</span>{history.slice(0,3).map(item=><div key={item.id}><b>{new Date(item.time).toLocaleString()}</b><small>{item.result}</small></div>)}</div>}</section></div></div>
}
function EmergencyPage({ setPage }) {
  const [ack,setAck]=useState(false)
  const [reports,setReports]=useLocalDemoState('orbit.emergency-reports',[])
  return <div className="content-page emergency-page"><div className="emergency-command"><div className="command-top"><span className="eyebrow"><span className="red-dot"/> MISSION SUPPORT / SIMULATED CHANNEL</span><span className="emergency-state"><AlertTriangle size={18}/> DEMO STANDBY</span></div><div className="emergency-header"><div><span className="eyebrow">PRIORITY RESPONSE CONSOLE</span><h1>Emergency <em>Center</em></h1><p>Response pathways and incident status for the demonstration mission.</p></div><div className="incident-counter"><strong>{String(reports.length).padStart(2,'0')}</strong><span>QUEUED<br/>DEMO REPORTS</span></div></div><section className="emergency-profile"><div><span className="eyebrow">MEDICAL PROFILE / COMMANDER ELENA VASQUEZ</span><b>SIMULATED RECENT READINGS</b></div><span>HR <strong>68 bpm</strong></span><span>SpO2 <strong>98%</strong></span><span>BP <strong>114/74</strong></span><span>GLUCOSE <strong>94 mg/dL</strong></span><button className="emergency-contact-jump" onClick={()=>document.getElementById('emergency-report')?.scrollIntoView({behavior:'smooth'})}>PRIORITY: OPEN MEDICAL TEAM REPORT</button></section><div className="emergency-layout"><section className="incident-panel"><div className="incident-top"><span>INCIDENT CHANNEL</span><span className="incident-count">NO SIGNAL · DEMO</span></div><div className="no-incident"><div className="pulse-shield"><ShieldCheck size={33}/></div><h2>No simulated incidents</h2><p>This prototype has no active incident feed or emergency connection.</p><Tag>SIMULATION CLEAR</Tag></div><div className="incident-foot"><span>LAST DEMO SYSTEM CHECK</span><b>09:42:16 UTC</b></div></section><section className="response-panel"><span className="eyebrow">MISSION RESPONSE CHECKLIST / DEMO</span><h3>Mission response sequence</h3><div className="response-step"><b>01</b><div><strong>Confirm crew safety</strong><small>Review the fictional crew status page.</small></div><button aria-label="Open crew status" onClick={()=>setPage('crew')}><ChevronRight size={17}/></button></div><div className="response-step"><b>02</b><div><strong>Review sample health values</strong><small>Open the simulated monitoring display.</small></div><button aria-label="Open health monitoring" onClick={()=>setPage('health')}><ChevronRight size={17}/></button></div><div className="response-step"><b>03</b><div><strong>Prepare sample handover</strong><small>Demonstration workflow only.</small></div><button aria-label="Open ORBIT AI" onClick={()=>setPage('ai')}><ChevronRight size={17}/></button></div><button className={`ack-button ${ack?'acknowledged':''}`} onClick={()=>setAck(!ack)}>{ack?<><Check size={17}/> PROTOCOL REVIEWED · DEMO</>:<>ACKNOWLEDGE DEMO PROTOCOL <ChevronRight size={17}/></>}</button><small className="emergency-note">PROTOTYPE ONLY · Not connected to emergency services. Use approved mission procedures and contact the flight surgeon in real situations.</small><CommunicationComposer onQueue={report=>setReports(v=>[{text:report,at:new Date().toISOString()},...v])}/>{reports.map((report,i)=><div className="queued-report" key={`${report.at}-${i}`}><b>QUEUED FOR MEDICAL TEAM - DEMO · {new Date(report.at).toLocaleString()}</b><span>{report.text}</span></div>)}</section></div></div></div>
}

export default function App() {
  const [page,setPage]=useState('mission')
  const [mobileOpen,setMobileOpen]=useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalView, setAuthModalView] = useState('LOGIN')
  const { user, profile, crewMember, roles, isPendingApproval, isDemoMode, isAdmin, isAuthorized, isLoading } = useAuth()
  const { crewList, pendingCount } = useCrew()

  // Ensure unauthorized access to admin screen immediately falls back to mission
  useEffect(() => {
    if (page === 'admin-crew' && !isDemoMode && (!isAuthorized || !isAdmin)) {
      setPage('mission')
    }
  }, [page, isDemoMode, isAuthorized, isAdmin])

  const activeNav = useMemo(() => {
    const list = [...nav]
    if (isAdmin || isDemoMode) {
      list.push({
        id: 'admin-crew',
        label: 'Crew Operations',
        icon: Shield,
        group: 'ADMINISTRATION',
        badge: pendingCount > 0 ? pendingCount : null,
      })
    }
    return list
  }, [isAdmin, isDemoMode, pendingCount])

  const current = activeNav.find((n) => n.id === page) || activeNav[0]
  const groups = useMemo(() => [...new Set(activeNav.map((n) => n.group))], [activeNav])
  const renderPage = () => {
    if (page === 'admin-crew' && !isDemoMode && (!isAuthorized || !isAdmin)) {
      return <MissionControlScreen setPage={setPage} crew={crewList} />
    }
    return ({
      mission: <MissionControlScreen setPage={setPage} crew={crewList} />,
      health: <HealthMonitoringScreen setPage={setPage} crew={crewList} />,
      crew: <CrewStatusScreen setPage={setPage} crew={crewList} />,
      medical: <MedicalBayScreen />,
      ai: <OrbitAIScreen setPage={setPage} crew={crewList} />,
      scan: <BiometricScanScreen setPage={setPage} />,
      emergency: <EmergencyCenterScreen setPage={setPage} crew={crewList} />,
      'admin-crew': <CrewAdminHub setPage={setPage} />,
    }[page] || <MissionControlScreen setPage={setPage} crew={crewList} />)
  }

  const activeCallsign = crewMember?.callsign || profile?.full_name?.split(' ')[0] || (user ? user.email.split('@')[0] : 'SIGN IN')
  const activeInitials = crewMember?.initials || profile?.full_name?.slice(0, 2).toUpperCase() || (user ? 'OH' : '?')
  const primaryRole = roles[0] || (isPendingApproval ? 'pending' : 'visitor')

  // 1. Initial Authentication Resolution Splash Screen
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#030712',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#38bdf8',
          fontFamily: 'var(--font-mono, monospace)',
          gap: '1rem',
        }}
      >
        <Orbit size={42} className="animate-spin" />
        <span style={{ fontSize: '0.85rem', letterSpacing: '0.12em', color: '#94a3b8' }}>
          ESTABLISHING ORBIT HEALTH SECURE LINK...
        </span>
      </div>
    )
  }

  // 2. Unauthenticated Gateway: Show Login / Enlistment screen first
  if (!user) {
    return <AuthGatewayScreen />
  }

  return (
    <div className={`app-shell screen-${page}`}>
      <aside className={`sidebar ${mobileOpen?'open':''}`}>
        <div className="brand">
          <div className="brand-mark"><Orbit size={23}/></div>
          <div><strong>ORBIT<span> HEALTH</span></strong><small>MISSION SYSTEM · DEMO</small></div>
          <button className="mobile-close" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"><X size={18}/></button>
        </div>
        <div className="mission-chip">
          <span className="live-dot"/>
          <div><b>EXPEDITION 07</b><small>SIMULATED MISSION</small></div>
          <ChevronDown size={14}/>
        </div>
        <nav aria-label="Mission screens">
          {groups.map(g=>(
            <div className="nav-group" key={g}>
              <div className="nav-group-label">{g}</div>
              {activeNav.filter(n=>n.group===g).map(n=>{
                const Icon=n.icon;
                return (
                  <button key={n.id} className={`nav-link ${page===n.id?'active':''}`} aria-current={page===n.id?'page':undefined} onClick={()=>{setPage(n.id);setMobileOpen(false)}}>
                    <Icon size={17}/>
                    <span>{n.label}</span>
                    {n.badge && <span className="admin-tab-counter" style={{ marginLeft: 'auto' }}>{n.badge}</span>}
                    {n.id==='emergency'&&<i className="nav-alert"/>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection-card">
            <div className="connection-icon"><Radio size={16}/></div>
            <div><b>SIMULATED LINK</b><small>No telemetry connected</small></div>
            <span className="demo-indicator">DEMO</span>
          </div>
          <div className="sidebar-footer">
            <span>ORBIT HEALTH v0.2.0</span>
            <button aria-label="Settings prototype control" title="Prototype control: settings are not connected" onClick={e=>e.currentTarget.title='Settings are a visual prototype control.'}>
              <Settings size={15}/>
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <div className="mobile-top">
          <button onClick={()=>setMobileOpen(true)} aria-label="Open navigation"><Menu size={20}/></button>
          <b>ORBIT HEALTH</b>
          <span className="demo-indicator">DEMO</span>
        </div>

        {/* Quarantined Holding Banner if Candidate is pending triage */}
        {isPendingApproval && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.14)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '0.5rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#fbbf24',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={15} /> APPLICATION QUARANTINED: Candidate self-registration pending Flight Director approval.
            </span>
            <button
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#ffffff',
                padding: '0.2rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.72rem',
              }}
              onClick={() => {
                setAuthModalView('ACCOUNT')
                setAuthModalOpen(true)
              }}
            >
              CLEARANCE STATUS
            </button>
          </div>
        )}

        <div className="topbar">
          <div className="breadcrumb">
            <span>EXPEDITION 07</span>
            <ChevronRight size={13}/>
            <b>{current?.label.toUpperCase()}</b>
            <span className="topbar-demo">SIMULATION</span>
          </div>
          <div className="topbar-right">
            <span>08 NOV 2026</span>
            <span className="topbar-divider"/>
            <span>09:42 UTC · SAMPLE TIME</span>

            {/* Interactive Aerospace Authentication Pill */}
            {!user ? (
              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                <button
                  className="topbar-auth-btn"
                  onClick={() => {
                    setAuthModalView('LOGIN')
                    setAuthModalOpen(true)
                  }}
                  title="Click to sign in with your astronaut account"
                >
                  <div className="topbar-auth-avatar">?</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                    <strong style={{ fontSize: '0.78rem' }}>SIGN IN</strong>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary, #9ca3af)', fontFamily: 'monospace' }}>
                      RETURNING
                    </span>
                  </div>
                </button>
                <button
                  className="btn-table-action"
                  onClick={() => {
                    setAuthModalView('REGISTER')
                    setAuthModalOpen(true)
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.35) 0%, rgba(56, 189, 248, 0.25) 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    color: '#38bdf8',
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  title="Click to register as a new astronaut"
                >
                  <Sparkles size={13} />
                  ENLIST
                </button>
              </div>
            ) : (
              <button
                className="topbar-auth-btn"
                onClick={() => {
                  setAuthModalView('ACCOUNT')
                  setAuthModalOpen(true)
                }}
                title="Click to view personnel clearance, switch persona, or authenticate"
              >
                <div className="topbar-auth-avatar">
                  {activeInitials}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                  <strong style={{ fontSize: '0.78rem' }}>{activeCallsign}</strong>
                  <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary, #9ca3af)', fontFamily: 'monospace' }}>
                    {isPendingApproval ? 'PENDING TRIAGE' : (roles[0]?.toUpperCase() || 'CREW MEMBER')}
                  </span>
                </div>
                <span className={`topbar-auth-role ${primaryRole}`}>
                  {isPendingApproval ? 'PENDING' : (roles[0] ? roles[0].toUpperCase() : 'DEMO')}
                </span>
              </button>
            )}

            <button className="icon-button" aria-label="Notifications prototype control" title="Prototype control: no notification feed" onClick={e=>e.currentTarget.title='No live alert feed is connected.'}>
              <Bell size={16}/>
            </button>
          </div>
        </div>

        <div className="page-container">{renderPage()}</div>

        <footer className="app-footer">
          <span>ORBIT HEALTH <i>·</i> ASTRONAUT WELLNESS CONCEPT</span>
          <span>ALL READINGS ARE SIMULATED DEMONSTRATION DATA</span>
        </footer>

        {/* Aerospace Authentication & Registration Modal Dialog */}
        <AuthModals
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialView={authModalView}
        />
      </main>
    </div>
  )
}
