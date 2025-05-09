import React from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded-lg font-medium transition-colors ${
      location.pathname === path
        ? "bg-blue-500 text-white"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    }`;

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        w-64 bg-white dark:bg-gray-800 shadow-md p-4
      `}
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">Admin Panel</h2>
      <nav className="space-y-2">
        <Link to="/" className={linkClass("/")}>Dashboard</Link>
        <Link to="/users" className={linkClass("/users")}>Utilisateurs</Link>
        <Link to="/reports" className={linkClass("/reports")}>Signalements</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
