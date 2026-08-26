import React from 'react';
import { type LanguageCode, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendOnline: boolean | null;
  onRefreshHealth: () => void;
  currentLang: LanguageCode;
  onSelectLang: (lang: LanguageCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendOnline,
  onRefreshHealth,
  currentLang,
  onSelectLang,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const { user, isAuthenticated, logout, setShowLoginModal } = useAuth();

  const tabs = [
    { id: 'dashboard', label: t.dashboard || 'Dashboard' },
    { id: 'patients', label: t.patients || 'Patients' },
    { id: 'appointments', label: '📅 Appointments' },
    { id: 'visits', label: t.visits || 'Visits' },
    { id: 'facilities', label: t.facilities || 'Facilities' },
    { id: 'users', label: t.staffUsers || 'Staff / Users' },
    { id: 'followups', label: t.followups || 'Follow-ups' },
  ];

  return (
    <header className="bg-white border-b border-[#DDE8E8] sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-9 w-9 rounded-xl bg-[#E8F8F6] border border-[#00A99D]/30 flex items-center justify-center text-[#00A99D] font-bold text-lg shadow-xs">
              ⚕️
            </div>
            <div>
              <h1 className="text-base font-bold text-[#16313A] tracking-tight leading-tight">{t.portalTitle}</h1>
              <p className="text-[11px] text-[#61747B]">{t.portalSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <nav className="hidden lg:flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#E8F8F6] text-[#00A99D] border border-[#00A99D]/30 shadow-xs'
                      : 'text-[#61747B] hover:text-[#16313A] hover:bg-[#F0FAF8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Multilingual Selector */}
            <div className="relative">
              <select
                value={currentLang}
                onChange={(e) => onSelectLang(e.target.value as LanguageCode)}
                className="bg-[#F8FAFA] hover:bg-[#F0FAF8] text-[#16313A] text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#DDE8E8] focus:outline-none focus:border-[#00A99D] cursor-pointer shadow-xs transition-colors"
                title="Select language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            {/* Auth / Role Badge */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-[#DDE8E8]">
                <div className="hidden sm:block text-right">
                  <span className="block text-xs font-bold text-[#16313A] leading-tight truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-[#E8F8F6] text-[#00A99D] rounded font-semibold">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="px-2.5 py-1 text-xs bg-[#F8FAFA] hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl border border-[#DDE8E8] transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-1.5 bg-[#00A99D] hover:bg-[#008F83] text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
              >
                <span>🔑</span>
                <span>Staff Login</span>
              </button>
            )}

            {/* Server health pill */}
            <button
              onClick={onRefreshHealth}
              title="Click to re-check backend connection"
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                isBackendOnline === true
                  ? 'bg-[#E8F8F6] text-[#00A99D] border-[#00A99D]/30'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isBackendOnline === true ? 'bg-[#00A99D] animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span>{isBackendOnline === true ? 'Live' : 'Offline'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex overflow-x-auto space-x-1.5 py-2 border-t border-[#DDE8E8]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#E8F8F6] text-[#00A99D] border border-[#00A99D]/30 font-semibold'
                  : 'text-[#61747B] hover:bg-[#F0FAF8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
