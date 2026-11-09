# ORBIT HEALTH — Astronaut Health & Operational Platform (Frontend)

NASA Space Apps Challenge · Expedition 07 Medical Operations

ORBIT HEALTH is an aerospace-grade clinical telemetry and operational platform designed for deep-space astronaut monitoring. Built with React 18, Vite 6, and Three.js 0.171 WebGL interactive scenes.

---

## Features

- **7 Operational Flight Decks**:
  1. **Mission Control**: Orbital position, ISS telemetry, cabin life support (ECLSS), and solar status.
  2. **Crew Status**: Expedition 07 roster, real-time biometrics, radiation dosimeters, and EVA duration.
  3. **Health Monitoring**: Real-time multi-waveform vital telemetry (ECG, SpO2, Core Temp, Optic Nerve Sheath Diameter).
  4. **Medical Bay (3D Anatomical Digital Twin)**: Interactive Three.js 3D human body model with physiological heatmaps and symptom diagnostics.
  5. **Emergency Center**: Spaceflight clinical decision support, differential diagnostics, and air-gapped emergency protocols.
  6. **Orbit AI Clinical Assistant**: Aerospace clinical guidance, space medicine countermeasure prescriptions, and voice synthesis.
  7. **Crew Admin Hub**: Personnel clearance triage, role escalation guards, and operational audit logging.

- **Aerospace Identity Protocol**:
  - Full-screen **Authentication Gateway** with NASA Astronaut Badge ID (e.g. `NASA-621`) and Flight Security Access PIN.
  - Zero commercial email requirement for space travelers.
  - One-click instant offline demo personas (`Elena Vasquez`, `Dr. Marcus Chen`).

---

## Tech Stack

- **Framework**: React 18.3 + Vite 6
- **3D Graphics**: Three.js 0.171 (Orbital Earth, Digital Twin, MedEquipment, Astronaut EVA scenes)
- **Styling**: Tailwind CSS + Vanilla CSS Aerospace Design System
- **Icons**: Lucide React
- **Backend Integration**: Supabase Auth + PostgreSQL RLS (optional, graceful offline demo fallback)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup (Optional)
If connecting to a live Supabase backend:
```bash
cp .env.example .env.local
```
Edit `.env.local` and fill in your Supabase project URL and anon public key.

> **Note**: If `.env.local` is not provided, the platform automatically boots into **Simulated Prototype Demo Mode**, enabling full evaluation of all 7 screens without external dependencies.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 4. Production Build
```bash
npm run build
```

---

## License & Attribution

Developed for the NASA Space Apps Challenge.
