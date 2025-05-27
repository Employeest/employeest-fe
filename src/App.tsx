// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Connect from './pages/Connect';
import SignUp from './pages/SignUp';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectListPage from './pages/ProjectListPage';
import ProfilePage from './pages/ProfilePage';
import TeamDetailPage from './pages/TeamDetailPage';
import TeamListPage from './pages/TeamListPage';
import TaskDetailPage from './pages/TaskDetailPage'; // Import TaskDetailPage
// import MyTimeLogsPage from './pages/MyTimeLogsPage';
import PrivateRoute from './components/auth/PrivateRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicOnlyRoute><Connect /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignUp /></PublicOnlyRoute>} />

          {/* Private Routes with AuthenticatedLayout */}
          <Route element={<PrivateRoute><AuthenticatedLayout /></PrivateRoute>} >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/project/:projectId" element={<ProjectDetailPage />} />
            <Route path="/teams" element={<TeamListPage />} />
            <Route path="/team/:teamId" element={<TeamDetailPage />} />
            <Route path="/task/:taskId" element={<TaskDetailPage />} /> {/* Added Task Detail Route */}
            {/* <Route path="/my-timelogs" element={<MyTimeLogsPage />} /> */}
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;