import React, { useState, useEffect, useCallback } from 'react';
import type { Patient } from '../types';
import {
  apiGetPatientById,
  apiCreatePatientAllergy,
  apiCreatePatientLabReport,
} from '../services/api';
import { calculatePatientAlerts } from '../utils/alertEngine';
import { generateQRCodeSVG, formatOfficialHealthId, getScannableQRImageUrl } from '../utils/qrGenerator';
import { InsuranceAssistanceModal } from './InsuranceAssistanceModal';
import { AudioPrescriptionPlayer } from './AudioPrescriptionPlayer';

interface PatientDetailModalProps {
  patientId: string;
  onClose: () => void;
}

export type TimelineEventType = 'REGISTRATION' | 'VISIT' | 'LAB_REPORT' | 'PRESCRIPTION' | 'ALERT';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  subtitle?: string;
  facilityName?: string;
  description: string;
  badgeText?: string;
  badgeSeverity?: 'HIGH' | 'MEDIUM' | 'INFO' | 'SUCCESS';
  details?: Record<string, string | null | undefined>;
}

export function buildPatientTimeline(patient: Patient): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Registration Event
  events.push({
    id: `reg-${patient.id}`,
    type: 'REGISTRATION',
    date: patient.createdAt,
    title: 'Digital Health Profile Registered',
    subtitle: `Official Health ID: ${formatOfficialHealthId(patient.healthId, patient.createdAt)}`,
    description: `Migrant worker registered in Kerala Migrant Health Portal (${patient.stateOfOrigin} → ${patient.currentDistrict} District).`,
    badgeText: 'REGISTRATION',
    badgeSeverity: 'SUCCESS',
  });

  // 2. Clinical Visits & Prescriptions
  if (patient.visits) {
    patient.visits.forEach((visit) => {
      events.push({
        id: `visit-${visit.id}`,
        type: 'VISIT',
        date: visit.visitDate,
        title: `Clinical Encounter — ${visit.chiefComplaint}`,
        subtitle: `Dr. ${visit.doctor?.name || 'Medical Officer'} @ ${visit.facility?.name || 'Healthcare Facility'}`,
        facilityName: visit.facility?.name,
        description: visit.diagnosis
          ? `Diagnosis: ${visit.diagnosis}`
          : `Consultation conducted for ${visit.chiefComplaint}.`,
        badgeText: 'CLINICAL VISIT',
        details: {
          BP: visit.bloodPressure,
          Temp: visit.temperature,
          Pulse: visit.pulse,
          Weight: visit.weight,
        },
      });

      if (visit.prescriptions) {
        visit.prescriptions.forEach((rx) => {
          events.push({
            id: `rx-${rx.id}`,
            type: 'PRESCRIPTION',
            date: visit.visitDate,
            title: `Rx Prescribed: ${rx.medicineName}`,
            subtitle: `Dosage: ${rx.dosage} (${rx.frequency})`,
            description: `Prescribed for ${rx.duration} by attending medical officer.`,
            badgeText: 'PRESCRIPTION',
          });
        });
      }
    });
  }

  // 3. Lab Reports
  if (patient.labReports) {
    patient.labReports.forEach((report) => {
      events.push({
        id: `lab-${report.id}`,
        type: 'LAB_REPORT',
        date: report.reportDate,
        title: `Lab Diagnostic — ${report.testName}`,
        subtitle: `Result Summary: ${report.result}`,
        description: `Diagnostic test report uploaded to patient health profile.`,
        badgeText: 'LAB REPORT',
      });
    });
  }

  // 4. Health Alerts
  const calculatedAlerts = calculatePatientAlerts(patient);
  calculatedAlerts.forEach((alert) => {
    events.push({
      id: `alert-${alert.id}`,
      type: 'ALERT',
      date: alert.createdAt,
      title: alert.title,
      subtitle: `Health Risk Alert (${alert.severity})`,
      description: alert.description,
      badgeText: alert.severity,
      badgeSeverity: alert.severity,
    });
  });

  // Sort newest first
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab ('OVERVIEW' | 'TIMELINE')
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMELINE'>('OVERVIEW');

  // Timeline Filter state ('ALL' | 'VISITS' | 'LABS' | 'RX' | 'ALERTS')
  const [timelineFilter, setTimelineFilter] = useState<'ALL' | 'VISITS' | 'LABS' | 'RX' | 'ALERTS'>('ALL');

  // Emergency Modal state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [allergen, setAllergen] = useState('');
  const [severity, setSeverity] = useState('HIGH');

  const [showLabForm, setShowLabForm] = useState(false);
  const [testName, setTestName] = useState('');
  const [testResult, setTestResult] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadPatientData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await apiGetPatientById(patientId);
    if (res.success && res.data) {
      setPatient(res.data);
    } else {
      setError(res.error || 'Failed to load patient health record.');
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergen) return;
    setFormSubmitting(true);
    const res = await apiCreatePatientAllergy(patientId, { allergen, severity });
    setFormSubmitting(false);
    if (res.success) {
      setAllergen('');
      setShowAllergyForm(false);
      loadPatientData();
    } else {
      alert(res.error || 'Failed to add allergy alert');
    }
  };

  const handleAddLabReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName || !testResult) return;
    setFormSubmitting(true);
    const res = await apiCreatePatientLabReport(patientId, { testName, result: testResult });
    setFormSubmitting(false);
    if (res.success) {
      setTestName('');
      setTestResult('');
      setShowLabForm(false);
      loadPatientData();
    } else {
      alert(res.error || 'Failed to add lab report');
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const calculatedAlerts = patient ? calculatePatientAlerts(patient) : [];
  const officialHealthId = patient ? formatOfficialHealthId(patient.healthId, patient.createdAt) : '';
  // Encode live public portal link into QR code so scanning with any phone camera opens the verified record
  const liveVerificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?verify=${encodeURIComponent(patient?.healthId || officialHealthId)}`
    : `https://sih25083-health-record.vercel.app/?verify=${encodeURIComponent(patient?.healthId || officialHealthId)}`;
  const qrCodeImageUrl = getScannableQRImageUrl(liveVerificationUrl, 200);
  const qrCodeSvg = patient ? generateQRCodeSVG(officialHealthId, 110) : '';

  const allTimelineEvents = patient ? buildPatientTimeline(patient) : [];

  const filteredTimelineEvents = allTimelineEvents.filter((ev) => {
    if (timelineFilter === 'VISITS') return ev.type === 'VISIT';
    if (timelineFilter === 'LABS') return ev.type === 'LAB_REPORT';
    if (timelineFilter === 'RX') return ev.type === 'PRESCRIPTION';
    if (timelineFilter === 'ALERTS') return ev.type === 'ALERT';
    return true;
  });

  const lastVisit = patient?.visits && patient.visits.length > 0 ? patient.visits[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-[#DDE8E8] rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#16313A] print:max-w-none print:border-none print:shadow-none">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#DDE8E8] flex items-center justify-between bg-[#F8FAFA] gap-4 flex-wrap print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F0FAF8] text-[#61747B] hover:text-[#16313A] rounded-xl text-xs font-medium border border-[#DDE8E8] transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Back to Patients</span>
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#16313A] tracking-tight">
                  {patient ? patient.fullName : 'Patient Health Record'}
                </h2>
                <span className="inline-block px-2.5 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-xs font-mono font-semibold rounded-md border border-[#00A99D]/30">
                  {officialHealthId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#F8FAFA] p-1 rounded-xl border border-[#DDE8E8] text-xs">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-white text-[#00A99D] font-semibold shadow-xs border border-[#DDE8E8]'
                    : 'text-[#61747B] hover:text-[#16313A]'
                }`}
              >
                Health Record
              </button>
              <button
                onClick={() => setActiveTab('TIMELINE')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'TIMELINE'
                    ? 'bg-white text-[#00A99D] font-semibold shadow-xs border border-[#DDE8E8]'
                    : 'text-[#61747B] hover:text-[#16313A]'
                }`}
              >
                Health Timeline ({allTimelineEvents.length})
              </button>
            </div>

            <button
              onClick={handlePrintSummary}
              className="px-3 py-1.5 bg-white hover:bg-[#F0FAF8] text-[#16313A] border border-[#DDE8E8] rounded-xl text-xs font-medium transition-colors"
              title="Print Summary"
            >
              🖨️ Print
            </button>

            {patient && (
              <>
                <button
                  onClick={() => setShowInsuranceModal(true)}
                  className="px-3 py-1.5 bg-[#E8F8F6] hover:bg-[#d5f3ee] text-[#00A99D] font-semibold border border-[#00A99D]/30 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>🛡️</span>
                  <span>AWAZ / Insurance</span>
                </button>

                <button
                  onClick={() => setShowEmergencyModal(true)}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-200 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>🚨 Emergency Access</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="text-[#61747B] hover:text-[#16313A] p-2 rounded-xl bg-white hover:bg-[#F0FAF8] transition-colors border border-[#DDE8E8]"
              title="Close view"
            >
              ✕
            </button>
          </div>
        </div>

        {/* View Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#16313A]">
          {loading && (
            <div className="text-center py-16 text-[#61747B]">
              <div className="inline-block animate-spin h-8 w-8 border-2 border-[#00A99D] border-t-transparent rounded-full mb-3" />
              <p className="text-sm">Fetching complete health record from Supabase...</p>
            </div>
          )}

          {error && (
            <div className="p-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center">
              ⚠️ {error}
            </div>
          )}

          {patient && activeTab === 'OVERVIEW' && (
            <>
              {/* OFFICIAL PORTABLE DIGITAL HEALTH ID CARD & QR CODE */}
              <div className="bg-gradient-to-r from-white via-[#F0FAF8] to-[#E8F8F6] p-6 rounded-3xl border border-[#00A99D]/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#00A99D] animate-pulse" />
                    <span className="text-xs font-semibold text-[#00A99D] uppercase tracking-widest font-mono">
                      Official Portable Digital Health ID Card
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-[#16313A] tracking-tight">{patient.fullName}</h3>
                    <p className="text-[#00A99D] font-mono text-base font-bold mt-0.5">
                      {officialHealthId} <span className="text-xs text-[#61747B] font-normal">({patient.healthId})</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-[#DDE8E8]">
                    <div>
                      <span className="text-[#61747B] block">Origin State:</span>
                      <span className="font-semibold text-[#16313A]">{patient.stateOfOrigin}</span>
                    </div>
                    <div>
                      <span className="text-[#61747B] block">Kerala District:</span>
                      <span className="font-semibold text-[#00A99D]">{patient.currentDistrict}</span>
                    </div>
                    <div>
                      <span className="text-[#61747B] block">Registration Date:</span>
                      <span className="font-mono text-[#16313A]">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code Graphic */}
                <div className="flex flex-col items-center gap-2 bg-white p-3.5 rounded-2xl border border-[#DDE8E8] text-center shadow-xs">
                  <div className="relative w-[130px] h-[130px] flex items-center justify-center bg-white p-1 rounded-xl border border-[#DDE8E8]">
                    <img
                      src={qrCodeImageUrl}
                      alt={`QR Code for ${officialHealthId}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback to inline SVG if network is disconnected
                        (e.currentTarget.parentElement as HTMLElement).innerHTML = qrCodeSvg;
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#00A99D] font-mono tracking-wider font-bold">
                    SCAN WITH PHONE CAMERA
                  </span>
                </div>
              </div>

              {/* SECTION: RULE-BASED HEALTH & FOLLOW-UP ALERTS */}
              {calculatedAlerts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider flex items-center gap-2">
                    <span>⚠️ Calculated Health Risk Alerts</span>
                    <span className="text-[11px] bg-[#E8F8F6] text-[#00A99D] px-2 py-0.5 rounded-full font-mono font-semibold">
                      {calculatedAlerts.length} Active
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {calculatedAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                          alert.severity === 'HIGH'
                            ? 'bg-rose-50 border-rose-200 text-rose-800'
                            : alert.severity === 'MEDIUM'
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-sky-50 border-sky-200 text-sky-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            {alert.severity === 'HIGH'
                              ? '🔴'
                              : alert.severity === 'MEDIUM'
                              ? '🟡'
                              : '🔵'}{' '}
                            {alert.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded bg-white border border-[#DDE8E8]">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-[#61747B] leading-snug">{alert.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DEMOGRAPHICS & CONTACTS */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider">
                  Patient Profile Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-[#DDE8E8] shadow-xs">
                  <div>
                    <span className="text-xs text-[#61747B] uppercase tracking-wider block">Full Name</span>
                    <span className="font-bold text-[#16313A]">{patient.fullName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#61747B] uppercase tracking-wider block">Gender / DOB</span>
                    <span className="font-medium text-[#16313A]">
                      {patient.gender} • {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#61747B] uppercase tracking-wider block">State of Origin</span>
                    <span className="font-medium text-[#16313A]">{patient.stateOfOrigin}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#61747B] uppercase tracking-wider block">Kerala District</span>
                    <span className="font-medium text-[#00A99D]">{patient.currentDistrict}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#61747B] uppercase tracking-wider block">Preferred Language</span>
                    <span className="font-medium text-[#16313A]">{patient.preferredLanguage}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#61747B] uppercase tracking-wider block">Contact Phone</span>
                    <span className="font-mono text-[#16313A]">{patient.phone || 'Not provided'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-[#61747B] uppercase tracking-wider block">Emergency Contact</span>
                    <span className="font-medium text-[#16313A]">
                      {patient.emergencyContactName
                        ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || 'No phone'})`
                        : 'No emergency contact registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* MEDICAL SUMMARY & ALLERGY ALERTS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider flex items-center gap-2">
                    <span>Medical Summary & Allergy Alerts</span>
                    <span className="text-[11px] bg-[#F8FAFA] text-[#61747B] px-2 py-0.5 rounded-full font-mono border border-[#DDE8E8]">
                      {patient.allergies?.length || 0} Alert{patient.allergies?.length === 1 ? '' : 's'}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowAllergyForm(!showAllergyForm)}
                    className="text-xs px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors font-medium"
                  >
                    {showAllergyForm ? 'Cancel' : '+ Add Allergy Alert'}
                  </button>
                </div>

                {showAllergyForm && (
                  <form onSubmit={handleAddAllergy} className="bg-[#F8FAFA] p-4 rounded-2xl border border-rose-200 flex flex-wrap gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Allergen (e.g. Penicillin, Sulfa, Dust)"
                      value={allergen}
                      onChange={(e) => setAllergen(e.target.value)}
                      className="bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] text-xs flex-1 min-w-[200px]"
                      required
                    />
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] text-xs"
                    >
                      <option value="LOW">LOW Severity</option>
                      <option value="MEDIUM">MEDIUM Severity</option>
                      <option value="HIGH">HIGH Severity</option>
                    </select>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 shadow"
                    >
                      Save Alert
                    </button>
                  </form>
                )}

                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {patient.allergies.map((allergy) => (
                      <span
                        key={allergy.id}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium border ${
                          allergy.severity === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : allergy.severity === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-[#F8FAFA] text-[#16313A] border-[#DDE8E8]'
                        }`}
                      >
                        <span>⛔ {allergy.allergen}</span>
                        <span className="text-[10px] uppercase font-bold opacity-80 font-mono">({allergy.severity})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#F8FAFA] rounded-2xl border border-[#DDE8E8] text-xs text-[#61747B] italic">
                    No known allergy alerts or medical restrictions recorded for this patient.
                  </div>
                )}
              </div>

              {/* CLINICAL VISIT HISTORY */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider flex items-center gap-2">
                    <span>Clinical Encounters & Consultations</span>
                    <span className="text-[11px] bg-[#F8FAFA] text-[#61747B] px-2 py-0.5 rounded-full font-mono border border-[#DDE8E8]">
                      {patient.visits?.length || 0} Visit{patient.visits?.length === 1 ? '' : 's'}
                    </span>
                  </h3>
                </div>

                {patient.visits && patient.visits.length > 0 ? (
                  <div className="space-y-4">
                    {patient.visits.map((visit) => (
                      <div key={visit.id} className="bg-white p-5 rounded-2xl border border-[#DDE8E8] space-y-3 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between text-xs border-b border-[#DDE8E8] pb-3 gap-2">
                          <span className="font-bold text-[#00A99D] flex items-center gap-1.5">
                            <span>🗓️</span>
                            <span>{new Date(visit.visitDate).toLocaleDateString()}</span>
                          </span>
                          <span className="text-[#16313A] font-medium">
                            Dr. {visit.doctor?.name || 'Medical Officer'} • {visit.facility?.name}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[#61747B] block mb-0.5">Chief Complaint</span>
                            <p className="text-[#16313A] font-medium bg-[#F8FAFA] p-2.5 rounded-xl border border-[#DDE8E8]">
                              {visit.chiefComplaint}
                            </p>
                          </div>

                          <div>
                            <span className="text-[#61747B] block mb-0.5">Diagnosis</span>
                            <p className="text-[#00A99D] font-medium bg-[#F8FAFA] p-2.5 rounded-xl border border-[#DDE8E8]">
                              {visit.diagnosis || 'No formal diagnosis specified'}
                            </p>
                          </div>
                        </div>

                        {(visit.bloodPressure || visit.temperature || visit.pulse || visit.weight) && (
                          <div className="flex flex-wrap gap-4 text-xs bg-[#F8FAFA] p-3 rounded-xl border border-[#DDE8E8] text-[#61747B] font-mono">
                            {visit.bloodPressure && <span>BP: <strong className="text-[#16313A]">{visit.bloodPressure}</strong></span>}
                            {visit.temperature && <span>Temp: <strong className="text-[#16313A]">{visit.temperature}</strong></span>}
                            {visit.pulse && <span>Pulse: <strong className="text-[#16313A]">{visit.pulse.toLowerCase().includes('bpm') ? visit.pulse : `${visit.pulse} bpm`}</strong></span>}
                            {visit.weight && <span>Weight: <strong className="text-[#16313A]">{visit.weight}</strong></span>}
                          </div>
                        )}

                        {visit.prescriptions && visit.prescriptions.length > 0 && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-[#61747B] font-semibold uppercase tracking-wider block">
                                Prescribed Medications (Rx)
                              </span>
                              <AudioPrescriptionPlayer
                                language={patient.preferredLanguage || 'Hindi'}
                                textToSpeak={`Medicine instructions: ${visit.prescriptions
                                  .map((p) => `${p.medicineName}, dosage ${p.dosage}, take ${p.frequency} for ${p.duration}`)
                                  .join('. ')}. Doctor notes: ${visit.doctorNotes || 'Take rest and drink clean water.'}`}
                              />
                            </div>
                            <div className="space-y-1.5">
                              {visit.prescriptions.map((p) => (
                                <div key={p.id} className="text-xs bg-[#F8FAFA] px-3.5 py-2 rounded-xl border border-[#DDE8E8] text-[#16313A] flex flex-wrap justify-between gap-2">
                                  <span className="font-semibold text-[#00A99D]">💊 {p.medicineName} ({p.dosage})</span>
                                  <span className="text-[#61747B] font-mono">{p.frequency} — {p.duration}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#F8FAFA] rounded-2xl border border-[#DDE8E8] text-xs text-[#61747B] italic">
                    No clinical visit records logged yet for this worker.
                  </div>
                )}
              </div>

              {/* LAB REPORTS & DIAGNOSTICS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider flex items-center gap-2">
                    <span>Lab Diagnostic Reports</span>
                    <span className="text-[11px] bg-[#F8FAFA] text-[#61747B] px-2 py-0.5 rounded-full font-mono border border-[#DDE8E8]">
                      {patient.labReports?.length || 0} Report{patient.labReports?.length === 1 ? '' : 's'}
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowLabForm(!showLabForm)}
                    className="text-xs px-3 py-1 bg-[#E8F8F6] text-[#00A99D] border border-[#00A99D]/30 rounded-xl hover:bg-[#d5f3ee] transition-colors font-medium"
                  >
                    {showLabForm ? 'Cancel' : '+ Add Lab Report'}
                  </button>
                </div>

                {showLabForm && (
                  <form onSubmit={handleAddLabReport} className="bg-[#F8FAFA] p-4 rounded-2xl border border-[#00A99D]/30 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Test Name (e.g. Complete Blood Count, Malaria Smear)"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        className="bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] text-xs"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Result Summary (e.g. Negative, Hb 12.5 g/dL)"
                        value={testResult}
                        onChange={(e) => setTestResult(e.target.value)}
                        className="bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] text-xs"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-4 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-xl text-xs font-semibold disabled:opacity-50 shadow-sm"
                    >
                      Save Lab Report
                    </button>
                  </form>
                )}

                {patient.labReports && patient.labReports.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {patient.labReports.map((report) => (
                      <div key={report.id} className="bg-white p-4 rounded-2xl border border-[#DDE8E8] text-xs space-y-2 shadow-xs">
                        <div className="flex justify-between font-bold text-[#16313A]">
                          <span>🧪 {report.testName}</span>
                          <span className="text-[#61747B] font-mono text-[11px]">
                            {new Date(report.reportDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[#00A99D] font-mono bg-[#F8FAFA] p-2.5 rounded-xl border border-[#DDE8E8]">
                          {report.result}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#F8FAFA] rounded-2xl border border-[#DDE8E8] text-xs text-[#61747B] italic">
                    No lab diagnostic reports uploaded for this patient.
                  </div>
                )}
              </div>
            </>
          )}

          {/* CHRONOLOGICAL PATIENT HEALTH TIMELINE */}
          {patient && activeTab === 'TIMELINE' && (
            <div className="space-y-6">
              {/* Header Title & ID */}
              <div className="bg-[#F8FAFA] p-5 rounded-2xl border border-[#DDE8E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#16313A] tracking-tight">{patient.fullName}</h3>
                  <p className="text-xs text-[#00A99D] font-mono">{officialHealthId} • Complete Health Journey Timeline</p>
                </div>
                <span className="text-xs bg-white text-[#16313A] px-3 py-1 rounded-xl border border-[#DDE8E8] font-mono">
                  {allTimelineEvents.length} Total Chronological Events
                </span>
              </div>

              {/* Compact Dynamic Summary Cards Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-[#DDE8E8] space-y-1 shadow-xs">
                  <span className="text-[#61747B] uppercase tracking-wider text-[10px] font-semibold">Total Visits</span>
                  <p className="text-2xl font-extrabold text-[#16313A]">{patient.visits?.length || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#DDE8E8] space-y-1 shadow-xs">
                  <span className="text-[#61747B] uppercase tracking-wider text-[10px] font-semibold">Lab Reports</span>
                  <p className="text-2xl font-extrabold text-[#3B82A0]">{patient.labReports?.length || 0}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#DDE8E8] space-y-1 shadow-xs">
                  <span className="text-[#61747B] uppercase tracking-wider text-[10px] font-semibold">Active Alerts</span>
                  <p className="text-2xl font-extrabold text-[#E6A23C]">{calculatedAlerts.length}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#DDE8E8] space-y-1 shadow-xs">
                  <span className="text-[#61747B] uppercase tracking-wider text-[10px] font-semibold">Last Visit</span>
                  <p className="text-sm font-bold text-[#00A99D] font-mono">
                    {lastVisit ? new Date(lastVisit.visitDate).toLocaleDateString() : 'No Visits'}
                  </p>
                </div>
              </div>

              {/* Timeline Filter Controls */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-[#DDE8E8] pb-4">
                <span className="text-xs text-[#61747B] font-semibold uppercase tracking-wider mr-2">Filter Timeline:</span>
                {(['ALL', 'VISITS', 'LABS', 'RX', 'ALERTS'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimelineFilter(filter)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                      timelineFilter === filter
                        ? 'bg-[#00A99D] text-white shadow-xs'
                        : 'bg-white text-[#61747B] hover:text-[#16313A] border border-[#DDE8E8]'
                    }`}
                  >
                    {filter === 'ALL' && `All (${allTimelineEvents.length})`}
                    {filter === 'VISITS' && `Visits (${patient.visits?.length || 0})`}
                    {filter === 'LABS' && `Lab Reports (${patient.labReports?.length || 0})`}
                    {filter === 'RX' && `Prescriptions`}
                    {filter === 'ALERTS' && `Alerts (${calculatedAlerts.length})`}
                  </button>
                ))}
              </div>

              {/* Chronological Vertical Timeline List */}
              {filteredTimelineEvents.length === 0 ? (
                <div className="text-center py-16 bg-[#F8FAFA] rounded-2xl border border-[#DDE8E8] text-[#61747B]">
                  <p className="text-sm">No timeline events match the selected filter category.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-[#DDE8E8] ml-4 pl-6 space-y-6">
                  {filteredTimelineEvents.map((ev) => (
                    <div key={ev.id} className="relative group">
                      {/* Event Dot Icon */}
                      <span
                        className={`absolute -left-[35px] top-1 h-7 w-7 rounded-full flex items-center justify-center text-xs border shadow-xs ${
                          ev.type === 'VISIT'
                            ? 'bg-[#E8F8F6] text-[#00A99D] border-[#00A99D]/40'
                            : ev.type === 'LAB_REPORT'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : ev.type === 'PRESCRIPTION'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : ev.type === 'ALERT'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {ev.type === 'VISIT' && '📋'}
                        {ev.type === 'LAB_REPORT' && '🧪'}
                        {ev.type === 'PRESCRIPTION' && '💊'}
                        {ev.type === 'ALERT' && '⚠️'}
                        {ev.type === 'REGISTRATION' && '🆔'}
                      </span>

                      {/* Event Card */}
                      <div className="bg-white p-5 rounded-2xl border border-[#DDE8E8] space-y-2 shadow-xs hover:border-[#00A99D]/50 transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE8E8] pb-2">
                          <span className="font-bold text-[#16313A] text-sm tracking-tight">{ev.title}</span>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-[#61747B]">🗓️ {new Date(ev.date).toLocaleDateString()}</span>
                            {ev.badgeText && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  ev.badgeSeverity === 'HIGH'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : ev.badgeSeverity === 'MEDIUM'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-[#E8F8F6] text-[#00A99D] border-[#00A99D]/30'
                                }`}
                              >
                                {ev.badgeText}
                              </span>
                            )}
                          </div>
                        </div>

                        {ev.subtitle && (
                          <p className="text-xs text-[#61747B] font-medium">{ev.subtitle}</p>
                        )}

                        <p className="text-xs text-[#61747B] leading-relaxed">{ev.description}</p>

                        {ev.details && (
                          <div className="flex flex-wrap gap-3 text-[11px] font-mono bg-[#F8FAFA] p-2 rounded-xl border border-[#DDE8E8] text-[#61747B] mt-2">
                            {ev.details.BP && <span>BP: <strong className="text-[#16313A]">{ev.details.BP}</strong></span>}
                            {ev.details.Temp && <span>Temp: <strong className="text-[#16313A]">{ev.details.Temp}</strong></span>}
                            {ev.details.Pulse && <span>Pulse: <strong className="text-[#16313A]">{ev.details.Pulse}</strong></span>}
                            {ev.details.Weight && <span>Weight: <strong className="text-[#16313A]">{ev.details.Weight}</strong></span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* EMERGENCY ACCESS SUMMARY MODAL */}
      {showEmergencyModal && patient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-[#16313A]">
            <div className="flex items-center justify-between border-b border-rose-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                <div>
                  <h3 className="text-lg font-bold text-rose-700">Emergency Medical Access Summary</h3>
                  <p className="text-xs text-rose-600 font-mono">Authorized Medical Officer Rapid Summary</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-[#61747B] hover:text-[#16313A] p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200 space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-[#16313A] text-base">{patient.fullName}</span>
                  <span className="text-[#00A99D] font-mono">{officialHealthId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#16313A]">
                  <div>Gender / DOB: <strong>{patient.gender} • {new Date(patient.dateOfBirth).toLocaleDateString()}</strong></div>
                  <div>Origin: <strong>{patient.stateOfOrigin} ({patient.currentDistrict})</strong></div>
                  <div>Emergency Contact: <strong>{patient.emergencyContactName || 'None'} ({patient.emergencyContactPhone || 'N/A'})</strong></div>
                  <div>Contact Phone: <strong>{patient.phone || 'N/A'}</strong></div>
                </div>
              </div>

              {/* Critical Allergy Warnings */}
              <div>
                <span className="text-rose-700 font-bold uppercase tracking-wider block mb-1.5">
                  Critical Allergy Warnings
                </span>
                {patient.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((a) => (
                      <span
                        key={a.id}
                        className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-xl font-bold font-mono"
                      >
                        ⛔ {a.allergen} ({a.severity})
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#61747B] italic">No known allergy alerts registered.</p>
                )}
              </div>

              {/* Latest Clinical Encounter */}
              <div>
                <span className="text-[#00A99D] font-bold uppercase tracking-wider block mb-1.5">
                  Most Recent Clinical Encounter
                </span>
                {patient.visits && patient.visits.length > 0 ? (
                  <div className="bg-[#F8FAFA] p-3.5 rounded-xl border border-[#DDE8E8] space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#16313A]">{patient.visits[0].chiefComplaint}</span>
                      <span className="text-[#61747B] font-mono">{new Date(patient.visits[0].visitDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[#00A99D]">Diagnosis: {patient.visits[0].diagnosis || 'Unspecified'}</p>
                    <p className="text-[#61747B] text-[11px]">Facility: {patient.visits[0].facility?.name}</p>
                  </div>
                ) : (
                  <p className="text-[#61747B] italic">No clinical encounters recorded.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-5 py-2 bg-[#F8FAFA] text-[#16313A] rounded-xl text-xs font-semibold hover:bg-[#F0FAF8] border border-[#DDE8E8]"
              >
                Close Emergency Summary
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Insurance Assistance Modal */}
      {showInsuranceModal && patient && (
        <InsuranceAssistanceModal
          isOpen={showInsuranceModal}
          onClose={() => setShowInsuranceModal(false)}
          patient={patient}
        />
      )}
    </div>
  );
};
