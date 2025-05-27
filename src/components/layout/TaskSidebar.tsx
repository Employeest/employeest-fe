// src/components/layout/TaskSidebar.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CogIcon, ChevronDownIcon, ChevronUpIcon, PlusCircleIcon, DotsVerticalIcon, UserPlaceholderIcon } from '../icons';
import { apiService } from '../../services/apiService';
import { User, Task as TaskType, Project as ProjectType } from '../../types/apiTypes';
import CreateTaskModal from '../tasks/CreateTaskModal'; // Import the modal

// ... (TaskItem component remains the same)
interface TaskItemProps {
  task: TaskType;
  onStartTask: (taskId: number) => Promise<void>;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onStartTask }) => {
  const handleStartClick = () => {
    onStartTask(task.id);
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200">
      <div className="flex items-center min-w-0 mr-2"> {/* Added min-w-0 and mr-2 for better spacing */}
        <button className={`flex-shrink-0 w-5 h-5 border-2 rounded-full mr-3 focus:outline-none ${
          task.status === 'DONE' ? 'bg-green-500 border-green-500' :
            task.status === 'IN_PROGRESS' ? 'bg-yellow-400 border-yellow-400' : 'border-gray-400'
        }`} />
        <span className="text-sm text-gray-700 truncate" title={task.name}>{task.name}</span>
      </div>
      <div className="flex-shrink-0 flex items-center"> {/* Group buttons */}
        {task.status === 'TODO' && (
          <button
            onClick={handleStartClick}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded"
          >
            Start
          </button>
        )}
        {task.status === 'IN_PROGRESS' && (
          <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">In Progress</span>
        )}
        {task.status === 'DONE' && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Done</span>
        )}
        <button className="text-gray-400 hover:text-gray-600 ml-2">
          <DotsVerticalIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};


const TaskSidebar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<TaskType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]); // State for projects
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false); // Loading state for projects
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for modal

  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    try {
      await apiService.auth.logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem('authToken');
      navigate('/');
    }
  };

  const fetchUserTasks = async () => {
    if (!currentUser?.id) return; // Ensure currentUser is loaded
    setIsLoadingTasks(true);
    try {
      const params = {
        assignee_id: currentUser.id.toString(),
        status__in: ['TODO', 'IN_PROGRESS'].join(','),
        ordering: 'deadline',
      };
      const response = await apiService.tasks.getAll(params);
      if ('results' in response) {
        setMyTasks(response.results);
      } else {
        setMyTasks(response as unknown as TaskType[]);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Could not load tasks.");
    } finally {
      setIsLoadingTasks(false);
    }
  };


  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingUser(true);
      setIsLoadingProjects(true);
      try {
        const user = await apiService.auth.getProfile();
        setCurrentUser(user);

        // Fetch projects (all projects for simplicity, filter if needed)
        const projectResponse = await apiService.projects.getAll();
        if ('results' in projectResponse) {
          setProjects(projectResponse.results);
        } else {
          setProjects(projectResponse as unknown as ProjectType[]);
        }
        setError(null);

      } catch (err: any) {
        console.error("Failed to fetch initial data:", err);
        setError("Could not load user data or projects.");
        if (err.message?.includes("401") || err.message?.includes("authenticat")) {
          handleLogout();
        }
      } finally {
        setIsLoadingUser(false);
        setIsLoadingProjects(false);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user's tasks when currentUser is loaded or after a task is created
  useEffect(() => {
    if (currentUser?.id) {
      fetchUserTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Re-fetch tasks if currentUser changes

  const handleTaskCreated = () => {
    fetchUserTasks(); // Re-fetch tasks after one is created
  };


  // Close dropdown if clicked outside (remains same)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleStartTask = async (taskId: number) => {
    setError(null); // Clear previous errors
    try {
      await apiService.tasks.startProgress(taskId);
      setMyTasks(prevTasks =>
        prevTasks.map(t => t.id === taskId ? { ...t, status: 'IN_PROGRESS' } : t)
      );
    } catch (err: any) {
      console.error("Failed to start task:", err);
      setError(err.message || "Could not start the task. Please try again.");
    }
  };

  const displayName = currentUser?.first_name && currentUser?.last_name
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser?.username || 'User';

  const displayRole = currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Employee';

  return (
    <>
      <aside className="w-96 bg-gray-50 p-6 border-l border-gray-200 flex flex-col">
        {/* User Profile Area & Dropdown (remains mostly the same) */}
        <div className="relative mb-6 pb-4 border-b border-gray-200" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <div className="flex items-center cursor-pointer min-w-0" onClick={toggleDropdown}>
              <button className="text-gray-500 hover:text-gray-700 mr-3 focus:outline-none" aria-label="Settings">
                <CogIcon className="w-6 h-6" />
              </button>
              {isLoadingUser ? (
                <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 animate-pulse"></div>
              ) : (
                <UserPlaceholderIcon className="w-10 h-10 rounded-full mr-3"/>
              )}
              <div className="min-w-0"> {/* For ellipsis on long names */}
                {isLoadingUser ? (
                  <>
                    <div className="h-4 bg-gray-300 rounded w-24 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800 truncate" title={displayName}>{displayName}</h3>
                    <p className="text-xs text-gray-500 truncate" title={displayRole}>{displayRole}</p>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={toggleDropdown}
              className="text-gray-500 hover:text-gray-700 p-1 focus:outline-none"
              aria-expanded={isDropdownOpen}
              aria-label="Toggle user menu"
            >
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform duration-300 ease-in-out ${
                  isDropdownOpen ? 'transform rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div
            className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 transition-all duration-300 ease-in-out transform overflow-hidden
            ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            style={{ transformOrigin: 'top right' }}
          >
            {isDropdownOpen && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center focus:outline-none focus:bg-gray-100"
              >
                <span className="mr-2">➔</span>
                Logout
              </button>
            )}
          </div>
        </div>

        {/* My Tasks Area */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">My tasks</h3>
            <div className="text-xs text-gray-500">
              <span>{'<'} Today {'>'}</span>
            </div>
          </div>
          {error && !error.toLowerCase().includes("task") && <p className="text-red-500 text-sm mb-2">{error}</p>} {/* Show general errors */}
          {isLoadingTasks || isLoadingProjects ? ( // Combined loading state for initial task display
            <p className="text-sm text-gray-500">Loading tasks...</p>
          ) : myTasks.length > 0 ? (
            <div>
              {myTasks.map((task) => (
                <TaskItem key={task.id} task={task} onStartTask={handleStartTask} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active tasks assigned to you.</p>
          )}
          {error && error.toLowerCase().includes("task") && <p className="text-red-500 text-sm mt-2">{error}</p>} {/* Show task-specific errors */}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col space-y-3">
          <button
            onClick={() => setIsCreateModalOpen(true)} // Open modal
            className="flex items-center justify-center text-sm text-indigo-600 hover:text-indigo-800 py-2"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Create new task
          </button>
          <button className="text-sm text-gray-600 hover:text-gray-800 py-2">
            Track my time
          </button>
        </div>
      </aside>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={() => {
          setIsCreateModalOpen(false); // Close modal
          handleTaskCreated(); // Refresh task list
        }}
        projects={projects}
        currentUserId={currentUser?.id}
      />
    </>
  );
};

export default TaskSidebar;