import React, { useState, useEffect } from 'react';
import type { Appointment, HealthcareFacility, User, Patient } from '../types';
import {
  apiGetAppointments,
  apiGetFacilities,
  apiGetUsers,
  apiGetPatients,
  apiGetAvailableSlots,
  apiCreateAppointment,
  apiUpdateAppointmentStatus,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from './PaymentModal';
import { DoctorRecommendationModal } from './DoctorRecommendationModal';

export const AppointmentsView: React.FC = () => {
  const { hasRole } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDoctorId, setFilterDoctorId] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Booking Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [formPatientId, setFormPatientId] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formFacilityId, setFormFacilityId] = useState('');
  const [formDate, setFormDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [formSlot, setFormSlot] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formPriority, setFormPriority] = useState('MEDIUM');
  const [availableSlots, setAvailableSlots] = useState<Array<{ slotTime: string; isAvailable: boolean }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Modals
  const [paymentAppointment, setPaymentAppointment] = useState<Appointment | null>(null);
  const [showDocRecModal, setShowDocRecModal] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    const res = await apiGetAppointments({
      doctorId: filterDoctorId || undefined,
      date: filterDate || undefined,
    });
    setLoading(false);
    if (res.success && res.data) {
      setAppointments(res.data);
    } else {
      setError(res.error || 'Failed to load appointments.');
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [filterDoctorId, filterDate]);

  useEffect(() => {
    Promise.all([apiGetFacilities(), apiGetUsers(), apiGetPatients()]).then(([fRes, uRes, pRes]) => {
      if (fRes.success && fRes.data) setFacilities(fRes.data);
      if (uRes.success && uRes.data) {
        const docs = uRes.data.filter((u) => u.role === 'DOCTOR');
        setDoctors(docs);
        if (docs.length > 0) setFormDoctorId(docs[0].id);
      }
      if (pRes.success && pRes.data) {
        setPatients(pRes.data);
        if (pRes.data.length > 0) setFormPatientId(pRes.data[0].id);
      }
    });
  }, []);

  const loadSlots = async (docId: string, dateStr: string) => {
    if (!docId || !dateStr) return;
    const res = await apiGetAvailableSlots(docId, dateStr);
    if (res.success && res.data) {
      setAvailableSlots(res.data.slots);
      const openSlot = res.data.slots.find((s) => s.isAvailable);
      if (openSlot) setFormSlot(openSlot.slotTime);
    }
  };

  useEffect(() => {
    if (showBookModal && formDoctorId && formDate) {
      loadSlots(formDoctorId, formDate);
    }
  }, [showBookModal, formDoctorId, formDate]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPatientId || !formDoctorId || !formFacilityId || !formSlot || !formReason) {
      setBookingError('Please fill all required booking fields.');
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    const res = await apiCreateAppointment({
      patientId: formPatientId,
      doctorId: formDoctorId,
      facilityId: formFacilityId,
      appointmentDate: formDate,
      slotTime: formSlot,
      reason: formReason,
      priority: formPriority,
    });
    setSubmitting(false);

    if (res.success && res.data) {
      setShowBookModal(false);
      setFormReason('');
      loadAppointments();
      // Prompt payment
      setPaymentAppointment(res.data);
    } else {
      setBookingError(res.error || 'Failed to book slot.');
    }
  };

  const handleStatusChange = async (aptId: string, status: string) => {
    await apiUpdateAppointmentStatus(aptId, status);
    loadAppointments();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#DDE8E8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold uppercase tracking-wider mb-1 border border-[#00A99D]/30">
            <span>Clinical Scheduling & Tele-triage</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#16313A] tracking-tight">Online Appointment Booking</h2>
          <p className="text-xs text-[#61747B]">
            Schedule doctor consultations with double-booking prevention, clinic slots & fee waivers
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowDocRecModal(true)}
            className="px-4 py-2 bg-[#F0FAF8] text-[#00A99D] border border-[#00A99D]/40 hover:bg-[#d5f3ee] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>🩺</span>
            <span>Doctor Matcher / Triage</span>
          </button>

          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>+ Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DDE8E8] flex flex-wrap items-center gap-3 text-xs shadow-xs">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[#61747B] font-medium mb-1">Filter Doctor:</label>
          <select
            value={filterDoctorId}
            onChange={(e) => setFilterDoctorId(e.target.value)}
            className="w-full bg-white text-[#16313A] px-3 py-1.5 rounded-xl border border-[#DDE8E8]"
          >
            <option value="">All Medical Officers</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialization || 'General'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[#61747B] font-medium mb-1">Filter Date:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-white text-[#16313A] px-3 py-1.5 rounded-xl border border-[#DDE8E8]"
          />
        </div>

        {filterDate && (
          <div className="flex items-end">
            <button
              onClick={() => setFilterDate('')}
              className="px-3 py-1.5 bg-[#F8FAFA] hover:bg-[#F0FAF8] text-[#61747B] rounded-xl border border-[#DDE8E8]"
            >
              Clear Date
            </button>
          </div>
        )}
      </div>

      {/* Appointment Grid */}
      {loading && (
        <div className="text-center py-14 text-[#61747B]">
          <div className="inline-block animate-spin h-7 w-7 border-2 border-[#00A99D] border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Loading appointments & schedules...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center text-xs">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="text-center py-14 bg-white rounded-2xl border border-[#DDE8E8] text-[#61747B] space-y-3">
          <div className="text-3xl">📅</div>
          <h3 className="text-base font-semibold text-[#16313A]">No Appointments Found</h3>
          <p className="text-xs">No doctor consultation slots are currently scheduled for the selected filter.</p>
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((apt) => {
            const hasPayment = apt.payments && apt.payments.length > 0;
            const latestPayment = hasPayment ? apt.payments![0] : null;

            return (
              <div
                key={apt.id}
                className="bg-white p-5 rounded-2xl border border-[#DDE8E8] hover:border-[#00A99D]/40 space-y-3 shadow-xs transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-[#E8F8F6] text-[#00A99D] border border-[#00A99D]/30">
                      {apt.appointmentNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase border ${
                        apt.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : apt.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : apt.status === 'IN_CONSULTATION'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#16313A] truncate">
                      {apt.patient?.fullName || 'Guest Worker'}
                    </h3>
                    <p className="text-xs text-[#61747B] font-mono">
                      Health ID: {apt.patient?.healthId} • {apt.patient?.phone || 'No phone'}
                    </p>
                  </div>

                  <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8] space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#61747B]">Doctor:</span>
                      <strong className="text-[#16313A]">{apt.doctor?.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#61747B]">Specialty:</span>
                      <span className="text-[#00A99D] font-semibold">{apt.doctor?.specialization || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#61747B]">Date & Slot:</span>
                      <strong className="font-mono text-[#16313A]">
                        {new Date(apt.appointmentDate).toLocaleDateString()} @ {apt.slotTime}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#61747B]">Facility:</span>
                      <span className="text-[#16313A] truncate">{apt.facility?.name}</span>
                    </div>
                  </div>

                  <div className="text-xs text-[#61747B]">
                    <strong>Reason:</strong> {apt.reason}
                  </div>

                  {/* Payment / Waiver Status */}
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[#61747B]">Consultation Fee:</span>
                    {latestPayment ? (
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          latestPayment.status === 'WAIVED'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {latestPayment.status === 'WAIVED' ? 'AWAZ Free Waiver' : '₹50 Paid ✓'}
                      </span>
                    ) : (
                      <button
                        onClick={() => setPaymentAppointment(apt)}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        Pay / Apply Waiver →
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#DDE8E8] flex gap-2">
                  {apt.status === 'SCHEDULED' && hasRole(['DOCTOR', 'ADMIN']) && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'IN_CONSULTATION')}
                      className="flex-1 py-1.5 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Start Consult
                    </button>
                  )}

                  {apt.status === 'IN_CONSULTATION' && hasRole(['DOCTOR', 'ADMIN']) && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Mark Complete ✓
                    </button>
                  )}

                  {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#DDE8E8] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 text-[#16313A]">
            <div className="flex justify-between items-center border-b border-[#DDE8E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#16313A]">Book Consultation Slot</h3>
                <p className="text-xs text-[#61747B]">Select worker, specialist doctor, facility, and available slot</p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-[#61747B] hover:text-[#16313A] text-lg p-1"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                ⚠️ {bookingError}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#16313A] font-semibold mb-1">Registered Patient</label>
                <select
                  required
                  value={formPatientId}
                  onChange={(e) => setFormPatientId(e.target.value)}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8]"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.healthId}) - {p.stateOfOrigin}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16313A] font-semibold mb-1">Medical Officer</label>
                  <select
                    required
                    value={formDoctorId}
                    onChange={(e) => setFormDoctorId(e.target.value)}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8]"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialization || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#16313A] font-semibold mb-1">Healthcare Facility</label>
                  <select
                    required
                    value={formFacilityId}
                    onChange={(e) => setFormFacilityId(e.target.value)}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8]"
                  >
                    <option value="">-- Choose Facility --</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#16313A] font-semibold mb-1">Consultation Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8]"
                  />
                </div>

                <div>
                  <label className="block text-[#16313A] font-semibold mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#16313A] font-semibold mb-1">Available 20-Min Slots</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8]">
                  {availableSlots.length === 0 && (
                    <span className="text-slate-400 text-xs p-1">No slots loaded. Select doctor and date.</span>
                  )}
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.slotTime}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setFormSlot(slot.slotTime)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                        formSlot === slot.slotTime
                          ? 'bg-[#00A99D] text-white shadow-xs'
                          : slot.isAvailable
                          ? 'bg-white border border-[#DDE8E8] text-[#16313A] hover:bg-[#E8F8F6]'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.slotTime}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#16313A] font-semibold mb-1">Consultation Reason / Chief Complaint</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chronic cough review / factory checkup"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8]"
                />
              </div>

              <div className="pt-3 border-t border-[#DDE8E8] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 bg-[#F8FAFA] text-[#61747B] rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formSlot}
                  className="px-5 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-xl font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Locking Slot...' : 'Confirm & Reserve Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentAppointment && (
        <PaymentModal
          isOpen={!!paymentAppointment}
          onClose={() => setPaymentAppointment(null)}
          appointment={paymentAppointment}
          patientId={paymentAppointment.patientId}
          patientName={paymentAppointment.patient?.fullName || 'Guest Worker'}
          onPaymentSuccess={loadAppointments}
        />
      )}

      {/* Doctor Recommendation Modal */}
      <DoctorRecommendationModal
        isOpen={showDocRecModal}
        onClose={() => setShowDocRecModal(false)}
        onAppointmentBooked={loadAppointments}
      />
    </div>
  );
};
