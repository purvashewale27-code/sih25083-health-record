import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { VisitsView } from './components/VisitsView';
import { FacilitiesView } from './components/FacilitiesView';
import { UsersView } from './components/UsersView';
import { FollowUpsView } from './components/FollowUpsView';
import { apiCheckHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  const checkBackendHealth = useCallback(async () => {
    const res = await apiCheckHealth();
    setIsBackendOnline(res.success);
  }, []);

  useEffect(() => {
    checkBackendHealth();
    // Poll health status every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#16313A] flex flex-col font-sans selection:bg-[#00A99D] selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendOnline={isBackendOnline}
        onRefreshHealth={checkBackendHealth}
      />

      {/* Main Content Body - Desktop Viewport Flex Layout */}
      <main className="flex-1 w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1650px] mx-auto py-4 sm:py-5">
        {isBackendOnline === false && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3 text-sm">
              <span className="text-xl">⚠️</span>
              <div>
                <strong className="block font-semibold">Backend Server Offline</strong>
                <span className="text-xs text-rose-600">
                  Ensure the Express server is running on <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">http://localhost:5000</code>.
                </span>
              </div>
            </div>
            <button
              onClick={checkBackendHealth}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow transition-colors"
            >
              Reconnect
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
        {activeTab === 'patients' && <PatientsView />}
        {activeTab === 'visits' && <VisitsView />}
        {activeTab === 'facilities' && <FacilitiesView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'followups' && <FollowUpsView />}
      </main>

      {/* Footer positioned cleanly at bottom of viewport */}
      <footer className="mt-auto bg-white border-t border-[#DDE8E8] py-4 text-center text-xs text-[#61747B] space-y-0.5">
        <p className="font-medium text-[#16313A]">
          SIH 2025 • Problem Statement SIH25083 — Digital Health Record Management System for Migrant Workers in Kerala
        </p>
        <p className="text-[#61747B] font-mono text-[11px]">
          React 19 + TypeScript + Vite + Tailwind CSS | Express + Prisma + Supabase PostgreSQL
        </p>
      </footer>
    </div>
  );
}
