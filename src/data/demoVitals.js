import { Activity, Droplets, HeartPulse, Thermometer, Waves, Zap } from 'lucide-react'

export const demoVitals = [
  {
    label: 'HEART RATE',
    value: '68',
    unit: 'BPM',
    icon: HeartPulse,
    color: 'cyan',
    data: [32, 48, 40, 58, 43, 66, 51, 62, 47, 68, 55, 72, 58, 65, 50, 67, 56, 69]
  },
  {
    label: 'BLOOD OXYGEN',
    value: '98',
    unit: '% SpO₂',
    icon: Waves,
    color: 'blue',
    data: [55, 62, 52, 69, 58, 72, 64, 77, 62, 70, 59, 76, 68, 82, 70, 77, 67, 80]
  },
  {
    label: 'BODY TEMPERATURE',
    value: '36.8',
    unit: '°C',
    icon: Thermometer,
    color: 'amber',
    data: [48, 50, 49, 53, 51, 52, 50, 54, 52, 55, 53, 52, 56, 54, 55, 53, 54, 55]
  }
]

export const baselineReference = {
  'Heart rate': 66,
  'Oxygen saturation': 98,
  'Temperature': 36.7,
  'Blood pressure': '112/72',
  'Glucose': 92
}

export const initialConnectSamples = [
  { label: 'Heart rate', value: 68, unit: 'bpm', icon: HeartPulse, color: 'cyan' },
  { label: 'Oxygen saturation', value: 98, unit: '%', icon: Activity, color: 'blue' },
  { label: 'Temperature', value: 36.8, unit: '°C', icon: Zap, color: 'amber' },
  { label: 'Blood pressure', value: '114/74', unit: 'mmHg', icon: Activity, color: 'violet' },
  { label: 'Glucose', value: 94, unit: 'mg/dL', icon: Droplets, color: 'green' }
]

