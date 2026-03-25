import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onLogout: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  return (
    <button
      onClick={onLogout}
      className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 w-8 h-8 rounded-lg shadow-sm border border-red-200 transition-all duration-200 hover:scale-105"
      title="Se déconnecter"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
};

export default LogoutButton;
