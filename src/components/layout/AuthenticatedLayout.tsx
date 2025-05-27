// src/components/layout/AuthenticatedLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TaskSidebar from './TaskSidebar';

const AuthenticatedLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content area including its own header and the right task sidebar */}
        <div className="flex flex-1 overflow-x-hidden">
          {/* The Outlet will render the matched child route's component */}
          <Outlet />
          <TaskSidebar />
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;