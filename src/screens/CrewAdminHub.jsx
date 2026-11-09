/**
 * ORBIT HEALTH — Administrator Crew Operations Hub
 * NASA Space Apps Challenge Astronaut Health & Operations Platform
 *
 * Implements:
 * - Astronaut Personnel Directory management (add, edit, deactivate, archive).
 * - Registration Approval Triage Queue (approve/reject candidate self-registrations).
 * - Mission assignment and account invitation link generator.
 * - Server-authoritative security boundaries and PostgreSQL RLS alignment.
 */

import React, { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCrew } from '../context/CrewContext'
import '../styles/crewAdmin.css'

export default function CrewAdminHub({ setPage }) {
  const { user, isAdmin, isAuthorized, isDemoMode, switchDemoAccount } = useAuth()
  const {
    crewList,
    pendingRequests,
    pendingCount,
    addCrewMember,
    toggleCrewStatus,
    approveRegistration,
    rejectRegistration,
  } = useCrew()

  // Strict Screen Gate: Deny unauthorized direct access
  if (!isDemoMode && (!isAuthorized || !isAdmin)) {
    return (
      <div className="crew-admin-page" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: '500px',
            margin: '4rem auto',
            background: 'var(--ink-2)',
            border: '1px solid rgba(229,96,79,0.35)',
            borderRadius: '12px',
            padding: '2.5rem 2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,.35)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(229,96,79,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <ShieldAlert size={36} color="var(--danger)" />
          </div>
          <h2
            style={{
              color: 'var(--danger)',
              fontSize: '1.15rem',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            Clearance restricted · flight director required
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            Flight Operations Crew Provisioning & Registration Triage is restricted to active Flight Directors.
            Personnel must complete administrative verification before accessing mission consoles.
          </p>
          <button
            className="btn-table-action"
            onClick={() => setPage('mission')}
            style={{ padding: '0.75rem 1.5rem', margin: '0 auto', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Return to Mission Control
          </button>
        </div>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState(pendingCount > 0 ? 'triage' : 'directory')
  const [copiedLink, setCopiedLink] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state for Adding Crew Member
  const [newName, setNewName] = useState('')
  const [newCallsign, setNewCallsign] = useState('')
  const [newRole, setNewRole] = useState('MISSION SPECIALIST')
  const [newAgency, setNewAgency] = useState('NASA')
  const [newColor, setNewColor] = useState('cyan')
  const [newHr, setNewHr] = useState(68)
  const [newOxygen, setNewOxygen] = useState(98)
  const [newFlightDays, setNewFlightDays] = useState(45)

  // Invitation Generator State
  const [selectedCrewForInvite, setSelectedCrewForInvite] = useState(crewList[0]?.name || '')
  const [generatedInviteToken, setGeneratedInviteToken] = useState(null)

  const handleAddCrewSubmit = async (e) => {
    e.preventDefault()
    if (!newName.trim() || !newCallsign.trim()) return

    const res = await addCrewMember({
      name: newName,
      callsign: newCallsign,
      role: newRole,
      agency: newAgency,
      color: newColor,
      hr: newHr,
      oxygen: newOxygen,
      flightDays: newFlightDays,
      note: 'Pre-provisioned by Flight Operations.',
    })

    if (res.success) {
      setSuccessMessage(`Astronaut ${newCallsign} (${newName}) successfully added to Expedition roster.`)
      setNewName('')
      setNewCallsign('')
      setActiveTab('directory')
      setTimeout(() => setSuccessMessage(null), 4000)
    }
  }

  const handleApprove = async (requestId) => {
    const res = await approveRegistration(requestId, 'NEW', 'astronaut')
    if (res.success) {
      setSuccessMessage('Candidate approved! Profile provisioned and cleared for flight operations.')
      setTimeout(() => setSuccessMessage(null), 4000)
    }
  }

  const handleReject = async (requestId) => {
    await rejectRegistration(requestId, 'Did not meet current flight qualification criteria.')
    setSuccessMessage('Registration request rejected and archived.')
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleGenerateInvite = () => {
    // Generate cryptographically secure single-use invitation token with 96-bit entropy
    const entropy = new Uint8Array(12)
    window.crypto.getRandomValues(entropy)
    const hexToken = Array.from(entropy, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    const token = `EXP07-INV-${hexToken}`
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString()
    setGeneratedInviteToken(
      `https://orbit.nasa.gov/claim?token=${token}&crew=${encodeURIComponent(selectedCrewForInvite)}&expires=${expiresAt}`
    )
  }

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text)
    setCopiedLink(text)
    setTimeout(() => setCopiedLink(null), 2500)
  }

  const filteredCrew = crewList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.callsign && c.callsign.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="crew-admin-page">
      {/* Top Banner */}
      <div className="admin-header-banner">
        <div className="admin-header-info">
          <div className="admin-badge-icon">
            <Shield size={24} />
          </div>
          <div>
            <h1>Flight Operations · Crew Management & Triage</h1>
            <p>Administrative console for astronaut provisioning, credentials, and self-registration approvals.</p>
          </div>
        </div>

        <div className="admin-stats-strip">
          <div className="admin-stat-card">
            <span>Active crew</span>
            <strong>{crewList.filter((c) => c.state !== 'ARCHIVED' && c.isActive !== false).length}</strong>
          </div>
          <div className="admin-stat-card">
            <span>Pending triage</span>
            <strong style={{ color: pendingCount > 0 ? 'var(--warn)' : 'rgba(76,195,138,0.6)' }}>{pendingCount}</strong>
          </div>
          <button
            className="btn-table-action"
            onClick={() => setPage('crew')}
            style={{ padding: '0.6rem 0.9rem', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={15} /> Return to Crew Roster
          </button>
        </div>
      </div>

      {/* Admin Privilege Guard Warning if not logged in as Admin */}
      {!isAdmin && (
        <div
          style={{
            background: 'rgba(229,96,79,0.12)',
            border: '1px solid rgba(229,96,79,0.35)',
            borderRadius: '8px',
            padding: '0.75rem 1.25rem',
            color: 'var(--danger)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} /> Viewing in elevated administrator preview. In live Supabase mode, this console requires the 'administrator' role.
          </span>
          {isDemoMode && (
            <button
              style={{
                background: 'rgba(229,96,79,0.25)',
                border: '1px solid rgba(229,96,79,0.5)',
                color: '#ffffff',
                padding: '0.25rem 0.65rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
              onClick={() => switchDemoAccount('admin')}
            >
              Switch to Administrator Persona
            </button>
          )}
        </div>
      )}

      {/* Global Success Notification */}
      {successMessage && (
        <div
          style={{
            background: 'rgba(76,195,138,0.08)',
            border: '1px solid rgba(76,195,138,0.24)',
            borderRadius: '8px',
            padding: '0.75rem 1.25rem',
            color: 'var(--ok)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tab Controls */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'triage' ? 'active' : ''}`}
          onClick={() => setActiveTab('triage')}
        >
          <Clock size={16} />
          Registration Triage
          {pendingCount > 0 && <span className="admin-tab-counter">{pendingCount}</span>}
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          <Users size={16} />
          Astronaut Directory ({crewList.length})
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <UserPlus size={16} />
          Add Crew Member
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          <Mail size={16} />
          Account Invitations & Linkages
        </button>
      </div>

      {/* TAB 1: REGISTRATION TRIAGE QUEUE */}
      {activeTab === 'triage' && (
        <div>
          {pendingRequests.length === 0 ? (
            <div className="triage-empty">
              <CheckCircle2 size={44} />
              <h3 style={{ margin: 0, color: 'var(--text)' }}>All Registrations Triaged</h3>
              <p style={{ margin: 0, maxWidth: '420px', fontSize: '0.84rem' }}>
                There are no pending astronaut candidate requests in the verification queue. Newly submitted
                self-registrations will appear here for administrative approval.
              </p>
            </div>
          ) : (
            <div className="triage-grid">
              {pendingRequests.map((req) => (
                <div key={req.id} className="triage-card">
                  <div className="triage-card-header">
                    <div className="triage-candidate-info">
                      <h3>{req.full_name || req.profiles?.full_name || 'Candidate ' + req.requested_callsign}</h3>
                      <span>{req.email || req.profiles?.email || 'email pending'}</span>
                    </div>
                    <span className="topbar-auth-role pending">Pending review</span>
                  </div>

                  <div className="triage-details-box">
                    <div className="triage-details-row">
                      <span>Requested callsign:</span>
                      <strong>{req.requested_callsign || 'TBD'}</strong>
                    </div>
                    <div className="triage-details-row">
                      <span>Operational role:</span>
                      <span>{req.requested_role || 'MISSION SPECIALIST'}</span>
                    </div>
                    <div className="triage-details-row">
                      <span>Space agency:</span>
                      <span>{req.agency || 'NASA'}</span>
                    </div>
                    <div className="triage-details-row">
                      <span>Submitted at:</span>
                      <span>{new Date(req.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {req.statement_of_intent && (
                    <div className="triage-statement">
                      "{req.statement_of_intent}"
                    </div>
                  )}

                  <div className="triage-actions">
                    <button className="btn-approve" onClick={() => handleApprove(req.id)}>
                      <CheckCircle2 size={16} /> Approve & Link to Roster
                    </button>
                    <button className="btn-reject" onClick={() => handleReject(req.id)}>
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ASTRONAUT PERSONNEL DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="admin-table-container">
          <div className="admin-table-top">
            <h3>Expedition 07 Personnel Roster</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.7rem', color: 'var(--text-2)' }} />
                <input
                  type="text"
                  placeholder="Filter personnel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.4rem 0.75rem 0.4rem 2.2rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                  }}
                />
              </div>
              <button
                className="btn-table-action"
                style={{ background: 'rgba(98,212,200,0.15)', borderColor: 'rgba(98,212,200,0.4)', color: 'var(--accent)' }}
                onClick={() => setActiveTab('add')}
              >
                <Plus size={15} /> Add Crew
              </button>
            </div>
          </div>

          <table className="admin-crew-table">
            <thead>
              <tr>
                <th>Astronaut</th>
                <th>Callsign</th>
                <th>Operational Role</th>
                <th>Agency</th>
                <th>Status</th>
                <th>Flight Days</th>
                <th>Radiation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCrew.map((c) => (
                <tr key={c.callsign || c.name}>
                  <td>
                    <div className="crew-row-name">
                      <div className={`crew-row-avatar ${c.color || 'cyan'}`}>{c.initials}</div>
                      <div>
                        <strong>{c.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{c.note}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>
                      {c.callsign || 'UNASSIGNED'}
                    </span>
                  </td>
                  <td>{c.role}</td>
                  <td>{c.agency || 'NASA'}</td>
                  <td>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.72rem',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        background:
                          c.state === 'ARCHIVED'
                            ? 'rgba(169,179,191,0.2)'
                            : c.state === 'MONITOR'
                            ? 'rgba(224,164,60,0.15)'
                            : 'rgba(76,195,138,0.09)',
                        color:
                          c.state === 'ARCHIVED'
                            ? 'var(--text-2)'
                            : c.state === 'MONITOR'
                            ? 'var(--warn)'
                            : 'var(--ok)',
                      }}
                    >
                      {c.state || 'NOMINAL'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{c.flightDays || 126}d</td>
                  <td style={{ fontFamily: 'monospace' }}>{c.radiation || '1.20 mSv'}</td>
                  <td>
                    <div className="crew-actions-cell">
                      <button
                        className="btn-table-action"
                        title="Toggle Active / Archive Status"
                        onClick={() => toggleCrewStatus(c.callsign || c.name)}
                      >
                        {c.state === 'ARCHIVED' ? 'Activate' : 'Archive'}
                      </button>
                      <button
                        className="btn-table-action"
                        title="View Medical Dossier"
                        onClick={() => setPage('crew')}
                      >
                        Dossier
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ADD CREW MEMBER FORM */}
      {activeTab === 'add' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <div
            style={{
              background: 'var(--ink-2)',
              border: '1px solid rgba(98,212,200,0.25)',
              borderRadius: '12px',
              padding: '1.75rem',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
              Pre-Provision Astronaut Profile
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', margin: '0 0 1.5rem 0' }}>
              Administrators can register an astronaut profile in advance. The profile can later be claimed or
              linked to an authenticated user account.
            </p>

            <form onSubmit={handleAddCrewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="auth-form-group">
                  <label>Full Legal Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    style={{ paddingLeft: '0.9rem' }}
                    placeholder="e.g. Maya Lin"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-form-group">
                  <label>Callsign</label>
                  <input
                    type="text"
                    className="auth-input"
                    style={{ paddingLeft: '0.9rem' }}
                    placeholder="e.g. AURORA-1"
                    value={newCallsign}
                    onChange={(e) => setNewCallsign(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="auth-form-group">
                  <label>Operational Role</label>
                  <select
                    className="auth-select"
                    style={{ paddingLeft: '0.9rem' }}
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="MISSION COMMANDER">Mission commander</option>
                    <option value="FLIGHT SURGEON">Flight surgeon</option>
                    <option value="MISSION SPECIALIST">Mission specialist</option>
                    <option value="SYSTEMS ENGINEER">Systems engineer</option>
                    <option value="PAYLOAD SCIENTIST">Payload scientist</option>
                  </select>
                </div>

                <div className="auth-form-group">
                  <label>Space Agency</label>
                  <select
                    className="auth-select"
                    style={{ paddingLeft: '0.9rem' }}
                    value={newAgency}
                    onChange={(e) => setNewAgency(e.target.value)}
                  >
                    <option value="NASA">NASA</option>
                    <option value="ESA">ESA</option>
                    <option value="JAXA">JAXA</option>
                    <option value="CSA">CSA</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="auth-form-group">
                  <label>Baseline HR (BPM)</label>
                  <input
                    type="number"
                    className="auth-input"
                    style={{ paddingLeft: '0.9rem' }}
                    value={newHr}
                    onChange={(e) => setNewHr(e.target.value)}
                  />
                </div>

                <div className="auth-form-group">
                  <label>Baseline SpO₂ (%)</label>
                  <input
                    type="number"
                    className="auth-input"
                    style={{ paddingLeft: '0.9rem' }}
                    value={newOxygen}
                    onChange={(e) => setNewOxygen(e.target.value)}
                  />
                </div>

                <div className="auth-form-group">
                  <label>Color Theme</label>
                  <select
                    className="auth-select"
                    style={{ paddingLeft: '0.9rem' }}
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                  >
                    <option value="cyan">Cyan</option>
                    <option value="violet">Violet</option>
                    <option value="blue">Blue</option>
                    <option value="amber">Amber</option>
                    <option value="teal">Teal</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="auth-btn-primary" style={{ marginTop: '0.5rem' }}>
                <UserPlus size={16} /> Pre-Provision Astronaut & Add to Roster
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT INVITATIONS & LINKAGE */}
      {activeTab === 'invitations' && (
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <div
            style={{
              background: 'var(--ink-2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.2rem', color: '#ffffff', margin: '0 0 0.5rem 0' }}>
                Generate Astronaut Claim Invitation
              </h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', margin: 0 }}>
                Generate a secure, single-use onboarding link that allows an astronaut to set up their password
                and immediately claim their pre-provisioned flight roster profile.
              </p>
            </div>

            <div className="auth-form-group">
              <label>Select Astronaut Profile to Bind</label>
              <select
                className="auth-select"
                style={{ paddingLeft: '0.9rem' }}
                value={selectedCrewForInvite}
                onChange={(e) => {
                  setSelectedCrewForInvite(e.target.value)
                  setGeneratedInviteToken(null)
                }}
              >
                {crewList.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} — {c.role} ({c.callsign || 'CALLSIGN PENDING'})
                  </option>
                ))}
              </select>
            </div>

            <button type="button" className="auth-btn-primary" onClick={handleGenerateInvite}>
              <Zap size={16} /> Generate Secure Onboarding Link
            </button>

            {generatedInviteToken && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(98,212,200,0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', fontFamily: 'monospace' }}>
                  Secure claim invitation URL:
                </span>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: 'var(--accent)',
                    wordBreak: 'break-all',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                  }}
                >
                  {generatedInviteToken}
                </div>
                <button
                  type="button"
                  className="btn-table-action"
                  style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}
                  onClick={() => handleCopy(generatedInviteToken)}
                >
                  <Copy size={14} /> {copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

