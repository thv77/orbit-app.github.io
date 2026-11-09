import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Award,
  Check,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Moon,
  Orbit,
  Radio,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Timer,
  User,
  Users,
  Waves,
  Zap,
} from 'lucide-react'
import { mountAstronautHelmet } from '../three/astronautScene'

export default function CrewStatusScreen({ setPage, crew = [] }) {
  const helmetCanvasRef = useRef(null)
  const [selectedCrew, setSelectedCrew] = useState('Elena Vasquez')
  const [medicalAccess, setMedicalAccess] = useState(true) // true = Flight Surgeon Full View; false = Public Restricted View
  const [filterState, setFilterState] = useState('ALL')

  const crewColors = {
    'Elena Vasquez': 0x8b5cf6,
    'Dr. Marcus Chen': 0x3b82f6,
    'Amara Okafor': 0xf59e0b,
    'Luca Moretti': 0x14b8a6,
  }

  // Mount 3D Astronaut EVA Helmet Canvas
  useEffect(() => {
    let cancelled = false
    let cleanup
    if (helmetCanvasRef.current) {
      cleanup = mountAstronautHelmet(helmetCanvasRef.current, crewColors[selectedCrew] || 0x8b5cf6)
    }
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [selectedCrew])

  // Detailed operational astronaut profiles
  const crewProfiles = {
    'Elena Vasquez': {
      callsign: 'VANGUARD-1',
      assignment: 'NASA / Expedition 07 Commander',
      flightTime: '342 Days in Space (2nd Long-Duration Mission)',
      evaTime: '24h 15m (3 EVAs)',
      radiation: '1.20 mSv (Cumulative Mission)',
      exerciseAdherence: '98%',
      medicalNotes:
        'Resting cardiac parameters stable at 68 BPM. Baroreceptor resetting nominal. Normal microgravity cephalad fluid adaptation with mild facial fullness. Sleep architecture efficiency 94%.',
      psychNotes: 'Leadership indices strong. Reports steady morale and positive crew communication.',
      confidentialDetails: 'Blood Pressure: 114/74 mmHg · Core Temp: 36.8°C · Hemoglobin A1c: 5.2% · ONSD: 5.1 mm',
    },
    'Dr. Marcus Chen': {
      callsign: 'SURGEON-1',
      assignment: 'NASA / Flight Surgeon & Science Officer',
      flightTime: '126 Days in Space (1st Mission)',
      evaTime: '7h 10m (1 EVA)',
      radiation: '1.24 mSv (Cumulative Mission)',
      exerciseAdherence: '92%',
      medicalNotes:
        'Elevated workload flag active. Multiple consecutive high-intensity robotic arm and EVA procedures. Resting heart rate 82 BPM (+4 BPM from baseline). Sleep deficit noted (-1.2h).',
      psychNotes: 'Cognitive acuity high, but self-reported fatigue 4/10. Recommended 45-min recovery rest buffer.',
      confidentialDetails: 'Blood Pressure: 118/76 mmHg · Core Temp: 37.1°C · Hemoglobin A1c: 5.4% · ONSD: 5.3 mm',
    },
    'Amara Okafor': {
      callsign: 'HORIZON-1',
      assignment: 'ESA / Mission Specialist & Lead Botanist',
      flightTime: '126 Days in Space (1st Mission)',
      evaTime: '14h 30m (2 EVAs)',
      radiation: '1.18 mSv (Cumulative Mission)',
      exerciseAdherence: '100%',
      medicalNotes:
        'Cardiovascular and pulmonary efficiency optimal (SpO₂ 99%, Resting HR 71 BPM). Daily ARED resistance exercise fully compliant. Calcaneal bone density ultrasound scheduled.',
      psychNotes: 'Morale positive. Excellent sleep continuity (8h 05m).',
      confidentialDetails: 'Blood Pressure: 110/70 mmHg · Core Temp: 36.6°C · Hemoglobin A1c: 5.0% · ONSD: 4.9 mm',
    },
    'Luca Moretti': {
      callsign: 'ENGINEER-1',
      assignment: 'ESA / Flight Engineer & Systems Specialist',
      flightTime: '210 Days in Space (2nd Mission)',
      evaTime: '18h 45m (2 EVAs)',
      radiation: '1.19 mSv (Cumulative Mission)',
      exerciseAdherence: '96%',
      medicalNotes:
        'Resting heart rate 64 BPM, SpO₂ 98%. Completed routine ECLSS atmosphere scrubber maintenance. Paraspinal muscle tone intact. Grip strength 42.8 kg.',
      psychNotes: 'Consistent high focus. Personal baseline variance minimal.',
      confidentialDetails: 'Blood Pressure: 112/72 mmHg · Core Temp: 36.7°C · Hemoglobin A1c: 5.1% · ONSD: 5.0 mm',
    },
  }

  const activeProfile = crewProfiles[selectedCrew] || crewProfiles['Elena Vasquez']
  const activeMember = crew.find(c => c.name === selectedCrew) || crew[0]

  // Filtered crew list
  const filteredCrew = crew.filter(c => {
    if (filterState === 'NOMINAL') return c.state === 'NOMINAL'
    if (filterState === 'MONITOR') return c.state === 'MONITOR'
    return true
  })

  return (
    <div className="cs-root">
      {/* ============================================================== */}
      {/* 1. CREW STATUS HEADER & MANIFEST OVERVIEW */}
      {/* ============================================================== */}
      <header className="cs-header">
        <div className="cs-title-block">
          <div className="cs-eyebrow">
            <Users size={13} className="cs-icon-cyan" />
            <span>Expedition 07 · flight crew dossiers</span>
          </div>
          <h1>Crew Status & Readiness</h1>
          <p>
            Astronaut operational readiness, individualized baseline profiles, and medical privacy authorization matrix.
          </p>
        </div>

        <div className="cs-header-stats">
          <div className="cs-stat-box">
            <small>Crew on board</small>
            <strong>{String(crew.length).padStart(2, '0')} <span>Astronauts</span></strong>
          </div>
          <div className="cs-stat-box">
            <small>Mission readiness</small>
            <strong className="good">3 Nominal / 1 monitor</strong>
          </div>
          <span className="cs-sim-tag">Simulated crew dossiers</span>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. ROLE-BASED PRIVACY ACCESS CONSOLE */}
      {/* ============================================================== */}
      <section className="cs-privacy-banner">
        <div className="cs-privacy-info">
          <div className="cs-privacy-icon">
            {medicalAccess ? <ShieldCheck size={22} className="cs-icon-teal" /> : <LockKeyhole size={22} className="cs-icon-amber" />}
          </div>
          <div>
            <div className="cs-privacy-title">
              <strong>MEDICAL TEAM ACCESS: {medicalAccess ? 'Authorized (full clinical dossier)' : 'Restricted (flight deck redacted view)'}</strong>
            </div>
            <p>
              {medicalAccess
                ? 'Flight Surgeon clearance authenticated. Full physiological biometrics, psychological logs, and confidential clinical notes are accessible.'
                : 'Public flight deck view active. Confidential medical records and psychiatric notes are masked to protect crew health privacy.'}
            </p>
          </div>
        </div>

        <div className="cs-privacy-action">
          <button
            className="cs-toggle-access-btn"
            style={{ background: 'rgba(229,96,79,0.15)', borderColor: 'rgba(229,96,79,0.35)', color: 'var(--danger)' }}
            onClick={() => setPage('admin-crew')}
            aria-label="Open Admin Operations Console"
          >
            <ShieldCheck size={14} />
            <span>Admin crew operations</span>
          </button>
          <button
            className={`cs-toggle-access-btn ${medicalAccess ? 'auth' : 'restr'}`}
            onClick={() => setMedicalAccess(v => !v)}
            aria-label="Toggle role-based medical access"
          >
            {medicalAccess ? (
              <>
                <EyeOff size={14} />
                <span>Restrict access (mask private data)</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>Authenticate flight surgeon access</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. PRIMARY CREW DOSSIER WORKSTATION */}
      {/* ============================================================== */}
      <section className="cs-dossier-layout">
        {/* Left: Astronaut Selector & Readiness List */}
        <aside className="cs-roster-sidebar">
          <div className="cs-sidebar-head">
            <span className="cs-eyebrow">MISSION ROSTER ({String(crew.length).padStart(2, '0')})</span>
            <div className="cs-filter-pills">
              {['ALL', 'NOMINAL', 'MONITOR'].map(f => (
                <button
                  key={f}
                  className={`cs-filter-pill ${filterState === f ? 'active' : ''}`}
                  onClick={() => setFilterState(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="cs-roster-list">
            {filteredCrew.map(c => (
              <div
                key={c.name}
                className={`cs-roster-card ${selectedCrew === c.name ? 'active' : ''} ${c.state === 'MONITOR' ? 'monitor' : 'nominal'}`}
                onClick={() => setSelectedCrew(c.name)}
              >
                <div className={`cs-avatar ${c.color}`}>{c.initials}</div>
                <div className="cs-roster-meta">
                  <strong>{c.name}</strong>
                  <small>{c.role}</small>
                </div>
                <div className="cs-roster-indicators">
                  <span className={`cs-status-tag ${c.state === 'MONITOR' ? 'warn' : 'ok'}`}>{c.state}</span>
                  <div className="cs-roster-hr">
                    <span>{c.hr} <small>BPM</small></span>
                    <span>{c.oxygen}<small>%</small></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right: Detailed Astronaut Medical Dossier */}
        <main className="cs-dossier-detail">
          <div className="cs-detail-hero">
            <div className={`cs-hero-badge ${activeMember.color}`}>
              <span>{activeMember.initials}</span>
            </div>
            <div className="cs-hero-info">
              <div className="cs-hero-callsign">
                <span className="cs-tag-callsign">{activeProfile.callsign}</span>
                <span className={`cs-status-pill ${activeMember.state === 'MONITOR' ? 'warn' : 'ok'}`}>
                  {activeMember.state} READINESS
                </span>
              </div>
              <h2>{activeMember.name}</h2>
              <span className="cs-hero-assignment">{activeProfile.assignment}</span>
            </div>

            <div className="cs-helmet-preview">
              <canvas ref={helmetCanvasRef} className="cs-helmet-canvas" aria-label="3D Astronaut EVA Space Helmet & Suit Display" />
              <span className="cs-helmet-hint">Drag to rotate 3D suit</span>
            </div>

            <div className="cs-hero-action">
              <button className="cs-btn-inspect-twin" onClick={() => setPage('health')}>
                <Activity size={15} />
                <span>Inspect 3D digital twin</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Operational Metrics Bar */}
          <div className="cs-operational-metrics">
            <div className="cs-op-item">
              <small>Cumulative flight time</small>
              <strong>{activeProfile.flightTime}</strong>
            </div>
            <div className="cs-op-item">
              <small>EVA spacewalk duration</small>
              <strong>{activeProfile.evaTime}</strong>
            </div>
            <div className="cs-op-item">
              <small>Space radiation dose</small>
              <strong>{activeProfile.radiation}</strong>
            </div>
            <div className="cs-op-item">
              <small>Exercise countermeasures</small>
              <strong className="teal">{activeProfile.exerciseAdherence} ADHERENCE</strong>
            </div>
          </div>

          {/* Real-time Physiological Telemetry Row */}
          <div className="cs-vitals-row">
            <div className="cs-vital-item cyan">
              <HeartPulse size={16} />
              <div>
                <small>Heart rate</small>
                <strong>{activeMember.hr} <abbr>BPM</abbr></strong>
              </div>
              <span className="cs-sub-metric">Resting sinus</span>
            </div>

            <div className="cs-vital-item blue">
              <Waves size={16} />
              <div>
                <small>PULSE SpO₂</small>
                <strong>{activeMember.oxygen} <abbr>%</abbr></strong>
              </div>
              <span className="cs-sub-metric">Arterial perfusion</span>
            </div>

            <div className="cs-vital-item teal">
              <Moon size={16} />
              <div>
                <small>Circadian sleep</small>
                <strong>{activeMember.sleep}</strong>
              </div>
              <span className="cs-sub-metric">94% Efficiency</span>
            </div>
          </div>

          {/* Clinical Surveillance Notes */}
          <div className="cs-clinical-notes-card">
            <div className="cs-notes-header">
              <Stethoscope size={16} className="cs-icon-cyan" />
              <div>
                <span className="cs-eyebrow">Clinical observation log</span>
                <h3>Physiological Space Adaptation Status</h3>
              </div>
            </div>
            <p className="cs-notes-text">{activeProfile.medicalNotes}</p>
          </div>

          {/* Confidential Psychological & Laboratory Records (With Privacy Redaction Mask) */}
          <div className={`cs-confidential-card ${!medicalAccess ? 'redacted' : ''}`}>
            <div className="cs-confidential-header">
              <div className="cs-conf-title">
                {medicalAccess ? <ShieldCheck size={16} className="cs-icon-teal" /> : <LockKeyhole size={16} className="cs-icon-amber" />}
                <span>Confidential behavioral & biomarker logs</span>
              </div>
              <span className="cs-conf-tag">
                {medicalAccess ? 'Unrestricted clinical access' : 'Confidential · redacted'}
              </span>
            </div>

            {medicalAccess ? (
              <div className="cs-conf-body">
                <div className="cs-conf-section">
                  <small>Behavioral & psychological wellness (local log)</small>
                  <p>{activeProfile.psychNotes}</p>
                </div>
                <div className="cs-conf-section">
                  <small>Advanced biomarker matrix (simulated sample)</small>
                  <code>{activeProfile.confidentialDetails}</code>
                </div>
              </div>
            ) : (
              <div className="cs-redacted-overlay">
                <LockKeyhole size={28} className="cs-icon-amber" />
                <strong>Confidential clinical record redacted</strong>
                <p>
                  Health data privacy controls active. Detailed behavioral assessments and lab values require Flight Surgeon authentication.
                </p>
                <button className="cs-btn-unlock" onClick={() => setMedicalAccess(true)}>
                  Authenticate clearance
                </button>
              </div>
            )}
          </div>
        </main>
      </section>
    </div>
  )
}
