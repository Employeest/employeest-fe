// src/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, UsersIcon, ProjectPlaceholderIcon as ProjectsIcon } from '../icons'; // Added ProjectsIcon (can be any suitable icon)

const Sidebar: React.FC = () => {
  const location = useLocation();

  const getLinkClass = (path: string) => {
    return location.pathname.startsWith(path)
      ? "p-3 bg-indigo-100 text-indigo-700 rounded-lg"
      : "p-3 text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700";
  };

  return (
    <aside className="w-20 bg-white shadow-md flex flex-col items-center py-6 space-y-6">
      {/* Logo */}
      <Link to="/dashboard" className="w-12 h-12 bg-gray-800 text-white flex items-center justify-center rounded-lg text-2xl font-bold">
        EM
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col space-y-4">
        <Link
          to="/dashboard"
          className={getLinkClass("/dashboard")}
          title="Home"
        >
          <HomeIcon className="w-6 h-6" />
        </Link>
        <Link
          to="/projects" // Link to all projects page
          className={getLinkClass("/projects")}
          title="Projects"
        >
          <ProjectsIcon className="w-6 h-6" /> {/* Changed to ProjectsIcon */}
        </Link>
        <Link
          to="/teams" // Link to all teams page
          className={getLinkClass("/teams")}
          title="Teams"
        >
          <UsersIcon className="w-6 h-6" />
        </Link>
        {/* Add more links here as needed, e.g., My Tasks, Time Logs */}
      </nav>
    </aside>
  );
};

export default Sidebar;