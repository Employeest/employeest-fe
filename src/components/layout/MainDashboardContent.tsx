// src/components/layout/MainDashboardContent.tsx
import React, { useState, useEffect } from 'react';
import { ProjectPlaceholderIcon, UserPlaceholderIcon, PlusIcon } from '../icons';
import CreateProjectModal from '../projects/CreateProjectModal';
import { apiService } from '../../services/apiService';
import { Project as ProjectType, User as UserType, Team as TeamType } from '../../types/apiTypes'; // Added TeamType

const MainDashboardContent: React.FC = () => {
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [myTeams, setMyTeams] = useState<TeamType[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [errorTeams, setErrorTeams] = useState<string | null>(null);

  const [hoveredBar, setHoveredBar] = useState<{ day: string; hours: number } | null>(null);

  const workingHours = [
    { day: 'Mon', hours: 8 }, { day: 'Tue', hours: 6 }, { day: 'Wed', hours: 7.5 },
    { day: 'Thu', hours: 8 }, { day: 'Fri', hours: 5 }, { day: 'Sat', hours: 0 },
  ];
  const dataMaxHours = Math.max(...workingHours.map(item => item.hours), 0);
  // chartMaxHours determines the top of the Y-axis for percentage calculations.
  // Ensure it's at least a small value if all hours are 0, to prevent division by zero if that were possible.
  const chartMaxHours = dataMaxHours > 0 ? dataMaxHours + Math.max(1, Math.ceil(dataMaxHours * 0.1)) : 2;


  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingUser(true);
      setIsLoadingProjects(true);
      setIsLoadingTeams(true);

      try {
        const userProfile = await apiService.auth.getProfile();
        setCurrentUser(userProfile);

        const projectResponse = await apiService.projects.getAll();
        setProjects('results' in projectResponse ? projectResponse.results : projectResponse);
        setErrorProjects(null);

        if (userProfile) {
          try {
            const dashboardData = await apiService.statistics.getEmployeeDashboard();
            setMyTeams(dashboardData.my_teams || []);
            setErrorTeams(null);
          } catch (teamErr) {
            console.error("Failed to fetch teams for dashboard:", teamErr);
            setErrorTeams("Could not load team data.");
            setMyTeams([]);
          }
        } else {
          setMyTeams([]);
        }

      } catch (err) {
        console.error("Failed to fetch initial dashboard data:", err);
        // Consider setting a more generic error for the whole dashboard if initial calls fail
        setErrorProjects("Could not load initial dashboard data.");
        setErrorTeams("Could not load initial dashboard data.");
      } finally {
        setIsLoadingUser(false);
        setIsLoadingProjects(false);
        setIsLoadingTeams(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleProjectCreated = () => {
    console.log('Project created! Refreshing project list.');
    setIsLoadingProjects(true);
    apiService.projects.getAll()
      .then(response => {
        setProjects('results' in response ? response.results : response);
        setErrorProjects(null);
      })
      .catch(err => {
        console.error("Failed to re-fetch projects", err);
        setErrorProjects("Could not update projects list.");
      })
      .finally(() => setIsLoadingProjects(false));
  };

  const welcomeName = isLoadingUser
    ? 'User...'
    : currentUser?.first_name
      ? currentUser.first_name
      : currentUser?.username || 'User';

  const displayTeamMembers: UserType[] = [];
  if (myTeams && myTeams.length > 0) {
    const memberSet = new Set<number>();
    for (const team of myTeams) {
      if (team.members) {
        for (const member of team.members) {
          if (!memberSet.has(member.id) && displayTeamMembers.length < 2) {
            displayTeamMembers.push(member);
            memberSet.add(member.id);
          }
        }
      }
      if (displayTeamMembers.length >=2) break;
    }
  }

  return (
    <>
      <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-xl text-gray-500">Home</h1>
          <h2 className="text-3xl font-semibold text-gray-800">
            Welcome, {welcomeName}
          </h2>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* My Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-xl font-semibold text-gray-800 mr-2">My projects</h3>
                {!isLoadingProjects && (
                  <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {projects.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="w-4 h-4 mr-1.5" />
                New Project
              </button>
            </div>
            {/* ... project list rendering ... */}
            {isLoadingProjects && <p className="text-gray-500">Loading projects...</p>}
            {errorProjects && <p className="text-red-500">{errorProjects}</p>}
            {!isLoadingProjects && !errorProjects && projects.length === 0 && (
              <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
                No projects yet. Create one to get started!
              </div>
            )}
            {!isLoadingProjects && !errorProjects && projects.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow space-y-4">
                {projects.slice(0, 1).map((project: ProjectType) => (
                  <div key={project.id} className="flex items-start">
                    <ProjectPlaceholderIcon className="w-16 h-16 mr-4" />
                    <div>
                      <h4 className="font-semibold text-gray-800">{project.name}</h4>
                      <p className="text-sm text-gray-500 mb-2">{project.tasks_count || 0} tasks</p>
                      <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800">
                        View more information
                      </a>
                    </div>
                  </div>
                ))}
                {projects.length > 1 && (
                  <div className="pt-2 text-right">
                    <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800">
                      View all projects ({projects.length})
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* My Team Section - Updated */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-xl font-semibold text-gray-800 mr-2">My team</h3>
                {!isLoadingTeams && (
                  <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {myTeams.reduce((acc, team) => acc + (team.members?.length || 0), 0)}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              {isLoadingTeams && <p className="text-sm text-gray-500">Loading team data...</p>}
              {errorTeams && <p className="text-sm text-red-500">{errorTeams}</p>}
              {!isLoadingTeams && !errorTeams && displayTeamMembers.length === 0 && (
                <p className="text-sm text-gray-500">No team members to display.</p>
              )}
              {!isLoadingTeams && !errorTeams && displayTeamMembers.length > 0 && (
                <>
                  {displayTeamMembers.map((member) => (
                    <div key={`member-${member.id}`} className="flex items-center">
                      <UserPlaceholderIcon className="w-10 h-10 rounded-full mr-3"/>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : member.username}
                        </h4>
                        <p className="text-sm text-gray-500">{member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Team Member'}</p>
                      </div>
                      <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800">
                        View profile
                      </a>
                    </div>
                  ))}
                  {(myTeams.reduce((acc, team) => acc + (team.members?.length || 0), 0) > 2) && (
                    <div className="pt-2">
                      <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800">
                        Watch more
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Statistics - Reverted to simpler structure that correctly displayed bars */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Statistics</h3>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-700 mb-6">Working hours per day</p>
            {/* Chart Container - This is where the fixed height is set. items-stretch is default for align-items. */}
            <div className="flex h-48 space-x-2 md:space-x-4">
              {workingHours.map((item) => (
                // Each Day's Column: flex-1 for width, h-full to take parent's height.
                // justify-end pushes bar and label to the bottom.
                <div
                  key={item.day}
                  className="flex-1 h-full flex flex-col justify-end items-center relative group"
                  onMouseEnter={() => setHoveredBar(item)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {hoveredBar && hoveredBar.day === item.day && item.hours > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 mb-1 w-auto p-1.5 px-2.5 text-xs leading-tight text-white bg-gray-800 rounded-md shadow-lg z-30 whitespace-nowrap"
                         style={{ bottom: `calc(${(item.hours / chartMaxHours) * 100}% + 5px)`}}> {/* Position tooltip above bar */}
                      {item.hours} hrs
                      <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-px w-2 h-2 bg-gray-800 transform rotate-45"></div>
                    </div>
                  )}
                  {/* The Bar: Height is % of this Day Column (which is h-full of the h-48 chart area) */}
                  <div
                    className="w-3/4 bg-indigo-200 group-hover:bg-indigo-300 transition-colors duration-150 rounded-t-md"
                    style={{ height: `${item.hours > 0 ? (item.hours / chartMaxHours) * 100 : 0}%` }}
                    title={`${item.hours} hours`}
                  ></div>
                  {/* Label */}
                  <span className="text-xs text-gray-500 mt-1">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
};

export default MainDashboardContent;