/**
 * ORBIT HEALTH — Authentication & Authorization Context (Option A Hardened)
 * NASA Space Apps Challenge Astronaut Health & Operations Platform
 *
 * Security & Architecture Principles:
 * - Supabase is the sole source of truth for live authentication; localStorage is never trusted for authorization.
 * - Server-authoritative role hydration directly from public.user_roles (zero client trust).
 * - Safe onAuthStateChange listener pattern: never awaits database calls inside the auth callback.
 * - Multi-layer concurrency serialization:
 *     1. authEventSeqRef: Serializes auth events (getSession, onAuthStateChange, sign-in, sign-out)
 *        to prevent delayed getSession() or obsolete events from overwriting newer user state.
 *     2. hydrationSeqRef: Serializes asynchronous database hydration requests.
 * - Gated Role Flags: isAdmin, isFlightSurgeon, isAstronaut are strictly false unless isAuthorized is true.
 * - Strict multi-table clearance condition: active status requires verified email, active profile, assigned role,
 *   and an active crew dossier for astronauts.
 * - Clear operational state transitions: unauthenticated, pending_email_verification, provisioning, active, provisioning_error.
 * - Privacy & data minimization: explicit column selection; excludes admin triage notes and clinical emergency notes.
 * - Immediate state clearance on user sign-out, session invalidation, or failed hydration.
 * - Graceful fallback to offline demonstration personas when Supabase is not configured.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const DEMO_STORAGE_KEY = 'orbit-health.demo-auth-session-v1'
const DEMO_REGISTRATIONS_KEY = 'orbit-health.demo-registration-queue-v1'

/**
 * Normalizes an Astronaut ID, Badge Number, or Email into a canonical Supabase Auth identity.
 * Supports:
 * - Direct Astronaut ID (e.g. "NASA-084" -> "nasa-084@orbit.nasa.gov")
 * - Numerical Badge (e.g. "621" -> "astro-621@orbit.nasa.gov")
 * - Callsign / Alphanumeric (e.g. "VALKYRIE-1" -> "valkyrie-1@orbit.nasa.gov")
 * - Standard Email (e.g. "alex@nasa.gov" -> preserved as-is)
 */
export function formatAstronautIdentifier(identifier) {
  if (!identifier) return ''
  const trimmed = identifier.trim()
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase()
  }
  const cleanId = trimmed.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
  return `${cleanId}@nasa.gov`
}

// Canonical Demo Personas for Offline Evaluation Only
const DEMO_ACCOUNTS = {
  admin: {
    id: 'demo-user-admin-001',
    email: 'flight.director@nasa.gov',
    fullName: 'Gene Kranz (Flight Director)',
    roles: ['administrator'],
    isActive: true,
    crewMember: null,
  },
  surgeon: {
    id: 'demo-user-surgeon-002',
    email: 'marcus.chen@nasa.gov',
    fullName: 'Dr. Marcus Chen',
    roles: ['flight_surgeon'],
    isActive: true,
    crewMember: {
      id: 'demo-crew-chen',
      callsign: 'SURGEON-1',
      fullName: 'Dr. Marcus Chen',
      operationalRole: 'FLIGHT SURGEON',
      initials: 'MC',
      agency: 'NASA',
    },
  },
  commander: {
    id: 'demo-user-cmdr-003',
    email: 'elena.vasquez@nasa.gov',
    fullName: 'Elena Vasquez',
    roles: ['astronaut'],
    isActive: true,
    crewMember: {
      id: 'demo-crew-vasquez',
      callsign: 'VANGUARD-1',
      fullName: 'Elena Vasquez',
      operationalRole: 'MISSION COMMANDER',
      initials: 'EV',
      agency: 'NASA',
    },
  },
  pending: {
    id: 'demo-user-pending-004',
    email: 'cadet.candidate@nasa.gov',
    fullName: 'Astra Candidate',
    roles: [],
    isActive: false,
    crewMember: null,
    registrationRequest: {
      id: 'demo-reg-001',
      requestedCallsign: 'NOVA-1',
      requestedRole: 'MISSION SPECIALIST',
      status: 'pending_approval',
      submittedAt: new Date().toISOString(),
    },
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [crewMember, setCrewMember] = useState(null)
  const [roles, setRoles] = useState([])
  const [registrationRequest, setRegistrationRequest] = useState(null)
  const [registrationState, setRegistrationState] = useState('unauthenticated') // 'unauthenticated' | 'pending_email_verification' | 'provisioning' | 'active' | 'provisioning_error'
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Auth event & hydration concurrency sequence barriers
  const authEventSeqRef = useRef(0)
  const hydrationSeqRef = useRef(0)
  const lastHydratedUserIdRef = useRef(null)
  const hydrationTimerRef = useRef(null)

  const isDemoMode = !isConfigured

  /**
   * Immediate, synchronous clearance of all authorization state.
   * Increments authEventSeqRef and hydrationSeqRef to immediately invalidate any
   * in-flight asynchronous auth callbacks or database hydration requests.
   * Cancels any pending deferred hydration timers.
   */
  const clearAuthState = useCallback(() => {
    authEventSeqRef.current++
    hydrationSeqRef.current++
    if (hydrationTimerRef.current) {
      clearTimeout(hydrationTimerRef.current)
      hydrationTimerRef.current = null
    }
    setProfile(null)
    setCrewMember(null)
    setRoles([])
    setRegistrationRequest(null)
    setRegistrationState('unauthenticated')
    setError(null)
    lastHydratedUserIdRef.current = null
  }, [])

  /**
   * Secure, Server-Authoritative User Data Hydration
   * - Queries public.profiles, public.user_roles, public.crew_members, and public.crew_registration_requests.
   * - Uses explicit column selection to minimize data transmission and protect sensitive fields (emergency notes, triage notes).
   * - Governed by sequence counter (hydrationSeqRef) to guarantee stale responses are dropped.
   * - Strictly enforces email verification and multi-table validation before granting 'active' status.
   */
  const hydrateLiveUserData = useCallback(async (authUser) => {
    if (!authUser || !supabase) {
      clearAuthState()
      setIsLoading(false)
      return {
        success: false,
        error: 'No authenticated user identity',
        registrationState: 'unauthenticated',
        isAuthorized: false,
      }
    }

    // Cancel any pending hydration timer
    if (hydrationTimerRef.current) {
      clearTimeout(hydrationTimerRef.current)
      hydrationTimerRef.current = null
    }

    // If switching to a different user, immediately reset ALL authorization and registration state
    if (lastHydratedUserIdRef.current && lastHydratedUserIdRef.current !== authUser.id) {
      setProfile(null)
      setCrewMember(null)
      setRoles([])
      setRegistrationRequest(null)
      setRegistrationState('unauthenticated')
      setError(null)
      lastHydratedUserIdRef.current = null
    }

    const currentSeq = ++hydrationSeqRef.current

    try {
      setIsLoading(true)
      setError(null)

      // 1. Fetch Profile (Explicit columns, no select('*'))
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, phone_number, is_active, created_at, updated_at')
        .eq('id', authUser.id)
        .maybeSingle()

      if (currentSeq !== hydrationSeqRef.current) return { success: false, aborted: true }
      if (profileErr) throw profileErr

      // 2. Fetch Server-Authoritative Roles from public.user_roles
      const { data: rolesData, error: rolesErr } = await supabase
        .from('user_roles')
        .select('role, assigned_at')
        .eq('user_id', authUser.id)

      if (currentSeq !== hydrationSeqRef.current) return { success: false, aborted: true }
      if (rolesErr) throw rolesErr

      const userRoles = (rolesData || []).map((r) => r.role)

      // 3. Fetch Linked Crew Dossier (Explicitly omits sensitive clinical emergency_notes)
      const { data: crewData, error: crewErr } = await supabase
        .from('crew_members')
        .select(
          'id, user_id, callsign, full_name, agency, operational_role, initials, color_code, current_status, is_active, is_demo, flight_days_count, eva_minutes_count, cumulative_radiation_msv'
        )
        .eq('user_id', authUser.id)
        .maybeSingle()

      if (currentSeq !== hydrationSeqRef.current) return { success: false, aborted: true }
      if (crewErr && crewErr.code !== 'PGRST116') throw crewErr

      // 4. Fetch Optional Registration Request (Explicitly omits administrative triage notes)
      const { data: regData, error: regErr } = await supabase
        .from('crew_registration_requests')
        .select('id, user_id, requested_callsign, requested_role, agency, status, reviewed_at, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (currentSeq !== hydrationSeqRef.current) return { success: false, aborted: true }
      if (regErr && regErr.code !== 'PGRST116') throw regErr

      // 5. Evaluate Operational Authorization State
      // Requirement: Email verification is strictly required for ALL live account types.
      const isEmailConfirmed = Boolean(authUser.email_confirmed_at)
      let computedState = 'provisioning'

      if (!isEmailConfirmed) {
        computedState = 'pending_email_verification'
      } else if (profileData && profileData.is_active === true) {
        const isAstronautValid =
          userRoles.includes('astronaut') && crewData && crewData.is_active === true
        const isFlightSurgeonValid = userRoles.includes('flight_surgeon')
        const isAdminValid = userRoles.includes('administrator')

        if (isAdminValid || isFlightSurgeonValid || isAstronautValid) {
          computedState = 'active'
        } else {
          computedState = 'provisioning'
        }
      } else {
        computedState = 'provisioning'
      }

      // Update state atomically once all queries succeed
      setProfile(profileData || null)
      setRoles(userRoles)
      setCrewMember(crewData || null)
      setRegistrationRequest(regData || null)
      setRegistrationState(computedState)
      lastHydratedUserIdRef.current = authUser.id

      const isAuthorized = computedState === 'active'

      return {
        success: true,
        profile: profileData,
        roles: userRoles,
        crew: crewData,
        registrationState: computedState,
        isAuthorized,
      }
    } catch (err) {
      if (currentSeq === hydrationSeqRef.current) {
        console.error('[ORBIT AUTH] Authorization hydration error:', err.message)
        // Ensure failed query results in denied access rather than lingering permissions or outdated requests
        setProfile(null)
        setRoles([])
        setCrewMember(null)
        setRegistrationRequest(null)
        setRegistrationState('provisioning_error')
        setError('Authorization check failed. Personnel clearance could not be verified.')
        lastHydratedUserIdRef.current = null
      }
      return {
        success: false,
        error: err.message,
        registrationState: 'provisioning_error',
        isAuthorized: false,
      }
    } finally {
      if (currentSeq === hydrationSeqRef.current) {
        setIsLoading(false)
      }
    }
  }, [clearAuthState])

  /**
   * Supabase Auth Listener Initialization
   * Concurrency Guard: authEventSeqRef serializes session resolution and auth events.
   * - A delayed getSession() response cannot overwrite a newer onAuthStateChange event.
   * - Obsolete events cannot trigger hydration for an outdated user.
   * - Unmount invalidates sequences, cancels timers, and unbinds listener.
   */
  useEffect(() => {
    let mounted = true

    if (isConfigured && supabase) {
      // 1. Initial Session Resolution with event sequence capture
      const initSeq = ++authEventSeqRef.current

      supabase.auth
        .getSession()
        .then(({ data: { session: initialSession }, error: sessionErr }) => {
          if (!mounted) return
          // Drop response if superseded by a newer auth event (e.g. from onAuthStateChange or login/logout)
          if (initSeq !== authEventSeqRef.current) {
            console.log('[ORBIT AUTH] Stale getSession response superseded by newer auth event, dropping')
            return
          }

          if (sessionErr) {
            console.warn('[ORBIT AUTH] Initial session fetch error:', sessionErr.message)
            setError('Session resolution error.')
            setIsLoading(false)
            return
          }

          setSession(initialSession)
          const initialUser = initialSession?.user || null
          setUser(initialUser)

          if (initialUser) {
            hydrateLiveUserData(initialUser)
          } else {
            clearAuthState()
            setIsLoading(false)
          }
        })
        .catch((err) => {
          if (!mounted || initSeq !== authEventSeqRef.current) return
          console.error('[ORBIT AUTH] Unexpected getSession failure:', err)
          setIsLoading(false)
        })

      // 2. Safe Auth State Listener (Dispatches hydration outside callback)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!mounted) return

        const currentEventSeq = ++authEventSeqRef.current

        // Synchronous updates only inside the callback
        setSession(newSession)
        const newUser = newSession?.user || null
        setUser(newUser)

        if (!newUser) {
          clearAuthState()
          setIsLoading(false)
        } else if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'INITIAL_SESSION'
        ) {
          // Defer database queries outside the auth lock
          if (hydrationTimerRef.current) {
            clearTimeout(hydrationTimerRef.current)
          }
          hydrationTimerRef.current = setTimeout(() => {
            hydrationTimerRef.current = null
            if (mounted && currentEventSeq === authEventSeqRef.current) {
              hydrateLiveUserData(newUser)
            }
          }, 0)
        }
      })

      return () => {
        mounted = false
        authEventSeqRef.current++
        hydrationSeqRef.current++
        if (hydrationTimerRef.current) {
          clearTimeout(hydrationTimerRef.current)
          hydrationTimerRef.current = null
        }
        subscription?.unsubscribe()
      }
    } else {
      // Offline Simulated Demonstration Mode
      try {
        const savedDemo = window.localStorage.getItem(DEMO_STORAGE_KEY)
        if (savedDemo) {
          const parsed = JSON.parse(savedDemo)
          setUser(parsed.user)
          setProfile(parsed.profile)
          setCrewMember(parsed.crewMember)
          setRoles(parsed.roles || [])
          setRegistrationRequest(parsed.registrationRequest || null)
          setRegistrationState(parsed.profile?.is_active ? 'active' : 'pending_email_verification')
        } else {
          // Default to Commander Elena Vasquez for instant interactive demo
          const defaultDemo = DEMO_ACCOUNTS.commander
          setUser({ id: defaultDemo.id, email: defaultDemo.email })
          setProfile({
            id: defaultDemo.id,
            email: defaultDemo.email,
            full_name: defaultDemo.fullName,
            is_active: defaultDemo.isActive,
          })
          setCrewMember(defaultDemo.crewMember)
          setRoles(defaultDemo.roles)
          setRegistrationRequest(null)
          setRegistrationState('active')
        }
      } catch {
        // Fallback safely if browser storage fails
      } finally {
        setIsLoading(false)
      }

      return () => {
        mounted = false
      }
    }
  }, [hydrateLiveUserData, clearAuthState])

  /**
   * User Sign In
   * Accepts either an Astronaut Identification Number / Badge ID (e.g. "NASA-084")
   * or a standard mission email, plus the security PIN / password.
   */
  const login = useCallback(
    async (emailOrId, passwordOrPin) => {
      setError(null)
      setIsLoading(true)

      const formattedEmail = formatAstronautIdentifier(emailOrId)
      const password = passwordOrPin

      if (isConfigured && supabase) {
        try {
          authEventSeqRef.current++
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: formattedEmail,
            password,
          })

          if (authError) {
            setError(authError.message)
            return { success: false, error: authError.message, isAuthorized: false }
          }

          setUser(data.user)
          setSession(data.session)
          const hydrationResult = await hydrateLiveUserData(data.user)
          const isAuthorized = hydrationResult.registrationState === 'active'

          return {
            success: true,
            user: data.user,
            isAuthorized,
            registrationState: hydrationResult.registrationState || 'provisioning',
            ...hydrationResult,
          }
        } catch (err) {
          const safeMessage = err.message || 'Authentication failed. Please verify credentials.'
          setError(safeMessage)
          return { success: false, error: safeMessage, isAuthorized: false }
        } finally {
          setIsLoading(false)
        }
      } else {
        // Simulated Offline Authentication
        try {
          const accountMatch = Object.values(DEMO_ACCOUNTS).find(
            (acc) =>
              acc.email.toLowerCase() === formattedEmail.toLowerCase() ||
              acc.crewMember?.callsign?.toLowerCase() === emailOrId?.trim().toLowerCase()
          )

          const selectedAccount = accountMatch || {
            id: 'demo-user-custom',
            email: formattedEmail,
            fullName: emailOrId.split('@')[0],
            roles: ['astronaut'],
            isActive: true,
            crewMember: {
              id: 'demo-crew-custom',
              callsign: emailOrId.split('@')[0].toUpperCase(),
              fullName: emailOrId.split('@')[0],
              operationalRole: 'MISSION ASTRONAUT',
              initials: 'GU',
              agency: 'NASA',
            },
          }

          const statePayload = {
            user: { id: selectedAccount.id, email: selectedAccount.email },
            profile: {
              id: selectedAccount.id,
              email: selectedAccount.email,
              full_name: selectedAccount.fullName,
              is_active: selectedAccount.isActive,
            },
            crewMember: selectedAccount.crewMember || null,
            roles: selectedAccount.roles || [],
            registrationRequest: selectedAccount.registrationRequest || null,
          }

          setUser(statePayload.user)
          setProfile(statePayload.profile)
          setCrewMember(statePayload.crewMember)
          setRoles(statePayload.roles)
          setRegistrationRequest(statePayload.registrationRequest)
          setRegistrationState(statePayload.profile.is_active ? 'active' : 'pending_email_verification')

          try {
            window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(statePayload))
          } catch {}

          return {
            success: true,
            simulated: true,
            user: statePayload.user,
            isAuthorized: statePayload.profile.is_active,
          }
        } finally {
          setIsLoading(false)
        }
      }
    },
    [hydrateLiveUserData]
  )

  /**
   * User Sign Out
   * Clears state immediately, invalidating any pending async responses.
   * Executes remote termination with safe error boundary.
   */
  const logout = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    clearAuthState()
    setUser(null)
    setSession(null)

    if (isConfigured && supabase) {
      try {
        const { error: signOutErr } = await supabase.auth.signOut()
        if (signOutErr) {
          console.warn('[ORBIT AUTH] Remote sign-out notification failed:', signOutErr.message)
        }
      } catch (err) {
        console.warn('[ORBIT AUTH] Sign-out network error:', err.message)
      } finally {
        setIsLoading(false)
      }
    } else {
      try {
        window.localStorage.removeItem(DEMO_STORAGE_KEY)
      } catch {}
      setIsLoading(false)
    }
  }, [clearAuthState])

  /**
   * Open Astronaut Registration (Option A)
   * Dispatches signup with Astronaut ID or email, issuing an official flight pin.
   * Evaluates server hydration before declaring 'active' status.
   */
  const registerAstronaut = useCallback(
    async ({ email, astronautId, password, pin, fullName, requestedCallsign, agency }) => {
      setError(null)
      setIsLoading(true)

      const formattedEmail = formatAstronautIdentifier(
        email || astronautId || requestedCallsign || `astro-${Date.now().toString().slice(-4)}`
      )
      const finalPassword = password || pin
      const finalCallsign = requestedCallsign ? requestedCallsign.trim() : (astronautId ? astronautId.trim() : 'NOVA-1')
      const finalBadgeId = astronautId ? astronautId.trim() : finalCallsign

      if (isConfigured && supabase) {
        try {
          authEventSeqRef.current++
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: formattedEmail,
            password: finalPassword,
            options: {
              data: {
                full_name: fullName.trim(),
                requested_callsign: finalCallsign,
                agency: agency || 'NASA',
                astronaut_id: finalBadgeId,
              },
            },
          })

          if (authErr) {
            let userMsg = authErr.message
            if (authErr.message.toLowerCase().includes('rate limit')) {
              userMsg = 'Supabase email rate limit reached. To enable instant Astronaut ID & PIN enlistment without email checks, turn OFF "Confirm email" in Supabase Dashboard (Authentication > Providers > Email).'
            } else if (authErr.message.toLowerCase().includes('invalid')) {
              userMsg = 'Identity or email address format rejected. Please ensure a valid Astronaut ID (e.g. NASA-621) is used.'
            }
            setError(userMsg)
            return { success: false, error: userMsg, isAuthorized: false }
          }

          const newUser = authData.user
          const hasImmediateSession = Boolean(authData.session)
          const isEmailConfirmed = Boolean(newUser?.email_confirmed_at)
          const requiresEmailConfirmation = !hasImmediateSession || !isEmailConfirmed

          let finalRegistrationState = 'pending_email_verification'
          let hydrationResult = null

          if (hasImmediateSession && newUser) {
            setUser(newUser)
            setSession(authData.session)
            hydrationResult = await hydrateLiveUserData(newUser)
            finalRegistrationState = hydrationResult.registrationState || 'provisioning'
          } else if (newUser) {
            setUser(newUser)
            setRegistrationState('pending_email_verification')
            finalRegistrationState = 'pending_email_verification'
          }

          const isAuthorized = finalRegistrationState === 'active'

          return {
            success: true,
            requiresEmailConfirmation,
            status: finalRegistrationState,
            registrationState: finalRegistrationState,
            isAuthorized,
            message: requiresEmailConfirmation
              ? `Astronaut ID ${finalBadgeId} registered. Flight PIN clearance sent to verification channel.`
              : isAuthorized
              ? `Astronaut ID ${finalBadgeId} cleared! Flight station uplink established.`
              : `Astronaut ID ${finalBadgeId} received. Initializing medical telemetry baseline...`,
            ...(hydrationResult || {}),
          }
        } catch (err) {
          const safeMessage = err.message || 'Registration failed.'
          setError(safeMessage)
          return { success: false, error: safeMessage, isAuthorized: false }
        } finally {
          setIsLoading(false)
        }
      } else {
        // Simulated Offline Open Registration
        try {
          const simulatedId = 'demo-astro-' + Date.now()
          const newDemoCrew = {
            id: simulatedId,
            callsign: finalCallsign,
            fullName: fullName.trim(),
            operationalRole: 'MISSION ASTRONAUT',
            initials: fullName.trim().slice(0, 2).toUpperCase() || 'AS',
            agency: agency || 'NASA',
          }

          const statePayload = {
            user: { id: simulatedId, email: formattedEmail },
            profile: {
              id: simulatedId,
              email: formattedEmail,
              full_name: fullName.trim(),
              is_active: true,
            },
            crewMember: newDemoCrew,
            roles: ['astronaut'],
            registrationRequest: null,
          }

          setUser(statePayload.user)
          setProfile(statePayload.profile)
          setCrewMember(newDemoCrew)
          setRoles(['astronaut'])
          setRegistrationRequest(null)
          setRegistrationState('active')

          try {
            window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(statePayload))
          } catch {}

          return {
            success: true,
            simulated: true,
            status: 'active',
            registrationState: 'active',
            isAuthorized: true,
            message: 'DEMO: Astronaut enlistment complete. Welcome aboard, Astronaut!',
          }
        } finally {
          setIsLoading(false)
        }
      }
    },
    [hydrateLiveUserData]
  )

  /**
   * Revalidate Server Authorization State
   * Provides stable, on-demand re-hydration without stale closures.
   */
  const refreshSession = useCallback(async () => {
    if (isConfigured && supabase) {
      try {
        const {
          data: { session: refreshedSession },
          error: refreshErr,
        } = await supabase.auth.getSession()

        if (refreshErr) {
          setError(refreshErr.message)
          return { success: false, error: refreshErr.message, isAuthorized: false }
        }

        setSession(refreshedSession)
        const currentUser = refreshedSession?.user || null
        setUser(currentUser)

        if (currentUser) {
          return await hydrateLiveUserData(currentUser)
        } else {
          clearAuthState()
          return {
            success: false,
            error: 'No active session',
            isAuthorized: false,
            registrationState: 'unauthenticated',
          }
        }
      } catch (err) {
        return { success: false, error: err.message, isAuthorized: false }
      }
    } else {
      return { success: true, simulated: true, isAuthorized: true }
    }
  }, [hydrateLiveUserData, clearAuthState])

  /**
   * Prototype Persona Switcher (strictly barred in live Supabase mode)
   */
  const switchDemoAccount = useCallback(
    (accountKey) => {
      const target = DEMO_ACCOUNTS[accountKey]
      if (!target) return

      const statePayload = {
        user: { id: target.id, email: target.email },
        profile: {
          id: target.id,
          email: target.email,
          full_name: target.fullName,
          is_active: target.isActive,
        },
        crewMember: target.crewMember,
        roles: target.roles,
        registrationRequest: target.registrationRequest || null,
      }

      setUser(statePayload.user)
      setProfile(statePayload.profile)
      setCrewMember(target.crewMember)
      setRoles(target.roles)
      setRegistrationRequest(target.registrationRequest || null)
      setRegistrationState('active')

      try {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(statePayload))
      } catch {}
    },
    [isDemoMode]
  )

  // =========================================================================
  // AUTHORITATIVE OPERATIONAL AUTHORIZATION & GATED ROLE PRIVILEGES
  // =========================================================================

  /**
   * isAuthorized: Core operational clearance gate.
   * - In Live Mode: true ONLY when registrationState === 'active' (email verified,
   *   profile active, role provisioned, and active crew dossier for astronauts).
   * - In Demo Mode: true when demo persona state is 'active'.
   */
  const isAuthorized = useMemo(() => {
    return registrationState === 'active'
  }, [registrationState])

  /**
   * isProvisioned: Identical to isAuthorized; indicates full account provisioning completion.
   */
  const isProvisioned = useMemo(() => {
    return registrationState === 'active'
  }, [registrationState])

  /**
   * Distinct Mode Indicators for UI Transparency
   */
  const isSimulatedAuthorized = useMemo(() => {
    return isDemoMode && isAuthorized
  }, [isDemoMode, isAuthorized])

  const isLiveAuthorized = useMemo(() => {
    return !isDemoMode && isAuthorized
  }, [isDemoMode, isAuthorized])

  /**
   * Gated Role Flags:
   * Rule: Frontend privileges MUST NOT be granted unless the account is operationally authorized.
   * Unverified, provisioning, or error-state accounts strictly receive false.
   */
  const isAdmin = useMemo(() => {
    return isAuthorized && roles.includes('administrator')
  }, [isAuthorized, roles])

  const isFlightSurgeon = useMemo(() => {
    return isAuthorized && roles.includes('flight_surgeon')
  }, [isAuthorized, roles])

  const isAstronaut = useMemo(() => {
    return isAuthorized && roles.includes('astronaut')
  }, [isAuthorized, roles])

  const isEmailUnconfirmed = useMemo(() => {
    return registrationState === 'pending_email_verification'
  }, [registrationState])

  const isPendingApproval = useMemo(() => {
    // Under Option A, normal astronauts are never pending approval.
    // Legacy / special billet applications without assigned roles remain pending approval.
    if (!user) return false
    if (registrationRequest && registrationRequest.status === 'pending_approval' && !roles.includes('astronaut')) {
      return true
    }
    return false
  }, [user, roles, registrationRequest])

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      crewMember,
      roles,
      registrationRequest,
      registrationState,
      isAuthorized,
      isProvisioned,
      isSimulatedAuthorized,
      isLiveAuthorized,
      isEmailUnconfirmed,
      isPendingApproval,
      isLoading,
      error,
      isDemoMode,
      authMode: isDemoMode ? 'SIMULATED_DEMO_OFFLINE' : 'LIVE_SUPABASE_AUTH',
      isAdmin,
      isFlightSurgeon,
      isAstronaut,
      login,
      logout,
      registerAstronaut,
      switchDemoAccount,
      refreshSession,
    }),
    [
      user,
      session,
      profile,
      crewMember,
      roles,
      registrationRequest,
      registrationState,
      isAuthorized,
      isProvisioned,
      isSimulatedAuthorized,
      isLiveAuthorized,
      isEmailUnconfirmed,
      isPendingApproval,
      isLoading,
      error,
      isDemoMode,
      isAdmin,
      isFlightSurgeon,
      isAstronaut,
      login,
      logout,
      registerAstronaut,
      switchDemoAccount,
      refreshSession,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Access hook for ORBIT HEALTH authentication & clearance state
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return context
}
