import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendOnline: boolean | null;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendOnline,
  onRefreshHealth,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'patients', label: 'Patients' },
    { id: 'visits', label: 'Visits' },
    { id: 'facilities', label: 'Facilities' },
    { id: 'users', label: 'Staff / Users' },
    { id: 'followups', label: 'Follow-ups' },
  ];

  return (
    <header className="bg-white border-b border-[#DDE8E8] sticky top-0 z-30 shadow-sm">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#E8F8F6] border border-[#00A99D]/30 flex items-center justify-center text-[#00A99D] font-bold text-xl shadow-xs">
              ⚕️
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#16313A] tracking-tight">Kerala Migrant Health Portal</h1>
              <p className="text-xs text-[#61747B]">SIH25083 Digital Health Record System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#E8F8F6] text-[#00A99D] border border-[#00A99D]/30 font-semibold shadow-xs'
                      : 'text-[#61747B] hover:text-[#16313A] hover:bg-[#F0FAF8]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <button
              onClick={onRefreshHealth}
              title="Click to re-check backend connection"
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isBackendOnline === true
                  ? 'bg-[#E8F8F6] text-[#00A99D] border-[#00A99D]/30 hover:bg-[#d5f3ee]'
                  : isBackendOnline === false
                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isBackendOnline === true
                    ? 'bg-[#00A99D] animate-pulse'
                    : isBackendOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span>
                {isBackendOnline === true
                  ? 'Backend Connected'
                  : isBackendOnline === false
                  ? 'Backend Offline'
                  : 'Connecting...'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto space-x-1.5 py-2.5 border-t border-[#DDE8E8]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
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
