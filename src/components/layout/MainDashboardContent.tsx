// src/components/layout/MainDashboardContent.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ProjectPlaceholderIcon, UserPlaceholderIcon, PlusIcon } from '../icons';
import CreateProjectModal from '../projects/CreateProjectModal';
import { apiService } from '../../services/apiService';
import { Project as ProjectType, User as UserType, Team as TeamType, WorkLog } from '../../types/apiTypes';

interface DailyHours {
  day: string; // e.g., 'Mon', 'Tue' or a date string 'YYYY-MM-DD'
  shortDay: string; // e.g., 'M', 'T', 'W' or day of month
  hours: number;
  fullDate: string; // YYYY-MM-DD for tooltip
}

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

  // State for work logs and processed daily hours
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [dailyWorkingHours, setDailyWorkingHours] = useState<DailyHours[]>([]);
  const [isLoadingWorkLogs, setIsLoadingWorkLogs] = useState(true);
  const [errorWorkLogs, setErrorWorkLogs] = useState<string | null>(null);
  
  const [hoveredBar, setHoveredBar] = useState<DailyHours | null>(null);


  const processWorkLogsForChart = (logs: WorkLog[]): DailyHours[] => {
    const last7DaysData: { [key: string]: { hours: number; shortDay: string; fullDate: string } } = {};
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
    const shortDayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric' });


    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7DaysData[dateString] = { hours: 0, shortDay: dayFormatter.format(date).slice(0,1), fullDate: dateString };
    }

    logs.forEach(log => {
      const logDateStr = log.date; // Assuming log.date is 'YYYY-MM-DD'
      if (last7DaysData[logDateStr]) {
        last7DaysData[logDateStr].hours += parseFloat(log.hours_spent);
      }
    });
    
    return Object.entries(last7DaysData).map(([date, data]) => ({
      day: dayFormatter.format(new Date(date  + 'T00:00:00')), // Ensure date is parsed correctly for formatter
      shortDay: shortDayFormatter.format(new Date(date + 'T00:00:00')),
      hours: Math.round(data.hours * 100) / 100, // Round to 2 decimal places
      fullDate: data.fullDate,
    })).sort((a,b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
  };


  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingUser(true);
      setIsLoadingProjects(true);
      setIsLoadingTeams(true);
      setIsLoadingWorkLogs(true);

      try {
        const userProfile = await apiService.auth.getProfile();
        setCurrentUser(userProfile);

        // Fetch projects
        let projectResponse;
        if (userProfile.role === 'owner' || userProfile.role === 'admin') {
            const ownerDashData = await apiService.statistics.getOwnerDashboard();
            projectResponse = ownerDashData.projects_list || [];
        } else {
            const empDashData = await apiService.statistics.getEmployeeDashboard();
            projectResponse = empDashData.my_projects || [];
        }
        setProjects(Array.isArray(projectResponse) ? projectResponse : []);
        setErrorProjects(null);

        // Fetch teams
        const empDashDataForTeams = await apiService.statistics.getEmployeeDashboard();
        setMyTeams(empDashDataForTeams.my_teams || []);
        setErrorTeams(null);
        
        // Fetch Work Logs for the current user
        if (userProfile) {
            try {
                const workLogResponse = await apiService.workLogs.getAll(); // Fetches current user's logs
                const logs = 'results' in workLogResponse ? workLogResponse.results : workLogResponse;
                setWorkLogs(logs);
                setDailyWorkingHours(processWorkLogsForChart(logs));
                setErrorWorkLogs(null);
            } catch (workLogError: any) {
                console.error("Failed to fetch work logs:", workLogError);
                setErrorWorkLogs(workLogError.message || "Could not load work log data.");
            }
        }

      } catch (err: any) {
        console.error("Failed to fetch initial dashboard data:", err);
        const عمومیError = "Could not load initial dashboard data.";
        setErrorProjects(عمومیError);
        setErrorTeams(عمومیError);
        setErrorWorkLogs(عمومیError);
      } finally {
        setIsLoadingUser(false);
        setIsLoadingProjects(false);
        setIsLoadingTeams(false);
        setIsLoadingWorkLogs(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleProjectCreated = () => {
    setIsLoadingProjects(true);
    (async () => {
        try {
            let projectResponse;
             if (currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin')) {
                const ownerDashData = await apiService.statistics.getOwnerDashboard();
                projectResponse = ownerDashData.projects_list || [];
            } else if (currentUser) {
                 const empDashData = await apiService.statistics.getEmployeeDashboard();
                 projectResponse = empDashData.my_projects || [];
            } else {
                projectResponse = await apiService.projects.getAll();
                projectResponse = 'results' in projectResponse ? projectResponse.results : projectResponse;
            }
            setProjects(Array.isArray(projectResponse) ? projectResponse : []);
            setErrorProjects(null);
        } catch (err) {
            console.error("Failed to re-fetch projects", err);
            setErrorProjects("Could not update projects list.");
        } finally {
            setIsLoadingProjects(false);
        }
    })();
  };

  const welcomeName = isLoadingUser
    ? 'User...'
    : currentUser?.first_name
      ? currentUser.first_name
      : currentUser?.username || 'User';

  const displayTeamMembers: UserType[] = useMemo(() => {
    const members: UserType[] = [];
    if (myTeams && myTeams.length > 0) {
        const memberSet = new Set<number>();
        for (const team of myTeams) {
            if (team.memberships) {
                for (const membership of team.memberships) {
                    if (membership.user && !memberSet.has(membership.user.id) && members.length < 2) {
                        // Assuming UserSimple from membership.user is compatible enough with UserType
                        // Or, if UserType requires fields UserSimple doesn't have, you might need to fetch full user details
                        // For now, we directly cast/use, ensure types are compatible or handle appropriately
                        members.push(membership.user as UserType);
                        memberSet.add(membership.user.id);
                    }
                }
            }
            if (members.length >= 2) break;
        }
    }
    return members;
  }, [myTeams]);


  const chartDataMaxHours = useMemo(() => Math.max(...dailyWorkingHours.map(item => item.hours), 0), [dailyWorkingHours]);
  const chartDisplayMaxHours = useMemo(() => chartDataMaxHours > 0 ? chartDataMaxHours + Math.max(1, Math.ceil(chartDataMaxHours * 0.1)) : 2, [chartDataMaxHours]);


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
          {/* My Projects Section (remains the same) */}
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
                      <Link to={`/project/${project.id}`} className="font-semibold text-gray-800 hover:text-indigo-600">{project.name}</Link>
                      <p className="text-sm text-gray-500 mb-2">{project.tasks_count || 0} tasks</p>
                      <Link to={`/project/${project.id}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
                {projects.length > 1 && (
                  <div className="pt-2 text-right">
                    <Link to="/projects" className="text-sm text-indigo-600 hover:text-indigo-800">
                      View all projects ({projects.length})
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* My Team Section (remains the same) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h3 className="text-xl font-semibold text-gray-800 mr-2">My team</h3>
                {!isLoadingTeams && (
                  <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {myTeams.reduce((acc, team) => acc + (team.memberships?.length || 0), 0)}
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
                        <Link to={`/profile/${member.id}`} className="font-semibold text-gray-800 hover:text-indigo-600">
                          {member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : member.username}
                        </Link>
                        <p className="text-sm text-gray-500">{member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : 'Team Member'}</p>
                      </div>
                       <Link to={`/profile/${member.id}`} className="text-sm text-indigo-600 hover:text-indigo-800">
                        View profile
                      </Link>
                    </div>
                  ))}
                  {myTeams.length > 0 && ( 
                    <div className="pt-2 text-right">
                      <Link to="/teams" className="text-sm text-indigo-600 hover:text-indigo-800">
                        View all teams
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Statistics - Reverted to bar chart with real data */}
        <section>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">My Working Hours (Last 7 Days)</h3>
          <div className="bg-white p-6 rounded-lg shadow">
            {isLoadingWorkLogs && <p className="text-gray-500 text-center">Loading working hours...</p>}
            {errorWorkLogs && !isLoadingWorkLogs && <p className="text-red-500 text-center">{errorWorkLogs}</p>}
            {!isLoadingWorkLogs && !errorWorkLogs && dailyWorkingHours.length === 0 && (
                <p className="text-sm text-gray-500 text-center">No work logged in the last 7 days.</p>
            )}
            {!isLoadingWorkLogs && !errorWorkLogs && dailyWorkingHours.length > 0 && (
              <>
                <p className="text-sm text-gray-700 mb-6 text-center">Hours logged per day</p>
                <div className="flex h-48 space-x-1 md:space-x-2 justify-around"> {/* Adjusted spacing */}
                  {dailyWorkingHours.map((item) => (
                    <div
                      key={item.fullDate}
                      className="flex-1 h-full flex flex-col justify-end items-center relative group max-w-[calc(100%/7 - 0.5rem)]" // Ensure bars fit
                      onMouseEnter={() => setHoveredBar(item)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {hoveredBar && hoveredBar.fullDate === item.fullDate && item.hours > 0 && (
                        <div className="absolute left-1/2 -translate-x-1/2 mb-1 w-auto p-1.5 px-2.5 text-xs leading-tight text-white bg-gray-800 rounded-md shadow-lg z-30 whitespace-nowrap"
                             style={{ bottom: `calc(${(item.hours / chartDisplayMaxHours) * 100}% + 5px)`}}>
                          {item.hours.toFixed(2)} hrs on {new Date(item.fullDate  + 'T00:00:00').toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                          <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-px w-2 h-2 bg-gray-800 transform rotate-45"></div>
                        </div>
                      )}
                      <div
                        className="w-3/4 md:w-1/2 bg-indigo-200 group-hover:bg-indigo-300 transition-colors duration-150 rounded-t-md"
                        style={{ height: `${item.hours > 0 ? (item.hours / chartDisplayMaxHours) * 100 : 0}%` }}
                        title={`${item.hours.toFixed(2)} hours on ${item.day}`}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{item.shortDay}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
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