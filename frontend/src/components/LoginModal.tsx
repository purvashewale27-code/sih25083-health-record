import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Kerala@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Login failed');
    }
  };

  const handleQuickSelect = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Kerala@123');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#DDE8E8] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 text-[#16313A]">
        <div className="flex justify-between items-start border-b border-[#DDE8E8] pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F8F6] text-[#00A99D] text-xs font-semibold uppercase tracking-wider mb-1 border border-[#00A99D]/30">
              <span>Kerala DHS Access Control</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#16313A]">Staff & Medical Login</h3>
            <p className="text-xs text-[#61747B]">Role-based access for Medical Officers, Triage & Admins</p>
          </div>
          <button
            onClick={() => setShowLoginModal(false)}
            className="text-[#61747B] hover:text-[#16313A] text-lg p-1 rounded-lg hover:bg-[#F0FAF8]"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#16313A] font-semibold mb-1">Official DHS / Hospital Email</label>
            <input
              type="email"
              required
              placeholder="dr.rajesh.nambiar@dhs.kerala.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
            />
          </div>

          <div>
            <label className="block text-[#16313A] font-semibold mb-1">Security Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white text-[#16313A] px-3.5 py-2 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#00A99D] hover:bg-[#008F83] text-white font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </div>
        </form>

        {/* Quick Demo Switcher for Hackathon Evaluation */}
        <div className="pt-2 border-t border-[#DDE8E8] space-y-2">
          <span className="text-[11px] font-semibold text-[#61747B] uppercase tracking-wider block">
            Demo 1-Click Role Switcher:
          </span>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickSelect('dr.rajesh.nambiar@dhs.kerala.gov.in')}
              className="px-3 py-1.5 bg-[#F8FAFA] hover:bg-[#E8F8F6] border border-[#DDE8E8] hover:border-[#00A99D]/40 rounded-xl text-left flex items-center justify-between transition-colors"
            >
              <div>
                <strong className="block text-[#16313A]">Dr. Rajesh Nambiar</strong>
                <span className="text-[10px] text-[#61747B]">Doctor • Pulmonology (Full Clinical Rx)</span>
              </div>
              <span className="text-xs">🩺</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('sunil.health@kerala.gov.in')}
              className="px-3 py-1.5 bg-[#F8FAFA] hover:bg-[#E8F8F6] border border-[#DDE8E8] hover:border-[#00A99D]/40 rounded-xl text-left flex items-center justify-between transition-colors"
            >
              <div>
                <strong className="block text-[#16313A]">Sunil Kumar K. V.</strong>
                <span className="text-[10px] text-[#61747B]">Health Worker • Field Triage & Registration</span>
              </div>
              <span className="text-xs">📋</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('admin.migranthealth@kerala.gov.in')}
              className="px-3 py-1.5 bg-[#F8FAFA] hover:bg-[#E8F8F6] border border-[#DDE8E8] hover:border-[#00A99D]/40 rounded-xl text-left flex items-center justify-between transition-colors"
            >
              <div>
                <strong className="block text-[#16313A]">Kerala Migrant Health Admin</strong>
                <span className="text-[10px] text-[#61747B]">District Admin • Analytics & Staff Management</span>
              </div>
              <span className="text-xs">🛡️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
