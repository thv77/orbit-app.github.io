/**
 * OrbitAIScreen.jsx
 * Cinematic ORBIT AI holographic interface for ORBIT HEALTH.
 *
 * MEDICAL SAFETY: All messages are scripted demonstration responses.
 * No real medical diagnosis, real sensor data, or autonomous medication
 * delivery is performed. This assistant cannot replace a flight surgeon.
 *
 * @param {Function} setPage  - Navigation callback from App.jsx
 * @param {Array}    crew     - Crew roster passed from App.jsx
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  ChevronRight,
  ClipboardList,
  FileText,
  Orbit,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from 'lucide-react'
import useLocalDemoState from '../useLocalDemoState'
import '../styles/orbitAI.css'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_MESSAGE = {
  from: 'ai',
  text:
    "Good day, Commander. I'm ORBIT, a scripted mission health assistant. " +
    'I can demonstrate how wellness trends or a medical handover might be summarized. ' +
    'All responses are pre-written and do not reflect real medical data or diagnosis.',
  at: new Date().toISOString(),
}

const MODES = [
  {
    id: 'medical',
    label: 'Medical Summary',
    colorClass: 'active',
    icon: Stethoscope,
    chips: [
      'Summarize crew wellness',
      'Explain demo alerts',
      'What do sample readings indicate?',
    ],
    prefill: "Summarize crew wellness for today's shift",
  },
  {
    id: 'wellness',
    label: 'Crew Wellness',
    colorClass: 'active teal-mode',
    icon: Activity,
    chips: [
      'Show routine wellness overview',
      'Review exercise and sleep data',
      'Compare crew sample baselines',
    ],
    prefill: 'Show a routine wellness overview for the crew',
  },
  {
    id: 'handover',
    label: 'Handover Prep',
    colorClass: 'active violet-mode',
    icon: ClipboardList,
    chips: [
      'Prepare a sample handover',
      'Draft a crew health summary',
      'List items for the flight surgeon',
    ],
    prefill: 'Prepare a sample handover document for the next shift',
  },
]

// ---------------------------------------------------------------------------
// Scripted AI answer (keyword matching, identical logic to original AIPage)
// ---------------------------------------------------------------------------
function getScriptedAnswer(question) {
  const q = question.toLowerCase()
  if (q.includes('summary') || q.includes('handover') || q.includes('report') || q.includes('draft')) {
    return (
      '[DEMO HANDOVER] Sample readings: heart rate 68 bpm, SpO₂ 98%, temperature 36.8 °C. ' +
      'All values are simulated. Present this document to the flight surgeon for review — ' +
      'this assistant cannot triage or recommend treatment.'
    )
  }
  if (q.includes('routine') || q.includes('exercise') || q.includes('sleep') || q.includes('water') || q.includes('wellness') || q.includes('baseline')) {
    return (
      'Routine demonstration: follow mission-approved exercise, hydration, rest, and nutrition ' +
      'schedules. Confirm individual care plans with the flight surgeon. ' +
      'This demo cannot approve medical routines or modify prescribed protocols.'
    )
  }
  if (q.includes('oxygen') || q.includes('heart') || q.includes('glucose') || q.includes('reading') || q.includes('indicate') || q.includes('alert')) {
    return (
      'Sample reading context: this is fictional interface data. Compare it with the ' +
      "astronaut's personal baseline and clinical safety limits, then ask the flight surgeon " +
      'to interpret any concerns. No diagnosis or medical inference is provided by this demo.'
    )
  }
  return (
    'I can demonstrate sample-reading explanations, routine reminders, and medical-team ' +
    'summary concepts. All values and replies are scripted. ' +
    'For any health concern, contact the flight surgeon immediately.'
  )
}

// ---------------------------------------------------------------------------
// Three.js Orb Scene
// ---------------------------------------------------------------------------

/**
 * mountOrbitAIOrb — attaches a Three.js WebGL scene to `canvas`.
 * Returns a cleanup function. `isThinkingRef` is a React ref whose `.current`
 * value is read every animation frame to adjust orb speed/brightness.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ isThinkingRef: React.MutableRefObject<boolean> }} opts
 * @returns {Function} cleanup
 */
export function mountOrbitAIOrb(canvas, { isThinkingRef }) {
  if (!canvas) return () => {}

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100)
  camera.position.set(0, 0, 3.5)

  // ── Outer wireframe sphere ──────────────────────────────────────────────
  const outerGeo = new THREE.IcosahedronGeometry(1.3, 2)
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0x48d7f4,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  })
  const outerSphere = new THREE.Mesh(outerGeo, outerMat)
  scene.add(outerSphere)

  // ── Inner plasma core ───────────────────────────────────────────────────
  const coreGeo = new THREE.SphereGeometry(0.5, 48, 48)
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x48d7f4,
    emissive: new THREE.Color(0x48d7f4),
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.92,
    roughness: 0.2,
    metalness: 0.6,
  })
  const core = new THREE.Mesh(coreGeo, coreMat)
  scene.add(core)

  // Subtle inner glow layer
  const glowGeo = new THREE.SphereGeometry(0.62, 32, 32)
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x48d7f4,
    transparent: true,
    opacity: 0.09,
    side: THREE.FrontSide,
  })
  const glowMesh = new THREE.Mesh(glowGeo, glowMat)
  scene.add(glowMesh)

  // ── Orbital rings ───────────────────────────────────────────────────────
  function makeRing(innerR, outerR, color, rx, ry, rz) {
    const geo = new THREE.TorusGeometry((innerR + outerR) / 2, (outerR - innerR) / 2, 4, 96)
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.set(rx, ry, rz)
    return mesh
  }

  const ring1 = makeRing(0.85, 0.92, 0x48d7f4, Math.PI / 2, 0, 0.3)          // cyan, near-horizontal
  const ring2 = makeRing(1.05, 1.11, 0x4ce3bd, 0.4, Math.PI / 5, Math.PI / 4) // teal, tilted
  const ring3 = makeRing(1.22, 1.27, 0x8b5cf6, 0.1, 0.6, Math.PI / 3)         // violet, steeply angled
  scene.add(ring1, ring2, ring3)

  // ── Particle cloud ──────────────────────────────────────────────────────
  const PARTICLE_COUNT = 300
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    const r     = 1.0 + Math.random() * 0.65
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0x48d7f4,
    size: 0.028,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  })
  const particles = new THREE.Points(particleGeo, particleMat)
  scene.add(particles)

  // ── Lighting ────────────────────────────────────────────────────────────
  const ambientLight = new THREE.AmbientLight(0x0a1a2a, 2)
  const pointLight1  = new THREE.PointLight(0x48d7f4, 4, 8)
  const pointLight2  = new THREE.PointLight(0x8b5cf6, 2.5, 8)
  pointLight1.position.set(2, 2, 2)
  pointLight2.position.set(-2, -1, -2)
  scene.add(ambientLight, pointLight1, pointLight2)

  // ── Color cycle state ───────────────────────────────────────────────────
  // Cycle: cyan → teal → violet → cyan
  const colorStops = [
    new THREE.Color(0x48d7f4),  // cyan
    new THREE.Color(0x4ce3bd),  // teal
    new THREE.Color(0x8b5cf6),  // violet
  ]
  const tempColor = new THREE.Color()

  // ── Resize handler ──────────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
      renderer.setSize(w, h, false)
    }
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  // ── Animation loop ──────────────────────────────────────────────────────
  let rafId
  let t = 0

  function animate() {
    rafId = requestAnimationFrame(animate)
    const thinking = isThinkingRef.current
    const speed    = thinking ? 3.2 : 1.0
    t += 0.016 * speed

    // Outer sphere slow rotation
    outerSphere.rotation.y += 0.0015 * speed
    outerSphere.rotation.x += 0.0007 * speed

    // Core: emissive color cycle
    const cycleT   = (Math.sin(t * 0.4) + 1) / 2            // 0..1
    const segment  = cycleT * colorStops.length
    const segIdx   = Math.floor(segment) % colorStops.length
    const segNext  = (segIdx + 1) % colorStops.length
    const segAlpha = segment - Math.floor(segment)
    tempColor.lerpColors(colorStops[segIdx], colorStops[segNext], segAlpha)
    coreMat.emissive.copy(tempColor)
    coreMat.color.copy(tempColor)
    glowMat.color.copy(tempColor)

    // Core pulse intensity
    const baseIntensity  = thinking ? 2.6 : 1.4
    const pulseAmp       = thinking ? 0.9 : 0.35
    coreMat.emissiveIntensity = baseIntensity + Math.sin(t * (thinking ? 5 : 2)) * pulseAmp

    // Core gentle scale breathe
    const breathe = 1 + Math.sin(t * 1.5) * 0.03
    core.scale.setScalar(breathe)
    glowMesh.scale.setScalar(breathe)

    // Rings at different speeds and axes
    ring1.rotation.z += 0.004 * speed
    ring1.rotation.y += 0.001 * speed

    ring2.rotation.x += 0.003 * speed
    ring2.rotation.z -= 0.002 * speed

    ring3.rotation.y += 0.005 * speed
    ring3.rotation.x -= 0.002 * speed

    // Particles slow orbit
    particles.rotation.y += 0.0008 * speed
    particles.rotation.x += 0.0004 * speed

    // Update point light color to match core
    pointLight1.color.copy(tempColor)

    renderer.render(scene, camera)
  }

  animate()

  // ── Cleanup ─────────────────────────────────────────────────────────────
  return () => {
    cancelAnimationFrame(rafId)
    resizeObserver.disconnect()
    // Dispose geometries + materials
    ;[outerGeo, coreGeo, glowGeo, ring1.geometry, ring2.geometry, ring3.geometry, particleGeo]
      .forEach(g => g.dispose())
    ;[outerMat, coreMat, glowMat, ring1.material, ring2.material, ring3.material, particleMat]
      .forEach(m => m.dispose())
    renderer.dispose()
  }
}

// ---------------------------------------------------------------------------
// Message component with expand/collapse for long AI messages
// ---------------------------------------------------------------------------
function ChatMessage({ msg, index }) {
  const isAI  = msg.from === 'ai'
  const LONG  = 180
  const isLong = isAI && msg.text.length > LONG
  const [expanded, setExpanded] = useState(!isLong)

  return (
    <div className={`oa-message ${msg.from}`} key={`${msg.at}-${index}`}>
      <div className={`oa-avatar ${isAI ? 'ai-avatar' : 'user-avatar'}`}>
        {isAI ? <Orbit size={15} /> : 'EV'}
      </div>
      <div className="oa-bubble-wrap">
        <div className="oa-bubble-meta">
          <span>{isAI ? 'Orbit AI · scripted' : 'You · commander'}</span>
          {msg.at && (
            <time>
              {new Date(msg.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>
          )}
        </div>
        <div className={`oa-bubble ${isAI ? 'ai-bubble' : 'user-bubble'} ${isLong && !expanded ? 'collapsed' : ''}`}>
          <p>{msg.text}</p>
        </div>
        {isLong && (
          <button className="oa-expand-btn" onClick={() => setExpanded(v => !v)}>
            {expanded ? (
              <><X size={9} /> Collapse</>
            ) : (
              <><ChevronRight size={9} /> Read more</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function OrbitAIScreen({ setPage, crew = [] }) {
  // Persistent conversation
  const [messages, setMessages] = useLocalDemoState('orbit.ai-conversation', [INITIAL_MESSAGE])
  const [value, setValue]       = useState('')
  const [thinking, setThinking] = useState(false)
  const [activeMode, setActiveMode] = useState('medical')

  // Live clock (seconds)
  const [clockStr, setClockStr] = useState('')

  // Refs
  const thinkingTimer  = useRef(null)
  const isThinkingRef  = useRef(false)   // read by Three.js animation loop
  const canvasRef      = useRef(null)
  const messagesEndRef = useRef(null)
  const cleanupOrbRef  = useRef(null)

  // Keep the ref in sync
  useEffect(() => { isThinkingRef.current = thinking }, [thinking])

  // Live clock — update every second for mission context display
  useEffect(() => {
    function tick() {
      setClockStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Three.js orb
  useEffect(() => {
    if (!canvasRef.current) return
    const cleanup = mountOrbitAIOrb(canvasRef.current, { isThinkingRef })
    cleanupOrbRef.current = cleanup
    return cleanup
  }, []) // mount once; isThinkingRef is read by ref so no dep needed

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(thinkingTimer.current), [])

  // Send message
  const send = useCallback(() => {
    if (!value.trim() || thinking) return
    const q = value.trim()
    setMessages(m => [...m, { from: 'user', text: q, at: new Date().toISOString() }])
    setValue('')
    setThinking(true)
    thinkingTimer.current = setTimeout(() => {
      setMessages(m => [...m, { from: 'ai', text: getScriptedAnswer(q), at: new Date().toISOString() }])
      setThinking(false)
    }, 650)
  }, [value, thinking, setMessages])

  // Clear conversation
  const clearConversation = useCallback(() => {
    clearTimeout(thinkingTimer.current)
    setThinking(false)
    setMessages([{ ...INITIAL_MESSAGE, at: new Date().toISOString() }])
    setValue('')
  }, [setMessages])

  // Current mode data
  const mode = MODES.find(m => m.id === activeMode) || MODES[0]

  // Mission context stats
  const nominalCount = crew.filter(c => c.state === 'NOMINAL').length || 3
  const totalCrew    = crew.length || 4

  return (
    <div className="oa-root">
      {/* Scan-line overlay */}
      <div className="oa-scanlines" aria-hidden="true" />

      {/* ── Header bar ────────────────────────────────────────────────── */}
      <header className="oa-header">
        <div className="oa-header-left">
          <BrainCircuit size={18} color="var(--ai-cyan)" />
          <div>
            <div className="oa-header-eyebrow">Orbit Health / AI assistant</div>
            <div className="oa-header-title">Orbit AI · scripted demo</div>
          </div>
          <div className="oa-header-divider" />
          <div className="oa-signal-badge">
            <span className={`oa-signal-dot ${thinking ? 'thinking' : ''}`} />
            {thinking ? 'Generating response' : 'Standby · no real data'}
          </div>
        </div>

        <div className="oa-header-right">
          <button
            className="oa-clear-btn"
            onClick={clearConversation}
            title="Reset conversation to initial state"
            aria-label="Clear conversation"
          >
            <RotateCcw size={11} />
            Clear session
          </button>
        </div>
      </header>

      {/* ── Two-column body ────────────────────────────────────────────── */}
      <div className="oa-body">

        {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
        <aside className="oa-left">

          {/* WebGL Orb */}
          <div className="oa-orb-stage">
            <div className="oa-orb-canvas-wrap">
              <div className={`oa-orb-halo ${thinking ? 'thinking' : ''}`} aria-hidden="true" />
              <canvas
                ref={canvasRef}
                className="oa-orb-canvas"
                aria-label="ORBIT AI holographic orb visualization"
              />
            </div>
          </div>

          {/* Identity block */}
          <div className="oa-identity">
            <div className="oa-identity-eyebrow">Onboard assistant / simulation</div>
            <div className="oa-identity-name">
              {thinking ? (
                <>Processing<br /><em>sample data.</em></>
              ) : (
                <>Listen to the<br /><em>quiet signals.</em></>
              )}
            </div>
            <p className="oa-identity-tagline">
              Explore wellness summaries and handover concepts.
              All responses are pre-written scripts.
            </p>
            <div className={`oa-identity-state ${thinking ? 'thinking' : ''}`}>
              <span
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: thinking ? 'var(--ai-violet)' : 'var(--ai-teal)',
                  boxShadow: thinking
                    ? '0 0 8px var(--ai-violet-glow)'
                    : '0 0 8px var(--ai-teal-glow)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              {thinking ? 'Thinking · scripted demo' : 'Ready · demo only'}
            </div>
          </div>

          {/* Capability list */}
          <div className="oa-capabilities">
            <div className="oa-cap-label">Capabilities</div>
            {[
              { icon: Activity,     label: 'Trend summaries (scripted)' },
              { icon: ClipboardList,label: 'Medical handover drafts' },
              { icon: Sparkles,     label: 'Scripted Q&A responses' },
              { icon: FileText,     label: 'Wellness overview concepts' },
            ].map(({ icon: Icon, label }) => (
              <div className="oa-cap-item" key={label}>
                <Icon size={13} />
                {label}
              </div>
            ))}
          </div>

          {/* Mission context grid */}
          <div className="oa-mission-context">
            <div className="oa-mc-head">
              <span>Mission Context</span>
              <span>Demo values</span>
            </div>
            <div className="oa-mc-grid">
              <div className="oa-mc-cell">
                <span className="oa-mc-cell-label">Crew Nominal</span>
                <span className="oa-mc-cell-value teal">
                  {nominalCount} / {totalCrew}
                </span>
              </div>
              <div className="oa-mc-cell">
                <span className="oa-mc-cell-label">Mission Day</span>
                <span className="oa-mc-cell-value amber">126</span>
              </div>
              <div className="oa-mc-cell">
                <span className="oa-mc-cell-label">Med Bay</span>
                <span className="oa-mc-cell-value cyan">98% RDY</span>
              </div>
              <div className="oa-mc-cell">
                <span className="oa-mc-cell-label">AI Check</span>
                <span className="oa-mc-cell-value" style={{ fontSize: 10 }}>
                  {clockStr}
                </span>
              </div>
            </div>
          </div>

          {/* AI mode switcher */}
          <div className="oa-mode-switcher">
            <span className="oa-mode-label">AI Mode</span>
            <div className="oa-mode-buttons">
              {MODES.map(m => {
                const Icon = m.icon
                return (
                  <button
                    key={m.id}
                    className={`oa-mode-btn ${activeMode === m.id ? m.colorClass : ''}`}
                    onClick={() => {
                      setActiveMode(m.id)
                      setValue(m.prefill)
                    }}
                    aria-pressed={activeMode === m.id}
                  >
                    <Icon size={12} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

        </aside>

        {/* ── RIGHT PANEL — CHAT ──────────────────────────────────────── */}
        <section className="oa-right">

          {/* Chat header */}
          <div className="oa-chat-head">
            <div className="oa-chat-head-left">
              <Orbit size={15} color="var(--ai-cyan)" />
              <div>
                <div className="oa-chat-status-label">
                  <strong>Orbit Assistant</strong>
                </div>
                <div className="oa-chat-status-sub">
                  {thinking ? 'GENERATING SCRIPTED RESPONSE…' : 'OFFLINE PROTOTYPE · NO LIVE DATA'}
                </div>
              </div>
            </div>
            <div className="oa-chat-encrypted">
              <ShieldCheck size={12} />
              No real medical data
            </div>
          </div>

          {/* Messages scroll area */}
          <div className="oa-messages" aria-live="polite" aria-label="Conversation with ORBIT AI">
            {messages.map((msg, i) => (
              <ChatMessage key={`${msg.at || i}-${i}`} msg={msg} index={i} />
            ))}

            {/* Typing indicator */}
            {thinking && (
              <div className="oa-typing" role="status" aria-label="ORBIT AI is composing a response">
                <div className="oa-avatar ai-avatar">
                  <Orbit size={15} />
                </div>
                <div>
                  <div className="oa-bubble-meta">
                    <span>Orbit AI · demo response</span>
                  </div>
                  <div className="oa-typing-bubble">
                    <span className="oa-typing-dot" />
                    <span className="oa-typing-dot" />
                    <span className="oa-typing-dot" />
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion chips — always visible below messages */}
            <div className="oa-chips">
              {mode.chips.map(chip => (
                <button
                  key={chip}
                  className="oa-chip"
                  disabled={thinking}
                  onClick={() => setValue(chip)}
                  aria-label={`Use suggestion: ${chip}`}
                >
                  {chip}
                  <ChevronRight size={11} />
                </button>
              ))}
            </div>

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Compose bar */}
          <div className="oa-compose">
            <input
              className="oa-compose-input"
              type="text"
              aria-label="Message ORBIT AI demo assistant"
              placeholder="Ask ORBIT to demonstrate a summary…"
              value={value}
              disabled={thinking}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button
              className="oa-send-btn"
              disabled={thinking || !value.trim()}
              onClick={send}
              aria-label="Send demo message"
            >
              <ArrowUpRight size={18} />
            </button>
          </div>

          {/* Safety disclaimer — REQUIRED, do not remove */}
          <div className="oa-disclaimer" role="note">
            <strong>Scripted demonstration</strong>
            {' · '}NOT MEDICAL ADVICE OR DIAGNOSIS
            {' · '}TRANSCRIPT STORED LOCALLY
            {' · '}THIS AI DOES NOT REPLACE A FLIGHT SURGEON
          </div>

        </section>
      </div>
    </div>
  )
}
