import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import LogoutButton from './components/LogoutButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import EmployeeList from './components/EmployeeList';
import StationsView from './components/StationsView';
import PlanningGantt from './components/PlanningGantt';
import ShiftsModule from './components/ShiftsModule';
import { Employee, fetchEmployees, makeApiRequest } from './utils/api';

const MainApp = () => {
  const { isAuthenticated, logout, token } = useAuth();
  const [activeSection, setActiveSection] = useState('Planning MEC');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const loadedTokenRef = useRef<string | null>(null);

  const menuItems = ['Planning MEC', 'Liste MEC', 'Station', 'Shifts'];

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
      <aside className="w-full lg:w-64 bg-white/85 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-white/60 shadow-sm">
        <div className="px-4 py-4 lg:py-6 border-b border-gray-200">
          <img
            src="/images/59eee07c-20f1-4d39-b757-85758d019d18.avif"
            alt="iCare AMS Logo"
            className="h-10 lg:h-14 w-auto"
          />
        </div>
        <nav className="p-3 lg:p-4 flex lg:block gap-2 overflow-x-auto lg:overflow-visible">
          {menuItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setActiveSection(item)}
              className={`shrink-0 lg:w-full text-left px-3 py-2 rounded-md transition-colors whitespace-nowrap ${
                activeSection === item
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="bg-white/70 backdrop-blur-sm shadow-sm border-b border-white/60">
          <div className="px-3 py-3 sm:px-6 lg:px-8 flex justify-end items-center">
            <LogoutButton onLogout={logout} />
          </div>
        </header>
        <main className="px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
          <div className="bg-white/85 backdrop-blur-sm rounded-xl shadow-lg border border-white/70 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">{activeSection}</h2>
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