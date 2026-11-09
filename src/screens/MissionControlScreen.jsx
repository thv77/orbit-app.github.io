import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock,
  Compass,
  Cpu,
  Globe,
  HeartPulse,
  LifeBuoy,
  Orbit,
  Pill,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  Users,
  Wind,
  Zap,
} from 'lucide-react'
import useLocalDemoState from '../useLocalDemoState'

export default function MissionControlScreen({ setPage, crew = [] }) {
  const canvasRef = useRef(null)
  const [viewMode, setViewMode] = useState('ORBITAL')
  const [telemetry, setTelemetry] = useState({
    altitude: '408.4',
    velocity: '7.662',
    subLat: '24.2',
    subLon: '48.6',
  })

  // Live mission elapsed time clock
  const [met, setMet] = useState({ days: 126, hours: 8, mins: 42, secs: 16 })
  useEffect(() => {
    const id = setInterval(() => {
      setMet(prev => {
        let s = prev.secs + 1
        let m = prev.mins
        let h = prev.hours
        let d = prev.days
        if (s >= 60) {
          s = 0
          m += 1
        }
        if (m >= 60) {
          m = 0
          h += 1
        }
        if (h >= 24) {
          h = 0
          d += 1
        }
        return { days: d, hours: h, mins: m, secs: s }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Mount Cinematic Earth Three.js Engine
  useEffect(() => {
    let cancelled = false
    let cleanup
    import('../threeScenes')
      .then(({ mountStarfield }) => {
        if (!cancelled && canvasRef.current) {
          cleanup = mountStarfield(canvasRef.current, update => {
            if (!cancelled && update) setTelemetry(update)
          })
        }
      })
      .catch(err => {
        console.warn('Three.js canvas init fallback:', err)
      })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  // Camera View Mode switcher handler
  const handleViewChange = mode => {
    setViewMode(mode)
    if (canvasRef.current?.__setViewMode) {
      canvasRef.current.__setViewMode(mode)
    }
  }

  // --- Comms Delay Simulator State & Logic ---
  const [delay, setDelay] = useState(8)
  const [distance, setDistance] = useState('Lunar transit')
  const [commsMessages, setCommsMessages] = useLocalDemoState('orbit.delay-messages', [])
  const [clock, setClock] = useState(Date.now())
  const [commsText, setCommsText] = useState('')

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setCommsMessages(prev => {
      let changed = false
      const next = prev.map(m => {
        if (m.status === 'IN TRANSIT' && clock >= m.arrives) {
          changed = true
          return { ...m, status: 'DELIVERED' }
        }
        if (m.status === 'DELIVERED' && !m.reply && clock >= m.replyAt) {
          changed = true
          return {
            ...m,
            reply: 'Simulated Houston CAPCOM response: Telemetry and wellness data acknowledged nominal.',
          }
        }
        return m
      })
      return changed ? next : prev
    })
  }, [clock, setCommsMessages])

  const sendComms = () => {
    if (!commsText.trim()) return
    const queued = {
      id: Date.now(),
      text: commsText.trim(),
      status: delay === 0 ? 'DELIVERED' : 'IN TRANSIT',
      arrives: Date.now() + delay * 1000,
      replyAt: Date.now() + delay * 2000,
    }
    setCommsMessages(v => [queued, ...v])
    setCommsText('')
  }

  // --- Solar Storm Drill State & Logic ---
  const [storm, setStorm] = useState(false)
  const [stormElapsed, setStormElapsed] = useState(0)
  const [checks, setChecks] = useState([])

  useEffect(() => {
    if (!storm) return
    const id = setInterval(() => setStormElapsed(v => v + 1), 1000)
    return () => clearInterval(id)
  }, [storm])

  // Sparkline data generator for quick vitals pulse
  const pulseData = [38, 45, 42, 60, 50, 68, 55, 62, 51, 68, 56, 70, 58, 64, 52, 67]

  return (
    <div className="mc-root">
      {/* ============================================================== */}
      {/* 1. CINEMATIC 3D EARTH VIEWPORT & COCKPIT CANOPY */}
      {/* ============================================================== */}
      <section className="mc-viewport-section">
        <canvas ref={canvasRef} className="mc-canvas" aria-label="Cinematic 3D Earth and Spacecraft Environment" />

        {/* Cockpit Canopy Overlays */}
        <div className="mc-hud-grid" />
        <div className="mc-vignette" />
        <div className="mc-canopy-frame">
          <span className="corner-tl" />
          <span className="corner-tr" />
          <span className="corner-bl" />
          <span className="corner-br" />
        </div>

        {/* Top HUD Telemetry Ribbon */}
        <div className="mc-top-hud">
          <div className="mc-mission-id">
            <span className="mc-live-dot" />
            <div>
              <span className="mc-eyebrow">Expedition 07 · flight deck</span>
              <strong className="mc-callsign">ISS · Low Earth orbit</strong>
            </div>
          </div>

          <div className="mc-clock-display">
            <span className="mc-clock-label">Mission elapsed time</span>
            <span className="mc-clock-value">
              {String(met.days).padStart(3, '0')}D : {String(met.hours).padStart(2, '0')}H :{' '}
              {String(met.mins).padStart(2, '0')}M : {String(met.secs).padStart(2, '0')}S
            </span>
          </div>

          <div className="mc-orbit-telemetry">
            <div className="mc-telem-item">
              <small>Altitude</small>
              <b>{telemetry.altitude} <abbr>KM</abbr></b>
            </div>
            <div className="mc-telem-item">
              <small>Velocity</small>
              <b>{telemetry.velocity} <abbr>KM/S</abbr></b>
            </div>
            <div className="mc-telem-item">
              <small>Inclination</small>
              <b>51.6<abbr>°</abbr></b>
            </div>
            <div className="mc-telem-item">
              <small>Sub-point</small>
              <b>{telemetry.subLat}° N / {telemetry.subLon}° E</b>
            </div>
          </div>
        </div>

        {/* Hero Mission Statement & Direct CTA */}
        <div className="mc-hero-center">
          <div className="mc-hero-tag">
            <Orbit size={14} className="mc-spin" />
            <span>Astronaut health monitoring & operational medicine</span>
          </div>
          <h1 className="mc-hero-title">
            Earth in view.<br />
            <em>Humanity in focus.</em>
          </h1>
          <p className="mc-hero-desc">
            Autonomous mission health oversight, personalized crew baseline telemetry, and clinical operations for deep-space exploration.
          </p>

          <div className="mc-hero-actions">
            <button className="mc-btn-primary" onClick={() => setPage('health')}>
              <HeartPulse size={16} />
              <span>Open crew health monitor</span>
              <ChevronRight size={15} />
            </button>
            <button className="mc-btn-secondary" onClick={() => setPage('crew')}>
              <Users size={15} />
              <span>Crew roster (04)</span>
            </button>
            <button className="mc-btn-ghost" onClick={() => setPage('emergency')}>
              <LifeBuoy size={15} />
              <span>Emergency console</span>
            </button>
          </div>
        </div>

        {/* Viewport Camera Mode Selector */}
        <div className="mc-view-switcher">
          <span className="mc-view-label">Canopy camera</span>
          <div className="mc-view-buttons">
            {[
              { id: 'ORBITAL', label: 'PANORAMA' },
              { id: 'NADIR', label: 'NADIR TRACK' },
              { id: 'HORIZON', label: 'HORIZON LIMB' },
            ].map(v => (
              <button
                key={v.id}
                className={`mc-view-btn ${viewMode === v.id ? 'active' : ''}`}
                onClick={() => handleViewChange(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <span className="mc-view-hint">Drag to orbit · scroll to zoom</span>
        </div>

        {/* Watermark Safety Guardrail */}
        <div className="mc-safety-ribbon">
          <ShieldCheck size={13} />
          <span>Simulated mission environment · not live flight telemetry</span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. COMMAND TELEMETRY & CLINICAL READINESS PODS */}
      {/* ============================================================== */}
      <section className="mc-telemetry-grid">
        {/* POD 1: Crew Physiological Readiness */}
        <article className="mc-pod mc-pod-crew">
          <div className="mc-pod-header">
            <div>
              <span className="mc-pod-eyebrow">Crew physiological status</span>
              <h3>Flight Crew Readiness</h3>
            </div>
            <span className="mc-status-badge good">
              <span className="mc-badge-dot" /> 03 / 04 Nominal
            </span>
          </div>

          <div className="mc-crew-pills">
            {crew.map(c => (
              <div
                key={c.initials}
                className={`mc-crew-item ${c.state === 'MONITOR' ? 'monitor' : 'nominal'}`}
                onClick={() => setPage('crew')}
                title={`Open profile for ${c.name}`}
              >
                <div className={`mc-avatar ${c.color}`}>{c.initials}</div>
                <div className="mc-crew-meta">
                  <span className="mc-crew-name">{c.name}</span>
                  <small className="mc-crew-role">{c.role}</small>
                </div>
                <div className="mc-crew-vitals">
                  <span>{c.hr} <small>BPM</small></span>
                  <span>{c.oxygen} <small>%</small></span>
                </div>
                <span className={`mc-tag-pill ${c.state === 'MONITOR' ? 'warn' : 'ok'}`}>
                  {c.state}
                </span>
              </div>
            ))}
          </div>

          <div className="mc-pod-footer">
            <div className="mc-pulse-summary">
              <HeartPulse size={15} className="mc-icon-cyan" />
              <span>Commander Resting Pulse: <b>68 BPM</b> · Nominal baseline</span>
            </div>
            <button className="mc-link-btn" onClick={() => setPage('health')}>
              Inspect vitals <ChevronRight size={13} />
            </button>
          </div>
        </article>

        {/* POD 2: Medical Bay Logistics Readiness */}
        <article className="mc-pod mc-pod-medbay">
          <div className="mc-pod-header">
            <div>
              <span className="mc-pod-eyebrow">Module 03 / clinical lab</span>
              <h3>Medical Bay Logistics</h3>
            </div>
            <span className="mc-status-badge good">
              <span className="mc-badge-dot" /> 98% Readiness
            </span>
          </div>

          <div className="mc-readiness-meter">
            <div className="mc-meter-numbers">
              <strong>98.4<span>%</span></strong>
              <small>Clinical system availability</small>
            </div>
            <div className="mc-meter-track">
              <div className="mc-meter-fill" style={{ width: '98.4%' }} />
            </div>
          </div>

          <div className="mc-med-inventory-snapshot">
            <div className="mc-inv-row">
              <span>Diagnostic Ultrasound (Butterfly iQ)</span>
              <strong className="status-ready">Ready · calibrated</strong>
            </div>
            <div className="mc-inv-row">
              <span>ECG & Continuous Vitals Sensors</span>
              <strong className="status-ready">12 / 12 Ready</strong>
            </div>
            <div className="mc-inv-row">
              <span>Emergency O₂ Resuscitation Kit</span>
              <strong className="status-check">Inspection due in 48H</strong>
            </div>
          </div>

          <div className="mc-pod-footer">
            <span className="mc-footer-note">Sterile work surface pressurized at 101.3 kPa</span>
            <button className="mc-link-btn" onClick={() => setPage('medical')}>
              Open medical bay <ChevronRight size={13} />
            </button>
          </div>
        </article>

        {/* POD 3: Space Environmental Risk Radar */}
        <article className="mc-pod mc-pod-risk">
          <div className="mc-pod-header">
            <div>
              <span className="mc-pod-eyebrow">Environmental dosimetry</span>
              <h3>Space Risk Radar</h3>
            </div>
            <span className="mc-status-badge nominal">
              <span className="mc-badge-dot" /> Quiescent
            </span>
          </div>

          <div className="mc-risk-body">
            <div className="mc-radar-mini">
              <div className="mc-radar-sweep" />
              <div className="mc-radar-rings" />
              <div className="mc-radar-center">
                <Radio size={14} />
                <b>1.20</b>
                <small>mSv</small>
              </div>
              <span className="mc-blip b1" />
              <span className="mc-blip b2" />
            </div>

            <div className="mc-risk-telemetry">
              <div className="mc-env-metric">
                <small>Cabin temperature</small>
                <strong>22.1 <abbr>°C</abbr></strong>
                <span>Nominal thermal comfort</span>
              </div>
              <div className="mc-env-metric">
                <small>Cabin pressure</small>
                <strong>101.3 <abbr>kPa</abbr></strong>
                <span>Sea-level equivalent</span>
              </div>
              <div className="mc-env-metric">
                <small>Partial co₂</small>
                <strong>0.42 <abbr>%</abbr></strong>
                <span>Below headache ceiling</span>
              </div>
            </div>
          </div>

          <div className="mc-pod-footer">
            <span className="mc-footer-note">Cumulative space radiation sample well below 30-day limits</span>
            <button className="mc-link-btn" onClick={() => setPage('health')}>
              Full risk radar <ChevronRight size={13} />
            </button>
          </div>
        </article>
      </section>

      {/* ============================================================== */}
      {/* 3. FLIGHT ACTIVITY LOG & RAPID NAVIGATION MATRIX */}
      {/* ============================================================== */}
      <section className="mc-operations-grid">
        {/* Left: Recent Mission Health Notes */}
        <div className="mc-pod mc-log-pod">
          <div className="mc-pod-header">
            <div>
              <span className="mc-pod-eyebrow">Chronological audit trail</span>
              <h3>Recent Mission Health Notes</h3>
            </div>
            <span className="mc-data-tag">Simulated logs</span>
          </div>

          <div className="mc-log-list">
            <div className="mc-log-item">
              <span className="mc-log-mark cyan"><HeartPulse size={14} /></span>
              <div className="mc-log-content">
                <strong>Daily wellness check logged · Commander Elena Vasquez</strong>
                <p>Cardiovascular metrics stable at rest (68 BPM, SpO₂ 98%). Sleep recovery score nominal.</p>
              </div>
              <time className="mc-log-time">09:42 UTC</time>
            </div>

            <div className="mc-log-item">
              <span className="mc-log-mark amber"><Activity size={14} /></span>
              <div className="mc-log-content">
                <strong>Workload & fatigue review flagged · Dr. Marcus Chen</strong>
                <p>Consecutive high-intensity EVA procedure prep. Recommended 45-min sleep buffer extension.</p>
              </div>
              <time className="mc-log-time">09:18 UTC</time>
            </div>

            <div className="mc-log-item">
              <span className="mc-log-mark blue"><Pill size={14} /></span>
              <div className="mc-log-content">
                <strong>Care schedule routine confirmed · Amara Okafor</strong>
                <p>Microgravity countermeasure resistance workout completed on ARED (30 min).</p>
              </div>
              <time className="mc-log-time">08:55 UTC</time>
            </div>

            <div className="mc-log-item">
              <span className="mc-log-mark teal"><ShieldCheck size={14} /></span>
              <div className="mc-log-content">
                <strong>Environmental life support validation · Luca Moretti</strong>
                <p>Cabin atmosphere scrubbers scrubbed. Trace contaminant sensors within tolerance.</p>
              </div>
              <time className="mc-log-time">07:30 UTC</time>
            </div>
          </div>
        </div>

        {/* Right: Quick Command Dispatch Matrix */}
        <div className="mc-pod mc-dispatch-pod">
          <div className="mc-pod-header">
            <div>
              <span className="mc-pod-eyebrow">Flight deck command</span>
              <h3>System Dispatch Matrix</h3>
            </div>
            <span className="mc-data-tag">Mission systems</span>
          </div>

          <div className="mc-dispatch-buttons">
            <button className="mc-dispatch-tile" onClick={() => setPage('health')}>
              <div className="mc-tile-icon cyan"><HeartPulse size={20} /></div>
              <div className="mc-tile-info">
                <strong>Health Monitoring</strong>
                <small>3D Digital Twin, vital trends, telemetry connect</small>
              </div>
              <ArrowUpRight size={17} className="mc-tile-arrow" />
            </button>

            <button className="mc-dispatch-tile" onClick={() => setPage('crew')}>
              <div className="mc-tile-icon blue"><Users size={20} /></div>
              <div className="mc-tile-info">
                <strong>Crew Status</strong>
                <small>Individual astronaut dossiers & baseline records</small>
              </div>
              <ArrowUpRight size={17} className="mc-tile-arrow" />
            </button>

            <button className="mc-dispatch-tile" onClick={() => setPage('medical')}>
              <div className="mc-tile-icon teal"><Stethoscope size={20} /></div>
              <div className="mc-tile-info">
                <strong>Medical Bay</strong>
                <small>Clinical equipment inventory & care schedule</small>
              </div>
              <ArrowUpRight size={17} className="mc-tile-arrow" />
            </button>

            <button className="mc-dispatch-tile" onClick={() => setPage('ai')}>
              <div className="mc-tile-icon violet"><Cpu size={20} /></div>
              <div className="mc-tile-info">
                <strong>ORBIT AI Assistant</strong>
                <small>Clinical handovers & protocol reasoning</small>
              </div>
              <ArrowUpRight size={17} className="mc-tile-arrow" />
            </button>

            <button className="mc-dispatch-tile" onClick={() => setPage('scan')}>
              <div className="mc-tile-icon cyan"><Radio size={20} /></div>
              <div className="mc-tile-info">
                <strong>Biometric Scan Concept</strong>
                <small>Non-contact facial alignment & baseline comparison</small>
              </div>
              <ArrowUpRight size={17} className="mc-tile-arrow" />
            </button>

            <button className="mc-dispatch-tile emergency-tile" onClick={() => setPage('emergency')}>
              <div className="mc-tile-icon red"><LifeBuoy size={20} /></div>
              <div className="mc-tile-info">
                <strong>Emergency Center</strong>
                <small>Priority checklists & urgent doctor queue</small>
              </div>
              <ArrowUpRight size={17} className="mc-tile-arrow" />
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. DEEP-SPACE OPERATIONS & EMERGENCY DRILL MODULES */}
      {/* ============================================================== */}
      <section className="mc-deep-space-section">
        {/* Comms Delay Simulator */}
        <div className="mc-pod mc-comms-pod">
          <div className="mc-pod-header">
            <div>
              <span className="mc-pod-eyebrow">Deep-space communications link</span>
              <h3>Speed-of-Light Delay Simulator</h3>
            </div>
            <span className="mc-status-badge cyan">
              <Radio size={12} /> {distance} ({delay}s delay)
            </span>
          </div>

          <p className="mc-pod-desc">
            Simulates interplanetary light-time transmission delays between the spacecraft and Earth ground stations (Houston CAPCOM / DSN).
          </p>

          <div className="mc-comms-controls">
            <label className="mc-field">
              <span>Distance profile</span>
              <select
                value={distance}
                onChange={e => {
                  setDistance(e.target.value)
                  setDelay(e.target.value === 'Lunar transit' ? 8 : e.target.value === 'Mars approach' ? 22 : 0)
                }}
              >
                <option>Lunar transit</option>
                <option>Mars approach</option>
                <option>Custom / near Earth</option>
              </select>
            </label>

            <label className="mc-field">
              <span>One-way transmission delay: <b>{delay} SECONDS</b></span>
              <input
                type="range"
                min="0"
                max="30"
                value={delay}
                onChange={e => setDelay(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="mc-comms-compose">
            <input
              type="text"
              value={commsText}
              onChange={e => setCommsText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendComms()}
              placeholder="Transmit message to Houston CAPCOM (simulated ground link)..."
            />
            <button onClick={sendComms} disabled={!commsText.trim()} aria-label="Send message">
              <Send size={15} />
              <span>Transmit</span>
            </button>
          </div>

          <div className="mc-comms-queue">
            <span className="mc-queue-header">Link transmission queue</span>
            {commsMessages.length > 0 ? (
              commsMessages.map(m => (
                <div key={m.id} className="mc-queue-item">
                  <div className="mc-queue-row">
                    <span className="mc-msg-text">{m.text}</span>
                    <span className={`mc-msg-status ${m.status === 'DELIVERED' ? 'delivered' : 'transit'}`}>
                      {m.status === 'IN TRANSIT' ? (
                        <>
                          <Timer size={12} className="mc-spin-slow" />
                          IN TRANSIT ({Math.max(0, Math.ceil((m.arrives - Date.now()) / 1000))}s)
                        </>
                      ) : (
                        <>
                          <Check size={12} /> Delivered to ground
                        </>
                      )}
                    </span>
                  </div>
                  {m.reply && <div className="mc-ground-reply"><Radio size={12} /> {m.reply}</div>}
                </div>
              ))
            ) : (
              <div className="mc-queue-empty">
                <Radio size={14} />
                <span>No outbound packets in transit. Messages sent will experience configured one-way light delay.</span>
              </div>
            )}
          </div>
        </div>

        {/* Solar Storm Contingency Drill */}
        <div className={`mc-pod mc-storm-pod ${storm ? 'storm-active' : ''}`}>
          <div className="mc-pod-header">
            <div>
              <span className="mc-pod-eyebrow">Crew safety contingency</span>
              <h3>Solar Particle Event (SPE) Drill</h3>
            </div>
            <span className={`mc-status-badge ${storm ? 'emergency' : 'nominal'}`}>
              <Zap size={12} /> {storm ? 'Drill in progress' : 'Training standby'}
            </span>
          </div>

          {storm && (
            <div className="mc-storm-banner" role="alert">
              <AlertTriangle size={18} />
              <div>
                <strong>Coronal mass ejection drill active</strong>
                <span>Radiation levels elevated. Implement shelter protocols and secure high-gain instrumentation.</span>
              </div>
            </div>
          )}

          <div className="mc-storm-readout">
            <div className="mc-storm-numbers">
              <small>Simulated exposure rate</small>
              <strong>{(0.3 + stormElapsed * 0.18).toFixed(2)} <span>mSv</span></strong>
            </div>
            <div className="mc-storm-gauge">
              <div
                className="mc-storm-fill"
                style={{ width: `${Math.min(8 + stormElapsed * 4, 100)}%` }}
              />
            </div>
          </div>

          <div className="mc-storm-checklist">
            <span className="mc-checklist-title">Emergency protocol checklist</span>
            {[
              ['Secure high-gain antenna & sensitive diagnostic kits', 'Stow portable ultrasound in shielded locker'],
              ['Order crew relocation to water-shielded habitat sleep station', 'Crew gathers in Module 02 radiation storm shelter'],
              ['Transmit emergency radiation dosage log to Flight Surgeon', 'Transmit dosimeter reading via high-priority uplink'],
            ].map(([title, subtitle], idx) => (
              <label key={title} className={`mc-check-row ${checks.includes(idx) ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={checks.includes(idx)}
                  onChange={() =>
                    setChecks(prev =>
                      prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]
                    )
                  }
                />
                <div className="mc-check-label">
                  <strong>{title}</strong>
                  <small>{subtitle}</small>
                </div>
              </label>
            ))}
          </div>

          <button
            className={`mc-storm-toggle-btn ${storm ? 'stop' : 'start'}`}
            onClick={() => {
              setStorm(s => !s)
              if (storm) {
                setStormElapsed(0)
                setChecks([])
              }
            }}
          >
            <Zap size={15} />
            <span>{storm ? 'Terminate & reset drill' : 'Initiate solar storm training drill'}</span>
          </button>
        </div>
      </section>
    </div>
  )
}

