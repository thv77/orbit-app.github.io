/**
 * EmergencyCenterScreen.jsx
 * ORBIT HEALTH · Priority Response Command Center
 *
 * PROTOTYPE ONLY · Not connected to emergency services.
 * All readings are simulated demonstration data.
 * This screen does not replace flight surgeon judgment.
 */

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Radio,
  ShieldCheck,
  Radiation,
  Zap,
  Wind,
  Wifi,
  X,
  Activity,
  Heart,
} from 'lucide-react'
import { CommunicationComposer } from '../features'
import useLocalDemoState from '../useLocalDemoState'
import '../styles/emergencyCenter.css'

/* ─────────────────────────────────────────────
   THREE.JS · Emergency Radar Scene
   mountEmergencyRadar(canvas, drillActive)
   returns a cleanup function
───────────────────────────────────────────── */
function mountEmergencyRadar(canvas, drillActive = false) {
  if (!canvas) return () => {}

  const W = canvas.clientWidth || 180
  const H = canvas.clientHeight || 180

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H)
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
  camera.position.set(0, 4.8, 0)
  camera.lookAt(0, 0, 0)

  /* ── Concentric rings ── */
  const ringMat = (color, opacity) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide })

  ;[0.9, 1.6, 2.4].forEach((r, i) => {
    const geo = new THREE.TorusGeometry(r, 0.018, 8, 64)
    const col = i === 2 ? 0xd4860a : 0x2a9d8f
    const mesh = new THREE.Mesh(geo, ringMat(col, 0.35))
    mesh.rotation.x = Math.PI / 2
    scene.add(mesh)
  })

  /* ── Radar disc (sweep arm) ── */
  const sweepGeo = new THREE.PlaneGeometry(2.4, 0.03)
  const sweepMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  })
  const sweepArm = new THREE.Mesh(sweepGeo, sweepMat)
  sweepArm.rotation.x = Math.PI / 2
  sweepArm.position.set(1.2, 0.01, 0)
  const sweepPivot = new THREE.Object3D()
  sweepPivot.add(sweepArm)
  scene.add(sweepPivot)

  /* Sweep trail — wide translucent sector */
  const trailGeo = new THREE.PlaneGeometry(2.4, 0.18)
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
  })
  const trailMesh = new THREE.Mesh(trailGeo, trailMat)
  trailMesh.rotation.x = Math.PI / 2
  trailMesh.position.set(1.2, 0.01, 0)
  sweepPivot.add(trailMesh)

  /* ── Central pulse node ── */
  const coreGeo = new THREE.SphereGeometry(0.14, 16, 16)
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x22d3ee,
    emissiveIntensity: 1.2,
  })
  const coreNode = new THREE.Mesh(coreGeo, coreMat)
  coreNode.position.y = 0.01
  scene.add(coreNode)

  /* ── Crew blips ── */
  const blipData = [
    { x:  1.3, z: -0.6, color: 0x22c55e }, // EV  NOMINAL
    { x: -0.8, z: -1.2, color: 0xd4860a }, // MC  MONITOR
    { x: -1.4, z:  0.5, color: 0x22c55e }, // AO  NOMINAL
    { x:  0.6, z:  1.4, color: 0x22c55e }, // LM  NOMINAL
  ]
  const blipMeshes = blipData.map(({ x, z, color }) => {
    const geo = new THREE.SphereGeometry(0.09, 8, 8)
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.9,
    })
    const m = new THREE.Mesh(geo, mat)
    m.position.set(x, 0.05, z)
    scene.add(m)
    return m
  })

  /* ── Ambient light ── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const pt = new THREE.PointLight(0x22d3ee, 1.0, 10)
  pt.position.set(0, 3, 0)
  scene.add(pt)

  /* ── Animation ── */
  let frame
  let t = 0
  const BASE_SPEED = drillActive ? 2.4 : 0.9

  const tick = () => {
    frame = requestAnimationFrame(tick)
    t += 0.016
    sweepPivot.rotation.y += (BASE_SPEED * 0.016)

    // Core pulse
    const pulse = 0.9 + 0.35 * Math.sin(t * 3.5)
    coreMat.emissiveIntensity = pulse

    // Blip twinkle
    blipMeshes.forEach((b, i) => {
      b.material.emissiveIntensity = 0.7 + 0.5 * Math.sin(t * 2 + i * 1.4)
    })

    renderer.render(scene, camera)
  }
  tick()

  return () => {
    cancelAnimationFrame(frame)
    renderer.dispose()
  }
}

/* ─────────────────────────────────────────────
   Static Data Constants
───────────────────────────────────────────── */
const SYSTEM_STATUS = [
  { name: 'ECLSS', label: 'Life Support',   status: 'NOMINAL', icon: Wind,       checked: '09:42 UTC', tone: 'nominal' },
  { name: 'POWER', label: 'Electrical Grid', status: 'NOMINAL', icon: Zap,        checked: '09:38 UTC', tone: 'nominal' },
  { name: 'PROP',  label: 'Propulsion',      status: 'MONITOR', icon: Activity,   checked: '09:21 UTC', tone: 'amber'   },
  { name: 'COMMS', label: 'Communication',   status: 'NOMINAL', icon: Wifi,       checked: '09:41 UTC', tone: 'nominal' },
]

const RESPONSE_STEPS = [
  {
    num: '01',
    title: 'Confirm Crew Safety',
    desc: 'Review the fictional crew status page and account for all personnel.',
    page: 'crew',
    label: 'Open Crew Status',
  },
  {
    num: '02',
    title: 'Review Sample Health Values',
    desc: 'Open the simulated monitoring display for biometric overview.',
    page: 'health',
    label: 'Open Health Monitor',
  },
  {
    num: '03',
    title: 'Prepare Sample Handover',
    desc: 'Demonstration workflow only · prepare ORBIT AI summary for flight surgeon.',
    page: 'ai',
    label: 'Open ORBIT AI',
  },
]

const DRILL_ITEMS = [
  'Notify crew to move to shielded segment',
  'Verify ECLSS radiation sensors (simulated)',
  'Log radiation exposure in mission record',
]

const PRIORITY_LEVELS = ['STANDBY', 'ELEVATED', 'CRITICAL']

const DEFAULT_CREW = [
  { name: 'Elena Vasquez', role: 'MISSION COMMANDER', initials: 'EV', state: 'NOMINAL', hr: 68, oxygen: 98, color: 'violet' },
  { name: 'Dr. Marcus Chen', role: 'FLIGHT SURGEON', initials: 'MC', state: 'MONITOR', hr: 82, oxygen: 97, color: 'blue' },
  { name: 'Amara Okafor', role: 'MISSION SPECIALIST', initials: 'AO', state: 'NOMINAL', hr: 71, oxygen: 99, color: 'amber' },
  { name: 'Luca Moretti', role: 'SYSTEMS ENGINEER', initials: 'LM', state: 'NOMINAL', hr: 64, oxygen: 98, color: 'teal' },
]

/* ─────────────────────────────────────────────
   EmergencyCenterScreen Component
───────────────────────────────────────────── */
export default function EmergencyCenterScreen({ setPage, crew = DEFAULT_CREW }) {
  /* ── Persistent State ── */
  const [reports, setReports] = useLocalDemoState('orbit.emergency-reports', [])

  /* ── UI State ── */
  const [ack, setAck] = useState(false)
  const [priority, setPriority] = useState('STANDBY')
  const [drillActive, setDrillActive] = useState(false)
  const [drillRads, setDrillRads] = useState(0.3)
  const [drillChecked, setDrillChecked] = useState([false, false, false])

  /* ── Refs ── */
  const radarCanvasRef = useRef(null)
  const radarCleanupRef = useRef(null)
  const drillIntervalRef = useRef(null)

  /* ── Three.js Radar ── */
  useEffect(() => {
    let cancelled = false
    const canvas = radarCanvasRef.current
    if (!canvas) return

    // Small delay to ensure canvas has layout dimensions
    const timer = setTimeout(() => {
      if (!cancelled) {
        radarCleanupRef.current?.()
        radarCleanupRef.current = mountEmergencyRadar(canvas, drillActive)
      }
    }, 80)

    return () => {
      cancelled = true
      clearTimeout(timer)
      radarCleanupRef.current?.()
      radarCleanupRef.current = null
    }
  }, [drillActive])

  /* ── Solar Storm Drill Counter ── */
  useEffect(() => {
    if (drillActive) {
      drillIntervalRef.current = setInterval(() => {
        setDrillRads(r => Math.min(r + 0.07, 50.0))
      }, 300)
    } else {
      clearInterval(drillIntervalRef.current)
    }
    return () => clearInterval(drillIntervalRef.current)
  }, [drillActive])

  const handleDrillToggle = () => {
    if (drillActive) {
      setDrillActive(false)
      setDrillRads(0.3)
      setDrillChecked([false, false, false])
    } else {
      setDrillActive(true)
    }
  }

  const toggleDrillCheck = (i) => {
    setDrillChecked(prev => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  /* ── Report Queue ── */
  const handleQueue = (text) => {
    setReports(prev => [{ text, at: new Date().toISOString() }, ...prev])
  }
  const handleDismiss = (idx) => {
    setReports(prev => prev.filter((_, i) => i !== idx))
  }

  /* ── Priority CSS class ── */
  const priorityClass =
    priority === 'CRITICAL' ? 'ec-critical'
    : priority === 'ELEVATED' ? 'ec-elevated'
    : 'ec-standby'

  /* ── Crew data (use prop or fallback) ── */
  const crewData = crew.length > 0 ? crew : DEFAULT_CREW

  /* ─────────────────────────────── */
  return (
    <div className={`ec-root ${priorityClass}`}>

      {/* ── Safety Banner ── */}
      <div className="ec-safety-banner" role="status">
        <AlertTriangle size={12} />
        PROTOTYPE ONLY · Not connected to emergency services · Use approved mission
        procedures and contact the flight surgeon in real situations · All readings
        are simulated demonstration data
      </div>

      {/* ── Priority Warning Banners ── */}
      {priority === 'CRITICAL' && (
        <div className="ec-critical-warning" role="alert">
          <AlertTriangle size={14} />
          Critical priority active · all response protocols engage · demo mode only
        </div>
      )}
      {priority === 'ELEVATED' && (
        <div className="ec-critical-warning ec-elevated-warning" role="status">
          <AlertTriangle size={14} />
          Elevated priority · heightened monitoring active · simulation
        </div>
      )}

      {/* ── Drill Banner (when active) ── */}
      {drillActive && (
        <div className="ec-drill-banner" role="alert" aria-label="Training drill active">
          <div>
            <div className="ec-drill-label">⚠ Training drill only · not a real emergency</div>
            <div className="ec-drill-sub">
              Solar Radiation Drill · Demonstration scenario · No real sensor data
            </div>
          </div>
          <button
            className="ec-drill-toggle ec-running"
            onClick={handleDrillToggle}
            aria-label="Stop drill"
          >
            Stop drill
          </button>
        </div>
      )}

      {/* ── Main Header ── */}
      <header className="ec-header">
        <div>
          <div className="ec-eyebrow">
            <span className="ec-red-dot" />
            Mission support · simulated emergency channel
          </div>
          <h1 className="ec-title">
            Emergency <em>Center</em>
          </h1>
          <p className="ec-subtitle">
            Priority response command and incident management · Expedition 07 · Demo
          </p>
        </div>

        <div className="ec-header-right">
          {/* Priority Badge */}
          <div className="ec-priority-badge">
            <Radio size={13} />
            MISSION PRIORITY · {priority}
          </div>

          {/* Priority Selector */}
          <div className="ec-priority-selector" role="group" aria-label="Priority level selector">
            {PRIORITY_LEVELS.map(lvl => (
              <button
                key={lvl}
                className={`ec-priority-btn ${priority === lvl ? 'ec-active' : ''}`}
                onClick={() => setPriority(lvl)}
                aria-pressed={priority === lvl}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Medical Profile Strip (all crew) ── */}
      <section aria-label="Crew medical profile strip">
        <div className="ec-crew-strip">
          {crewData.slice(0, 4).map(c => (
            <div className="ec-crew-card" key={c.initials}>
              <div className="ec-crew-top">
                <div className={`ec-crew-avatar ${c.color}`}>{c.initials}</div>
                <div>
                  <div className="ec-crew-name">{c.name}</div>
                  <div className="ec-crew-role">{c.role}</div>
                </div>
              </div>

              <div className="ec-crew-vitals">
                <div className="ec-crew-vital">
                  <span className="ec-vital-label">HR</span>
                  <span className="ec-vital-value">
                    {c.hr}<em> bpm</em>
                  </span>
                </div>
                <div className="ec-crew-vital">
                  <span className="ec-vital-label">SpO₂</span>
                  <span className="ec-vital-value">
                    {c.oxygen}<em>%</em>
                  </span>
                </div>
              </div>

              <div className={`ec-crew-state ${c.state === 'MONITOR' ? 'monitor' : 'nominal'}`}>
                <Heart size={8} />
                {c.state}
              </div>
            </div>
          ))}
        </div>
        <span className="ec-crew-simulated">Simulated readings · not live sensor data</span>
      </section>

      {/* ── Main Two-Column Grid ── */}
      <div className="ec-main-grid">

        {/* ── LEFT COLUMN ── */}
        <div className="ec-col-left">

          {/* Radar Panel */}
          <div className="ec-panel">
            <div className="ec-panel-head">
              <span className="ec-panel-title">Crew Radar · Status Overview</span>
              <span className="ec-panel-tag">Demo · not live</span>
            </div>
            <div className="ec-radar-wrap">
              <div className="ec-radar-canvas-box">
                <canvas
                  ref={radarCanvasRef}
                  className="ec-radar-canvas"
                  width={180}
                  height={180}
                  aria-hidden="true"
                />
              </div>
              <div className="ec-radar-legend">
                {crewData.slice(0, 4).map((c, i) => (
                  <div className="ec-radar-legend-item" key={c.initials}>
                    <span
                      className={`ec-radar-legend-dot ${c.state === 'MONITOR' ? 'ec-blip-amber' : 'ec-blip-green'}`}
                    />
                    <span>
                      <strong style={{ color: 'var(--ec-text-main)', fontSize: '10px' }}>
                        {c.initials}
                      </strong>{' '}
                      {c.state}
                    </span>
                  </div>
                ))}
                <div className="ec-radar-legend-item" style={{ marginTop: 6 }}>
                  <span className="ec-radar-legend-dot" style={{ background: 'var(--accent)' }} />
                  <span>Sweep · {drillActive ? 'DRILL' : 'STANDBY'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Incident Channel Panel */}
          <div className="ec-panel">
            <div className="ec-panel-head">
              <span className="ec-panel-title">Incident Channel</span>
              <span className="ec-panel-tag">No signal</span>
            </div>
            <div className="ec-incident-body">
              <div className="ec-shield-pulse">
                <ShieldCheck size={28} />
              </div>
              <h2 className="ec-incident-h2">No simulated incidents</h2>
              <p className="ec-incident-p">
                This prototype has no active incident feed or emergency connection.
              </p>
              <span className="ec-tag-clear"><i />Simulation clear</span>
            </div>
            <div className="ec-incident-foot">
              <span>Last demo system check</span>
              <b>09:42:16 UTC</b>
            </div>
          </div>

          {/* System Status Board */}
          <div className="ec-panel">
            <div className="ec-panel-head">
              <span className="ec-panel-title">System Status Board</span>
              <span className="ec-panel-tag">Demo values</span>
            </div>
            <div className="ec-status-board">
              {SYSTEM_STATUS.map(sys => {
                const Icon = sys.icon
                return (
                  <div className="ec-status-row" key={sys.name}>
                    <div className="ec-status-left">
                      <div className={`ec-status-icon ${sys.tone}`}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <span className="ec-status-name">{sys.name} · {sys.label}</span>
                        <span className="ec-status-time">Last check · {sys.checked}</span>
                      </div>
                    </div>
                    <span className={`ec-status-pill ${sys.tone}`}>{sys.status}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="ec-col-right">

          {/* Response Protocol Cards */}
          <div className="ec-panel">
            <div className="ec-panel-head">
              <span className="ec-panel-title">Mission Response Sequence</span>
              <span className="ec-panel-tag">Demo checklist</span>
            </div>

            <div className="ec-steps" role="list">
              {RESPONSE_STEPS.map(step => (
                <div className="ec-step-card" key={step.num} role="listitem">
                  <div className="ec-step-num">{step.num}</div>
                  <div className="ec-step-info">
                    <p className="ec-step-title">{step.title}</p>
                    <p className="ec-step-desc">{step.desc}</p>
                  </div>
                  <button
                    className="ec-step-btn"
                    aria-label={step.label}
                    onClick={() => setPage(step.page)}
                    title={step.label}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Acknowledge Button */}
            <button
              className={`ec-ack-btn ${ack ? 'ec-acked' : ''}`}
              onClick={() => setAck(a => !a)}
              aria-pressed={ack}
            >
              {ack ? (
                <><Check size={15} /> Protocol reviewed</>
              ) : (
                <>Acknowledge demo protocol <ChevronRight size={15} /></>
              )}
            </button>

            <span className="ec-safety-note">
              PROTOTYPE ONLY · Not connected to emergency services.
              Use approved mission procedures and contact the flight surgeon in real situations.
            </span>
          </div>

          {/* Solar Storm Drill Panel */}
          <div className="ec-panel">
            <div className="ec-panel-head">
              <span className="ec-panel-title">
                <Radiation size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Solar Storm Drill
              </span>
              <span className="ec-panel-tag">Training only</span>
            </div>

            <div className="ec-drill-panel-body">
              {/* Radiation counter */}
              <div className="ec-drill-counter-row">
                <div>
                  <div className="ec-drill-counter">{drillRads.toFixed(2)}</div>
                  <div className="ec-drill-counter-unit">mSv · Simulated Exposure Counter</div>
                </div>
                <button
                  className={`ec-drill-toggle ${drillActive ? 'ec-running' : ''}`}
                  onClick={handleDrillToggle}
                  aria-pressed={drillActive}
                >
                  {drillActive ? '⏹ STOP DRILL' : '▶ START DRILL'}
                </button>
              </div>

              {/* Drill checklist */}
              <div className="ec-drill-checklist" role="group" aria-label="Drill checklist">
                {DRILL_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className={`ec-drill-check-item ${drillChecked[i] ? 'ec-checked' : ''}`}
                    onClick={() => toggleDrillCheck(i)}
                    role="checkbox"
                    aria-checked={drillChecked[i]}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && toggleDrillCheck(i)}
                  >
                    <div className="ec-drill-check-box">
                      {drillChecked[i] && <Check size={10} />}
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              {/* Training note */}
              <div className="ec-drill-training-note">
                Training drill only · not a real emergency
                <br />
                No sensor data · No crew actions required · Demonstration scenario
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Communication Composer & Queued Reports ── */}
      <div className="ec-compose-section">
        <div id="emergency-report" className="ec-compose-head">
          <span className="ec-compose-title">Medical Team Communication</span>
          {reports.length > 0 && (
            <span className="ec-report-count">
              {String(reports.length).padStart(2, '0')} QUEUED DEMO REPORTS
            </span>
          )}
        </div>

        {/* CommunicationComposer — preserved from original EmergencyPage */}
        <CommunicationComposer onQueue={handleQueue} />

        {/* Queued Reports with timestamps and dismiss */}
        {reports.length > 0 && (
          <div className="ec-queued-list" aria-label="Queued demo reports" role="list">
            {reports.map((report, i) => (
              <div className="ec-queued-item" key={`${report.at}-${i}`} role="listitem">
                <div className="ec-queued-meta">
                  <span className="ec-queued-ts">
                    QUEUED FOR MEDICAL TEAM — DEMO · {new Date(report.at).toLocaleString()}
                  </span>
                  <span className="ec-queued-text">{report.text}</span>
                </div>
                <button
                  className="ec-dismiss-btn"
                  aria-label={`Dismiss report from ${new Date(report.at).toLocaleString()}`}
                  onClick={() => handleDismiss(i)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
