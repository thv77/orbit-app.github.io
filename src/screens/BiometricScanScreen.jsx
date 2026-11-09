/**
 * BiometricScanScreen.jsx
 * ORBIT HEALTH – Cinematic Biometric Scan Screen
 *
 * MEDICAL SAFETY NOTICE:
 * This screen is a visual demonstration only. No camera, sensor, or
 * biometric analysis is connected. All scan results are placeholder
 * animations. This screen does not collect, process, or transmit any
 * biometric data. AI assistance does not replace flight surgeon judgment.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  ChevronRight,
  Eye,
  Layers,
  RefreshCw,
  ScanFace,
  ShieldOff,
  Thermometer,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import useLocalDemoState from '../useLocalDemoState'
import '../styles/biometricScan.css'

/* ─── Three.js scan stage ─────────────────────────────────── */

/**
 * mountScanStage(canvas, { isScanning })
 * Renders a procedural human bust with scanning effects.
 * Returns a cleanup function and an `update(isScanning)` function.
 */
export function mountScanStage(canvas, { isScanning: initialScanning = false } = {}) {
  if (!canvas) return { cleanup: () => {}, update: () => {} }

  let renderer, animFrame, resizeObserver
  let scanningFlag = initialScanning

  /* ── state refs for animation ── */
  const state = {
    beamY: -1.2,
    beamDir: 1,
    particlePhase: 0,
    reticleAngle: 0,
    idleAngle: 0,
  }

  try {
    /* ── Renderer ── */
    const w = canvas.clientWidth  || 480
    const h = canvas.clientHeight || 380

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, w / Math.max(h, 1), 0.1, 60)
    camera.position.set(0, 0.3, 5.5)

    /* ── Lighting ── */
    const hemi  = new THREE.HemisphereLight(0x0d2233, 0x000a12, 1.2)
    scene.add(hemi)
    const key   = new THREE.DirectionalLight(0x00e5ff, 2.8)
    key.position.set(2, 3, 4)
    scene.add(key)
    const fill  = new THREE.DirectionalLight(0x00bcd4, 0.8)
    fill.position.set(-3, 1, 2)
    scene.add(fill)
    const rim   = new THREE.DirectionalLight(0xffffff, 0.6)
    rim.position.set(0, -2, -3)
    scene.add(rim)

    /* ── Shared materials ── */
    const bustMat = new THREE.MeshPhysicalMaterial({
      color: 0x093644,
      emissive: 0x011a22,
      emissiveIntensity: 0.4,
      metalness: 0.25,
      roughness: 0.45,
      transmission: 0.35,
      thickness: 1.0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      transparent: true,
      opacity: 0.88,
    })

    /* ── Head ── */
    const headGeo = new THREE.SphereGeometry(0.72, 36, 28)
    // Flatten slightly on Y to give more face-like proportions
    headGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.0, 1.15, 0.9))
    const head = new THREE.Mesh(headGeo, bustMat)
    head.position.set(0, 0.55, 0)
    scene.add(head)

    /* ── Neck ── */
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.26, 0.42, 20),
      bustMat
    )
    neck.position.set(0, -0.25, 0)
    scene.add(neck)

    /* ── Shoulders (two trapezoid-like boxes) ── */
    const shoulderMat = bustMat.clone()
    shoulderMat.opacity = 0.75
    const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.55), shoulderMat)
    shoulderL.position.set(-0.65, -0.52, 0.05)
    shoulderL.rotation.z = 0.18
    scene.add(shoulderL)
    const shoulderR = shoulderL.clone()
    shoulderR.position.set(0.65, -0.52, 0.05)
    shoulderR.rotation.z = -0.18
    scene.add(shoulderR)

    /* Chest bar */
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.44), shoulderMat)
    chest.position.set(0, -0.65, 0)
    scene.add(chest)

    /* ── Wireframe edge overlay ── */
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.06,
    })
    const wireHead = new THREE.Mesh(headGeo.clone(), wireMat)
    wireHead.position.copy(head.position)
    scene.add(wireHead)

    /* ── Scanning beam ── */
    const beamGeo = new THREE.PlaneGeometry(3.0, 0.045)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const beam = new THREE.Mesh(beamGeo, beamMat)
    beam.position.set(0, state.beamY, 0.9)
    scene.add(beam)

    /* Soft glow plane behind the beam */
    const glowGeo = new THREE.PlaneGeometry(3.0, 0.3)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const beamGlow = new THREE.Mesh(glowGeo, glowMat)
    beamGlow.position.set(0, state.beamY, 0.85)
    scene.add(beamGlow)

    /* ── Scan point particles ── */
    const PARTICLE_COUNT = 320
    const pPositions = new Float32Array(PARTICLE_COUNT * 3)
    const pColors    = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta  = Math.random() * Math.PI * 2
      const phi    = Math.random() * Math.PI
      const r      = 0.6 + Math.random() * 0.5
      pPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pPositions[i * 3 + 1] = r * Math.cos(phi) * 0.9 + 0.5
      pPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.7
      pColors[i * 3]     = 0.0
      pColors[i * 3 + 1] = 0.65 + Math.random() * 0.35
      pColors[i * 3 + 2] = 0.9 + Math.random() * 0.1
    }

    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3))
    pGeo.setAttribute('color',    new THREE.BufferAttribute(pColors,    3))

    const pMat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      sizeAttenuation: true,
      depthWrite: false,
    })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    /* ── Reticle rings (3 concentric tori) ── */
    const torusMat = (opacity) => new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity,
      wireframe: false,
      depthWrite: false,
    })

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.008, 6, 64), torusMat(0.35))
    ring1.position.set(0, 0.5, 0)
    ring1.rotation.x = Math.PI / 2
    scene.add(ring1)

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.005, 6, 64), torusMat(0.18))
    ring2.position.set(0, 0.5, 0)
    ring2.rotation.x = Math.PI / 2
    ring2.rotation.z = 0.4
    scene.add(ring2)

    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.006, 6, 64), torusMat(0.12))
    ring3.position.set(0, 0.5, 0)
    ring3.rotation.x = Math.PI / 2.5
    scene.add(ring3)

    /* ── Corner bracket decorations (LineSegments) ── */
    const bracketVerts = new Float32Array([
      // top-left
      -1.6, 1.4, 0,  -1.6, 1.0, 0,
      -1.6, 1.4, 0,  -1.2, 1.4, 0,
      // top-right
       1.6, 1.4, 0,   1.6, 1.0, 0,
       1.6, 1.4, 0,   1.2, 1.4, 0,
      // bottom-left
      -1.6,-1.0, 0,  -1.6,-0.6, 0,
      -1.6,-1.0, 0,  -1.2,-1.0, 0,
      // bottom-right
       1.6,-1.0, 0,   1.6,-0.6, 0,
       1.6,-1.0, 0,   1.2,-1.0, 0,
    ])
    const bGeo = new THREE.BufferGeometry()
    bGeo.setAttribute('position', new THREE.BufferAttribute(bracketVerts, 3))
    const bMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.45 })
    scene.add(new THREE.LineSegments(bGeo, bMat))

    /* ── Crosshair lines ── */
    const crossVerts = new Float32Array([
      -0.3, 0.5, 1.0,   0.3, 0.5, 1.0,
       0.0, 0.2, 1.0,   0.0, 0.8, 1.0,
    ])
    const crossGeo = new THREE.BufferGeometry()
    crossGeo.setAttribute('position', new THREE.BufferAttribute(crossVerts, 3))
    const crossMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.22 })
    scene.add(new THREE.LineSegments(crossGeo, crossMat))

    /* ── Animation loop ── */
    const lerp = (a, b, t) => a + (b - a) * t

    function animate(ts) {
      animFrame = requestAnimationFrame(animate)
      const t = ts * 0.001

      if (scanningFlag) {
        /* Beam sweeps */
        state.beamY += state.beamDir * 0.018
        if (state.beamY >  1.3) state.beamDir = -1
        if (state.beamY < -1.0) state.beamDir =  1
        beam.position.y      = state.beamY
        beamGlow.position.y  = state.beamY
        beamMat.opacity      = lerp(beamMat.opacity,      0.72, 0.09)
        glowMat.opacity      = lerp(glowMat.opacity,      0.09, 0.09)
        pMat.opacity         = lerp(pMat.opacity,         0.75, 0.07)
        pMat.size            = 0.03 + 0.015 * Math.sin(t * 3.5)
        ring1.rotation.z    += 0.025
        ring2.rotation.z    -= 0.016
        ring3.rotation.z    += 0.032
        head.rotation.y      = lerp(head.rotation.y,     0, 0.05)
        wireHead.rotation.y  = head.rotation.y
      } else {
        /* Idle gentle drift */
        state.idleAngle     += 0.004
        head.rotation.y      = Math.sin(state.idleAngle) * 0.18
        wireHead.rotation.y  = head.rotation.y
        beamMat.opacity      = lerp(beamMat.opacity,  0.0, 0.07)
        glowMat.opacity      = lerp(glowMat.opacity,  0.0, 0.07)
        pMat.opacity         = lerp(pMat.opacity,     0.08, 0.05)
        pMat.size            = 0.02 + 0.006 * Math.sin(t * 1.4)
        ring1.rotation.z    += 0.004
        ring2.rotation.z    -= 0.003
        ring3.rotation.z    += 0.005
      }

      /* Gentle particle drift */
      const posAttr = pGeo.getAttribute('position')
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const off  = i * 3
        const y0   = posAttr.getY(i)
        posAttr.setY(i, y0 + Math.sin(t + i * 0.3) * 0.0003)
      }
      posAttr.needsUpdate = true

      renderer.render(scene, camera)
    }
    animFrame = requestAnimationFrame(animate)

    /* ── Resize observer ── */
    resizeObserver = new ResizeObserver(() => {
      const nw = canvas.clientWidth  || 480
      const nh = canvas.clientHeight || 380
      camera.aspect = nw / Math.max(nh, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh, false)
    })
    resizeObserver.observe(canvas)

  } catch (err) {
    console.warn('[BiometricScanStage] Three.js init failed:', err)
  }

  return {
    cleanup() {
      if (animFrame)        cancelAnimationFrame(animFrame)
      if (resizeObserver)   resizeObserver.disconnect()
      if (renderer)         renderer.dispose()
    },
    update(isScanning) {
      scanningFlag = isScanning
    },
  }
}

/* ─── Scan step definitions ───────────────────────────────── */
const SCAN_STEPS = [
  {
    num: '01',
    title: 'Visual Alignment',
    desc: 'Static illustration in scan frame',
    activatesAt: 0,       // always complete (pre-scan)
    icon: Eye,
    progressDuration: null,
  },
  {
    num: '02',
    title: 'EM Field Mapping',
    desc: 'Decorative scan beam active',
    activatesAt: 800,
    icon: Zap,
    progressDuration: 1000,
  },
  {
    num: '03',
    title: 'Spectral Analysis Sim',
    desc: 'Particle field intensifies',
    activatesAt: 1800,
    icon: Layers,
    progressDuration: 1400,
  },
  {
    num: '04',
    title: 'Demonstration Complete',
    desc: 'No data generated',
    activatesAt: 3200,
    icon: Check,
    progressDuration: null,
  },
]

const VIEW_MODES = [
  { id: 'visible', label: 'VISIBLE LIGHT' },
  { id: 'thermal', label: 'THERMAL MAP'   },
  { id: 'depth',   label: 'DEPTH CONTOUR' },
]

/* ─── Main component ──────────────────────────────────────── */

/**
 * BiometricScanScreen
 * @param {{ setPage: (id: string) => void }} props
 *
 * MEDICAL SAFETY: No camera, sensor, or biometric analysis is active.
 * This screen is a visual prototype only.
 */
export default function BiometricScanScreen({ setPage }) {
  /* ── Core state ── */
  const [scanning,  setScanning]  = useState(false)
  const [compared,  setCompared]  = useState(false)
  const [viewMode,  setViewMode]  = useState('visible')
  const [stepPhase, setStepPhase] = useState(0)   // 0 = pre-scan, 1-4 during scan
  const [history,   setHistory]   = useLocalDemoState('orbit.face-scan-history', [])

  /* ── Three.js refs ── */
  const canvasRef  = useRef(null)
  const stageRef   = useRef(null)   // { cleanup, update }

  /* ── Mount Three.js scene ── */
  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    const stage = mountScanStage(canvas, { isScanning: false })
    if (!cancelled) stageRef.current = stage
    return () => {
      cancelled = true
      stage.cleanup()
      stageRef.current = null
    }
  }, [])

  /* ── Sync scanning state to Three.js ── */
  useEffect(() => {
    stageRef.current?.update(scanning)
  }, [scanning])

  /* ── Scan sequence timer ── */
  useEffect(() => {
    if (!scanning) {
      setStepPhase(0)
      return
    }

    setStepPhase(1)   // step 1 immediately (visual alignment already done)

    const timers = [
      setTimeout(() => setStepPhase(2), 800),
      setTimeout(() => setStepPhase(3), 1800),
      setTimeout(() => {
        setStepPhase(4)
        setHistory(items =>
          [
            {
              id: Date.now(),
              time: new Date().toISOString(),
              result: 'Animation completed · no biometric result generated',
            },
            ...items,
          ].slice(0, 8)
        )
        setScanning(false)
      }, 3200),
    ]

    return () => timers.forEach(clearTimeout)
  }, [scanning, setHistory])

  /* ── Button handler ── */
  const handleScanToggle = useCallback(() => {
    setScanning(s => !s)
  }, [])

  /* ── Step status helper ── */
  const stepStatus = (stepIndex) => {
    // stepIndex 0-based; stepPhase 1-based active step
    if (!scanning && stepPhase === 0) {
      return stepIndex === 0 ? 'complete' : 'idle'
    }
    if (stepIndex + 1 < stepPhase)  return 'complete'
    if (stepIndex + 1 === stepPhase) return 'active'
    return 'idle'
  }

  /* ── Signal bar class ── */
  const signalClass = scanning
    ? 'bs-signal bs-signal--active'
    : 'bs-signal bs-signal--disconnected'

  return (
    <div className="bs-page">

      {/* ── Page header ── */}
      <header className="bs-header">
        <div className="bs-header-left">
          <span className="bs-eyebrow">Orbit Health / medical systems / biometric scan</span>
          <h1 className="bs-title">
            Biometric <em>Scan</em>
          </h1>
        </div>
        <div className="bs-header-badges">
          {/* Signal strength bars (purely decorative) */}
          <div className={signalClass} aria-hidden="true" title="Decorative signal indicator">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="bs-signal-bar" />
            ))}
          </div>
          <span className="bs-badge bs-badge--off">
            <CameraOff size={11} /> CAM: not connected
          </span>
          <span className="bs-badge bs-badge--off">
            <ShieldOff size={11} /> Analysis: disabled
          </span>
          <span className="bs-badge bs-badge--demo">
            Simulated demo
          </span>
        </div>
      </header>

      {/* ── Disconnected warning banner ── */}
      <div className="bs-disconnected-bar" role="status">
        <AlertTriangle size={13} />
        <span>
          <strong>Camera: not connected · no biometric analysis ·</strong>{' '}
          No real biometric values are collected or produced. This is a visual demonstration only.
        </span>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="bs-layout">

        {/* ══ LEFT — 3D Scan Stage ══════════════════════════════ */}
        <section className="bs-stage-panel" aria-label="3D scan stage">

          {/* Top bar: status + view-mode tabs */}
          <div className="bs-stage-topbar">
            <div className="bs-stage-status">
              <span
                className={`bs-status-dot ${scanning ? 'bs-status-dot--scanning' : 'bs-status-dot--idle'}`}
                aria-hidden="true"
              />
              <span className="bs-eyebrow">
                {scanning ? 'Scan animation running' : 'Standby · no camera'}
              </span>
            </div>

            {/* Multi-spectral view mode tabs (decorative) */}
            <div className="bs-view-tabs" role="tablist" aria-label="Decorative visualization modes">
              {VIEW_MODES.map(vm => (
                <button
                  key={vm.id}
                  role="tab"
                  aria-selected={viewMode === vm.id}
                  className={`bs-view-tab${viewMode === vm.id ? ' bs-view-tab--active' : ''}`}
                  onClick={() => setViewMode(vm.id)}
                  title="Decorative visualization label — no real sensor data"
                >
                  {vm.label}
                </button>
              ))}
            </div>
          </div>

          {/* WebGL Canvas */}
          <div className="bs-canvas-wrap">
            <canvas
              ref={canvasRef}
              aria-label="3D procedural human bust scan visualization (decorative, no camera feed)"
              aria-hidden="false"
            />

            {/* Colour overlay for thermal / depth modes */}
            <div
              className={`bs-view-overlay bs-view-overlay--${viewMode}${scanning ? ' bs-scanning' : ''}`}
              aria-hidden="true"
            />

            {/* HUD corner brackets */}
            <div className="bs-hud-corner bs-hud-corner--tl" aria-hidden="true" />
            <div className="bs-hud-corner bs-hud-corner--tr" aria-hidden="true" />
            <div className="bs-hud-corner bs-hud-corner--bl" aria-hidden="true" />
            <div className="bs-hud-corner bs-hud-corner--br" aria-hidden="true" />

            {/* View mode label (shown while scanning, decorative) */}
            {scanning && (
              <div
                className={`bs-view-label bs-view-label--${viewMode} bs-scanning`}
                aria-hidden="true"
              >
                {VIEW_MODES.find(v => v.id === viewMode)?.label} · DEMO
              </div>
            )}
          </div>

          {/* Stage bottom: camera/analysis status */}
          <div className="bs-stage-bottom">
            <div className="bs-stage-bottom-left">
              <span className="bs-cam-off">
                <CameraOff size={11} />
                Camera: not connected
              </span>
              <span style={{ color: 'rgba(140,180,195,0.3)' }}>·</span>
              <span className="bs-cam-off">
                <ShieldOff size={11} />
                Biometric analysis: disabled
              </span>
            </div>
            <div className="bs-stage-bottom-right">
              <span className="bs-eyebrow">Visual prototype only</span>
            </div>
          </div>
        </section>

        {/* ══ RIGHT — Details Panel ════════════════════════════ */}
        <aside className="bs-details" aria-label="Scan sequence details">

          {/* Intro */}
          <div className="bs-details-section">
            <span className="bs-eyebrow">Visual prototype · no sensor link</span>
            <h2 className="bs-scan-heading">
              A scan sequence,<br />
              <em>without a sensor.</em>
            </h2>
            <p className="bs-scan-subtext">
              This button starts a decorative 3D animation only. It does not access
              the camera, identify a person, or measure any health value.
            </p>
          </div>

          {/* Animated 4-step sequence */}
          <div className="bs-details-section">
            <span className="bs-eyebrow" style={{ display: 'block', marginBottom: '0.65rem' }}>
              Scan sequence · animation steps
            </span>
            <div className="bs-steps">
              {SCAN_STEPS.map((step, idx) => {
                const status = stepStatus(idx)
                const StepIcon = step.icon
                return (
                  <div
                    key={step.num}
                    className={`bs-step bs-step--${status}`}
                    aria-label={`Step ${step.num}: ${step.title} — ${status}`}
                  >
                    <div className="bs-step-num">{step.num}</div>
                    <div className="bs-step-body">
                      <span className="bs-step-title">{step.title}</span>
                      <span className="bs-step-desc">{step.desc}</span>
                      {/* Progress bar fill for active step */}
                      {status === 'active' && step.progressDuration && (
                        <div className="bs-step-progress-bar">
                          <div
                            className="bs-step-progress-fill"
                            style={{ animationDuration: `${step.progressDuration}ms` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="bs-step-icon">
                      {status === 'complete' ? (
                        <Check size={14} />
                      ) : status === 'active' ? (
                        <StepIcon size={14} />
                      ) : (
                        <span style={{ width: 14, height: 14, display: 'block' }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Scan button */}
          <div className="bs-details-section">
            <button
              className={`bs-scan-btn${scanning ? ' bs-scan-btn--scanning' : ''}`}
              onClick={handleScanToggle}
              aria-label={scanning ? 'Stop decorative scan animation' : 'Start decorative scan animation'}
            >
              {scanning ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  Stop scan animation
                </>
              ) : (
                <>
                  <ScanFace size={15} />
                  Play scan animation
                </>
              )}
            </button>
          </div>

          {/* Medical safety warning */}
          <div className="bs-details-section">
            <div className="bs-warning" role="note">
              <AlertTriangle size={14} />
              <span>
                No real biometric values are collected or produced. This is a visual
                demonstration only. No camera is accessed. AI features do not replace
                the judgment of a qualified flight surgeon.
              </span>
            </div>
          </div>

          {/* Baseline comparison */}
          <div className="bs-details-section">
            <div className="bs-baseline-head">
              <span className="bs-eyebrow">Personal baseline</span>
              <button
                className="bs-text-btn"
                onClick={() => setCompared(v => !v)}
                aria-expanded={compared}
              >
                {compared ? 'Reset comparison' : 'Compare to baseline'}
                <ChevronRight size={12} />
              </button>
            </div>

            {compared && (
              <div className="bs-baseline-items" aria-live="polite">
                <div className="bs-baseline-item">
                  <span className="bs-baseline-dot bs-baseline-dot--ok" />
                  Face position — aligned
                </div>
                <div className="bs-baseline-item">
                  <span className="bs-baseline-dot bs-baseline-dot--diff" />
                  Expression — visible difference example
                </div>
                <div className="bs-baseline-item">
                  <span className="bs-baseline-dot bs-baseline-dot--nc" />
                  Skin appearance — no change marked
                </div>
              </div>
            )}

            <p className="bs-baseline-note">
              Illustrative comparison only. No camera, face analysis, or health
              inference is active.
            </p>
          </div>

          {/* Scan history */}
          {history.length > 0 && (
            <div className="bs-details-section">
              <span className="bs-history-eyebrow">
                Local scan history · animation only
              </span>
              <div className="bs-history-items" aria-live="polite">
                {history.slice(0, 3).map(item => (
                  <div key={item.id} className="bs-history-item">
                    <span className="bs-history-time">
                      {new Date(item.time).toLocaleString()}
                    </span>
                    <span className="bs-history-result">{item.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>
      </div>
    </div>
  )
}
