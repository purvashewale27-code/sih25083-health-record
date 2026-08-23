export type UserRole = 'DOCTOR' | 'HEALTH_WORKER' | 'ADMIN';
export type FacilityType = 'PHC' | 'MOBILE_CAMP' | 'HOSPITAL';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  createdAt: string;
}

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  severity: Severity;
  createdAt: string;
}

export interface Prescription {
  id: string;
  visitId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  createdAt: string;
}

export interface LabReport {
  id: string;
  patientId: string;
  visitId?: string | null;
  testName: string;
  result: string;
  reportDate: string;
  createdAt: string;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  facilityId: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis?: string | null;
  bloodPressure?: string | null;
  temperature?: string | null;
  pulse?: string | null;
  weight?: string | null;
  doctorNotes?: string | null;
  createdAt: string;
  patient?: {
    id: string;
    healthId: string;
    fullName: string;
    createdAt?: string;
  };
  doctor?: {
    id: string;
    name: string;
    role: UserRole;
  };
  facility?: {
    id: string;
    name: string;
    type: FacilityType;
    district?: string;
  };
  prescriptions?: Prescription[];
  labReports?: LabReport[];
}

export interface Patient {
  id: string;
  healthId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone?: string | null;
  stateOfOrigin: string;
  currentDistrict: string;
  preferredLanguage: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  createdAt: string;
  updatedAt: string;
  allergies?: Allergy[];
  visits?: Visit[];
  labReports?: LabReport[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
