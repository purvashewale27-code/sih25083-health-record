import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { apiGetUsers, apiCreateUser } from '../services/api';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; email: string; role: UserRole }>({
    name: '',
    email: '',
    role: 'DOCTOR',
  });

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    const res = await apiGetUsers();
    if (res.success && res.data) {
      setUsers(res.data);
    } else {
      setError(res.error || 'Failed to load system staff users.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAddModal = () => {
    setAddError(null);
    setFormData({ name: '', email: '', role: 'DOCTOR' });
    setShowAddModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!formData.name.trim()) {
      setAddError('Full name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setAddError('Valid email address is required.');
      return;
    }

    setFormSubmitting(true);
    const res = await apiCreateUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
    });
    setFormSubmitting(false);

    if (res.success) {
      setShowAddModal(false);
      setToastMessage(`Staff member "${formData.name.trim()}" added successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      loadUsers();
    } else {
      setAddError(res.error || 'Failed to add staff member. Check if email is already registered.');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole ? user.role === selectedRole : true;
    return matchesSearch && matchesRole;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRole('');
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#DDE8E8] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#16313A] tracking-tight">Staff & Users</h2>
            <span className="px-2.5 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold rounded-full border border-[#00A99D]/30 font-mono">
              {users.length} Active Staff
            </span>
          </div>
          <p className="text-[#61747B] text-xs mt-0.5">
            Manage healthcare officers, community health workers and system administrators.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-[#00A99D] hover:bg-[#008F83] text-white font-semibold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <span>+ Add Staff Member</span>
        </button>
      </div>

      {/* Compact Toolbar: Search & Role Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-[#DDE8E8] shadow-xs">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search staff by name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-[#16313A] placeholder-[#61747B] pl-9 pr-3 py-1.5 rounded-lg border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D]"
          />
          <span className="absolute left-2.5 top-2 text-[#61747B] text-xs">🔍</span>
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-white text-[#16313A] px-3 py-1.5 rounded-lg border border-[#DDE8E8] text-xs focus:outline-none focus:border-[#00A99D] min-w-[180px]"
        >
          <option value="">All Staff Roles</option>
          <option value="DOCTOR">Medical Officer (Doctor)</option>
          <option value="HEALTH_WORKER">Community Health Worker</option>
          <option value="ADMIN">System Administrator</option>
        </select>

        {(searchQuery || selectedRole) && (
          <button
            onClick={handleResetFilters}
            className="px-2.5 py-1 bg-[#F8FAFA] text-[#61747B] hover:text-[#16313A] rounded-md text-[11px] font-medium border border-[#DDE8E8] hover:bg-[#F0FAF8] transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-14 text-[#61747B]">
          <div className="inline-block animate-spin h-7 w-7 border-2 border-[#00A99D] border-t-transparent rounded-full mb-2" />
          <p className="text-xs">Loading registered system staff...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-center text-xs flex flex-col items-center gap-2">
          <span>⚠️ {error}</span>
          <button
            onClick={loadUsers}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredUsers.length === 0 && (
        <div className="text-center py-14 bg-white rounded-xl border border-[#DDE8E8] text-[#61747B] space-y-2.5 shadow-xs">
          <div className="text-3xl">👨‍⚕️</div>
          <h3 className="text-base font-semibold text-[#16313A]">No Staff Members Found</h3>
          <p className="text-xs text-[#61747B]">No users match the search query or selected role filter.</p>
        </div>
      )}

      {/* 3-Column Staff Grid */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white p-5 rounded-xl border border-[#DDE8E8] hover:border-[#00A99D]/50 hover:bg-[#F0FAF8] transition-all shadow-xs flex flex-col justify-between min-h-[180px] space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <span
                    className={`px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-lg border ${
                      user.role === 'DOCTOR'
                        ? 'bg-[#E8F8F6] text-[#00A99D] border-[#00A99D]/30'
                        : user.role === 'HEALTH_WORKER'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    }`}
                  >
                    {user.role === 'DOCTOR' && '👨‍⚕️ Medical Officer'}
                    {user.role === 'HEALTH_WORKER' && '🏥 Health Worker'}
                    {user.role === 'ADMIN' && '⚙️ Administrator'}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E8F8F6] text-[#00A99D] text-[10px] font-semibold rounded-full border border-[#00A99D]/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00A99D] animate-pulse" />
                    Active
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#16313A] tracking-tight">{user.name}</h3>
                  <p className="text-xs text-[#61747B] font-mono mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#DDE8E8] flex justify-between items-center text-xs text-[#61747B]">
                <span>Member Since:</span>
                <span className="font-mono text-[#16313A]">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDE8E8] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-[#16313A]">
            <div className="flex justify-between items-center border-b border-[#DDE8E8] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#16313A]">Add Staff Member</h3>
                <p className="text-xs text-[#61747B]">Register a new doctor, officer or health worker</p>
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

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#16313A] font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ananya Nair"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              <div>
                <label className="block text-[#16313A] font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@keralahealth.gov.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                />
              </div>

              <div>
                <label className="block text-[#16313A] font-medium mb-1">System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full bg-white text-[#16313A] px-3.5 py-2.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
                >
                  <option value="DOCTOR">Medical Officer (DOCTOR)</option>
                  <option value="HEALTH_WORKER">Community Health Worker (HEALTH_WORKER)</option>
                  <option value="ADMIN">System Administrator (ADMIN)</option>
                </select>
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
                  {formSubmitting ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
