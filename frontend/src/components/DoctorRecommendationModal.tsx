import React, { useState, useEffect } from 'react';
import type { Patient, HealthcareFacility } from '../types';
import {
  apiRecommendDoctors,
  apiGetFacilities,
  apiGetPatients,
  apiGetAvailableSlots,
  apiCreateAppointment,
  type DoctorRecommendationResponse,
} from '../services/api';

interface DoctorRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentBooked?: () => void;
  initialComplaint?: string;
  initialDistrict?: string;
}

export const DoctorRecommendationModal: React.FC<DoctorRecommendationModalProps> = ({
  isOpen,
  onClose,
  onAppointmentBooked,
  initialComplaint = '',
  initialDistrict = '',
}) => {
  const [complaint, setComplaint] = useState(initialComplaint);
  const [district, setDistrict] = useState(initialDistrict);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<DoctorRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Booking Flow State
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecommendationResponse['doctors'][0] | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<Array<{ slotTime: string; isAvailable: boolean }>>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiGetPatients().then((res) => res.success && res.data && setPatients(res.data));
      apiGetFacilities().then((res) => res.success && res.data && setFacilities(res.data));
    }
  }, [isOpen]);

  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedDoctor(null);

    const res = await apiRecommendDoctors(complaint, district);
    setLoading(false);
    if (res.success && res.data) {
      setRecommendations(res.data);
    } else {
      setError(res.error || 'Failed to match doctors.');
    }
  };

  const handleSelectDoctorForBooking = async (doctor: DoctorRecommendationResponse['doctors'][0]) => {
    setSelectedDoctor(doctor);
    if (doctor.facilities.length > 0) {
      setSelectedFacilityId(doctor.facilities[0].facilityId);
    } else if (facilities.length > 0) {
      setSelectedFacilityId(facilities[0].id);
    }
    loadSlots(doctor.id, selectedDate);
  };

  const loadSlots = async (docId: string, dateStr: string) => {
    const res = await apiGetAvailableSlots(docId, dateStr);
    if (res.success && res.data) {
      setAvailableSlots(res.data.slots);
      const firstOpen = res.data.slots.find((s) => s.isAvailable);
      if (firstOpen) setSelectedSlot(firstOpen.slotTime);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !selectedPatientId || !selectedFacilityId || !selectedSlot) {
      alert('Please fill all booking requirements.');
      return;
    }

    setBookingLoading(true);
    const res = await apiCreateAppointment({
      patientId: selectedPatientId,
      doctorId: selectedDoctor.id,
      facilityId: selectedFacilityId,
      appointmentDate: selectedDate,
      slotTime: selectedSlot,
      reason: complaint || 'Doctor recommendation consultation',
      priority: 'MEDIUM',
    });
    setBookingLoading(false);

    if (res.success) {
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        if (onAppointmentBooked) onAppointmentBooked();
        onClose();
      }, 1800);
    } else {
      alert(res.error || 'Failed to book appointment.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#DDE8E8] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 text-[#16313A]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#DDE8E8] pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold uppercase tracking-wider mb-1 border border-[#00A99D]/30">
              <span>Clinical Triage Assistant</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#16313A]">Doctor & Specialist Matcher</h3>
            <p className="text-xs text-[#61747B]">
              Matches worker health complaints with medical specializations & available Kerala doctors
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#61747B] hover:text-[#16313A] text-lg p-1 rounded-lg hover:bg-[#F0FAF8]"
          >
            ✕
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGetRecommendations} className="space-y-3 text-xs">
          <div>
            <label className="block text-[#16313A] font-semibold mb-1">
              Patient Symptoms / Chief Complaint
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cough and chest tightness after plywood factory work, or acute high fever with chills"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#16313A] font-semibold mb-1">Kerala District Filter (Optional)</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
              >
                <option value="">All Districts</option>
                <option value="Ernakulam">Ernakulam</option>
                <option value="Palakkad">Palakkad</option>
                <option value="Kozhikode">Kozhikode</option>
                <option value="Kannur">Kannur</option>
                <option value="Wayanad">Wayanad</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[#00A99D] hover:bg-[#008F83] text-white font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? 'Analyzing Symptoms...' : 'Find Matching Doctors →'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* Results Area */}
        {recommendations && (
          <div className="space-y-4 pt-2 border-t border-[#DDE8E8]">
            {/* Triage Badge */}
            <div className="p-3.5 bg-[#F0FAF8] border border-[#00A99D]/30 rounded-2xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-[#00A99D]">
                <span>🩺 Recommended Specialization: {recommendations.department}</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#00A99D]/30">
                  {Math.round(recommendations.triageResult.confidenceScore * 100)}% Match
                </span>
              </div>
              <p className="text-xs text-[#61747B]">{recommendations.reasoning}</p>
            </div>

            {/* Doctor List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-[#61747B] uppercase tracking-wider block">
                Recommended Doctors ({recommendations.doctors.length}):
              </span>
              {recommendations.doctors.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    selectedDoctor?.id === doc.id
                      ? 'bg-[#E8F8F6] border-[#00A99D]'
                      : 'bg-white border-[#DDE8E8] hover:border-[#00A99D]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-[#16313A] text-sm">{doc.name}</strong>
                      <span className="px-2 py-0.5 bg-[#E8F8F6] text-[#00A99D] rounded font-semibold text-[10px]">
                        {doc.specialization}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#61747B] mt-0.5">
                      {doc.facilities.map((f) => `${f.facilityName} (${f.district})`).join(', ') || 'Kerala DHS Pool'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectDoctorForBooking(doc)}
                    className="px-3.5 py-1.5 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-xl text-xs whitespace-nowrap shadow-xs"
                  >
                    {selectedDoctor?.id === doc.id ? '✓ Selected' : 'Book Appointment'}
                  </button>
                </div>
              ))}
            </div>

            {/* Direct Booking Panel when Doctor Selected */}
            {selectedDoctor && (
              <div className="p-4 bg-[#F8FAFA] border border-[#DDE8E8] rounded-2xl space-y-3 text-xs animate-in fade-in">
                <strong className="block text-[#16313A] border-b border-[#DDE8E8] pb-1.5">
                  Book Slot with {selectedDoctor.name}
                </strong>

                {bookingSuccess ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-center font-bold">
                    ✅ Appointment Booked Successfully!
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#16313A] font-medium mb-1">Select Registered Patient</label>
                        <select
                          value={selectedPatientId}
                          onChange={(e) => setSelectedPatientId(e.target.value)}
                          className="w-full bg-white text-[#16313A] px-3 py-1.5 rounded-xl border border-[#DDE8E8]"
                        >
                          <option value="">-- Choose Patient --</option>
                          {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.fullName} ({p.healthId})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#16313A] font-medium mb-1">Appointment Date</label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            loadSlots(selectedDoctor.id, e.target.value);
                          }}
                          className="w-full bg-white text-[#16313A] px-3 py-1.5 rounded-xl border border-[#DDE8E8]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#16313A] font-medium mb-1.5">Available Slots</label>
                      <div className="flex flex-wrap gap-1.5">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.slotTime}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlot(slot.slotTime)}
                            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-semibold transition-all ${
                              selectedSlot === slot.slotTime
                                ? 'bg-[#00A99D] text-white shadow-xs'
                                : slot.isAvailable
                                ? 'bg-white border border-[#DDE8E8] text-[#16313A] hover:bg-[#E8F8F6]'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 line-through'
                            }`}
                          >
                            {slot.slotTime}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={bookingLoading || !selectedPatientId || !selectedSlot}
                        onClick={handleConfirmBooking}
                        className="px-5 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50"
                      >
                        {bookingLoading ? 'Reserving Slot...' : 'Confirm Appointment'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
