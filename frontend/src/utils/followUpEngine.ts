import type { Patient } from '../types';
import { calculatePatientAlerts } from './alertEngine';
import { formatOfficialHealthId } from './qrGenerator';
import { apiUpdateFollowUpStatus, type FollowUpRecord } from '../services/api';

export type FollowUpStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface FollowUpItem {
  id: string;
  patientId: string;
  patientName: string;
  healthId: string;
  officialHealthId: string;
  reason: string;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  relatedDiagnosis?: string;
  dueDate: string;
  status: FollowUpStatus;
  createdAt: string;
  completedAt?: string | null;
  completedBy?: string | null;
}

export async function persistFollowUpStatus(followUpId: string, patientId: string, status: FollowUpStatus): Promise<boolean> {
  const res = await apiUpdateFollowUpStatus(followUpId, { patientId, status });
  return res.success;
}

/**
 * Calculates actionable follow-up tasks derived strictly from real Supabase patients and rule-based alerts,
 * merging backend persistent status records from PostgreSQL.
 */
export function generateFollowUpsFromPatients(
  patients: Patient[],
  backendRecords: FollowUpRecord[] = []
): FollowUpItem[] {
  const statusMap: Record<string, { status: FollowUpStatus; completedAt?: string | null }> = {};
  backendRecords.forEach((rec) => {
    statusMap[rec.followUpId] = {
      status: rec.status as FollowUpStatus,
      completedAt: rec.completedAt,
    };
  });

  const followUps: FollowUpItem[] = [];

  patients.forEach((patient) => {
    const alerts = calculatePatientAlerts(patient);
    const officialId = formatOfficialHealthId(patient.healthId, patient.createdAt);
    const latestVisit = patient.visits && patient.visits.length > 0 ? patient.visits[0] : null;

    alerts.forEach((alert) => {
      const followUpId = `fu-${alert.id}`;
      const saved = statusMap[followUpId];

      const baseDate = new Date(patient.createdAt);
      let daysToAdd = 7;
      if (alert.severity === 'HIGH') daysToAdd = 3;
      if (alert.severity === 'INFO') daysToAdd = 14;

      const dueDateObj = new Date(baseDate);
      dueDateObj.setDate(dueDateObj.getDate() + daysToAdd);

      followUps.push({
        id: followUpId,
        patientId: patient.id,
        patientName: patient.fullName,
        healthId: patient.healthId,
        officialHealthId: officialId,
        reason: alert.title,
        severity: alert.severity,
        relatedDiagnosis: latestVisit?.diagnosis || alert.description,
        dueDate: dueDateObj.toISOString(),
        status: saved?.status || 'PENDING',
        createdAt: alert.createdAt,
        completedAt: saved?.completedAt || null,
      });
    });
  });

  return followUps;
}

export function getFollowUpSummary(followUps: FollowUpItem[]) {
  const now = new Date();
  let overdue = 0;
  let dueSoon = 0;
  let pending = 0;
  let completed = 0;

  followUps.forEach((item) => {
    if (item.status === 'COMPLETED') {
      completed++;
    } else {
      pending++;
      const due = new Date(item.dueDate);
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays < 0) {
        overdue++;
      } else if (diffDays <= 7) {
        dueSoon++;
      }
    }
  });

  return {
    total: followUps.length,
    overdue,
    dueSoon,
    pending,
    completed,
  };
}
