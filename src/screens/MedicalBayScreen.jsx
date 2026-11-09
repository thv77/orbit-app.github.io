import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BatteryCharging,
  Box,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Crosshair,
  FileText,
  KeyRound,
  LockKeyhole,
  Microscope,
  Pill,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Thermometer,
  Timer,
  Wind,
  X,
  Zap,
} from 'lucide-react'
import { DeliveryConcept } from '../features'
import { mountMedEquipment } from '../three/medEquipmentScene'

export default function MedicalBayScreen() {
  const equipCanvasRef = useRef(null)
  const [activeTab, setActiveTab] = useState('inventory')
  const [checkProgress, setCheckProgress] = useState(null) // null = idle; 0-100 = running
  const [checkResult, setCheckResult] = useState(null)

  // Mount 3D Medical Equipment Canvas
  useEffect(() => {
    let cancelled = false
    let cleanup
    if (equipCanvasRef.current) {
      cleanup = mountMedEquipment(equipCanvasRef.current)
    }
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  // Medication Administration Workflow Simulation (Strictly Non-Operational Concept)
  const [dualKeyAuth, setDualKeyAuth] = useState({ commander: false, surgeon: false })
  const [dispensePreview, setDispensePreview] = useState(false)

  // Equipment Inventory Manifest
  const inventoryItems = [
    {
      id: 'eq-1',
      name: 'Portable Diagnostic Ultrasound (Butterfly iQ+)',
      type: 'Diagnostic Imaging',
      category: 'DIAGNOSTICS',
      qty: '02 UNITS',
      status: 'READY',
      battery: '98%',
      calibration: 'CALIBRATED · EXP 2027',
      location: 'LOCKER M-01 · RACK 3',
    },
    {
      id: 'eq-2',
      name: 'Continuous Multi-Lead ECG Sensor Patches',
      type: 'Electrophysiology',
      category: 'MONITORING',
      qty: '12 PACKS',
      status: 'READY',
      battery: 'PASSIVE STERILE',
      calibration: 'STERILITY VALID · EXP 2028',
      location: 'LOCKER M-02 · SHELF A',
    },
    {
      id: 'eq-3',
      name: 'Emergency High-Flow O₂ Resuscitation Kit',
      type: 'Life Support & Resuscitation',
      category: 'CRITICAL',
      qty: '02 UNITS',
      status: 'CHECK',
      battery: '2,400 PSI CYLINDER',
      calibration: 'PRESSURE INSPECTION DUE IN 48H',
      location: 'AIRLOCK DEPLOYMENT STATION',
    },
    {
      id: 'eq-4',
      name: 'Crew Medical Restraint System (CMRS)',
      type: 'Patient Stabilization',
      category: 'TRAUMA',
      qty: '01 UNIT',
      status: 'READY',
      battery: 'MECHANICAL TETHER',
      calibration: 'STRUCTURAL INTEGRITY 100%',
      location: 'MODULE 03 CEILING TRACK',
    },
    {
      id: 'eq-5',
      name: 'Microgravity Sterile Surgical & Suture Pack',
      type: 'Wound Management',
      category: 'SUPPLIES',
      qty: '08 KITS',
      status: 'READY',
      battery: 'SEALED VACUUM',
      calibration: 'GAMMA STERILIZED · EXP 2028',
      location: 'LOCKER M-03 · DRAWER 2',
    },
    {
      id: 'eq-6',
      name: 'i-STAT Portable Blood Gas & Electrolyte Analyzer',
      type: 'Biomarker Point-of-Care',
      category: 'LABORATORY',
      qty: '04 CARTRIDGES',
      status: 'READY',
      battery: '94%',
      calibration: 'OPTICAL SENSORS PASS',
      location: 'CLINICAL BENCHTOP HUB',
    },
  ]

  // Care Records Data
  const careRecords = [
    {
      time: '09:42 UTC',
      patient: 'Commander Elena Vasquez',
      procedure: 'Routine Flight Vitals & Optic Nerve Sheath Scan',
      officer: 'Dr. Marcus Chen (Flight Surgeon)',
      outcome: 'NOMINAL · ONSD 5.1 mm, no signs of optic disc edema.',
    },
    {
      time: '08:55 UTC',
      patient: 'Amara Okafor',
      procedure: 'ARED Microgravity Exercise Protocol Review',
      officer: 'Self-Reported & Verified',
      outcome: 'COMPLETED · 30-min resistance routine logged at target load.',
    },
    {
      time: 'Yesterday 16:30',
      patient: 'Dr. Marcus Chen',
      procedure: 'Workload & Cognitive Fatigue Self-Assessment',
      officer: 'Flight Surgeon Protocol',
      outcome: 'ELEVATED WORKLOAD FLAG · Recommended sleep extension buffer.',
    },
    {
      time: '06 Nov 14:15',
      patient: 'Luca Moretti',
      procedure: 'Trace Contaminant & Airway Irritant Check',
      officer: 'Dr. Marcus Chen (Flight Surgeon)',
      outcome: 'NOMINAL · SpO₂ 98%, clear vesicular breath sounds bilateral.',
    },
  ]

  // Care Schedule Data
  const careSchedule = [
    {
      time: '14:00 UTC (Today)',
      event: 'Daily Telemedicine Handover with Houston CAPCOM Medical',
      attendees: 'All Crew & Ground Flight Surgeon',
      priority: 'ROUTINE',
    },
    {
      time: '16:30 UTC (Today)',
      event: 'Sleep Architecture Review & Circadian Lighting Check',
      attendees: 'Dr. Marcus Chen',
      priority: 'OBSERVATION',
    },
    {
      time: 'Tomorrow 09:00 UTC',
      event: 'Monthly Calcaneal & Lumbar Ultrasound Bone Density Check',
      attendees: 'Commander Elena Vasquez',
      priority: 'SCHEDULED',
    },
    {
      time: '10 Nov 11:30 UTC',
      event: 'Medical Bay Equipment Seal & O₂ Pressure Audit',
      attendees: 'Luca Moretti (Systems Engineer)',
      priority: 'AUDIT',
    },
  ]

  // Run Automated 3-Step Equipment Diagnostic Self-Test
  const runEquipmentCheck = () => {
    if (checkProgress !== null) return
    setCheckProgress(10)
    setCheckResult(null)

    const timer1 = setTimeout(() => setCheckProgress(40), 700)
    const timer2 = setTimeout(() => setCheckProgress(75), 1500)
    const timer3 = setTimeout(() => {
      setCheckProgress(100)
      setCheckResult('ALL 6 CLINICAL INSTRUMENTS VERIFIED · 5 NOMINAL, 1 INSPECTION SCHEDULED')
      setTimeout(() => setCheckProgress(null), 1200)
    }, 2400)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }

  return (
    <div className="mb-root">
      {/* ============================================================== */}
      {/* 1. CLINICAL OPERATIONS HEADER & CABIN TELEMETRY */}
      {/* ============================================================== */}
      <header className="mb-header">
        <div className="mb-title-block">
          <div className="mb-eyebrow">
            <Stethoscope size={13} className="mb-icon-cyan" />
            <span>Module 03 · clinical laboratory & treatment station</span>
          </div>
          <h1>Medical Bay Operations</h1>
          <p>
            Autonomous spaceflight medical bay logistics, clinical instrumentation diagnostics, and telemedicine handovers.
          </p>
        </div>

        <div className="mb-header-stats">
          <div className="mb-stat-box">
            <small>Clinical readiness</small>
            <strong className="good">98.4<span>%</span></strong>
          </div>
          <div className="mb-stat-box">
            <small>Sterile work surface</small>
            <strong className="cyan">ISO class 5</strong>
          </div>
          <span className="mb-sim-tag">Simulated clinical environment</span>
        </div>
      </header>

      {/* Sterile Bay Atmospheric Telemetry Strip */}
      <div className="mb-telemetry-strip">
        <div className="mb-telem-item">
          <Wind size={14} className="mb-icon-teal" />
          <div>
            <small>Laminar air flow</small>
            <strong>0.45 m/s · HEPA Active</strong>
          </div>
        </div>
        <div className="mb-telem-item">
          <Activity size={14} className="mb-icon-cyan" />
          <div>
            <small>Cabin pressure</small>
            <strong>101.3 kPa · Sea Level Eq</strong>
          </div>
        </div>
        <div className="mb-telem-item">
          <Thermometer size={14} className="mb-icon-amber" />
          <div>
            <small>Bay temperature</small>
            <strong>21.8 °C · Stable</strong>
          </div>
        </div>
        <div className="mb-telem-item">
          <ShieldCheck size={14} className="mb-icon-teal" />
          <div>
            <small>Sterilization status</small>
            <strong>UV-C cycle compliant</strong>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. AUTOMATED DIAGNOSTIC SELF-TEST SUITE */}
      {/* ============================================================== */}
      <section className="mb-diagnostic-suite">
        <div className="mb-diag-info">
          <div className="mb-diag-icon">
            <Microscope size={22} className="mb-icon-cyan" />
          </div>
          <div>
            <span className="mb-eyebrow">Hardware inspection & calibration</span>
            <strong>Automated Clinical Instrument Diagnostic Routine</strong>
            <p>
              Runs transducer acoustic pulse check, telemetry sensor impedance calibration, and emergency life support O₂ seal integrity test.
            </p>
          </div>
        </div>

        <div className="mb-equip-3d-box">
          <canvas ref={equipCanvasRef} className="mb-equip-canvas" aria-label="3D Diagnostic Ultrasound Scanner & Docking Hub" />
          <span className="mb-equip-hint">Drag to rotate 3D ultrasound probe</span>
        </div>

        <div className="mb-diag-action">
          <button
            className={`mb-btn-run-check ${checkProgress !== null ? 'running' : ''}`}
            onClick={runEquipmentCheck}
            disabled={checkProgress !== null}
          >
            {checkProgress !== null ? (
              <>
                <Timer size={14} className="mb-spin" />
                <span>CALIBRATING INSTRUMENTS ({checkProgress}%)...</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                <span>Run instrument self-test</span>
              </>
            )}
          </button>
        </div>
      </section>

      {checkResult && (
        <div className="mb-result-banner" role="status">
          <Check size={16} className="mb-icon-teal" />
          <span>{checkResult}</span>
          <button onClick={() => setCheckResult(null)} aria-label="Dismiss banner">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CLINICAL TABS WORKSTATION */}
      {/* ============================================================== */}
      <div className="mb-tabs-nav" role="tablist" aria-label="Medical Bay Management Sections">
        {[
          { id: 'inventory', label: 'Equipment Inventory & Diagnostic Hub', icon: Box },
          { id: 'records', label: 'Clinical Care Records & Logs', icon: ClipboardList },
          { id: 'schedule', label: 'Crew Care & Telemedicine Schedule', icon: Calendar },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={`mb-tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: EQUIPMENT INVENTORY */}
      {activeTab === 'inventory' && (
        <section className="mb-tab-content">
          <div className="mb-inventory-grid">
            {inventoryItems.map(item => (
              <article key={item.id} className={`mb-inv-card ${item.status === 'CHECK' ? 'check-needed' : ''}`}>
                <div className="mb-inv-head">
                  <span className="mb-inv-cat">{item.category}</span>
                  <span className={`mb-status-pill ${item.status === 'CHECK' ? 'warn' : 'ok'}`}>
                    {item.status === 'CHECK' ? 'Inspection due' : 'Ready · calibrated'}
                  </span>
                </div>

                <div className="mb-inv-title">
                  <h3>{item.name}</h3>
                  <small>{item.type}</small>
                </div>

                <div className="mb-inv-specs">
                  <div>
                    <small>Quantity on board</small>
                    <strong>{item.qty}</strong>
                  </div>
                  <div>
                    <small>Power / status</small>
                    <strong>{item.battery}</strong>
                  </div>
                </div>

                <div className="mb-inv-foot">
                  <span className="mb-calib-note">{item.calibration}</span>
                  <span className="mb-loc-tag">{item.location}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: CLINICAL CARE RECORDS */}
      {activeTab === 'records' && (
        <section className="mb-tab-content">
          <div className="mb-records-list">
            {careRecords.map((rec, idx) => (
              <div key={idx} className="mb-record-item">
                <div className="mb-record-time">
                  <Timer size={13} className="mb-icon-cyan" />
                  <strong>{rec.time}</strong>
                </div>
                <div className="mb-record-body">
                  <div className="mb-record-title-row">
                    <h4>{rec.procedure}</h4>
                    <span className="mb-patient-tag">{rec.patient}</span>
                  </div>
                  <p>{rec.outcome}</p>
                  <small className="mb-record-signoff">Validated by: {rec.officer}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: CARE & TELEMEDICINE SCHEDULE */}
      {activeTab === 'schedule' && (
        <section className="mb-tab-content">
          <div className="mb-schedule-list">
            {careSchedule.map((sched, idx) => (
              <div key={idx} className="mb-schedule-item">
                <div className="mb-sched-badge">
                  <Calendar size={15} className="mb-icon-teal" />
                  <span>{sched.priority}</span>
                </div>
                <div className="mb-sched-details">
                  <h4>{sched.event}</h4>
                  <p>Participants: {sched.attendees}</p>
                </div>
                <div className="mb-sched-time">
                  <strong>{sched.time}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 4. MEDICATION PROTOCOL WORKFLOW & SAFETY CONCEPT */}
      {/* ============================================================== */}
      <section className="mb-delivery-section">
        <div className="mb-delivery-banner">
          <div className="mb-delivery-header">
            <div className="mb-deliv-badge">
              <LockKeyhole size={16} className="mb-icon-amber" />
              <span>Telemedicine medication workflow concept</span>
            </div>
            <h3>Dual-Authorization Medication Administration Protocol</h3>
          </div>

          <p className="mb-deliv-desc">
            Spaceflight medical protocols require dual-key cryptographic authorization (Astronaut Commander + Houston Flight Surgeon) before any clinical dispensation or injector device can be unlocked.
          </p>

          <div className="mb-auth-flow">
            <div className={`mb-key-pod ${dualKeyAuth.commander ? 'authenticated' : ''}`}>
              <div className="mb-key-status">
                <KeyRound size={15} />
                <span>Key 01: commander authorization</span>
              </div>
              <strong>{dualKeyAuth.commander ? 'Authorized · signed' : 'Awaiting commander confirmation'}</strong>
              <button
                className="mb-btn-auth-commander"
                onClick={() => setDualKeyAuth(p => ({ ...p, commander: !p.commander }))}
              >
                {dualKeyAuth.commander ? 'Revoke signature' : 'Sign authorization'}
              </button>
            </div>

            <div className={`mb-key-pod ${dualKeyAuth.surgeon ? 'authenticated' : ''}`}>
              <div className="mb-key-status">
                <KeyRound size={15} />
                <span>Key 02: flight surgeon remote uplink</span>
              </div>
              <strong>{dualKeyAuth.surgeon ? 'CAPCOM medical sign-off' : 'Awaiting ground surgeon uplink'}</strong>
              <button
                className="mb-btn-auth-surgeon"
                onClick={() => setDualKeyAuth(p => ({ ...p, surgeon: !p.surgeon }))}
              >
                {dualKeyAuth.surgeon ? 'Revoke ground key' : 'Simulate ground sign-off'}
              </button>
            </div>
          </div>

          <div className="mb-dispense-status">
            <div className="mb-dispense-state">
              <small>Device lock status</small>
              <strong className={dualKeyAuth.commander && dualKeyAuth.surgeon ? 'unlocked' : 'locked'}>
                {dualKeyAuth.commander && dualKeyAuth.surgeon ? 'Protocol unlocked · ready for review' : 'Hardware interlock locked'}
              </strong>
            </div>

            <button
              className="mb-btn-preview"
              disabled={!(dualKeyAuth.commander && dualKeyAuth.surgeon)}
              onClick={() => setDispensePreview(v => !v)}
            >
              {dispensePreview ? 'Close protocol preview' : 'Preview dispense workflow'}
            </button>
          </div>

          {dispensePreview && (
            <div className="mb-preview-panel">
              <AlertTriangle size={16} className="mb-icon-amber" />
              <div>
                <strong>Simulated workflow preview only</strong>
                <p>
                  No autonomous injector, pump, or medication dispenser exists. Real administration is performed manually following strict flight surgeon voice-loop protocols.
                </p>
              </div>
            </div>
          )}

          <div className="mb-safety-guardrail">
            <ShieldCheck size={13} />
            <span>Strict safety requirement: no autonomous medication injection or drug delivery is implemented</span>
          </div>
        </div>

        {/* Existing Preserved Component from features.jsx */}
        <DeliveryConcept />
      </section>
    </div>
  )
}
