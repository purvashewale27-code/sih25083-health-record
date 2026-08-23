import React, { useState, useEffect } from 'react';
import type { Patient } from '../types';
import { apiGetPatients, apiCreatePatient, apiDeletePatient } from '../services/api';
import { PatientDetailModal } from './PatientDetailModal';
import { calculatePatientAlerts } from '../utils/alertEngine';
import { formatOfficialHealthId } from '../utils/qrGenerator';

export const PatientsView: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [alertFilter, setAlertFilter] = useState('ALL');

  // Selected Patient for detail modal
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Delete Confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Verification Modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifiedPatient, setVerifiedPatient] = useState<Patient | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Registration Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    healthId: '',
    fullName: '',
    dateOfBirth: '1995-06-15',
    gender: 'Male',
    phone: '',
    stateOfOrigin: 'West Bengal',
    currentDistrict: 'Ernakulam',
    preferredLanguage: 'Bengali',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    const res = await apiGetPatients();
    if (res.success && res.data) {
      setPatients(res.data);
    } else {
      setError(res.error || 'Failed to load patients from database.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const extractHealthIdNumber = (healthId: string): number => {
    const match = healthId.match(/\d+$/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const handleOpenAddModal = () => {
    let maxNum = patients.length;
    patients.forEach((p) => {
      const num = extractHealthIdNumber(p.healthId);
      if (num > maxNum) maxNum = num;
    });
    const nextNum = String(maxNum + 1).padStart(5, '0');
    const nextHealthId = `KMH-2026-${nextNum}`;

    setFormData({
      healthId: nextHealthId,
      fullName: '',
      dateOfBirth: '1995-06-15',
      gender: 'Male',
      phone: '',
      stateOfOrigin: 'West Bengal',
      currentDistrict: 'Ernakulam',
      preferredLanguage: 'Bengali',
      emergencyContactName: '',
      emergencyContactPhone: '',
    });
    setAddError(null);
    setShowAddModal(true);
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setFormSubmitting(true);

    let submitHealthId = formData.healthId.trim();
    if (!submitHealthId) {
      let maxNum = patients.length;
      patients.forEach((p) => {
        const num = extractHealthIdNumber(p.healthId);
        if (num > maxNum) maxNum = num;
      });
      submitHealthId = `KMH-2026-${String(maxNum + 1).padStart(5, '0')}`;
    }

    const res = await apiCreatePatient({
      ...formData,
      healthId: submitHealthId,
    });
    setFormSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      setToastMessage(`Patient record "${formData.fullName}" created with Health ID ${submitHealthId}!`);
      setTimeout(() => setToastMessage(null), 4000);
      loadPatients();
    } else {
      setAddError(res.error || 'Failed to create patient record. Check Health ID uniqueness.');
    }
  };

  const confirmDeletePatient = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await apiDeletePatient(deleteTarget.id);
    setDeleting(false);

    if (res.success) {
      setToastMessage(`Patient record "${deleteTarget.name}" deleted successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteTarget(null);
      loadPatients();
    } else {
      alert(res.error || 'Failed to delete patient record');
      setDeleteTarget(null);
    }
  };

  const handleVerifyHealthId = (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifiedPatient(null);

    const query = verifyInput.trim().toLowerCase();
    if (!query) return;

    const match = patients.find((p) => {
      const pId = p.healthId.toLowerCase();
      const pOfficial = formatOfficialHealthId(p.healthId, p.createdAt).toLowerCase();
      return pId === query || pOfficial === query || pId.includes(query) || pOfficial.includes(query);
    });

    if (match) {
      setVerifiedPatient(match);
    } else {
      setVerifyError(`No registered worker record found matching Health ID "${verifyInput}".`);
    }
  };

  const filteredPatients = patients
    .filter((p) => {
      const matchesSearch =
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.healthId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.currentDistrict.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = selectedState ? p.stateOfOrigin === selectedState : true;

      if (!matchesSearch || !matchesState) return false;

      if (alertFilter === 'ALERTS_ONLY') {
        const pAlerts = calculatePatientAlerts(p);
        return pAlerts.some((a) => a.severity === 'HIGH' || a.severity === 'MEDIUM');
      }
      if (alertFilter === 'HIGH_ONLY') {
        const pAlerts = calculatePatientAlerts(p);
        return pAlerts.some((a) => a.severity === 'HIGH');
      }

      return true;
    })
    .sort((a, b) => {
      const numA = extractHealthIdNumber(a.healthId);
      const numB = extractHealthIdNumber(b.healthId);
      if (numA !== numB) return numA - numB;
      return a.healthId.localeCompare(b.healthId, undefined, { numeric: true });
    });

  const statesOfOrigin = Array.from(new Set(patients.map((p) => p.stateOfOrigin)));

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('');
    setAlertFilter('ALL');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
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
            <h2 className="text-base sm:text-lg font-bold text-[#16313A] tracking-tight">Migrant Workers</h2>
            <span className="px-2 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-[11px] font-semibold rounded-full border border-[#00A99D]/30 font-mono">
              {patients.length} Registered
            </span>
          </div>
          <p className="text-[#61747B] text-[11px]">
            Manage registered migrant workers and digital health records across Kerala healthcare facilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVerifyModal(true)}
            className="px-3 py-1.5 bg-white hover:bg-[#F0FAF8] text-[#00A99D] font-semibold rounded-lg text-xs border border-[#00A99D] transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <span>📱 Verify Health ID</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>+ Add New Patient</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-[#DDE8E8] shadow-xs">
        <div className="flex flex-col sm:flex-row flex-1 gap-2 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search worker name, Health ID (e.g. KMH-2026-00001), or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-[#16313A] placeholder-[#61747B] pl-8 pr-3 py-1.5 rounded-lg border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D]"
            />
            <span className="absolute left-2.5 top-2 text-[#61747B] text-xs">🔍</span>
          </div>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-white text-[#16313A] px-3 py-1.5 rounded-lg border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D] min-w-[140px]"
          >
            <option value="">All States</option>
            {statesOfOrigin.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <select
            value={alertFilter}
            onChange={(e) => setAlertFilter(e.target.value)}
            className="bg-white text-[#16313A] px-3 py-1.5 rounded-lg border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D] min-w-[160px]"
          >
            <option value="ALL">All Risk Statuses</option>
            <option value="ALERTS_ONLY">⚠️ Active Alerts</option>
            <option value="HIGH_ONLY">🔴 High Severity</option>
          </select>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-[#DDE8E8]">
          <span className="text-[11px] text-[#61747B] font-mono whitespace-nowrap">
            Showing {filteredPatients.length} of {patients.length} workers
          </span>
          {(searchQuery || selectedState || alertFilter !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="px-2 py-0.5 bg-[#F8FAFA] text-[#61747B] hover:text-[#16313A] rounded-md text-[11px] font-medium border border-[#DDE8E8] hover:bg-[#F0FAF8] transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-14 text-[#61747B]">
          <div className="inline-block animate-spin h-7 w-7 border-2 border-[#00A99D] border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Loading migrant worker records from database...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center flex flex-col items-center gap-2 text-xs">
          <span>⚠️ {error}</span>
          <button
            onClick={loadPatients}
            className="px-3.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPatients.length === 0 && (
        <div className="text-center py-14 bg-white rounded-xl border border-[#DDE8E8] text-[#61747B] space-y-3 shadow-xs">
          <div className="text-3xl">📂</div>
          <h3 className="text-base font-semibold text-[#16313A]">No Patient Records Found</h3>
          <p className="text-xs text-[#61747B] max-w-md mx-auto">
            {searchQuery || selectedState || alertFilter !== 'ALL'
              ? 'No registered workers match your search query or alert filter selection.'
              : 'No migrant worker health profiles have been added yet to the database.'}
          </p>
        </div>
      )}

      {/* 3 Boxes Perfectly Fit on Screen 1 — Row 2 Starts Strictly Below the Viewport Fold */}
      {!loading && !error && filteredPatients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 pt-1">
          {filteredPatients.map((patient) => {
            const pAlerts = calculatePatientAlerts(patient);
            const highAlertCount = pAlerts.filter((a) => a.severity === 'HIGH').length;
            const officialHealthId = formatOfficialHealthId(patient.healthId, patient.createdAt);

            return (
              <div
                key={patient.id}
                className="bg-white p-4.5 rounded-2xl border border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8] transition-all shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-block px-2.5 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-xs font-mono font-bold rounded-lg border border-[#00A99D]/30">
                        {officialHealthId}
                      </span>
                      {highAlertCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200 font-mono">
                          🔴 {highAlertCount} Alert{highAlertCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] bg-[#F8FAFA] text-[#16313A] px-2 py-0.5 rounded-md border border-[#DDE8E8] font-semibold whitespace-nowrap">
                      {patient.gender}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#16313A] tracking-tight truncate">
                    {patient.fullName}
                  </h3>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-[#16313A] pt-2 border-t border-[#DDE8E8]">
                    <div>
                      <span className="text-[#61747B] text-[11px] block">Origin State:</span>
                      <span className="font-semibold text-[#16313A] text-xs truncate block">{patient.stateOfOrigin}</span>
                    </div>
                    <div>
                      <span className="text-[#61747B] text-[11px] block">Kerala District:</span>
                      <span className="font-semibold text-[#00A99D] text-xs truncate block">{patient.currentDistrict}</span>
                    </div>
                    <div>
                      <span className="text-[#61747B] text-[11px] block">Language:</span>
                      <span className="font-medium text-[#16313A] text-xs truncate block">{patient.preferredLanguage}</span>
                    </div>
                    <div>
                      <span className="text-[#61747B] text-[11px] block">Phone:</span>
                      <span className="font-mono text-[11px] text-[#16313A] truncate block">{patient.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDE8E8] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedPatientId(patient.id)}
                    className="flex-1 py-1.5 bg-[#E8F8F6] text-[#00A99D] hover:bg-[#d5f3ee] border border-[#00A99D]/30 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>👁️</span>
                    <span>View Health Record</span>
                  </button>

                  <button
                    onClick={() => setDeleteTarget({ id: patient.id, name: patient.fullName })}
                    title="Delete record"
                    className="p-1.5 text-[#61747B] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-xs"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VERIFY HEALTH ID MODAL */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDE8E8] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#16313A]">
            <div className="flex justify-between items-center border-b border-[#DDE8E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#16313A] flex items-center gap-2">
                  <span>📱 Scan & Verify Digital Health ID</span>
                </h3>
                <p className="text-xs text-[#61747B]">Enter or scan worker Portable Health ID (e.g. KMH-2026-00001)</p>
              </div>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerifyInput('');
                  setVerifiedPatient(null);
                  setVerifyError(null);
                }}
                className="text-[#61747B] hover:text-[#16313A] text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyHealthId} className="space-y-3 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Enter Health ID (KMH-2026-00001 or MIG-2025-0001)"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  className="flex-1 bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] font-mono text-xs focus:outline-none focus:border-[#00A99D]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Verify
                </button>
              </div>
            </form>

            {verifyError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                ⚠️ {verifyError}
              </div>
            )}

            {verifiedPatient && (
              <div className="bg-[#F8FAFA] p-4 rounded-xl border border-[#00A99D]/30 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#DDE8E8] pb-2">
                  <span className="text-[#00A99D] font-bold flex items-center gap-1">
                    <span>✅ Verified Record Found</span>
                  </span>
                  <span className="font-mono text-[#61747B]">
                    {formatOfficialHealthId(verifiedPatient.healthId, verifiedPatient.createdAt)}
                  </span>
                </div>

                <div className="space-y-1 text-[#16313A]">
                  <div className="font-bold text-sm text-[#16313A]">{verifiedPatient.fullName}</div>
                  <div>Origin: <strong>{verifiedPatient.stateOfOrigin}</strong> • District: <strong>{verifiedPatient.currentDistrict}</strong></div>
                  <div>Phone: <strong className="font-mono">{verifiedPatient.phone || 'N/A'}</strong></div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedPatientId(verifiedPatient.id);
                      setShowVerifyModal(false);
                    }}
                    className="px-4 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>👁️ Open Authorized Health Record</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatientId && (
        <PatientDetailModal patientId={selectedPatientId} onClose={() => setSelectedPatientId(null)} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDE8E8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#16313A]">
            <div className="flex items-center space-x-3 text-rose-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-[#16313A]">Delete Patient Record</h3>
            </div>
            <p className="text-xs text-[#61747B] leading-relaxed">
              Are you sure you want to permanently remove the medical profile for{' '}
              <strong className="text-[#16313A]">{deleteTarget.name}</strong>? This action will remove all associated visit histories and medical reports.
            </p>

            <div className="pt-2 flex justify-end gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-[#F8FAFA] text-[#61747B] rounded-xl text-xs font-medium hover:bg-[#F0FAF8] border border-[#DDE8E8]"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={confirmDeletePatient}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors shadow"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DDE8E8] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#16313A]">
            <div className="flex justify-between items-center border-b border-[#DDE8E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#16313A]">Register Migrant Worker</h3>
                <p className="text-xs text-[#61747B]">Create a digital health profile for guest worker</p>
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

            <form onSubmit={handleCreatePatient} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#16313A] font-medium mb-1">Health ID (e.g. KMH-2026-00006)</label>
                <input
                  type="text"
                  required
                  placeholder="KMH-2026-00006"
                  value={formData.healthId}
                  onChange={(e) => setFormData({ ...formData, healthId: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#16313A] font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Worker's Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  />
                </div>
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">State of Origin</label>
                  <input
                    type="text"
                    required
                    placeholder="West Bengal / Bihar / Assam"
                    value={formData.stateOfOrigin}
                    onChange={(e) => setFormData({ ...formData, stateOfOrigin: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  />
                </div>
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Current Kerala District</label>
                  <input
                    type="text"
                    required
                    placeholder="Ernakulam / Kozhikode"
                    value={formData.currentDistrict}
                    onChange={(e) => setFormData({ ...formData, currentDistrict: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Preferred Language</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengali / Hindi / Oriya"
                    value={formData.preferredLanguage}
                    onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  />
                </div>
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    placeholder="Next of Kin Name"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  />
                </div>
                <div>
                  <label className="block text-[#16313A] font-medium mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDE8E8] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#F8FAFA] text-[#61747B] rounded-xl hover:bg-[#F0FAF8] border border-[#DDE8E8] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-xs"
                >
                  {formSubmitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
