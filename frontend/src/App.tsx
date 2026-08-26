import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { VisitsView } from './components/VisitsView';
import { FacilitiesView } from './components/FacilitiesView';
import { UsersView } from './components/UsersView';
import { FollowUpsView } from './components/FollowUpsView';
import { AppointmentsView } from './components/AppointmentsView';
import { LoginModal } from './components/LoginModal';
import { AuthProvider } from './context/AuthContext';
import { apiCheckHealth } from './services/api';
import { type LanguageCode } from './utils/i18n';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');

  // Check URL parameters for direct QR scan navigation (e.g. ?verify=KMH-2026-00001 or ?tab=patients)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyParam = params.get('verify') || params.get('healthId');
    const tabParam = params.get('tab');
    const langParam = params.get('lang') as LanguageCode;

    if (langParam && ['en', 'hi', 'bn', 'ml', 'or'].includes(langParam)) {
      setCurrentLang(langParam);
    }

    if (verifyParam) {
      setActiveTab('patients');
    } else if (
      tabParam &&
      ['dashboard', 'patients', 'appointments', 'visits', 'facilities', 'users', 'followups'].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, []);

  const checkBackendHealth = useCallback(async () => {
    const res = await apiCheckHealth();
    setIsBackendOnline(res.success);
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#F8FAFA] text-[#16313A] flex flex-col font-sans selection:bg-[#00A99D] selection:text-white">
        {/* Navigation Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isBackendOnline={isBackendOnline}
          onRefreshHealth={checkBackendHealth}
          currentLang={currentLang}
          onSelectLang={setCurrentLang}
        />

        {/* Login Modal */}
        <LoginModal />

        {/* Main Content Body */}
        <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
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
          {activeTab === 'patients' && <PatientsView currentLang={currentLang} />}
          {activeTab === 'appointments' && <AppointmentsView />}
          {activeTab === 'visits' && <VisitsView />}
          {activeTab === 'facilities' && <FacilitiesView />}
          {activeTab === 'users' && <UsersView />}
          {activeTab === 'followups' && <FollowUpsView />}
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-white border-t border-[#DDE8E8] py-4 text-center text-xs text-[#61747B] space-y-0.5">
          <p className="font-medium text-[#16313A]">
            SIH 2025 • Problem Statement SIH25083 — Digital Health Record Management System for Migrant Workers in Kerala
          </p>
          <p className="text-[#61747B] font-mono text-[11px]">
            React 19 + TypeScript + Vite + Tailwind CSS | Express + Prisma + Supabase PostgreSQL
          </p>
        </footer>
      </div>
    </AuthProvider>
  );
}
