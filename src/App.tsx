import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import LogoutButton from './components/LogoutButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import EmployeeList from './components/EmployeeList';
import StationsView from './components/StationsView';
import PlanningGantt from './components/PlanningGantt';
import ShiftsModule from './components/ShiftsModule';
import UserModule from './components/UserModule';
import SettingsModule from './components/SettingsModule';
import { Employee, fetchEmployees, makeApiRequest } from './utils/api';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CalendarDays,
  Clock,
  Settings,
  Users,
  UserRound,
} from 'lucide-react';

type MenuKey =
  | 'Planning MEC'
  | 'Liste MEC'
  | 'Station'
  | 'Shifts'
  | 'User'
  | 'Paramètres';

const primaryNav: { key: MenuKey; label: string; icon: LucideIcon }[] = [
  { key: 'Planning MEC', label: 'Planning MEC', icon: CalendarDays },
  { key: 'Liste MEC', label: 'Liste MEC', icon: Users },
  { key: 'Station', label: 'Liste Station', icon: Building2 },
  { key: 'Shifts', label: 'Liste Shift', icon: Clock },
];

const accountNav: { key: MenuKey; label: string; icon: LucideIcon }[] = [
  { key: 'User', label: 'Utilisateur', icon: UserRound },
  { key: 'Paramètres', label: 'Paramètres', icon: Settings },
];

function sectionHeading(key: MenuKey): string {
  if (key === 'User') return 'Utilisateur';
  if (key === 'Station') return 'Liste Station';
  if (key === 'Shifts') return 'Liste Shift';
  return key;
}

function navButtonClass(active: boolean, variant: 'primary' | 'account'): string {
  const base =
    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150';
  if (variant === 'primary') {
    return `${base} ${
      active
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-1 ring-blue-600/20'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;
  }
  return `${base} ${
    active
      ? 'bg-slate-900 text-white shadow-md ring-1 ring-slate-900/10'
      : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm ring-1 ring-slate-200/80'
  }`;
}

const MainApp = () => {
  const { isAuthenticated, logout, token } = useAuth();
  const [activeSection, setActiveSection] = useState<MenuKey>('Planning MEC');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const loadedTokenRef = useRef<string | null>(null);

  const handleLoginSuccess = () => {
    // The login function will be called from LoginPage after successful authentication
    // We just need to trigger a re-render, which will happen automatically via context
  };

  const loadEmployees = useCallback(async () => {
    if (!token) return;
    try {
      setIsDataLoading(true);
      setDataError('');
      const data = await fetchEmployees({ token });
      setEmployees(data);
      setUpdatedAt(new Date());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue';
      setDataError(message);
      if (message.toLowerCase().includes('non autorisé') || message.toLowerCase().includes('session')) {
        logout();
      }
    } finally {
      setIsDataLoading(false);
    }
  }, [token, logout]);

  // Charge une seule fois les données à la connexion.
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    if (loadedTokenRef.current === token) return;
    loadedTokenRef.current = token;
    loadEmployees();
  }, [isAuthenticated, token, loadEmployees]);

  // Heartbeat API pour garder la session/token actif.
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let cancelled = false;

    const ping = async () => {
      try {
        await makeApiRequest('/', 'GET', {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        });
      } catch (_e) {
        // Ping best-effort: on ignore les erreurs réseau/timeout.
      }
    };

    // Ping immédiat puis périodique.
    ping();
    const intervalId = setInterval(() => {
      if (!cancelled) ping();
    }, 4 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isAuthenticated, token]);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Show main application if authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex flex-col lg:flex-row">
      <aside className="flex w-full flex-col lg:h-screen lg:w-[17rem] lg:shrink-0 lg:sticky lg:top-0 border-b border-slate-200/80 bg-white/95 shadow-[4px_0_24px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md lg:border-b-0 lg:border-r">
        <div className="shrink-0 border-b border-slate-100 px-4 py-5">
          <img
            src="/images/59eee07c-20f1-4d39-b757-85758d019d18.avif"
            alt="iCare AMS Logo"
            className="h-10 w-auto lg:h-12"
          />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Navigation</p>
        </div>

        <nav
          aria-label="Menu principal"
          className="flex min-h-0 flex-1 flex-row gap-1.5 overflow-x-auto px-3 py-3 lg:flex-col lg:gap-1 lg:overflow-y-auto lg:overflow-x-visible lg:px-3 lg:py-4"
        >
          {primaryNav.map(({ key, label, icon: Icon }) => {
            const active = activeSection === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={`shrink-0 whitespace-nowrap lg:whitespace-normal ${navButtonClass(active, 'primary')}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`} strokeWidth={2} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-0 border-t border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-slate-100/50 px-3 pb-3 pt-2 lg:px-3 lg:pb-4">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Compte</p>
          <div className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-sm">
            {accountNav.map(({ key, label, icon: Icon }) => {
              const active = activeSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSection(key)}
                  className={navButtonClass(active, 'account')}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-500'}`}
                    strokeWidth={2}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3">
            <LogoutButton onLogout={logout} layout="sidebar" />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        <main className="flex-1 px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
          <div className="bg-white/85 backdrop-blur-sm rounded-xl shadow-lg border border-white/70 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{sectionHeading(activeSection)}</h2>
            {activeSection === 'Liste MEC' && (
              <EmployeeList
                employees={employees}
                isLoading={isDataLoading}
                error={dataError}
                updatedAt={updatedAt}
                onRefresh={loadEmployees}
              />
            )}
            {activeSection === 'Station' && (
              <StationsView
                employees={employees}
                isLoading={isDataLoading}
                error={dataError}
                onRefresh={loadEmployees}
              />
            )}
            {activeSection === 'Planning MEC' && (
              <PlanningGantt
                employees={employees}
                isLoading={isDataLoading}
                error={dataError}
                onRefresh={loadEmployees}
              />
            )}
            {activeSection === 'Shifts' && <ShiftsModule />}
            {activeSection === 'User' && <UserModule />}
            {activeSection === 'Paramètres' && <SettingsModule key={token ?? 'out'} />}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;