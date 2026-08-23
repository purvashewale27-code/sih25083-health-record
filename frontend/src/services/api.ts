import type {
  ApiResponse,
  Patient,
  Visit,
  Prescription,
  Allergy,
  LabReport,
  HealthcareFacility,
  User,
} from '../types';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://sih25083-health-record.onrender.com/api';
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const targetUrl = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
    } catch (primaryErr) {
      // Windows IPv6 ::1 resolution fallback: If fetching http://localhost:5000 fails, retry with http://127.0.0.1:5000
      if (targetUrl.includes('localhost')) {
        const fallbackUrl = targetUrl.replace('localhost', '127.0.0.1');
        response = await fetch(fallbackUrl, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });
      } else {
        throw primaryErr;
      }
    }

    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status} error occurred.`,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error: Server is unreachable.',
    };
  }
}

// --- Health Service ---
export const apiCheckHealth = () => fetchApi<{ status: string }>('/health');

// --- Patient Services ---
export const apiGetPatients = () => fetchApi<Patient[]>('/patients');
export const apiGetPatientById = (id: string) => fetchApi<Patient>(`/patients/${id}`);
export const apiCreatePatient = (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) =>
  fetchApi<Patient>('/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const apiUpdatePatient = (id: string, data: Partial<Patient>) =>
  fetchApi<Patient>(`/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const apiDeletePatient = (id: string) =>
  fetchApi<{ message: string }>(`/patients/${id}`, {
    method: 'DELETE',
  });

// --- Visit Services ---
export const apiGetVisits = () => fetchApi<Visit[]>('/visits');
export const apiGetVisitById = (id: string) => fetchApi<Visit>(`/visits/${id}`);
export const apiCreateVisit = (data: {
  patientId: string;
  doctorId: string;
  facilityId: string;
  chiefComplaint: string;
  diagnosis?: string;
  bloodPressure?: string;
  temperature?: string;
  pulse?: string;
  weight?: string;
  doctorNotes?: string;
}) =>
  fetchApi<Visit>('/visits', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// --- Prescription Services ---
export const apiGetPrescriptions = (visitId?: string) =>
  fetchApi<Prescription[]>(`/prescriptions${visitId ? `?visitId=${visitId}` : ''}`);
export const apiCreatePrescription = (data: {
  visitId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}) =>
  fetchApi<Prescription>('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// --- Allergy Services ---
export const apiGetPatientAllergies = (patientId: string) =>
  fetchApi<Allergy[]>(`/patients/${patientId}/allergies`);
export const apiCreatePatientAllergy = (patientId: string, data: { allergen: string; severity: string }) =>
  fetchApi<Allergy>(`/patients/${patientId}/allergies`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// --- Lab Report Services ---
export const apiGetPatientLabReports = (patientId: string) =>
  fetchApi<LabReport[]>(`/patients/${patientId}/lab-reports`);
export const apiCreatePatientLabReport = (
  patientId: string,
  data: { testName: string; result: string; reportDate?: string; visitId?: string }
) =>
  fetchApi<LabReport>(`/patients/${patientId}/lab-reports`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

// --- Facility Services ---
export const apiGetFacilities = () => fetchApi<HealthcareFacility[]>('/facilities');
export const apiCreateFacility = (data: Omit<HealthcareFacility, 'id' | 'createdAt'>) =>
  fetchApi<HealthcareFacility>('/facilities', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// --- User Services ---
export const apiGetUsers = () => fetchApi<User[]>('/users');
export const apiCreateUser = (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) =>
  fetchApi<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// --- Follow-Up Services ---
export interface FollowUpRecord {
  id: string;
  followUpId: string;
  patientId: string;
  status: string;
  completedAt?: string | null;
  createdAt: string;
}

export const apiGetFollowUps = () => fetchApi<FollowUpRecord[]>('/followups');
export const apiUpdateFollowUpStatus = (followUpId: string, data: { patientId?: string; status: string }) =>
  fetchApi<FollowUpRecord>(`/followups/${followUpId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
