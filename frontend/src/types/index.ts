export type UserRole = 'DOCTOR' | 'HEALTH_WORKER' | 'ADMIN';
export type FacilityType = 'PHC' | 'MOBILE_CAMP' | 'HOSPITAL';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type DoctorSpecialization =
  | 'GENERAL_MEDICINE'
  | 'PULMONOLOGY'
  | 'DERMATOLOGY'
  | 'INFECTIOUS_DISEASE'
  | 'ORTHOPEDICS'
  | 'OCCUPATIONAL_HEALTH'
  | 'PEDIATRICS';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentStatus = 'INITIATED' | 'SUCCESS' | 'FAILED' | 'WAIVED';
export type PaymentMethod = 'UPI' | 'CARD' | 'CASH_AT_DESK' | 'AWAZ_INSURANCE_WAIVER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  specialization?: DoctorSpecialization | null;
  consultationFee?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  address?: string | null;
  contactPhone?: string | null;
  createdAt: string;
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  facilityId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  facility?: HealthcareFacility;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  facilityId: string;
  appointmentDate: string;
  slotTime: string;
  status: AppointmentStatus;
  reason: string;
  priority: Severity;
  notes?: string | null;
  createdAt: string;
  patient?: Patient;
  doctor?: User;
  facility?: HealthcareFacility;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  appointmentId?: string | null;
  patientId: string;
  amount: number;
  currency: string;
  orderId: string;
  paymentId?: string | null;
  signature?: string | null;
  status: PaymentStatus;
  method: PaymentMethod;
  waivedReason?: string | null;
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
    specialization?: DoctorSpecialization | null;
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
  insuranceScheme?: string | null;
  insuranceCardNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  allergies?: Allergy[];
  visits?: Visit[];
  labReports?: LabReport[];
  appointments?: Appointment[];
  payments?: Payment[];
}

export interface WelfareScheme {
  id: string;
  name: string;
  code: string;
  governingBody: string;
  healthCoverageAmount: string;
  accidentalBenefit: string;
  targetGroup: string;
  eligibilityRequirements: string[];
  coveredTreatments: string[];
  helplinePhone: string;
  officialPortalUrl: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
