/**
 * ORBIT HEALTH — Dynamic Crew Management Context
 * NASA Space Apps Challenge Astronaut Health & Operations Platform
 *
 * Implements:
 * - Dynamic roster management preserving the four canonical demo astronauts.
 * - Integration with Supabase public.crew_members and public.crew_registration_requests when configured.
 * - Local persistence and state synchronization across Mission Control, Crew Status, Health Monitoring, and Admin Hub.
 * - Self-registration triage approvals, role assignment, and account binding.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { initialCrew } from '../data/crewData'
import { supabase, isConfigured } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const CrewContext = createContext(null)

const CREW_STORAGE_KEY = 'orbit-health.crew-roster-v1'
const REGISTRATION_QUEUE_KEY = 'orbit-health.demo-registration-queue-v1'

const INITIAL_DEMO_REGISTRATIONS = [
  {
    id: 'demo-reg-cadet-01',
    user_id: 'demo-user-pending-004',
    email: 'cadet.candidate@nasa.gov',
    full_name: 'Astra Candidate',
    requested_callsign: 'NOVA-1',
    requested_role: 'MISSION SPECIALIST',
    agency: 'NASA',
    statement_of_intent: 'Specialized in closed-loop ECLSS bio-regenerative life support. Ready for long-duration expedition deployment.',
    status: 'pending_approval',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
]

export function CrewProvider({ children }) {
  const { isDemoMode, isAdmin, isAuthorized } = useAuth()

  // Master Crew Members List
  const [crewList, setCrewList] = useState(() => {
    try {
      const saved = window.localStorage.getItem(CREW_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure canonical 4 are always preserved
        const names = new Set(parsed.map((c) => c.name))
        const missing = initialCrew.filter((c) => !names.has(c.name))
        return [...parsed, ...missing]
      }
    } catch {}
    return initialCrew
  })

  // Pending Self-Registration Requests Queue
  const [pendingRequests, setPendingRequests] = useState(() => {
    try {
      const saved = window.localStorage.getItem(REGISTRATION_QUEUE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return INITIAL_DEMO_REGISTRATIONS
  })

  // Synchronize with localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(CREW_STORAGE_KEY, JSON.stringify(crewList))
    } catch {}
  }, [crewList])

  useEffect(() => {
    try {
      window.localStorage.setItem(REGISTRATION_QUEUE_KEY, JSON.stringify(pendingRequests))
    } catch {}
  }, [pendingRequests])

  // If live Supabase configured, load live data with strict authorization gating
  useEffect(() => {
    if (!isConfigured || !supabase) return

    let cancelled = false
    async function loadLiveData() {
      try {
        const { data: dbCrew, error: crewErr } = await supabase
          .from('crew_members')
          .select('*')
          .order('created_at', { ascending: true })

        if (!crewErr && dbCrew && dbCrew.length > 0 && !cancelled) {
          // Map DB columns to UI shape while preserving extra fields
          const mapped = dbCrew.map((c) => ({
            id: c.id,
            name: c.full_name,
            role: c.operational_role,
            callsign: c.callsign,
            agency: c.agency,
            initials: c.initials,
            state: c.current_status.toUpperCase(),
            hr: 68,
            oxygen: 98,
            sleep: '7h 30m',
            color: c.color_code || 'cyan',
            note: c.emergency_notes || 'All systems nominal',
            isActive: c.is_active,
            radiation: `${c.cumulative_radiation_msv || 0.0} mSv`,
            flightDays: c.flight_days_count || 0,
            evaMinutes: c.eva_minutes_count || 0,
          }))
          setCrewList(mapped)
        }

        // Only authorized administrators may fetch pending registration requests
        if (isAdmin && isAuthorized) {
          const { data: dbRequests, error: regErr } = await supabase
            .from('crew_registration_requests')
            .select('*, profiles:user_id(email, full_name)')
            .eq('status', 'pending_approval')
            .order('created_at', { ascending: false })

          if (!regErr && dbRequests && !cancelled) {
            setPendingRequests(dbRequests)
          }
        } else if (!isDemoMode) {
          // In live mode, non-administrators or logged-out users must never hold pending triage items
          if (!cancelled) {
            setPendingRequests([])
          }
        }
      } catch (err) {
        console.warn('[ORBIT CREW] Live data load notice:', err.message)
      }
    }

    loadLiveData()
    return () => {
      cancelled = true
    }
  }, [isAdmin, isAuthorized, isDemoMode])

  /**
   * Add a new crew member (Admin Provisioning)
   */
  const addCrewMember = useCallback(
    async (crewData) => {
      const newCrew = {
        name: crewData.name.trim(),
        role: crewData.role.toUpperCase(),
        callsign: crewData.callsign.toUpperCase(),
        agency: crewData.agency || 'NASA',
        initials:
          crewData.initials ||
          crewData.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        state: 'NOMINAL',
        hr: Number(crewData.hr) || 70,
        oxygen: Number(crewData.oxygen) || 98,
        sleep: crewData.sleep || '7h 15m',
        color: crewData.color || 'cyan',
        note: crewData.note || 'Assigned to active mission flight deck.',
        isActive: true,
        radiation: crewData.radiation || '0.00 mSv',
        flightDays: Number(crewData.flightDays) || 0,
        evaMinutes: Number(crewData.evaMinutes) || 0,
      }

      setCrewList((prev) => {
        // Prevent duplicate callsign or name
        if (prev.some((c) => c.name.toLowerCase() === newCrew.name.toLowerCase() || c.callsign === newCrew.callsign)) {
          return prev
        }
        return [...prev, newCrew]
      })

      if (isConfigured && supabase) {
        try {
          await supabase.from('crew_members').insert({
            full_name: newCrew.name,
            callsign: newCrew.callsign,
            operational_role: newCrew.role,
            agency: newCrew.agency,
            initials: newCrew.initials,
            color_code: newCrew.color,
            current_status: 'nominal',
            is_active: true,
            is_demo: false,
          })
        } catch (err) {
          console.error('[ORBIT CREW] Live crew insert error:', err.message)
        }
      }

      return { success: true, crew: newCrew }
    },
    []
  )

  /**
   * Deactivate or Archive Crew Member
   */
  const toggleCrewStatus = useCallback(
    async (identifier) => {
      setCrewList((prev) =>
        prev.map((c) => {
          if (c.callsign === identifier || c.name === identifier) {
            const nextState = c.state === 'ARCHIVED' || c.state === 'INACTIVE' ? 'NOMINAL' : 'ARCHIVED'
            return { ...c, state: nextState, isActive: nextState === 'NOMINAL' }
          }
          return c
        })
      )

      if (isConfigured && supabase) {
        try {
          await supabase
            .from('crew_members')
            .update({ current_status: 'archived', is_active: false })
            .or(`callsign.eq.${identifier},full_name.eq.${identifier}`)
        } catch {}
      }
    },
    []
  )

  /**
   * Approve Pending Registration Request & Link to Crew
   */
  const approveRegistration = useCallback(
    async (requestId, targetCrewMember, assignedRole = 'astronaut', adminNotes = '') => {
      // Find request
      const req = pendingRequests.find((r) => r.id === requestId)
      if (!req) return { success: false, error: 'Registration request not found.' }

      // Update local pending queue
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))

      // If linking to new astronaut profile, add them to crew list
      if (!targetCrewMember || targetCrewMember === 'NEW') {
        const candidateCrew = {
          name: req.full_name || req.profiles?.full_name || 'Astronaut ' + (req.requested_callsign || 'CANDIDATE'),
          role: (req.requested_role || 'MISSION SPECIALIST').toUpperCase(),
          callsign: (req.requested_callsign || 'NOVA-1').toUpperCase(),
          agency: req.agency || 'NASA',
          initials: (req.requested_callsign || 'AC').slice(0, 2).toUpperCase(),
          state: 'NOMINAL',
          hr: 70,
          oxygen: 99,
          sleep: '7h 30m',
          color: 'cyan',
          note: 'Administrative verification cleared. Expedition ready.',
          isActive: true,
          radiation: '0.05 mSv',
          flightDays: 1,
          evaMinutes: 0,
        }
        setCrewList((prev) => [...prev, candidateCrew])
      }

      if (isConfigured && supabase) {
        try {
          const { error } = await supabase.rpc('approve_crew_registration', {
            p_request_id: requestId,
            p_crew_member_id: targetCrewMember === 'NEW' ? null : targetCrewMember,
            p_role_to_assign: assignedRole,
            p_admin_notes: adminNotes,
          })
          if (error) throw error
        } catch (err) {
          console.error('[ORBIT CREW] Live approval RPC error:', err.message)
        }
      }

      return { success: true }
    },
    [pendingRequests]
  )

  /**
   * Reject Pending Registration Request
   */
  const rejectRegistration = useCallback(
    async (requestId, decisionNotes = '') => {
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))

      if (isConfigured && supabase) {
        try {
          await supabase
            .from('crew_registration_requests')
            .update({
              status: 'rejected',
              admin_decision_notes: decisionNotes,
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', requestId)
        } catch {}
      }

      return { success: true }
    },
    []
  )

  const value = useMemo(
    () => ({
      crewList,
      pendingRequests,
      pendingCount: pendingRequests.length,
      addCrewMember,
      toggleCrewStatus,
      approveRegistration,
      rejectRegistration,
    }),
    [crewList, pendingRequests, addCrewMember, toggleCrewStatus, approveRegistration, rejectRegistration]
  )

  return <CrewContext.Provider value={value}>{children}</CrewContext.Provider>
}

export function useCrew() {
  const context = useContext(CrewContext)
  if (!context) {
    throw new Error('useCrew must be used within a <CrewProvider>')
  }
  return context
}

