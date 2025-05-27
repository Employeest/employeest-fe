// src/components/layout/Sidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, UsersIcon } from '../icons'; // Assuming icons.tsx is in ../components

const Sidebar: React.FC = () => {
  return (
    <aside className="w-20 bg-white shadow-md flex flex-col items-center py-6 space-y-6">
      {/* Logo */}
      <div className="w-12 h-12 bg-gray-800 text-white flex items-center justify-center rounded-lg text-2xl font-bold">
        EM
      </div>

      {/* Navigation */}
      <nav className="flex flex-col space-y-4">
        <Link
          to="/dashboard"
          className="p-3 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300"
          title="Home"
        >
          <HomeIcon className="w-6 h-6" />
        </Link>
        <Link
          to="/team" // Placeholder link
          className="p-3 text-gray-500 rounded-lg hover:bg-gray-100"
          title="Team"
        >
          <UsersIcon className="w-6 h-6" />
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;