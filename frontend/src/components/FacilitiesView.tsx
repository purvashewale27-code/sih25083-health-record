import React, { useState, useEffect } from 'react';
import type { HealthcareFacility, FacilityType } from '../types';
import { apiGetFacilities, apiCreateFacility } from '../services/api';

export const FacilitiesView: React.FC = () => {
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; type: FacilityType; district: string }>({
    name: '',
    type: 'PHC',
    district: 'Ernakulam',
  });

  const loadFacilities = async () => {
    setLoading(true);
    setError(null);
    const res = await apiGetFacilities();
    if (res.success && res.data) {
      setFacilities(res.data);
    } else {
      setError(res.error || 'Failed to load healthcare facilities.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleOpenAddModal = () => {
    setAddError(null);
    setFormData({ name: '', type: 'PHC', district: 'Ernakulam' });
    setShowAddModal(true);
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!formData.name.trim()) {
      setAddError('Facility name is required.');
      return;
    }
    if (!formData.district.trim()) {
      setAddError('Kerala district is required.');
      return;
    }

    setFormSubmitting(true);
    const res = await apiCreateFacility({
      name: formData.name.trim(),
      type: formData.type,
      district: formData.district.trim(),
    });
    setFormSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      setToastMessage(`Healthcare facility "${formData.name.trim()}" added successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      loadFacilities();
    } else {
      setAddError(res.error || 'Failed to add healthcare facility.');
    }
  };

  const filteredFacilities = facilities.filter((fac) => {
    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType ? fac.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('');
  };

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

      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#DDE8E8] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#16313A] tracking-tight">Healthcare Facilities</h2>
            <span className="px-2.5 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold rounded-full border border-[#00A99D]/30 font-mono">
              {facilities.length} Active Centers
            </span>
          </div>
          <p className="text-[#61747B] text-xs mt-1">
            Manage Primary Health Centres (PHCs), mobile medical camps and district hospitals serving migrant workers.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4.5 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <span>+ Add Facility</span>
        </button>
      </div>

      {/* Compact Toolbar: Search & Facility Type Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#DDE8E8] shadow-sm">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search facility name or Kerala district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-[#16313A] placeholder-[#61747B] pl-9 pr-3 py-2 rounded-xl border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D]"
          />
          <span className="absolute left-3 top-2.5 text-[#61747B] text-xs">🔍</span>
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D] min-w-[200px]"
        >
          <option value="">All Facility Types</option>
          <option value="PHC">Primary Health Centre (PHC)</option>
          <option value="MOBILE_CAMP">Mobile Medical Camp</option>
          <option value="HOSPITAL">District Hospital</option>
        </select>

        {(searchQuery || selectedType) && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 bg-[#F8FAFA] text-[#61747B] hover:text-[#16313A] rounded-xl text-xs font-medium border border-[#DDE8E8] hover:bg-[#F0FAF8] transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-14 text-[#61747B]">
          <div className="inline-block animate-spin h-7 w-7 border-2 border-[#00A99D] border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Loading healthcare facility records...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center text-xs flex flex-col items-center gap-2">
          <span>⚠️ {error}</span>
          <button
            onClick={loadFacilities}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredFacilities.length === 0 && (
        <div className="text-center py-14 bg-white rounded-xl border border-[#DDE8E8] text-[#61747B] space-y-2.5 shadow-xs">
          <div className="text-3xl">🏥</div>
          <h3 className="text-base font-semibold text-[#16313A]">No Healthcare Facilities Found</h3>
          <p className="text-xs text-[#61747B]">No facilities match the selected type or district query.</p>
        </div>
      )}

      {/* 3-Column Grid on Desktop — Spacious, Readable Cards */}
      {!loading && !error && filteredFacilities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-white p-6 rounded-2xl border border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8] transition-all shadow-sm flex flex-col justify-between min-h-[210px] space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-xl border ${
                      facility.type === 'PHC'
                        ? 'bg-[#E8F8F6] text-[#00A99D] border-[#00A99D]/30'
                        : facility.type === 'MOBILE_CAMP'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-sky-50 text-sky-800 border-sky-200'
                    }`}
                  >
                    {facility.type === 'PHC' && '🏥 PHC'}
                    {facility.type === 'MOBILE_CAMP' && '🚐 Mobile Camp'}
                    {facility.type === 'HOSPITAL' && '🏨 Hospital'}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold rounded-full border border-[#00A99D]/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00A99D] animate-pulse" />
                    Operational
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#16313A] tracking-tight leading-snug">
                    {facility.name}
                  </h3>
                  <p className="text-xs text-[#00A99D] font-semibold mt-1.5">📍 {facility.district} District, Kerala</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#DDE8E8] flex justify-between items-center text-xs text-[#61747B]">
                <span>Registered ID:</span>
                <span className="font-mono text-[#16313A] font-medium">{facility.id.substring(0, 8)}...</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Facility Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDE8E8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#16313A]">
            <div className="flex justify-between items-center border-b border-[#DDE8E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#16313A]">Add Healthcare Facility</h3>
                <p className="text-xs text-[#61747B]">Register a PHC, camp or hospital center</p>
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

            <form onSubmit={handleCreateFacility} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#16313A] font-medium mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Perumbavoor Primary Health Centre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              <div>
                <label className="block text-[#16313A] font-medium mb-1">Facility Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as FacilityType })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                >
                  <option value="PHC">Primary Health Centre (PHC)</option>
                  <option value="MOBILE_CAMP">Mobile Medical Camp</option>
                  <option value="HOSPITAL">District Hospital</option>
                </select>
              </div>

              <div>
                <label className="block text-[#16313A] font-medium mb-1">Kerala District</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ernakulam / Kozhikode / Palakkad"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                />
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
                  {formSubmitting ? 'Saving...' : 'Add Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
