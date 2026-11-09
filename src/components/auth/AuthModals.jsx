/**
 * ORBIT HEALTH — Aerospace Authentication & Registration Modals
 * NASA Space Apps Challenge Astronaut Health & Operations Platform
 *
 * Implements:
 * - Commercial aerospace login modal with Supabase Auth integration.
 * - Astronaut self-registration with callsign request and quarantine warnings.
 * - Quarantined pending approval screen for applicants awaiting administrator triage.
 * - Account inspection and demo persona switcher for offline evaluation.
 */

import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Key,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Orbit,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../../styles/authModals.css'

export default function AuthModals({ isOpen, onClose, initialView = 'LOGIN' }) {
  const {
    user,
    profile,
    crewMember,
    roles,
    registrationRequest,
    isDemoMode,
    isAdmin,
    isFlightSurgeon,
    isAstronaut,
    isAuthorized,
    registrationState,
    isPendingApproval,
    isEmailUnconfirmed,
    login,
    logout,
    registerAstronaut,
    switchDemoAccount,
    refreshSession,
    isLoading,
    error: authError,
  } = useAuth()

  const [view, setView] = useState(initialView) // 'LOGIN' | 'REGISTER' | 'ACCOUNT'
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [localError, setLocalError] = useState(null)
  const [successNotice, setSuccessNotice] = useState(null)

  // Registration Form State
  const [fullName, setFullName] = useState('')
  const [astronautId, setAstronautId] = useState(() => `NASA-${Math.floor(100 + Math.random() * 899)}`)
  const [callsign, setCallsign] = useState('')
  const [agency, setAgency] = useState('NASA')
  const [requestedRole, setRequestedRole] = useState('MISSION SPECIALIST')
  const [statement, setStatement] = useState('')

  if (!isOpen) return null

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setSuccessNotice(null)

    if (!identifier || !pin) {
      setLocalError('Please enter Astronaut ID / Badge Number and Flight PIN.')
      return
    }

    const res = await login(identifier, pin)
    if (!res.success) {
      setLocalError(res.error || 'Authentication failed. Please verify credentials.')
    } else {
      if (res.simulated) {
        setSuccessNotice('Demo session initiated. Local prototype mode active.')
      }
      setTimeout(() => {
        onClose()
      }, 700)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setSuccessNotice(null)

    if (!astronautId || !pin || !fullName) {
      setLocalError('Please fill in Astronaut Badge ID, Full Name, and Flight PIN.')
      return
    }

    const res = await registerAstronaut({
      astronautId: astronautId.trim(),
      pin: pin.trim(),
      fullName: fullName.trim(),
      requestedCallsign: callsign.trim() || astronautId.trim(),
      requestedRole,
      agency,
      statementOfIntent: statement,
    })

    if (!res.success) {
      setLocalError(res.error || 'Application submission failed.')
    } else {
      setSuccessNotice(res.message)
      setTimeout(() => {
        setView('ACCOUNT')
      }, 900)
    }
  }

  const handleQuickSelect = (accountKey) => {
    switchDemoAccount(accountKey)
    setSuccessNotice(`Switched to demo persona: ${accountKey.toUpperCase()}`)
    setTimeout(() => {
      onClose()
    }, 600)
  }

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Orbit size={20} />
            </div>
            <div className="auth-brand-text">
              <h2>Orbit Health</h2>
              <span>
                {view === 'LOGIN' && 'Personnel Authentication'}
                {view === 'REGISTER' && 'Astronaut Enlistment'}
                {view === 'ACCOUNT' && 'Operational Clearance Profile'}
              </span>
            </div>
          </div>
          <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="auth-body">
          {/* Mode Pill Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className={`auth-mode-pill ${isDemoMode ? 'demo' : 'live'}`}>
              <Shield size={13} />
              {isDemoMode ? 'Prototype demo mode' : 'Live Supabase auth'}
            </span>
            {user && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', fontFamily: 'monospace' }}>
                SESSION: {user.email}
              </span>
            )}
          </div>

          {/* Prominent Auth Mode Tabs: Sign In vs Enlist as Astronaut */}
          {!user && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.3rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setView('LOGIN')
                  setLocalError(null)
                }}
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: view === 'LOGIN' ? 'rgba(98,212,200,0.18)' : 'transparent',
                  color: view === 'LOGIN' ? 'var(--accent)' : 'var(--text-2)',
                  fontWeight: view === 'LOGIN' ? 700 : 500,
                  fontSize: '0.82rem',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom: view === 'LOGIN' ? '2px solid var(--accent)' : '2px solid transparent',
                  fontFamily: 'var(--font-mono, monospace)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <LogIn size={15} />
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('REGISTER')
                  setLocalError(null)
                }}
                style={{
                  padding: '0.65rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: view === 'REGISTER' ? 'rgba(98,212,200,0.18)' : 'transparent',
                  color: view === 'REGISTER' ? 'var(--accent)' : 'var(--text-2)',
                  fontWeight: view === 'REGISTER' ? 700 : 500,
                  fontSize: '0.82rem',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom: view === 'REGISTER' ? '2px solid var(--accent)' : '2px solid transparent',
                  fontFamily: 'var(--font-mono, monospace)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <UserPlus size={15} />
                Enlist as astronaut
              </button>
            </div>
          )}

          {/* Error & Success Banners */}
          {(localError || authError) && (
            <div className="auth-error-banner">
              <AlertTriangle size={16} />
              <span>{localError || authError}</span>
            </div>
          )}

          {successNotice && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(76,195,138,0.07)',
                border: '1px solid rgba(76,195,138,0.21)',
                borderRadius: '8px',
                color: 'var(--ok)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successNotice}</span>
            </div>
          )}

          {/* VIEW: EMAIL VERIFICATION REQUIRED */}
          {user && isEmailUnconfirmed ? (
            <div className="pending-quarantine-box" style={{ borderColor: 'rgba(98,212,200,0.4)' }}>
              <div className="quarantine-icon-ring" style={{ background: 'rgba(98,212,200,0.15)', borderColor: 'var(--accent)' }}>
                <Mail size={30} color="var(--accent)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.35rem', color: 'var(--accent)', fontSize: '1.05rem' }}>
                  Verification Email Dispatched
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4 }}>
                  Your astronaut account has been provisioned. To unlock telemetry operations, please click the confirmation link sent to:
                </p>
                <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', color: 'var(--accent)', fontSize: '0.85rem' }}>
                  {user.email}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="auth-btn-primary"
                  style={{ background: 'rgba(98,212,200,0.2)', borderColor: 'rgba(98,212,200,0.4)' }}
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw size={16} /> I Have Confirmed My Email
                </button>
                <button
                  type="button"
                  className="auth-btn-primary"
                  style={{ background: 'rgba(229,96,79,0.15)', borderColor: 'rgba(229,96,79,0.35)' }}
                  onClick={() => logout()}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          ) : user && isPendingApproval ? (
            <div className="pending-quarantine-box">
              <div className="quarantine-icon-ring">
                <ShieldAlert size={30} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.35rem', color: 'var(--warn)', fontSize: '1.05rem' }}>
                  Application Quarantined
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4 }}>
                  Your astronaut self-registration has been submitted and is currently awaiting
                  administrative triage by Flight Operations.
                </p>
              </div>

              <div className="quarantine-details">
                <div>
                  <strong>Callsign requested:</strong>{' '}
                  <span style={{ color: 'var(--accent)' }}>
                    {registrationRequest?.requestedCallsign || registrationRequest?.requested_callsign || 'PENDING'}
                  </span>
                </div>
                <div>
                  <strong>Operational role:</strong>{' '}
                  <span>
                    {registrationRequest?.requestedRole || registrationRequest?.requested_role || 'ASTRONAUT CANDIDATE'}
                  </span>
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: 'var(--warn)', fontWeight: 600 }}>Pending_approval</span>
                </div>
                <div>
                  <strong>Clearance restriction:</strong>{' '}
                  <span style={{ color: 'var(--danger)' }}>Air-gapped (no telemetry access)</span>
                </div>
              </div>

              {isDemoMode && (
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-2)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    width: '100%',
                  }}
                >
                  <strong style={{ color: 'var(--warn)' }}>Demo simulation:</strong> Use the demo selector below to switch
                  to an Administrator persona to review and approve registrations.
                </div>
              )}

              {/* Demo Quick Persona Switcher in Quarantine */}
              {isDemoMode && (
                <div className="auth-quick-switch" style={{ width: '100%' }}>
                  <span className="auth-quick-title">Test Other Personas</span>
                  <div className="auth-quick-grid">
                    <button
                      type="button"
                      className="auth-quick-pill"
                      onClick={() => handleQuickSelect('admin')}
                    >
                      <strong>Flight Director</strong>
                      <small>Administrator</small>
                    </button>
                    <button
                      type="button"
                      className="auth-quick-pill"
                      onClick={() => handleQuickSelect('commander')}
                    >
                      <strong>Elena Vasquez</strong>
                      <small>Commander</small>
                    </button>
                  </div>
                </div>
              )}

              <button
                className="auth-btn-primary"
                style={{ background: 'rgba(229,96,79,0.2)', borderColor: 'rgba(229,96,79,0.4)' }}
                onClick={() => logout()}
              >
                <LogOut size={16} /> Sign Out of Candidate Account
              </button>
            </div>
          ) : user && registrationState === 'provisioning' ? (
            <div className="pending-quarantine-box" style={{ borderColor: 'rgba(224,164,60,0.4)' }}>
              <div className="quarantine-icon-ring" style={{ background: 'rgba(224,164,60,0.15)', borderColor: 'var(--warn)' }}>
                <RefreshCw size={30} color="var(--warn)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.35rem', color: 'var(--warn)', fontSize: '1.05rem' }}>
                  Personnel Dossier Provisioning
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4 }}>
                  Your account is verified. Database triggers are generating your flight dossier, callsign assignment,
                  and baseline telemetry channels.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="auth-btn-primary"
                  style={{ background: 'rgba(224,164,60,0.2)', borderColor: 'rgba(224,164,60,0.4)', color: 'var(--warn)' }}
                  onClick={async () => {
                    const res = await refreshSession()
                    if (res?.registrationState === 'active') {
                      setSuccessNotice('Personnel dossier provisioned and active!')
                    }
                  }}
                >
                  <RefreshCw size={16} /> Check Clearance Status
                </button>
                <button
                  type="button"
                  className="auth-btn-primary"
                  style={{ background: 'rgba(229,96,79,0.15)', borderColor: 'rgba(229,96,79,0.35)' }}
                  onClick={() => logout()}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          ) : user && registrationState === 'provisioning_error' ? (
            <div className="pending-quarantine-box" style={{ borderColor: 'rgba(229,96,79,0.4)' }}>
              <div className="quarantine-icon-ring" style={{ background: 'rgba(229,96,79,0.15)', borderColor: 'var(--danger)' }}>
                <AlertTriangle size={30} color="var(--danger)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.35rem', color: 'var(--danger)', fontSize: '1.05rem' }}>
                  Authorization Check Failed
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4 }}>
                  Unable to establish authoritative clearance credentials with the flight operations server.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="auth-btn-primary"
                  style={{ background: 'rgba(98,212,200,0.2)', borderColor: 'rgba(98,212,200,0.4)' }}
                  onClick={() => refreshSession()}
                >
                  <RefreshCw size={16} /> Retry Clearance Verification
                </button>
                <button
                  type="button"
                  className="auth-btn-primary"
                  style={{ background: 'rgba(229,96,79,0.15)', borderColor: 'rgba(229,96,79,0.35)' }}
                  onClick={() => logout()}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          ) : view === 'ACCOUNT' && user ? (
            /* VIEW: ACTIVE ACCOUNT PROFILE INSPECTOR */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(98,212,200,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#ffffff',
                  }}
                >
                  {crewMember?.initials || profile?.full_name?.slice(0, 2).toUpperCase() || 'OH'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
                    {crewMember?.fullName || profile?.full_name || user.email}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontFamily: 'monospace' }}>
                    {crewMember?.callsign ? `CALLSIGN: ${crewMember.callsign}` : user.email}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                    {roles.length > 0 ? (
                      roles.map((r) => (
                        <span key={r} className={`topbar-auth-role ${r}`}>
                          {r.toUpperCase()}
                        </span>
                      ))
                    ) : (
                      <span className="topbar-auth-role pending">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Demo Mode Persona Switcher */}
              {isDemoMode && (
                <div className="auth-quick-switch">
                  <span className="auth-quick-title">Switch Simulated Persona</span>
                  <div className="auth-quick-grid">
                    <button
                      type="button"
                      className={`auth-quick-pill ${crewMember?.callsign === 'VANGUARD-1' ? 'active' : ''}`}
                      onClick={() => handleQuickSelect('commander')}
                    >
                      <strong>Elena Vasquez</strong>
                      <small>Commander (astronaut)</small>
                    </button>
                    <button
                      type="button"
                      className={`auth-quick-pill ${crewMember?.callsign === 'SURGEON-1' ? 'active' : ''}`}
                      onClick={() => handleQuickSelect('surgeon')}
                    >
                      <strong>Dr. Marcus Chen</strong>
                      <small>Flight surgeon</small>
                    </button>
                    <button
                      type="button"
                      className={`auth-quick-pill ${isAdmin ? 'active' : ''}`}
                      onClick={() => handleQuickSelect('admin')}
                    >
                      <strong>Gene Kranz</strong>
                      <small>Administrator</small>
                    </button>
                    <button
                      type="button"
                      className="auth-quick-pill"
                      onClick={() => handleQuickSelect('pending')}
                    >
                      <strong>Astra Cadet</strong>
                      <small>Pending approval</small>
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="auth-btn-primary"
                  style={{
                    background: 'rgba(229,96,79,0.15)',
                    borderColor: 'rgba(229,96,79,0.35)',
                    color: 'var(--danger)',
                  }}
                  onClick={() => logout()}
                >
                  <LogOut size={16} /> Sign Out
                </button>
                <button type="button" className="auth-btn-primary" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          ) : view === 'LOGIN' ? (
            /* VIEW: PERSONNEL LOGIN */
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="auth-form-group">
                <label>Astronaut ID / Badge Number (or Email)</label>
                <div className="auth-input-wrapper">
                  <ShieldCheck size={16} />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. NASA-621 or ASTRO-084"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Flight Security Access PIN</label>
                <div className="auth-input-wrapper">
                  <Key size={16} />
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Enter flight PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                Authenticate Clearance
              </button>

              {/* Demo Mode Persona Switcher */}
              {isDemoMode && (
                <div className="auth-quick-switch">
                  <span className="auth-quick-title">Instant Prototype Personas (Offline)</span>
                  <div className="auth-quick-grid">
                    <button
                      type="button"
                      className="auth-quick-pill"
                      onClick={() => handleQuickSelect('commander')}
                    >
                      <strong>Elena Vasquez</strong>
                      <small>Commander · astronaut</small>
                    </button>
                    <button
                      type="button"
                      className="auth-quick-pill"
                      onClick={() => handleQuickSelect('surgeon')}
                    >
                      <strong>Dr. Marcus Chen</strong>
                      <small>Flight surgeon</small>
                    </button>
                    <button
                      type="button"
                      className="auth-quick-pill"
                      onClick={() => handleQuickSelect('admin')}
                    >
                      <strong>Flight Operations</strong>
                      <small>Administrator</small>
                    </button>
                    <button
                      type="button"
                      className="auth-quick-pill"
                      onClick={() => handleQuickSelect('pending')}
                    >
                      <strong>Cadet Applicant</strong>
                      <small>Pending approval</small>
                    </button>
                  </div>
                </div>
              )}

              <div className="auth-switch-links">
                <span>New astronaut applicant?</span>
                <button
                  type="button"
                  className="auth-text-btn"
                  onClick={() => {
                    setView('REGISTER')
                    setLocalError(null)
                  }}
                >
                  Submit Registration Request
                </button>
              </div>
            </form>
          ) : (
            /* VIEW: ASTRONAUT SELF-REGISTRATION */
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  background: 'rgba(98,212,200,0.08)',
                  border: '1px solid rgba(98,212,200,0.25)',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--text)',
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: 'var(--accent)' }}>NASA Spaceflight Protocol:</strong> Space travelers
                are assigned an official Astronaut Badge ID & Security PIN. Open enlistment automatically provisions
                your flight dossier and telemetry channels without requiring commercial email.
              </div>

              <div className="auth-form-group">
                <label>Astronaut Full Legal Name</label>
                <div className="auth-input-wrapper">
                  <User size={16} />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Candidate Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="auth-form-group">
                  <label>Space Agency</label>
                  <select
                    className="auth-select"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                  >
                    <option value="NASA">NASA (United States)</option>
                    <option value="ESA">ESA (Europe)</option>
                    <option value="JAXA">JAXA (Japan)</option>
                    <option value="CSA">CSA (Canada)</option>
                  </select>
                </div>

                <div className="auth-form-group">
                  <label>Astronaut Badge / ID No.</label>
                  <div className="auth-input-wrapper">
                    <ShieldCheck size={16} />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. NASA-621"
                      value={astronautId}
                      onChange={(e) => setAstronautId(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="auth-form-group">
                  <label>Requested Callsign</label>
                  <div className="auth-input-wrapper">
                    <Zap size={16} />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. NOVA-1"
                      value={callsign}
                      onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label>Operational Role</label>
                  <select
                    className="auth-select"
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                  >
                    <option value="MISSION SPECIALIST">Mission specialist</option>
                    <option value="FLIGHT ENGINEER">Flight engineer</option>
                    <option value="PAYLOAD SPECIALIST">Payload specialist</option>
                    <option value="SCIENCE OFFICER">Science officer</option>
                  </select>
                </div>
              </div>

              <div className="auth-form-group">
                <label>Flight Security Access PIN (6+ characters)</label>
                <div className="auth-input-wrapper">
                  <Key size={16} />
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label>Statement of Intent (Optional)</label>
                <textarea
                  className="auth-textarea"
                  placeholder="State your flight readiness, mission assignment context, or expedition specialization..."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                />
              </div>

              <button type="submit" className="auth-btn-primary" disabled={isLoading}>
                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
                Enlist Astronaut & Issue Flight PIN
              </button>

              <div className="auth-switch-links">
                <span>Already registered?</span>
                <button
                  type="button"
                  className="auth-text-btn"
                  onClick={() => {
                    setView('LOGIN')
                    setLocalError(null)
                  }}
                >
                  Sign In to Station
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

