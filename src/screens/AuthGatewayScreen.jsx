/**
 * ORBIT HEALTH — Astronaut Authentication & Enlistment Gateway
 * NASA Space Apps Challenge Astronaut Health & Operations Platform
 *
 * Full-screen aerospace landing portal displayed prior to entering mission operations.
 * Allows astronauts to authenticate or enlist using their unique Astronaut Identification
 * Number / Badge ID and Flight Security Access PIN.
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
  Mail,
  Orbit,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import '../styles/authModals.css'

export default function AuthGatewayScreen() {
  const {
    login,
    registerAstronaut,
    switchDemoAccount,
    isDemoMode,
    isLoading: authLoading,
    error: globalError,
  } = useAuth()

  const [activeTab, setActiveTab] = useState('REGISTER') // Default to REGISTER for new users!
  const [identifier, setIdentifier] = useState('') // Astronaut ID, Badge No, or Email
  const [pin, setPin] = useState('') // Security PIN or Password
  const [fullName, setFullName] = useState('')
  const [astronautId, setAstronautId] = useState(() => `NASA-${Math.floor(100 + Math.random() * 899)}`)
  const [callsign, setCallsign] = useState('')
  const [agency, setAgency] = useState('NASA')
  const [localError, setLocalError] = useState(null)
  const [successNotice, setSuccessNotice] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setSuccessNotice(null)
    setIsSubmitting(true)

    try {
      const res = await login(identifier, pin)
      if (!res.success) {
        setLocalError(res.error || 'Authentication failed. Please verify Astronaut ID and Access PIN.')
      } else {
        setSuccessNotice('Astronaut credentials verified! Launching flight station telemetry...')
      }
    } catch (err) {
      setLocalError(err.message || 'Authentication error encountered.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    setSuccessNotice(null)
    setIsSubmitting(true)

    try {
      const res = await registerAstronaut({
        astronautId: astronautId.trim(),
        pin: pin.trim(),
        fullName: fullName.trim(),
        requestedCallsign: callsign.trim() || astronautId.trim(),
        agency,
      })

      if (!res.success) {
        setLocalError(res.error || 'Astronaut enlistment failed.')
      } else {
        setSuccessNotice(res.message || 'Flight PIN issued and verified. Launching station interface...')
      }
    } catch (err) {
      setLocalError(err.message || 'Enlistment request failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'var(--ink-0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden',
        color: 'var(--text)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      {/* Background Decorative Aerospace Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'none',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />

      {/* Subtle Orbital Glow Rings */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'transparent',
          top: '-150px',
          pointerEvents: 'none',
        }}
      />

      {/* Main Gateway Container Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'var(--ink-2)',
          border: '1px solid rgba(98,212,200,0.28)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,.35)',
          padding: '2rem 2.25rem',
          position: 'relative',
          zIndex: 10,
          animation: 'fadeIn 0.4s ease-out',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: 'rgba(98,212,200,0.24)',
              border: '1px solid rgba(98,212,200,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
            }}
          >
            <Orbit size={30} color="var(--accent)" />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: '#ffffff',
            }}
          >
            ORBIT <span style={{ color: 'var(--accent)' }}>HEALTH</span>
          </h1>
          <p
            style={{
              margin: '0.35rem 0 0',
              fontSize: '0.74rem',
              color: 'var(--text-2)',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono, monospace)',
              textTransform: 'uppercase',
            }}
          >
            Expedition 07 · Astronaut Pin & Telemetry Gateway
          </p>

          <div style={{ marginTop: '0.65rem' }}>
            <span
              className={`auth-mode-pill ${isDemoMode ? 'demo' : 'live'}`}
              style={{ display: 'inline-flex', padding: '0.25rem 0.65rem', fontSize: '0.68rem' }}
            >
              <ShieldCheck size={12} />
              {isDemoMode ? 'Offline demo simulation' : 'Live Supabase platform'}
            </span>
          </div>
        </div>

        {/* Dual Tab Switcher: Enlist (New) vs Sign In (Returning) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.35rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTER')
              setLocalError(null)
            }}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '7px',
              border: 'none',
              background:
                activeTab === 'REGISTER'
                  ? 'rgba(98,212,200,0.21)'
                  : 'transparent',
              color: activeTab === 'REGISTER' ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: activeTab === 'REGISTER' ? 700 : 500,
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              borderBottom: activeTab === 'REGISTER' ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'var(--font-mono, monospace)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <UserPlus size={15} />
            Enlist astronaut
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGIN')
              setLocalError(null)
            }}
            style={{
              padding: '0.65rem 0.75rem',
              borderRadius: '7px',
              border: 'none',
              background:
                activeTab === 'LOGIN'
                  ? 'rgba(98,212,200,0.21)'
                  : 'transparent',
              color: activeTab === 'LOGIN' ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: activeTab === 'LOGIN' ? 700 : 500,
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              borderBottom: activeTab === 'LOGIN' ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily: 'var(--font-mono, monospace)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            <LogIn size={15} />
            Returning PIN login
          </button>
        </div>

        {/* Error and Success Notices */}
        {(localError || globalError) && (
          <div
            className="auth-error-banner"
            style={{ marginBottom: '1.25rem', animation: 'fadeIn 0.2s ease' }}
          >
            <AlertTriangle size={16} />
            <span>{localError || globalError}</span>
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
              marginBottom: '1.25rem',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* VIEW 1: ASTRONAUT ENLISTMENT FORM */}
        {activeTab === 'REGISTER' ? (
          <form
            onSubmit={handleRegisterSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
          >
            <div
              style={{
                padding: '0.75rem 0.9rem',
                background: 'rgba(98,212,200,0.08)',
                border: '1px solid rgba(98,212,200,0.25)',
                borderRadius: '8px',
                fontSize: '0.76rem',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Sparkles size={16} color="var(--accent)" />
              <span>
                <strong>NASA Spaceflight Protocol:</strong> Space travelers are registered with an official
                Astronaut Badge ID & PIN. No commercial email required.
              </span>
            </div>

            <div className="auth-form-group">
              <label>Astronaut Full Name</label>
              <div className="auth-input-wrapper">
                <User size={16} />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Alex Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
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
                  <option value="NASA">NASA (USA)</option>
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

            <div className="auth-form-group">
              <label>Flight Call Sign (Optional)</label>
              <div className="auth-input-wrapper">
                <Zap size={16} />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. VALKYRIE-1 or leave blank for auto"
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label>Flight Security Access PIN (6+ characters)</label>
              <div className="auth-input-wrapper">
                <Key size={16} />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Enter 6-digit PIN or passcode"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <small style={{ fontSize: '0.68rem', color: 'var(--text-2)', marginTop: '0.25rem' }}>
                Remember your Astronaut ID and PIN to log into any orbital station terminal.
              </small>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isSubmitting || authLoading}
              style={{
                marginTop: '0.4rem',
                padding: '0.8rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              {isSubmitting || authLoading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" /> Enlisting Astronaut...
                </>
              ) : (
                <>
                  <FileText size={17} /> Enlist Astronaut & Issue Flight PIN
                </>
              )}
            </button>
          </form>
        ) : (
          /* VIEW 2: RETURNING PIN LOGIN FORM */
          <form
            onSubmit={handleLoginSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div className="auth-form-group">
              <label>Astronaut ID / Badge Number</label>
              <div className="auth-input-wrapper">
                <ShieldCheck size={16} />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. NASA-621 or ASTRO-084"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
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
                  placeholder="Enter your flight PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={isSubmitting || authLoading}
              style={{
                marginTop: '0.5rem',
                padding: '0.8rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              {isSubmitting || authLoading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" /> Authenticating PIN...
                </>
              ) : (
                <>
                  <LogIn size={17} /> Authenticate PIN & Enter Station
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Instant Evaluation Personas */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-2)',
              fontFamily: 'var(--font-mono, monospace)',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.65rem',
            }}
          >
            ⚡ Instant Station Access (One-Click Personas)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              className="auth-quick-pill"
              onClick={() => switchDemoAccount('commander')}
              style={{ padding: '0.6rem 0.5rem' }}
            >
              <strong>Elena Vasquez</strong>
              <small>Mission commander</small>
            </button>
            <button
              type="button"
              className="auth-quick-pill"
              onClick={() => switchDemoAccount('surgeon')}
              style={{ padding: '0.6rem 0.5rem' }}
            >
              <strong>Dr. Marcus Chen</strong>
              <small>Flight surgeon</small>
            </button>
          </div>
        </div>
      </div>

      {/* Footer System Notice */}
      <div
        style={{
          marginTop: '1.75rem',
          fontSize: '0.72rem',
          color: 'var(--text-2)',
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '0.04em',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        ORBIT HEALTH v0.2.0 · NASA SPACE APPS CHALLENGE · EXPEDITION 07
      </div>
    </div>
  )
}
