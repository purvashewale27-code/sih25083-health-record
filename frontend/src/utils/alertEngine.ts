import type { Patient, Visit } from '../types';

export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'INFO';

export interface HealthAlert {
  id: string;
  patientId: string;
  patientName: string;
  healthId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: 'ALLERGY' | 'VISIT' | 'DIAGNOSIS' | 'RECORD';
  createdAt: string;
}

/**
 * Deterministic rule-based alert engine.
 * Computes active health alerts for a single patient based on clinical record data.
 */
export function calculatePatientAlerts(patient: Patient): HealthAlert[] {
  const alerts: HealthAlert[] = [];

  // Rule 1: High Severity / Active Allergies
  if (patient.allergies && patient.allergies.length > 0) {
    const highSeverityAllergies = patient.allergies.filter((a) => a.severity === 'HIGH');
    if (highSeverityAllergies.length > 0) {
      alerts.push({
        id: `alert-allergy-${patient.id}`,
        patientId: patient.id,
        patientName: patient.fullName,
        healthId: patient.healthId,
        title: 'Severe Allergy Warning',
        description: `Patient has ${highSeverityAllergies.length} high-severity allergy alert(s): ${highSeverityAllergies.map((a) => a.allergen).join(', ')}.`,
        severity: 'HIGH',
        category: 'ALLERGY',
        createdAt: new Date().toISOString(),
      });
    } else {
      alerts.push({
        id: `alert-allergy-mod-${patient.id}`,
        patientId: patient.id,
        patientName: patient.fullName,
        healthId: patient.healthId,
        title: 'Known Allergy Record',
        description: `Recorded allergies: ${patient.allergies.map((a) => a.allergen).join(', ')}.`,
        severity: 'MEDIUM',
        category: 'ALLERGY',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Rule 2: Frequent Encounters (2 or more visits)
  if (patient.visits && patient.visits.length >= 2) {
    alerts.push({
      id: `alert-visits-${patient.id}`,
      patientId: patient.id,
      patientName: patient.fullName,
      healthId: patient.healthId,
      title: 'Frequent Clinical Encounters',
      description: `Patient has ${patient.visits.length} recorded consultations across Kerala facilities. Review treatment plan.`,
      severity: 'MEDIUM',
      category: 'VISIT',
      createdAt: new Date().toISOString(),
    });
  }

  // Rule 3: Active Recent Clinical Diagnosis
  if (patient.visits && patient.visits.length > 0) {
    const latestVisit = patient.visits[0];
    if (latestVisit.diagnosis) {
      alerts.push({
        id: `alert-diag-${patient.id}`,
        patientId: patient.id,
        patientName: patient.fullName,
        healthId: patient.healthId,
        title: 'Active Clinical Diagnosis',
        description: `Latest Diagnosis (${new Date(latestVisit.visitDate).toLocaleDateString()}): ${latestVisit.diagnosis}`,
        severity: 'MEDIUM',
        category: 'DIAGNOSIS',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Rule 4: Incomplete Health Record (Missing Emergency Contact or Phone)
  if (!patient.emergencyContactName || !patient.phone) {
    const missingFields = [];
    if (!patient.phone) missingFields.push('Contact Phone');
    if (!patient.emergencyContactName) missingFields.push('Emergency Contact');

    alerts.push({
      id: `alert-record-${patient.id}`,
      patientId: patient.id,
      patientName: patient.fullName,
      healthId: patient.healthId,
      title: 'Incomplete Health Profile',
      description: `Missing details: ${missingFields.join(', ')}. Update profile.`,
      severity: 'INFO',
      category: 'RECORD',
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}

/**
 * Calculates aggregate health system alerts across all patients and visits.
 */
export function calculateSystemAlerts(patients: Patient[], _visits?: Visit[]): {
  totalAlerts: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  infoSeverityCount: number;
  alertsList: HealthAlert[];
} {
  const allAlerts: HealthAlert[] = [];

  patients.forEach((patient) => {
    const pAlerts = calculatePatientAlerts(patient);
    allAlerts.push(...pAlerts);
  });

  const highSeverityCount = allAlerts.filter((a) => a.severity === 'HIGH').length;
  const mediumSeverityCount = allAlerts.filter((a) => a.severity === 'MEDIUM').length;
  const infoSeverityCount = allAlerts.filter((a) => a.severity === 'INFO').length;

  return {
    totalAlerts: allAlerts.length,
    highSeverityCount,
    mediumSeverityCount,
    infoSeverityCount,
    alertsList: allAlerts,
  };
}
