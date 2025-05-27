// src/components/layout/DashboardLayout.tsx
import React from 'react';
import Sidebar from './Sidebar';
import MainDashboardContent from './MainDashboardContent';
import TaskSidebar from './TaskSidebar';

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content area including its own header and the right task sidebar */}
        <div className="flex flex-1 overflow-x-hidden">
          <MainDashboardContent />
          <TaskSidebar />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;