import * as THREE from 'three'
import { mountCinematicEarth } from './three/earthScene'
import { mountDigitalTwin } from './three/digitalTwinScene'

// High-fidelity Earth & Orbital Spacecraft system
export function mountStarfield(canvas, onTelemetryUpdate) {
  return mountCinematicEarth(canvas, onTelemetryUpdate)
}

// High-fidelity 3D Anatomical Digital Twin system
export function mountTwin(canvas, onSelect) {
  return mountDigitalTwin(canvas, { onSelect })
}
