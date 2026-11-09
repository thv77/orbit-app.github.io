import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Droplets,
  Eye,
  HeartPulse,
  Layers,
  LockKeyhole,
  Moon,
  Orbit,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Thermometer,
  User,
  Users,
  Waves,
  Wind,
  Zap,
} from 'lucide-react'
import { HealthModules } from '../features'
import useLocalDemoState from '../useLocalDemoState'

export default function HealthMonitoringScreen({ setPage, crew = [] }) {
  const canvasRef = useRef(null)
  const [selectedCrew, setSelectedCrew] = useState('Elena Vasquez')
  const [selectedOrgan, setSelectedOrgan] = useState('Heart (Cardiovascular)')
  const [activeLayer, setActiveLayer] = useState('ALL_SYSTEMS')
  const [timeWindow, setTimeWindow] = useState('6 HOURS')

  // Find selected crew member profile
  const currentMember = useMemo(() => {
    return crew.find(c => c.name === selectedCrew) || crew[0] || {
      name: 'Elena Vasquez',
      role: 'MISSION COMMANDER',
      initials: 'EV',
      state: 'NOMINAL',
      hr: 68,
      oxygen: 98,
      sleep: '7h 42m',
      color: 'violet',
      note: 'All systems nominal',
    }
  }, [crew, selectedCrew])

  // Individual crew baseline offsets for realistic simulation
  const baselineOffset = useMemo(() => {
    if (selectedCrew === 'Dr. Marcus Chen') return 4
    if (selectedCrew === 'Amara Okafor') return -2
    if (selectedCrew === 'Luca Moretti') return 1
    return 0
  }, [selectedCrew])

  // Mount 3D Anatomical Digital Twin Engine
  useEffect(() => {
    let cancelled = false
    let cleanup
    import('../threeScenes')
      .then(({ mountTwin }) => {
        if (!cancelled && canvasRef.current) {
          cleanup = mountTwin(canvasRef.current, name => {
            if (!cancelled && name) setSelectedOrgan(name)
          })
        }
      })
      .catch(err => {
        console.warn('Digital Twin Three.js init fallback:', err)
      })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  // Layer Switcher Handler
  const handleLayerChange = layer => {
    setActiveLayer(layer)
    if (canvasRef.current?.__setLayer) {
      canvasRef.current.__setLayer(layer)
    }
  }

  // Camera Reset Focus
  const handleResetFocus = () => {
    if (canvasRef.current?.__resetFocus) {
      canvasRef.current.__resetFocus()
    }
  }

  // Detailed clinical and space physiology notes for anatomy selection
  const organDescriptions = {
    'Heart (Cardiovascular)': {
      system: 'Cardiovascular System',
      status: 'NOMINAL · RESTING SINUS RHYTHM',
      baseline: `${66 + baselineOffset} BPM (Pre-Flight Reference)`,
      current: `${68 + baselineOffset} BPM (Current Sample)`,
      variance: '+2 BPM · Within nominal limits',
      microgravityNote:
        'Cephalad fluid shift causes transient increased central venous pressure and left ventricular filling. Baroreceptor resetting is underway as expected for Mission Day 126.',
    },
    'Lungs (Pulmonary)': {
      system: 'Respiratory & Gas Exchange',
      status: 'OPTIMAL VENTILATION',
      baseline: `${selectedCrew === 'Amara Okafor' ? 99 : selectedCrew === 'Dr. Marcus Chen' ? 97 : 98}% SpO₂`,
      current: `${selectedCrew === 'Amara Okafor' ? 99 : selectedCrew === 'Dr. Marcus Chen' ? 97 : 98}% SpO₂`,
      variance: '0% · Stable gas diffusion',
      microgravityNote:
        'In microgravity, ventilation-perfusion matching is more uniform due to absent hydrostatic gravity gradients. Tidal volume stable at 500 mL.',
    },
    'Spine & Vertebrae': {
      system: 'Skeletal / Biomechanical',
      status: 'MICROGRAVITY ELONGATION DETECTED',
      baseline: 'Pre-flight height: 174.0 cm',
      current: 'In-flight estimate: 178.8 cm (+4.8 cm)',
      variance: '+4.8 cm spinal decompression',
      microgravityNote:
        'Intervertebral disc unloading and spinal curvature flattening can produce mild lower-back sensitivity. Daily ARED axial loading countermeasures required to maintain paraspinal tone.',
    },
    'Brain & Optic Nerve (SANS)': {
      system: 'Neuro-Ocular & Cranial Pressure',
      status: 'MONITORING · NO CHOROIDAL FOLDING',
      baseline: 'Optic Nerve Sheath Diameter: 5.1 mm',
      current: 'ONSD estimate: 5.4 mm (Upper reference limit)',
      variance: '+0.3 mm · SANS Protocol Check',
      microgravityNote:
        'Headward fluid shift produces sustained mild elevation in microgravity intracranial pressure. Routine ultrasound check scheduled to monitor for optic disc edema.',
    },
    'Liver & Digestion': {
      system: 'Metabolic & Hepatic',
      status: 'METABOLISM STABLE',
      baseline: `${92 + baselineOffset} mg/dL Glucose fasting`,
      current: `${94 + baselineOffset} mg/dL Glucose sample`,
      variance: '+2 mg/dL · Normal glycemic curve',
      microgravityNote:
        'Gastrointestinal motility and nutrient assimilation show slight alterations in 0g. High-protein galley intake maintained to counter muscle breakdown.',
    },
    'Left Leg (Femur BMD)': {
      system: 'Musculoskeletal / Bone Mineral Density',
      status: 'BONE TURNOVER TRACKED',
      baseline: 'Bone mineral density: 100% reference',
      current: 'Estimated retention: 98.6% (Expedition 07)',
      variance: '-1.4% turnover over 126 days',
      microgravityNote:
        'Trabecular bone in the calcaneus, tibia, and proximal femur experiences mechanical unloading. Bisphosphonate schedule and daily resistance exercise active.',
    },
    'Right Leg (Femur BMD)': {
      system: 'Musculoskeletal / Bone Mineral Density',
      status: 'BONE TURNOVER TRACKED',
      baseline: 'Bone mineral density: 100% reference',
      current: 'Estimated retention: 98.7% (Expedition 07)',
      variance: '-1.3% turnover over 126 days',
      microgravityNote:
        'Bilateral lower limb load monitoring remains aligned with Commander Vasquez target threshold.',
    },
    'Left Arm': {
      system: 'Upper Limb Musculature',
      status: 'NOMINAL · 4 SESSIONS COMPLETED',
      baseline: 'Grip strength: 42 kg',
      current: 'Grip strength: 41.5 kg',
      variance: '-0.5 kg · Preserved power',
      microgravityNote:
        'Upper limb activity remains high due to manual translational locomotion inside spacecraft modules.',
    },
    'Right Arm': {
      system: 'Upper Limb Musculature',
      status: 'NOMINAL · 4 SESSIONS COMPLETED',
      baseline: 'Grip strength: 43 kg',
      current: 'Grip strength: 42.8 kg',
      variance: '-0.2 kg · Preserved power',
      microgravityNote:
        'Fine motor coordination and precision manual dexterity nominal.',
    },
    'Head & Cranium': {
      system: 'Cranial & Facial Systems',
      status: 'CEPHALAD FLUID SHIFT VISIBLE',
      baseline: 'Facial soft tissue reference',
      current: 'Mild periorbital puffiness (Normal 0g adaptation)',
      variance: 'Fluid shift observed',
      microgravityNote:
        'Typical spaceflight cephalad venous engorgement. Symptoms generally stabilize after the first 30 mission days.',
    },
    Torso: {
      system: 'Thoracic Viscera',
      status: 'COMPOSITE THORACIC SENSORS ACTIVE',
      baseline: 'Standard biometric matrix',
      current: 'Sensor patch matrix nominal',
      variance: 'All thoracic channels active',
      microgravityNote:
        'Continuous biosensor patch monitoring heart sounds, impedance cardiography, and respiration rate.',
    },
    Pelvis: {
      system: 'Pelvic Girdle & Bone Architecture',
      status: 'BONE UNLOADING TRACKED',
      baseline: 'Pelvic bone mass reference',
      current: 'Trabecular structure stable',
      variance: 'Countermeasure compliant',
      microgravityNote:
        'Sacroiliac joint and iliac crest bone remodeling rate consistent with active mission countermeasure log.',
    },
  }

  const currentOrganInfo = organDescriptions[selectedOrgan] || {
    system: 'Physiological Region',
    status: 'OBSERVATION ACTIVE',
    baseline: 'Pre-flight reference baseline',
    current: 'Simulated current sample',
    variance: 'Consistent with mission timeline',
    microgravityNote: 'Selection reflects localized astronaut anatomical surveillance model.',
  }

  // Available selectable anatomical regions
  const selectableRegions = [
    'Heart (Cardiovascular)',
    'Lungs (Pulmonary)',
    'Spine & Vertebrae',
    'Brain & Optic Nerve (SANS)',
    'Liver & Digestion',
    'Left Leg (Femur BMD)',
    'Right Leg (Femur BMD)',
    'Left Arm',
    'Right Arm',
    'Head & Cranium',
    'Torso',
  ]

  // Trend data sets based on selected window
  const trendDataMap = {
    '1 HOUR': [64, 65, 66, 68, 67, 69, 71, 70, 68, 67, 68, 69, 68, 67, 68],
    '6 HOURS': [62, 65, 64, 70, 68, 72, 66, 69, 68, 71, 67, 68, 70, 69, 68, 67, 69, 68],
    '24 HOURS': [58, 60, 59, 68, 72, 78, 82, 75, 70, 68, 69, 74, 80, 76, 70, 65, 61, 59],
    '7 DAYS': [66, 67, 68, 67, 69, 68, 68, 69, 70, 68, 67, 68, 69, 68],
  }
  const activeTrendData = trendDataMap[timeWindow] || trendDataMap['6 HOURS']

  return (
    <div className="hm-root">
      {/* ============================================================== */}
      {/* 1. SCREEN HEADER & CREW MEMBER SELECTOR */}
      {/* ============================================================== */}
      <header className="hm-page-header">
        <div className="hm-title-block">
          <div className="hm-eyebrow">
            <Activity size={13} className="hm-icon-cyan" />
            <span>Orbit Health · clinical monitoring</span>
          </div>
          <h1>Health Monitoring</h1>
          <p>
            Astronaut physiological telemetry, high-fidelity 3D anatomical digital twin, and clinical trend surveillance.
          </p>
        </div>

        <div className="hm-header-controls">
          <label className="hm-crew-selector">
            <span className="hm-selector-label">Active astronaut subject</span>
            <div className="hm-select-wrapper">
              <select value={selectedCrew} onChange={e => setSelectedCrew(e.target.value)}>
                {crew.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.role})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="hm-select-icon" />
            </div>
          </label>
          <span className="hm-sim-badge">Simulated demonstration data</span>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. PRIMARY CLINICAL WORKSTATION: 3D DIGITAL TWIN & REAL-TIME HUD */}
      {/* ============================================================== */}
      <section className="hm-stage-section">
        {/* Left: 3D Anatomical Digital Twin Canvas & Stage */}
        <div className="hm-twin-stage">
          <div className="hm-stage-header">
            <div>
              <span className="hm-stage-eyebrow">
                Subject: {currentMember.name} · {currentMember.role}
              </span>
              <h3>3D Holographic Digital Twin</h3>
            </div>
            <div className="hm-stage-tags">
              <span className={`hm-status-tag ${currentMember.state === 'MONITOR' ? 'warn' : 'ok'}`}>
                {currentMember.state}
              </span>
              <span className="hm-status-tag cyan">3D interactive</span>
            </div>
          </div>

          {/* 3D WebGL Canvas */}
          <div className="hm-canvas-wrapper">
            <canvas ref={canvasRef} className="hm-twin-canvas" aria-label="3D Anatomical Digital Twin" />

            {/* Layer Switcher HUD Controls */}
            <div className="hm-layer-hud">
              <span className="hm-hud-label">Anatomical layer</span>
              <div className="hm-layer-buttons">
                {[
                  { id: 'ALL_SYSTEMS', label: 'COMPOSITE' },
                  { id: 'CARDIOVASCULAR', label: 'FLUID SHIFT' },
                  { id: 'SKELETAL', label: 'SKELETAL / BMD' },
                  { id: 'RESPIRATORY', label: 'RESPIRATORY' },
                  { id: 'NEURO_SANS', label: 'NEURO / SANS' },
                ].map(l => (
                  <button
                    key={l.id}
                    className={`hm-layer-btn ${activeLayer === l.id ? 'active' : ''}`}
                    onClick={() => handleLayerChange(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Viewport Reset & Drag Hints */}
            <div className="hm-canvas-overlay-footer">
              <span className="hm-drag-hint">Click region to focus · drag to orbit · wheel to zoom</span>
              <button className="hm-reset-btn" onClick={handleResetFocus} title="Reset camera view">
                <RotateCcw size={12} />
                <span>Reset focus</span>
              </button>
            </div>
          </div>

          {/* Real-time Physiological Waveform Monitors */}
          <div className="hm-waveforms-strip">
            {/* ECG Sinus Rhythm */}
            <div className="hm-wave-box">
              <div className="hm-wave-header">
                <div className="hm-wave-title">
                  <HeartPulse size={14} className="hm-wave-icon red" />
                  <span>Lead II ECG · sinus rhythm</span>
                </div>
                <strong className="hm-wave-val">{68 + baselineOffset} <small>BPM</small></strong>
              </div>
              <svg className="hm-ecg-svg" viewBox="0 0 300 40" preserveAspectRatio="none">
                <path
                  className="hm-ecg-path"
                  d="M0,20 L40,20 L45,18 L50,22 L55,20 L65,20 L70,8 L75,34 L80,14 L85,24 L90,20 L105,20 L115,14 L125,20 L160,20 L165,18 L170,22 L175,20 L185,20 L190,8 L195,34 L200,14 L205,24 L210,20 L225,20 L235,14 L245,20 L300,20"
                />
              </svg>
            </div>

            {/* SpO2 Plethysmogram */}
            <div className="hm-wave-box">
              <div className="hm-wave-header">
                <div className="hm-wave-title">
                  <Waves size={14} className="hm-wave-icon cyan" />
                  <span>SpO₂ PLETHYSMOGRAM</span>
                </div>
                <strong className="hm-wave-val">
                  {selectedCrew === 'Amara Okafor' ? 99 : selectedCrew === 'Dr. Marcus Chen' ? 97 : 98}{' '}
                  <small>%</small>
                </strong>
              </div>
              <svg className="hm-pleth-svg" viewBox="0 0 300 40" preserveAspectRatio="none">
                <path
                  className="hm-pleth-path"
                  d="M0,28 Q15,4 30,16 Q45,26 60,28 Q75,4 90,16 Q105,26 120,28 Q135,4 150,16 Q165,26 180,28 Q195,4 210,16 Q225,26 240,28 Q255,4 270,16 Q285,26 300,28"
                />
              </svg>
            </div>

            {/* Respiration Curve */}
            <div className="hm-wave-box">
              <div className="hm-wave-header">
                <div className="hm-wave-title">
                  <Wind size={14} className="hm-wave-icon teal" />
                  <span>Capnography respiration</span>
                </div>
                <strong className="hm-wave-val">14 <small>BR/MIN</small></strong>
              </div>
              <svg className="hm-resp-svg" viewBox="0 0 300 40" preserveAspectRatio="none">
                <path
                  className="hm-resp-path"
                  d="M0,25 Q35,8 70,25 Q105,32 140,25 Q175,8 210,25 Q245,32 280,25 L300,25"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Selected Anatomy Callout & Accessible Region Selector */}
        <aside className="hm-anatomy-sidebar">
          <div className="hm-anatomy-card">
            <div className="hm-card-header">
              <div>
                <span className="hm-card-eyebrow">{currentOrganInfo.system}</span>
                <h2>{selectedOrgan}</h2>
              </div>
              <span className="hm-anatomy-tag">Focused anatomy</span>
            </div>

            <div className="hm-organ-status-bar">
              <span className="hm-status-dot" />
              <span>{currentOrganInfo.status}</span>
            </div>

            {/* Comparative Baseline Matrix for this Organ */}
            <div className="hm-organ-metrics">
              <div className="hm-metric-field">
                <small>Pre-flight baseline</small>
                <strong>{currentOrganInfo.baseline}</strong>
              </div>
              <div className="hm-metric-field">
                <small>Current in-flight reading</small>
                <strong className="cyan">{currentOrganInfo.current}</strong>
              </div>
              <div className="hm-metric-field">
                <small>Physiological variance</small>
                <span>{currentOrganInfo.variance}</span>
              </div>
            </div>

            {/* Spaceflight Physiological Insight */}
            <div className="hm-space-insight">
              <div className="hm-insight-header">
                <Orbit size={14} className="hm-icon-cyan" />
                <span>Microgravity adaptation context</span>
              </div>
              <p>{currentOrganInfo.microgravityNote}</p>
            </div>

            {/* Accessible 2D Region Buttons */}
            <div className="hm-region-selector-wrap">
              <span className="hm-selector-title">Select anatomical structure</span>
              <div className="hm-region-pills">
                {selectableRegions.map(reg => (
                  <button
                    key={reg}
                    className={`hm-region-pill ${selectedOrgan === reg ? 'active' : ''}`}
                    onClick={() => setSelectedOrgan(reg)}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* ============================================================== */}
      {/* 3. VITALS SUMMARY TILES & SLEEP HISTOGRAM */}
      {/* ============================================================== */}
      <section className="hm-vitals-grid">
        {/* Heart Rate Tile */}
        <article className="hm-vital-tile cyan">
          <div className="hm-tile-top">
            <span className="hm-tile-label">Resting heart rate</span>
            <HeartPulse size={18} className="hm-tile-icon" />
          </div>
          <div className="hm-tile-value">
            {68 + baselineOffset} <small>BPM</small>
          </div>
          <div className="hm-tile-bottom">
            <span className="hm-delta good">PRE: {66 + baselineOffset} BPM (+2)</span>
            <span className="hm-telemetry-tag">Sinus rhythm</span>
          </div>
        </article>

        {/* Blood Oxygen Tile */}
        <article className="hm-vital-tile blue">
          <div className="hm-tile-top">
            <span className="hm-tile-label">Blood oxygenation</span>
            <Waves size={18} className="hm-tile-icon" />
          </div>
          <div className="hm-tile-value">
            {selectedCrew === 'Amara Okafor' ? 99 : selectedCrew === 'Dr. Marcus Chen' ? 97 : 98}{' '}
            <small>% SpO₂</small>
          </div>
          <div className="hm-tile-bottom">
            <span className="hm-delta good">Optimal perfusion</span>
            <span className="hm-telemetry-tag">Pulse ox</span>
          </div>
        </article>

        {/* Body Temperature Tile */}
        <article className="hm-vital-tile amber">
          <div className="hm-tile-top">
            <span className="hm-tile-label">Core temperature</span>
            <Thermometer size={18} className="hm-tile-icon" />
          </div>
          <div className="hm-tile-value">
            {(36.7 + baselineOffset / 10).toFixed(1)} <small>°C</small>
          </div>
          <div className="hm-tile-bottom">
            <span className="hm-delta good">Euxermic range</span>
            <span className="hm-telemetry-tag">Core sensor</span>
          </div>
        </article>

        {/* Blood Pressure Tile */}
        <article className="hm-vital-tile violet">
          <div className="hm-tile-top">
            <span className="hm-tile-label">Arterial blood pressure</span>
            <Activity size={18} className="hm-tile-icon" />
          </div>
          <div className="hm-tile-value">
            {114 + baselineOffset}/{74 + Math.round(baselineOffset / 2)} <small>mmHg</small>
          </div>
          <div className="hm-tile-bottom">
            <span className="hm-delta good">Normotensive</span>
            <span className="hm-telemetry-tag">Cuffless continuous</span>
          </div>
        </article>

        {/* Sleep & Circadian Recovery */}
        <article className="hm-vital-tile teal hm-sleep-tile">
          <div className="hm-tile-top">
            <span className="hm-tile-label">Circadian sleep score</span>
            <Moon size={18} className="hm-tile-icon" />
          </div>
          <div className="hm-sleep-readout">
            <div className="hm-tile-value">
              {currentMember.sleep}
            </div>
            <span className="hm-sleep-sub">94% Sleep Architecture Efficiency</span>
          </div>
          <div className="hm-sleep-histogram" aria-label="Simulated Sleep Phase Histogram">
            {[24, 38, 28, 55, 42, 70, 48, 80, 60, 85, 50, 72, 40, 58, 32, 52, 28, 42, 22].map((h, i) => (
              <span key={i} className="hm-sleep-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
        </article>
      </section>

      {/* ============================================================== */}
      {/* 4. LONGITUDINAL TREND SURVEILLANCE & OBSERVATION */}
      {/* ============================================================== */}
      <section className="hm-trend-section">
        <div className="hm-trend-card">
          <div className="hm-trend-header">
            <div>
              <span className="hm-trend-eyebrow">Continuous biometric stream</span>
              <h3>Longitudinal Heart Rate & Cardiovascular Stability</h3>
            </div>
            <div className="hm-window-tabs">
              {['1 HOUR', '6 HOURS', '24 HOURS', '7 DAYS'].map(w => (
                <button
                  key={w}
                  className={`hm-window-btn ${timeWindow === w ? 'active' : ''}`}
                  onClick={() => setTimeWindow(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="hm-trend-chart-area">
            <svg className="hm-sparkline-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={activeTrendData
                  .map((v, i) => `${(i / (activeTrendData.length - 1)) * 100},${100 - (v - 50) * 2.2}`)
                  .join(' ')}
                className="hm-trend-polyline"
              />
            </svg>
            <div className="hm-chart-axis">
              <span>06:00 UTC</span>
              <span>08:00 UTC</span>
              <span>10:00 UTC</span>
              <span>12:00 UTC (now)</span>
            </div>
          </div>
        </div>

        <div className="hm-interpretation-card">
          <div className="hm-interp-header">
            <ShieldCheck size={20} className="hm-icon-teal" />
            <div>
              <span className="hm-trend-eyebrow">Flight surgeon interpretation</span>
              <h3>Physiological Safety Limit Verification</h3>
            </div>
          </div>
          <p>
            Values displayed represent simulated telemetry within the astronaut’s individual reference boundaries.
            Continuous algorithms check for hemodynamic anomalies, SANS progression, and dehydration indicators without replacing certified mission medical protocol.
          </p>
          <div className="hm-interp-footer">
            <span className="hm-safety-note">Prototype concept · flight surgeon authorization required</span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. PRESERVED EXTENDED HEALTH MODULES SUITE (ALL 8 SUB-MODULES) */}
      {/* ============================================================== */}
      <div className="hm-modules-wrapper">
        <div className="hm-modules-intro">
          <div>
            <span className="hm-trend-eyebrow">Expedition 07 health subsystems</span>
            <h2>Integrated Clinical Modules</h2>
          </div>
          <span className="hm-sim-badge">All 8 subsystems active</span>
        </div>
        <HealthModules />
      </div>
    </div>
  )
}

