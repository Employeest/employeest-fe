import React, { useEffect, useState }
from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Project, Task, User } from '../types/apiTypes';
import { apiService } from '../services/apiService';
import { CogIcon, DotsVerticalIcon, PlusIcon, UserPlaceholderIcon } from '../components/icons';
import CreateTaskModal from '../components/tasks/CreateTaskModal';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [velocityChartUrl, setVelocityChartUrl] = useState<string | null>(null);
  const [taskStatusChartUrl, setTaskStatusChartUrl] = useState<string | null>(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);


  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) {
        setError("Project ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setIsLoadingCharts(true);
      try {
        const projectData = await apiService.projects.getById(Number(projectId));
        setProject(projectData);

        const tasksData = await apiService.tasks.getAll({ project_id: projectId });
        setTasks('results' in tasksData ? tasksData.results : tasksData);

        const userProfile = await apiService.auth.getProfile();
        setCurrentUser(userProfile);

        // Fetch charts if the user is the owner (assuming this permission logic)
        // Adjust based on your actual permission requirements for viewing charts
        if (projectData.owner && userProfile && projectData.owner.id === userProfile.id) {
          try {
            const velocityData = await apiService.projects.getVelocityChart(Number(projectId));
            setVelocityChartUrl(velocityData.chart_url || null);
          } catch (chartError: any) {
            console.warn("Failed to load velocity chart:", chartError.message);
            setVelocityChartUrl(null); // Or set a placeholder/error message
          }
          try {
            const statusData = await apiService.projects.getTaskStatusChart(Number(projectId));
            setTaskStatusChartUrl(statusData.chart_url || null);
          } catch (chartError: any) {
            console.warn("Failed to load task status chart:", chartError.message);
            setTaskStatusChartUrl(null); // Or set a placeholder/error message
          }
        }


        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch project data:", err);
        setError(err.message || "Failed to load project details.");
        if (err.message?.includes("404") || err.message?.includes("Not found")) {
            navigate('/404'); // Or a more specific "project not found" page
        }
      } finally {
        setIsLoading(false);
        setIsLoadingCharts(false);
      }
    };

    fetchProjectData();
  }, [projectId, navigate]);

  const handleTaskCreated = async () => {
    if (!projectId) return;
    // Re-fetch tasks
    try {
      const tasksData = await apiService.tasks.getAll({ project_id: projectId });
      setTasks('results' in tasksData ? tasksData.results : tasksData);
       // Potentially re-fetch chart data if task creation affects it significantly
       if (project && project.owner && currentUser && project.owner.id === currentUser.id) {
        setIsLoadingCharts(true);
        try {
            const velocityData = await apiService.projects.getVelocityChart(Number(projectId));
            setVelocityChartUrl(velocityData.chart_url || null);
            const statusData = await apiService.projects.getTaskStatusChart(Number(projectId));
            setTaskStatusChartUrl(statusData.chart_url || null);
        } catch (chartError) {
            console.warn("Failed to refresh charts:", chartError);
        } finally {
            setIsLoadingCharts(false);
        }
      }
    } catch (err) {
      console.error("Failed to refresh tasks after creation:", err);
    }
  };


  const handleStartTask = async (taskId: number) => {
    try {
      await apiService.tasks.startProgress(taskId);
      setTasks(prevTasks =>
        prevTasks.map(t => t.id === taskId ? { ...t, status: 'IN_PROGRESS' } : t)
      );
      // Potentially re-fetch chart data
    } catch (err: any) {
      console.error("Failed to start task:", err);
      setError(err.message || "Could not start the task.");
    }
  };

  const handleMarkTaskAsDone = async (taskId: number) => {
    try {
      await apiService.tasks.markAsDone(taskId);
      setTasks(prevTasks =>
        prevTasks.map(t => t.id === taskId ? { ...t, status: 'DONE', updated_at: new Date().toISOString() } : t)
      );
      // Potentially re-fetch chart data
    } catch (err: any) {
      console.error("Failed to mark task as done:", err);
      setError(err.message || "Could not mark task as done.");
    }
  };


  if (isLoading) {
    return <div className="p-8 text-center">Loading project details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found.</div>;
  }

  const canManageProject = currentUser && project.owner.id === currentUser.id; // Basic check

  return (
    <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800">{project.name}</h1>
            <p className="text-gray-600">{project.description || "No description provided."}</p>
          </div>
          {canManageProject && (
            <button
              onClick={() => {/* TODO: Implement edit project functionality */}}
              className="p-2 text-gray-500 hover:text-indigo-600 rounded-md"
              title="Edit Project Settings"
            >
              <CogIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Owned by: {project.owner.first_name && project.owner.last_name ? `${project.owner.first_name} ${project.owner.last_name}` : project.owner.username}
          <span className="mx-2">|</span>
          Created: {new Date(project.created_at).toLocaleDateString()}
          <span className="mx-2">|</span>
          Status: <span className={`font-semibold ${project.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>{project.status}</span>
        </div>
      </header>

      {/* Team Members Section */}
      {project.team && project.team.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Team</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            {project.team.map((team: any) => (
              <div key={team.id} className="mb-3 last:mb-0">
                <h3 className="font-medium text-gray-700 mb-1">
                  <Link to={`/team/${team.id}`} className="hover:text-indigo-600">{team.name}</Link>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {team.members && team.members.map((member: any) => (
                     <Link key={member.id} to={`/profile/${member.id}`} className="flex items-center bg-gray-100 p-2 rounded-md hover:bg-gray-200 text-sm">
                      <UserPlaceholderIcon className="w-6 h-6 rounded-full mr-2" />
                      <span className="text-gray-700">{member.first_name} {member.last_name || member.username}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* Charts Section */}
      {(velocityChartUrl || taskStatusChartUrl) && !isLoadingCharts && (
        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {taskStatusChartUrl && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Task Status</h3>
              <img src={taskStatusChartUrl} alt="Task Status Chart" className="w-full h-auto"/>
            </div>
          )}
          {velocityChartUrl && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Project Velocity</h3>
              <img src={velocityChartUrl} alt="Project Velocity Chart" className="w-full h-auto"/>
            </div>
          )}
        </section>
      )}
       {isLoadingCharts && <div className="p-4 text-center text-gray-500">Loading charts...</div>}


      {/* Tasks Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Tasks ({tasks.length})</h2>
          {canManageProject && (
            <button
                onClick={() => setIsCreateTaskModalOpen(true)}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
            >
              <PlusIcon className="w-4 h-4 mr-1.5" />
              New Task
            </button>
          )}
        </div>
        <div className="bg-white p-2 rounded-lg shadow">
          {tasks.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {tasks.map(task => (
                <li key={task.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-indigo-600 truncate hover:underline">
                        <Link to={`/task/${task.id}`}>{task.name}</Link>
                      </p>
                      <p className="text-xs text-gray-500 truncate">{task.description || "No description"}</p>
                       {task.assignee && (
                        <p className="text-xs text-gray-500">
                          Assignee: {task.assignee.first_name} {task.assignee.last_name || task.assignee.username}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                        task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'TODO' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800' // For CANCELLED or other states
                        }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.deadline && <span className="text-xs text-gray-500">{new Date(task.deadline).toLocaleDateString()}</span>}
                      {currentUser && (task.assignee?.id === currentUser.id || (project.owner && project.owner.id === currentUser.id)) && (
                        <>
                          {task.status === 'TODO' && (
                             <button onClick={() => handleStartTask(task.id)} className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-0.5 rounded">Start</button>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <button onClick={() => handleMarkTaskAsDone(task.id)} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-0.5 rounded">Done</button>
                          )}
                        </>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <DotsVerticalIcon className="w-5 h-5" /> {/* For future actions like edit/delete task */}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-gray-500 text-center">No tasks found for this project.</p>
          )}
        </div>
      </section>

      {project && currentUser && isCreateTaskModalOpen && (
          <CreateTaskModal
            isOpen={isCreateTaskModalOpen}
            onClose={() => setIsCreateTaskModalOpen(false)}
            onTaskCreated={handleTaskCreated}
            projects={[project]}
            currentUserId={currentUser.id}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;