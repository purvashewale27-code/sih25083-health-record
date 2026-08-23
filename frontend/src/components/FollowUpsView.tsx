import React, { useState, useEffect, useCallback } from 'react';
import { apiGetPatients, apiGetFollowUps } from '../services/api';
import {
  generateFollowUpsFromPatients,
  getFollowUpSummary,
  persistFollowUpStatus,
  type FollowUpItem,
  type FollowUpStatus,
} from '../utils/followUpEngine';
import { PatientDetailModal } from './PatientDetailModal';

export const FollowUpsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'COMPLETED' | 'HIGH'>('ALL');

  // Modal target
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [pRes, fuRes] = await Promise.all([apiGetPatients(), apiGetFollowUps()]);
    if (pRes.success && pRes.data) {
      const backendRecords = fuRes.success && fuRes.data ? fuRes.data : [];
      const generated = generateFollowUpsFromPatients(pRes.data, backendRecords);
      setFollowUps(generated);
    } else {
      setError(pRes.error || 'Failed to load follow-up tasks.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateStatus = async (item: FollowUpItem, newStatus: FollowUpStatus) => {
    // Optimistic UI update
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === item.id
          ? {
              ...f,
              status: newStatus,
              completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null,
            }
          : f
      )
    );

    // Persist to Supabase backend
    const ok = await persistFollowUpStatus(item.id, item.patientId, newStatus);
    if (!ok) {
      alert('Failed to save follow-up status to Supabase server.');
      loadData();
    }
  };

  const summary = getFollowUpSummary(followUps);
  const now = new Date();

  const filteredFollowUps = followUps.filter((item) => {
    const due = new Date(item.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    const matchesSearch =
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.healthId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.officialHealthId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'OVERDUE') return item.status !== 'COMPLETED' && diffDays < 0;
    if (activeFilter === 'DUE_SOON') return item.status !== 'COMPLETED' && diffDays >= 0 && diffDays <= 7;
    if (activeFilter === 'COMPLETED') return item.status === 'COMPLETED';
    if (activeFilter === 'HIGH') return item.severity === 'HIGH';
    return true;
  });

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#DDE8E8] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#16313A] tracking-tight">
              Actionable Follow-ups
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200 font-mono">
              {summary.pending} Tasks Pending
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-[11px] font-semibold rounded-full border border-[#00A99D]/30 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00A99D] animate-pulse" />
              Supabase Persisted
            </span>
          </div>
          <p className="text-[#61747B] text-xs mt-0.5">
            Convert clinical alerts into actionable follow-up tasks for healthcare staff across Kerala facilities.
          </p>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveFilter('OVERDUE')}
          className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 shadow-xs ${
            activeFilter === 'OVERDUE'
              ? 'bg-rose-100 border-rose-300 text-rose-800'
              : 'bg-rose-50 border-rose-200 text-rose-700 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <span>Overdue</span>
            <span>🔴</span>
          </div>
          <p className="text-2xl font-extrabold text-[#16313A]">{summary.overdue}</p>
          <p className="text-[10px] text-rose-600 font-medium">Past due date — action required</p>
        </div>

        <div
          onClick={() => setActiveFilter('DUE_SOON')}
          className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 shadow-xs ${
            activeFilter === 'DUE_SOON'
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <span>Due Soon (7 Days)</span>
            <span>🟡</span>
          </div>
          <p className="text-2xl font-extrabold text-[#16313A]">{summary.dueSoon}</p>
          <p className="text-[10px] text-amber-600 font-medium">Upcoming clinical reviews</p>
        </div>

        <div
          onClick={() => setActiveFilter('ALL')}
          className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 shadow-xs ${
            activeFilter === 'ALL'
              ? 'bg-sky-100 border-sky-300 text-sky-800'
              : 'bg-sky-50 border-sky-200 text-sky-700 hover:border-sky-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <span>Total Pending</span>
            <span>🔵</span>
          </div>
          <p className="text-2xl font-extrabold text-[#16313A]">{summary.pending}</p>
          <p className="text-[10px] text-sky-600 font-medium">Active follow-up queue</p>
        </div>

        <div
          onClick={() => setActiveFilter('COMPLETED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 shadow-xs ${
            activeFilter === 'COMPLETED'
              ? 'bg-[#d5f3ee] border-[#00A99D]/50 text-[#00A99D]'
              : 'bg-[#E8F8F6] border-[#00A99D]/30 text-[#00A99D] hover:border-[#00A99D]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <span>Completed</span>
            <span>✅</span>
          </div>
          <p className="text-2xl font-extrabold text-[#16313A]">{summary.completed}</p>
          <p className="text-[10px] text-[#00A99D] font-medium">Successfully resolved</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-[#DDE8E8] shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by worker name, Health ID, or risk reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-[#16313A] placeholder-[#61747B] pl-9 pr-3 py-1.5 rounded-lg border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D]"
          />
          <span className="absolute left-2.5 top-2 text-[#61747B] text-xs">🔍</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', 'OVERDUE', 'DUE_SOON', 'COMPLETED', 'HIGH'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeFilter === f
                  ? 'bg-[#00A99D] text-white shadow-xs'
                  : 'bg-[#F8FAFA] text-[#61747B] hover:text-[#16313A] border border-[#DDE8E8]'
              }`}
            >
              {f === 'ALL' && `All (${followUps.length})`}
              {f === 'OVERDUE' && `Overdue (${summary.overdue})`}
              {f === 'DUE_SOON' && `Due Soon (${summary.dueSoon})`}
              {f === 'COMPLETED' && `Completed (${summary.completed})`}
              {f === 'HIGH' && `🔴 High`}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-14 text-[#61747B]">
          <div className="inline-block animate-spin h-7 w-7 border-2 border-[#00A99D] border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Fetching persistent follow-up tasks from Supabase PostgreSQL...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center text-xs flex flex-col items-center gap-2">
          <span>⚠️ {error}</span>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredFollowUps.length === 0 && (
        <div className="text-center py-14 bg-white rounded-xl border border-[#DDE8E8] text-[#61747B] space-y-2.5 shadow-xs">
          <div className="text-3xl">✅</div>
          <h3 className="text-base font-semibold text-[#16313A]">No Follow-up Tasks Found</h3>
          <p className="text-xs text-[#61747B] max-w-md mx-auto">
            No follow-up items match the selected search query or status filter.
          </p>
        </div>
      )}

      {/* Follow-up Cards Grid */}
      {!loading && !error && filteredFollowUps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFollowUps.map((item) => {
            const due = new Date(item.dueDate);
            const isOverdue = item.status !== 'COMPLETED' && due.getTime() < now.getTime();

            return (
              <div
                key={item.id}
                className={`p-4.5 sm:p-5 rounded-xl border shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                  item.status === 'COMPLETED'
                    ? 'bg-[#F8FAFA] border-[#DDE8E8] opacity-80'
                    : isOverdue
                    ? 'bg-rose-50/40 border-rose-300'
                    : 'bg-white border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8]'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-xs font-mono font-semibold rounded border border-[#00A99D]/30">
                        {item.officialHealthId}
                      </span>
                      <h3 className="text-base font-bold text-[#16313A] mt-1 tracking-tight">{item.patientName}</h3>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border font-mono ${
                        item.severity === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.severity === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#16313A]">
                    <div>
                      <span className="text-[#61747B] block text-[11px]">Risk Reason:</span>
                      <strong className="text-[#16313A]">{item.reason}</strong>
                    </div>

                    <div>
                      <span className="text-[#61747B] block text-[11px]">Clinical Context:</span>
                      <p className="text-[#16313A] bg-[#F8FAFA] p-2 rounded-lg border border-[#DDE8E8] leading-snug">
                        {item.relatedDiagnosis}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-0.5 text-[#61747B] font-mono text-[11px]">
                      <span>Due Date:</span>
                      <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-[#16313A]'}`}>
                        {new Date(item.dueDate).toLocaleDateString()} {isOverdue && '(OVERDUE)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#DDE8E8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#61747B] font-mono">
                      Status: <strong className="text-[#16313A]">{item.status}</strong>
                    </span>

                    <div className="flex gap-1.5">
                      {item.status !== 'COMPLETED' && item.status !== 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateStatus(item, 'IN_PROGRESS')}
                          className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          In Progress
                        </button>
                      )}

                      {item.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => handleUpdateStatus(item, 'COMPLETED')}
                          className="px-2.5 py-1 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
                        >
                          ✓ Mark Completed
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#00A99D] font-semibold">✓ Resolved</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs pt-0.5">
                    <button
                      onClick={() => setSelectedPatientId(item.patientId)}
                      className="flex-1 px-3 py-1.5 bg-[#E8F8F6] hover:bg-[#d5f3ee] text-[#00A99D] rounded-lg border border-[#00A99D]/30 text-center font-semibold transition-colors"
                    >
                      View Health Record
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatientId && (
        <PatientDetailModal patientId={selectedPatientId} onClose={() => setSelectedPatientId(null)} />
      )}
    </div>
  );
};
