import React, { useState, useEffect } from 'react';
import type { Visit, Patient, HealthcareFacility, User } from '../types';
import {
  apiGetVisits,
  apiCreateVisit,
  apiGetPatients,
  apiGetFacilities,
  apiGetUsers,
  apiCreatePrescription,
} from '../services/api';
import { formatOfficialHealthId } from '../utils/qrGenerator';

export const VisitsView: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');

  // Dropdown reference data for Modal
  const [patients, setPatients] = useState<Patient[]>([]);
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    facilityId: '',
    chiefComplaint: '',
    diagnosis: '',
    bloodPressure: '',
    temperature: '',
    pulse: '',
    weight: '',
    doctorNotes: '',
    medicineName: '',
    dosage: '',
    frequency: 'Once Daily',
    duration: '5 Days',
  });

  const loadVisitsData = async () => {
    setLoading(true);
    setError(null);
    const [vRes, pRes, fRes, uRes] = await Promise.all([
      apiGetVisits(),
      apiGetPatients(),
      apiGetFacilities(),
      apiGetUsers(),
    ]);

    if (vRes.success && vRes.data) {
      setVisits(vRes.data);
    } else {
      setError(vRes.error || 'Failed to load clinical encounters.');
    }

    if (pRes.success && pRes.data) setPatients(pRes.data);
    if (fRes.success && fRes.data) setFacilities(fRes.data);
    if (uRes.success && uRes.data) setDoctors(uRes.data);

    setLoading(false);
  };

  useEffect(() => {
    loadVisitsData();
  }, []);

  const handleOpenAddModal = () => {
    setAddError(null);
    setFormData({
      patientId: patients.length > 0 ? patients[0].id : '',
      doctorId: doctors.length > 0 ? doctors[0].id : '',
      facilityId: facilities.length > 0 ? facilities[0].id : '',
      chiefComplaint: '',
      diagnosis: '',
      bloodPressure: '120/80',
      temperature: '98.6°F',
      pulse: '72 bpm',
      weight: '65 kg',
      doctorNotes: '',
      medicineName: '',
      dosage: '',
      frequency: 'Once Daily',
      duration: '5 Days',
    });
    setShowAddModal(true);
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!formData.patientId) {
      setAddError('Please select a registered patient worker.');
      return;
    }
    if (!formData.facilityId) {
      setAddError('Please select a healthcare facility.');
      return;
    }
    if (!formData.doctorId) {
      setAddError('Please select an attending doctor/staff officer.');
      return;
    }
    if (!formData.chiefComplaint.trim()) {
      setAddError('Chief complaint is required.');
      return;
    }

    setFormSubmitting(true);
    const visitRes = await apiCreateVisit({
      patientId: formData.patientId,
      doctorId: formData.doctorId,
      facilityId: formData.facilityId,
      chiefComplaint: formData.chiefComplaint.trim(),
      diagnosis: formData.diagnosis.trim() || undefined,
      bloodPressure: formData.bloodPressure.trim() || undefined,
      temperature: formData.temperature.trim() || undefined,
      pulse: formData.pulse.trim() || undefined,
      weight: formData.weight.trim() || undefined,
      doctorNotes: formData.doctorNotes.trim() || undefined,
    });

    if (visitRes.success && visitRes.data) {
      if (formData.medicineName.trim() && formData.dosage.trim()) {
        await apiCreatePrescription({
          visitId: visitRes.data.id,
          medicineName: formData.medicineName.trim(),
          dosage: formData.dosage.trim(),
          frequency: formData.frequency,
          duration: formData.duration,
        });
      }

      setShowAddModal(false);
      setToastMessage('Clinical encounter logged successfully!');
      setTimeout(() => setToastMessage(null), 4000);
      loadVisitsData();
    } else {
      setAddError(visitRes.error || 'Failed to log clinical visit.');
    }
    setFormSubmitting(false);
  };

  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const filteredVisits = visits.filter((visit) => {
    const pName = visit.patient?.fullName || '';
    const hId = visit.patient?.healthId || '';
    const officialId = visit.patient ? formatOfficialHealthId(visit.patient.healthId, visit.patient.createdAt) : '';
    const diag = visit.diagnosis || '';
    const comp = visit.chiefComplaint || '';

    const matchesSearch =
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      diag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFacility = selectedFacilityId ? visit.facilityId === selectedFacilityId : true;

    return matchesSearch && matchesFacility;
  });

  return (
    <div className="space-y-4">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="p-3 bg-[#E8F8F6] border border-[#00A99D]/40 text-[#00A99D] rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <span>✅ {toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-[#61747B] hover:text-[#16313A] text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-4 py-2.5 rounded-xl border border-[#DDE8E8] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#16313A] tracking-tight">Clinical Visits</h2>
            <span className="px-2 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-[11px] font-semibold rounded-full border border-[#00A99D]/30 font-mono">
              {visits.length} Total Encounters
            </span>
          </div>
          <p className="text-[#61747B] text-[11px]">
            Consultation encounters and medical diagnosis records across Kerala facilities.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-3.5 py-1.5 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <span>+ Log Clinical Visit</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-[#DDE8E8] shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search worker name, Health ID, chief complaint, or diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-[#16313A] placeholder-[#61747B] pl-8 pr-3 py-1.5 rounded-lg border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D]"
          />
          <span className="absolute left-2.5 top-2 text-[#61747B] text-xs">🔍</span>
        </div>

        <select
          value={selectedFacilityId}
          onChange={(e) => setSelectedFacilityId(e.target.value)}
          className="bg-white text-[#16313A] px-3 py-1.5 rounded-lg border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D] min-w-[190px]"
        >
          <option value="">All Healthcare Facilities</option>
          {facilities.map((fac) => (
            <option key={fac.id} value={fac.id}>
              {fac.name} ({fac.district})
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-14 text-[#61747B]">
          <div className="inline-block animate-spin h-7 w-7 border-2 border-[#00A99D] border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Loading clinical encounter records...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredVisits.length === 0 && (
        <div className="text-center py-14 bg-white rounded-xl border border-[#DDE8E8] text-[#61747B] space-y-2.5 shadow-xs">
          <div className="text-3xl">📋</div>
          <h3 className="text-base font-semibold text-[#16313A]">No Clinical Visits Found</h3>
          <p className="text-xs text-[#61747B]">No encounters match the current search or facility filter.</p>
        </div>
      )}

      {/* 2 Columns in 1 Row on Desktop — Clean Rows with Rich Readable Fonts and Scroll Snap */}
      {!loading && !error && filteredVisits.length > 0 && (
        <div className="space-y-6">
          {Array.from({ length: Math.ceil(filteredVisits.length / 2) }).map((_, rowIndex) => {
            const pair = filteredVisits.slice(rowIndex * 2, rowIndex * 2 + 2);

            return (
              <div
                key={`visit-row-${rowIndex}`}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 scroll-mt-20"
              >
                {pair.map((visit, pairIdx) => {
                  const actualIndex = rowIndex * 2 + pairIdx;
                  const officialHealthId = visit.patient
                    ? formatOfficialHealthId(visit.patient.healthId, visit.patient.createdAt)
                    : '';
                  const ordinalText = `${getOrdinal(actualIndex + 1)} Visit`;

                  return (
                    <div
                      key={visit.id}
                      className="bg-white p-5 rounded-2xl border border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8] transition-all shadow-sm flex flex-col justify-between space-y-3.5 min-h-[290px]"
                    >
                      <div className="space-y-3">
                        {/* Header: Ordinal Badge + Health ID + Worker Name + Date */}
                        <div className="flex justify-between items-start gap-2 border-b border-[#DDE8E8] pb-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 bg-[#00A99D] text-white text-xs font-mono font-bold rounded-lg shadow-xs">
                                📍 {ordinalText}
                              </span>
                              <span className="px-2.5 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-xs font-mono font-bold rounded border border-[#00A99D]/30">
                                {officialHealthId}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-[#16313A] tracking-tight">
                              {visit.patient?.fullName || 'Migrant Worker'}
                            </h3>
                          </div>

                          <span className="text-xs font-mono font-semibold text-[#00A99D] bg-[#E8F8F6] px-3 py-1 rounded-lg border border-[#00A99D]/30 whitespace-nowrap">
                            📅 {new Date(visit.visitDate).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Facility & Doctor Info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-[#61747B] block text-xs font-medium mb-0.5">Healthcare Facility:</span>
                            <span className="font-semibold text-[#16313A] text-sm leading-snug truncate block">
                              🏥 {visit.facility?.name || 'Healthcare Facility'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#61747B] block text-xs font-medium mb-0.5">Doctor / Staff:</span>
                            <span className="font-semibold text-[#16313A] text-sm leading-snug truncate block">
                              👨‍⚕️ Dr. {visit.doctor?.name || 'Medical Officer'}
                            </span>
                          </div>
                        </div>

                        {/* Chief Complaint & Diagnosis Side-by-Side */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-[#61747B] block text-xs font-medium mb-1">Chief Complaint:</span>
                            <p className="text-[#16313A] font-medium text-xs sm:text-sm bg-[#F8FAFA] p-3 rounded-xl border border-[#DDE8E8] leading-relaxed min-h-[56px]">
                              {visit.chiefComplaint}
                            </p>
                          </div>

                          <div>
                            <span className="text-[#61747B] block text-xs font-medium mb-1">Clinical Diagnosis:</span>
                            <p className="text-[#00A99D] font-bold text-xs sm:text-sm bg-[#F8FAFA] p-3 rounded-xl border border-[#DDE8E8] leading-relaxed min-h-[56px]">
                              {visit.diagnosis || 'No formal diagnosis specified'}
                            </p>
                          </div>
                        </div>

                        {/* Patient Vitals Summary */}
                        {(visit.bloodPressure || visit.temperature || visit.pulse || visit.weight) && (
                          <div className="flex flex-wrap gap-3 text-xs bg-[#F8FAFA] px-3 py-2 rounded-xl border border-[#DDE8E8] font-mono text-[#61747B]">
                            {visit.bloodPressure && (
                              <span>
                                BP: <strong className="text-[#16313A]">{visit.bloodPressure}</strong>
                              </span>
                            )}
                            {visit.temperature && (
                              <span>
                                Temp: <strong className="text-[#16313A]">{visit.temperature}</strong>
                              </span>
                            )}
                            {visit.pulse && (
                              <span>
                                Pulse: <strong className="text-[#16313A]">{visit.pulse.toLowerCase().includes('bpm') ? visit.pulse : `${visit.pulse} bpm`}</strong>
                              </span>
                            )}
                            {visit.weight && (
                              <span>
                                Weight: <strong className="text-[#16313A]">{visit.weight}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Prescriptions (Rx) */}
                        {visit.prescriptions && visit.prescriptions.length > 0 && (
                          <div className="pt-1">
                            <span className="text-xs text-[#61747B] font-bold uppercase tracking-wider block mb-1">
                              Prescriptions (Rx)
                            </span>
                            <div className="space-y-1.5">
                              {visit.prescriptions.map((rx) => (
                                <div
                                  key={rx.id}
                                  className="text-xs sm:text-sm bg-[#F8FAFA] px-3.5 py-2 rounded-xl border border-[#DDE8E8] text-[#16313A] flex justify-between items-center"
                                >
                                  <span className="font-semibold text-[#00A99D]">💊 {rx.medicineName} ({rx.dosage})</span>
                                  <span className="text-[#61747B] font-mono text-xs">{rx.frequency} — {rx.duration}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Log Clinical Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DDE8E8] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-[#16313A]">
            <div className="flex justify-between items-center border-b border-[#DDE8E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#16313A]">Log Clinical Visit</h3>
                <p className="text-xs text-[#61747B]">Record consultation diagnosis and medical encounter</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#61747B] hover:text-[#16313A] text-lg p-1"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                ⚠️ {addError}
              </div>
            )}

            <form onSubmit={handleCreateVisit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#16313A] font-medium mb-1">Select Patient Worker</label>
                <select
                  required
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({formatOfficialHealthId(p.healthId, p.createdAt)}) — {p.stateOfOrigin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Healthcare Facility</label>
                  <select
                    required
                    value={formData.facilityId}
                    onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  >
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Attending Doctor / Officer</label>
                  <select
                    required
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.name} ({d.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#16313A] font-medium mb-1">Chief Complaint</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fever, cough and fatigue for 3 days"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              <div>
                <label className="block text-[#16313A] font-medium mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Upper Respiratory Tract Infection (URTI)"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              {/* Vitals Input Row */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="block text-[#61747B] font-mono text-[10px]">BP (mmHg)</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-2.5 py-1.5 rounded-lg border border-[#DDE8E8] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#61747B] font-mono text-[10px]">Temp (°F)</label>
                  <input
                    type="text"
                    placeholder="98.6°F"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-2.5 py-1.5 rounded-lg border border-[#DDE8E8] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#61747B] font-mono text-[10px]">Pulse (bpm)</label>
                  <input
                    type="text"
                    placeholder="72 bpm"
                    value={formData.pulse}
                    onChange={(e) => setFormData({ ...formData, pulse: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-2.5 py-1.5 rounded-lg border border-[#DDE8E8] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#61747B] font-mono text-[10px]">Weight (kg)</label>
                  <input
                    type="text"
                    placeholder="65 kg"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-2.5 py-1.5 rounded-lg border border-[#DDE8E8] text-xs font-mono"
                  />
                </div>
              </div>

              {/* Prescription Sub-Section */}
              <div className="pt-2 border-t border-[#DDE8E8] space-y-2">
                <span className="text-[#61747B] font-semibold block">Optional Prescription Item (Rx)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Paracetamol)"
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    className="bg-white text-[#16313A] px-3 py-2 rounded-xl border border-[#DDE8E8]"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="bg-white text-[#16313A] px-3 py-2 rounded-xl border border-[#DDE8E8]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDE8E8] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#F8FAFA] text-[#61747B] rounded-xl font-medium hover:bg-[#F0FAF8] border border-[#DDE8E8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-sm"
                >
                  {formSubmitting ? 'Logging...' : 'Save Encounter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
