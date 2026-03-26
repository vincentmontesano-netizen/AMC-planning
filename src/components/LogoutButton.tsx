import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onLogout: () => void;
  /** `sidebar` : bouton large pour le bas du menu latéral */
  layout?: 'icon' | 'sidebar';
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout, layout = 'icon' }) => {
  if (layout === 'sidebar') {
    return (
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100"
      >
        <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
        Déconnexion
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 w-8 h-8 rounded-lg shadow-sm border border-red-200 transition-all duration-200 hover:scale-105"
      title="Se déconnecter"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
};

export default LogoutButton;
