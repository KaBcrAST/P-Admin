import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import authService from "../services/authService";

interface HeaderProps {
  toggleSidebar: () => void;
  setIsAuthenticated: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, setIsAuthenticated }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <header className="w-full flex justify-between items-center px-4 py-2 bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <button onClick={toggleSidebar} className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        ☰
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-3 py-1 rounded-md"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Header;
