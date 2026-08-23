import React, { useState, useEffect, useCallback } from 'react';
import type { Visit } from '../types';
import { apiGetPatients, apiGetVisits, apiGetFacilities, apiGetUsers, apiGetFollowUps } from '../services/api';
import { generateFollowUpsFromPatients, getFollowUpSummary } from '../utils/followUpEngine';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const [patientCount, setPatientCount] = useState(0);
  const [visitCount, setVisitCount] = useState(0);
  const [facilityCount, setFacilityCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);

  const [stateCounts, setStateCounts] = useState<Record<string, number>>({});
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);

  const [followUpSummary, setFollowUpSummary] = useState({
    total: 0,
    overdue: 0,
    dueSoon: 0,
    pending: 0,
    completed: 0,
  });

  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const [pRes, vRes, fRes, uRes, fuRes] = await Promise.all([
      apiGetPatients(),
      apiGetVisits(),
      apiGetFacilities(),
      apiGetUsers(),
      apiGetFollowUps(),
    ]);

    if (pRes.success && pRes.data) {
      setPatientCount(pRes.data.length);
      const counts: Record<string, number> = {};
      pRes.data.forEach((p) => {
        const state = p.stateOfOrigin || 'Unknown';
        counts[state] = (counts[state] || 0) + 1;
      });
      setStateCounts(counts);

      const backendRecords = fuRes.success && fuRes.data ? fuRes.data : [];
      const followUps = generateFollowUpsFromPatients(pRes.data, backendRecords);
      const fuSummary = getFollowUpSummary(followUps);
      setFollowUpSummary(fuSummary);
    }

    if (vRes.success && vRes.data) {
      setVisitCount(vRes.data.length);
      const sorted = [...vRes.data].sort(
        (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
      );
      setRecentVisits(sorted.slice(0, 4));
    }

    if (fRes.success && fRes.data) setFacilityCount(fRes.data.length);
    if (uRes.success && uRes.data) setStaffCount(uRes.data.length);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* SECTION 1: PRIMARY DASHBOARD VIEW (FIRST VIEWPORT - ABOVE THE FOLD) */}
      <div className="space-y-6">
        {/* Sleek Healthcare Hero Banner (~380px) */}
        <div className="bg-white p-6 sm:p-8 lg:p-9 rounded-3xl border border-[#DDE8E8] shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8F8F6] text-[#00A99D] rounded-full text-xs font-semibold uppercase tracking-wider border border-[#00A99D]/30">
              <span>SIH 2025 • Problem Statement SIH25083</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#16313A] tracking-tight leading-tight">
              Digital Health Record System for Migrant Workers in Kerala
            </h2>
            <p className="text-[#61747B] text-sm sm:text-base leading-relaxed">
              Ensuring portable, continuous health management for guest workers from West Bengal, Bihar, Assam, Odisha, and UP. Connected directly to Supabase PostgreSQL.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('patients')}
                className="px-5 py-2.5 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
              >
                Manage Patient Records →
              </button>
              <button
                onClick={() => setActiveTab('followups')}
                className="px-5 py-2.5 bg-white hover:bg-[#F0FAF8] text-[#00A99D] font-semibold rounded-xl text-sm border border-[#00A99D] transition-all"
              >
                Actionable Follow-ups ({followUpSummary.pending})
              </button>
            </div>
          </div>
        </div>

        {/* 4 Equal KPI Cards (~150px) - Fits completely in the 1440x900 viewport */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div
            onClick={() => setActiveTab('patients')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8] cursor-pointer transition-all flex flex-col justify-between min-h-[145px] space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between text-[#61747B]">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Workers</span>
              <span className="text-xl">👥</span>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#16313A] tracking-tight">
                {loading ? '...' : patientCount}
              </p>
              <p className="text-xs text-[#00A99D] mt-1 font-medium">Patients in database</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('visits')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8] cursor-pointer transition-all flex flex-col justify-between min-h-[145px] space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between text-[#61747B]">
              <span className="text-xs font-semibold uppercase tracking-wider">Visits Logged</span>
              <span className="text-xl">📋</span>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#16313A] tracking-tight">
                {loading ? '...' : visitCount}
              </p>
              <p className="text-xs text-[#3B82A0] mt-1 font-medium">Clinical consultations</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('facilities')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8] cursor-pointer transition-all flex flex-col justify-between min-h-[145px] space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between text-[#61747B]">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Facilities</span>
              <span className="text-xl">🏥</span>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#16313A] tracking-tight">
                {loading ? '...' : facilityCount}
              </p>
              <p className="text-xs text-[#E6A23C] mt-1 font-medium">PHCs & Mobile Camps</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('users')}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8] cursor-pointer transition-all flex flex-col justify-between min-h-[145px] space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between text-[#61747B]">
              <span className="text-xs font-semibold uppercase tracking-wider">Medical Staff</span>
              <span className="text-xl">👨‍⚕️</span>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-[#16313A] tracking-tight">
                {loading ? '...' : staffCount}
              </p>
              <p className="text-xs text-[#12B8A6] mt-1 font-medium">Doctors & Field Staff</p>
            </div>
          </div>
        </div>

        {/* Clear Scroll Separation Cue */}
        <div className="pt-6 pb-2 flex items-center justify-center gap-4 text-xs font-semibold text-[#61747B] tracking-wider uppercase">
          <div className="h-px bg-[#DDE8E8] flex-1 max-w-[200px]" />
          <span className="flex items-center gap-1.5 text-[#61747B]">
            <span className="text-[#00A99D] animate-bounce">↓</span>
            <span>Scroll down to view system overview</span>
          </span>
          <div className="h-px bg-[#DDE8E8] flex-1 max-w-[200px]" />
        </div>
      </div>

      {/* SECTION 2: HEALTH SYSTEM OVERVIEW (BELOW THE FOLD) */}
      <div className="pt-6 border-t border-[#DDE8E8] space-y-8">
        <div className="space-y-1.5">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#16313A] tracking-tight">Health System Overview</h3>
          <p className="text-sm text-[#61747B]">Demographic distribution, recent encounters, rule-based alerts, follow-up management, and infrastructure status</p>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* COLUMN 1: PATIENTS BY STATE OF ORIGIN */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#DDE8E8] shadow-sm flex flex-col justify-between min-h-[360px] space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDE8E8] pb-4">
              <h4 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider">
                Patients by State of Origin
              </h4>
              <span className="text-xs bg-[#F8FAFA] text-[#16313A] px-2.5 py-1 rounded border border-[#DDE8E8] font-mono">
                {Object.keys(stateCounts).length} States
              </span>
            </div>

            {loading ? (
              <p className="text-xs text-[#61747B] italic py-8">Loading state demographics...</p>
            ) : Object.keys(stateCounts).length === 0 ? (
              <p className="text-xs text-[#61747B] italic py-8">No patient origin data registered.</p>
            ) : (
              <div className="space-y-4 flex-1">
                {Object.entries(stateCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([state, count]) => {
                    const percentage = Math.round((count / (patientCount || 1)) * 100);
                    return (
                      <div key={state} className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm font-medium">
                          <span className="text-[#16313A]">{state}</span>
                          <span className="text-[#00A99D] font-mono">
                            {count} {count === 1 ? 'patient' : 'patients'} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#E8F8F6] rounded-full h-2 overflow-hidden border border-[#00A99D]/20">
                          <div
                            className="bg-[#00A99D] h-2 rounded-full transition-all"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* COLUMN 2: RECENT CLINICAL ACTIVITY */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#DDE8E8] shadow-sm flex flex-col justify-between min-h-[360px] space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDE8E8] pb-4">
              <h4 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider">
                Recent Clinical Activity
              </h4>
              <button
                onClick={() => setActiveTab('visits')}
                className="text-xs text-[#00A99D] hover:underline font-medium"
              >
                View all →
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-[#61747B] italic py-8">Loading recent visits...</p>
            ) : recentVisits.length === 0 ? (
              <p className="text-xs text-[#61747B] italic py-8">No recent clinical visits logged.</p>
            ) : (
              <div className="space-y-3.5 flex-1">
                {recentVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-3.5 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8] text-xs space-y-1.5"
                  >
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#16313A]">{visit.patient?.fullName || 'Patient'}</span>
                      <span className="text-[#61747B] text-[11px] font-mono">
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-[#61747B]">
                      <span className="text-[#61747B]">Diagnosis: </span>
                      <span className="text-[#00A99D] font-medium">{visit.diagnosis || visit.chiefComplaint}</span>
                    </div>
                    <div className="text-[#61747B] text-[11px]">
                      🏥 {visit.facility?.name || 'Healthcare Facility'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMN 3: ACTIONABLE FOLLOW-UPS SUMMARY */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#DDE8E8] shadow-sm flex flex-col justify-between min-h-[360px] space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDE8E8] pb-4">
              <h4 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider flex items-center gap-1.5">
                <span>📋 Follow-up Tasks</span>
              </h4>
              <button
                onClick={() => setActiveTab('followups')}
                className="text-xs text-[#00A99D] hover:underline font-medium"
              >
                Manage →
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-[#61747B] italic py-8">Calculating follow-up tasks...</p>
            ) : (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                    <span className="block text-2xl font-extrabold">{followUpSummary.overdue}</span>
                    <span className="text-[10px] uppercase font-semibold">🔴 Overdue</span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                    <span className="block text-2xl font-extrabold">{followUpSummary.dueSoon}</span>
                    <span className="text-[10px] uppercase font-semibold">🟡 Due Soon</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8]">
                    <span className="text-[#61747B]">Total Pending Tasks</span>
                    <span className="font-mono text-[#3B82A0] font-bold">{followUpSummary.pending}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8]">
                    <span className="text-[#61747B]">Completed Reviews</span>
                    <span className="font-mono text-[#00A99D] font-bold">{followUpSummary.completed}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('followups')}
                  className="w-full py-2 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  View All Actionable Tasks
                </button>
              </div>
            )}
          </div>

          {/* COLUMN 4: SYSTEM STATUS */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-[#DDE8E8] shadow-sm flex flex-col justify-between min-h-[360px] space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDE8E8] pb-4">
              <h4 className="text-xs font-semibold text-[#61747B] uppercase tracking-wider">
                System Status
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold rounded border border-[#00A99D]/30">
                <span className="h-2 w-2 rounded-full bg-[#00A99D] animate-pulse" />
                Operational
              </span>
            </div>

            <div className="space-y-3.5 text-xs flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between p-3.5 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8]">
                <div className="flex items-center space-x-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#00A99D]" />
                  <span className="text-[#16313A] font-medium">Patient Records</span>
                </div>
                <span className="text-[#61747B] font-mono text-[11px]">{patientCount} synced</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8]">
                <div className="flex items-center space-x-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#00A99D]" />
                  <span className="text-[#16313A] font-medium">Clinical Visits</span>
                </div>
                <span className="text-[#61747B] font-mono text-[11px]">{visitCount} logged</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8]">
                <div className="flex items-center space-x-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#00A99D]" />
                  <span className="text-[#16313A] font-medium">Healthcare Facilities</span>
                </div>
                <span className="text-[#61747B] font-mono text-[11px]">{facilityCount} active</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[#F8FAFA] rounded-xl border border-[#DDE8E8]">
                <div className="flex items-center space-x-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#00A99D]" />
                  <span className="text-[#16313A] font-medium">Staff Registry</span>
                </div>
                <span className="text-[#61747B] font-mono text-[11px]">{staffCount} registered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
