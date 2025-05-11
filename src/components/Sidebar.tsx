import React from "react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-64"
      }`}
    >
      <div className="p-5">
        <h2 className="text-2xl font-bold mb-5">Admin Panel</h2>
        <nav className="mt-8">
          <ul className="space-y-2">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block p-3 rounded hover:bg-gray-700 ${
                    isActive ? "bg-blue-600" : ""
                  }`
                }
              >
                <span className="mr-2">📊</span> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `block p-3 rounded hover:bg-gray-700 ${
                    isActive ? "bg-blue-600" : ""
                  }`
                }
              >
                <span className="mr-2">👥</span> Utilisateurs
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `block p-3 rounded hover:bg-gray-700 ${
                    isActive ? "bg-blue-600" : ""
                  }`
                }
              >
                <span className="mr-2">🚨</span> Signalements
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/predictions"
                className={({ isActive }) =>
                  `block p-3 rounded hover:bg-gray-700 ${
                    isActive ? "bg-blue-600" : ""
                  }`
                }
              >
                <span className="mr-2">🔮</span> Prédictions
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
