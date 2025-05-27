// src/components/layout/TaskSidebar.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { useNavigate, Link } from 'react-router-dom';
import {
  CogIcon, ChevronDownIcon, ChevronUpIcon, PlusCircleIcon,
  UserPlaceholderIcon, LogoutIcon, PlayIcon, StopIcon, PauseIcon,
} from '../icons';
import { apiService } from '../../services/apiService';
import { User, Task as TaskType, Project as ProjectType, WorkLogCreatePayload } from '../../types/apiTypes';
import CreateTaskModal from '../tasks/CreateTaskModal';

interface ActiveTaskInfo {
  taskId: number;
  startTime: number;
  taskName: string;
  isPaused: boolean;
  accumulatedTime: number;
}

interface TaskItemProps {
  task: TaskType;
  onStartTracking: (taskId: number, taskName: string) => void;
  onStopTracking: (taskId: number) => void;
  onPauseTracking: (taskId: number) => void;
  onResumeTracking: (taskId: number) => void;
  onMarkTaskAsDone: (taskId: number) => void;
  isActiveTracking: boolean;
  isCurrentlyPaused: boolean;
  canBeDone: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onStartTracking,
  onStopTracking,
  onPauseTracking,
  onResumeTracking,
  onMarkTaskAsDone,
  isActiveTracking,
  isCurrentlyPaused,
  canBeDone
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200">
      <div className="flex items-center min-w-0 mr-2">
        <div
          className={`flex-shrink-0 w-5 h-5 border-2 rounded-full mr-3 ${
            isActiveTracking && !isCurrentlyPaused ? 'bg-blue-500 border-blue-700 animate-pulse' :
            isActiveTracking && isCurrentlyPaused ? 'bg-yellow-500 border-yellow-700' :
            task.status === 'DONE' ? 'bg-green-500 border-green-500' :
            task.status === 'IN_PROGRESS' ? 'bg-yellow-400 border-yellow-400' : 'border-gray-400'
          }`}
        />
        <Link to={`/task/${task.id}`} className="text-sm text-gray-700 truncate hover:text-indigo-600" title={task.name}>
          {task.name}
        </Link>
      </div>
      <div className="flex-shrink-0 flex items-center space-x-1 md:space-x-2">
        {task.status === 'TODO' && !isActiveTracking && (
          <button
            onClick={() => onStartTracking(task.id, task.name)}
            className="flex items-center text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
            title="Start Tracking"
          >
            <PlayIcon className="w-3 h-3 mr-1" /> Start
          </button>
        )}
        {isActiveTracking && !isCurrentlyPaused && (
          <>
            <button
              onClick={() => onPauseTracking(task.id)}
              className="flex items-center text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-2 py-1 rounded"
              title="Pause Tracking"
            >
              <PauseIcon className="w-3 h-3 mr-1" /> Pause
            </button>
            <button
              onClick={() => onStopTracking(task.id)}
              className="flex items-center text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
              title="Stop Tracking & Log Time"
            >
              <StopIcon className="w-3 h-3 mr-1" /> Stop
            </button>
          </>
        )}
        {isActiveTracking && isCurrentlyPaused && (
           <button
            onClick={() => onResumeTracking(task.id)}
            className="flex items-center text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
            title="Resume Tracking"
          >
            <PlayIcon className="w-3 h-3 mr-1" /> Resume
          </button>
        )}
        {canBeDone && task.status === 'IN_PROGRESS' && !isActiveTracking && (
           <button
            onClick={() => onMarkTaskAsDone(task.id)}
            className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded"
            title="Mark as Done"
          >
            Done
          </button>
        )}
        {task.status === 'DONE' && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Done</span>
        )}
      </div>
    </div>
  );
};


const TaskSidebar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myTasks, setMyTasks] = useState<TaskType[]>([]);
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  
  const [activeTaskInfo, setActiveTaskInfo] = useState<ActiveTaskInfo | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentSegmentElapsedTime, setCurrentSegmentElapsedTime] = useState(0);

  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Moved fetchUserTasks to component scope and wrapped with useCallback
  const fetchUserTasks = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoadingTasks(true);
    try {
      const params = {
        assignee_id: currentUser.id.toString(),
        status__in: ['TODO', 'IN_PROGRESS'].join(','),
        ordering: 'deadline,-priority',
      };
      const response = await apiService.tasks.getAll(params);
      setMyTasks('results' in response ? response.results : response as TaskType[]);
      setError(null); // Clear previous task-specific errors
    } catch (err: any) {
      console.error("Failed to fetch tasks:", err);
      setError(err.message || "Could not load your tasks.");
    } finally {
      setIsLoadingTasks(false);
    }
  }, [currentUser]); // Dependency on currentUser

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingUser(true);
      setIsLoadingProjects(true);
      try {
        const user = await apiService.auth.getProfile();
        setCurrentUser(user); // This will trigger the useEffect below to fetch tasks
        const projectResponse = await apiService.projects.getAll();
        setProjects('results' in projectResponse ? projectResponse.results : projectResponse as ProjectType[]);
        // setError(null); // General error state clear
      } catch (err: any) {
        console.error("Failed to fetch initial data for TaskSidebar:", err);
        setError(err.message || "Could not load user data or projects.");
        if (err.message?.includes("401") || err.message?.includes("authenticat")) {
          handleLogout(true);
        }
      } finally {
        setIsLoadingUser(false);
        setIsLoadingProjects(false);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // handleLogout is stable due to useCallback or being outside if not dependent on state/props

  useEffect(() => {
    if (currentUser?.id) {
      fetchUserTasks();
    }
  }, [currentUser, fetchUserTasks]); // Added fetchUserTasks to dependency array

  const handleTaskCreatedOrUpdated = () => {
    fetchUserTasks();
  };

  // Timer effect
  useEffect(() => {
    if (activeTaskInfo && !activeTaskInfo.isPaused) {
      setCurrentSegmentElapsedTime(Date.now() - activeTaskInfo.startTime);
      timerIntervalRef.current = setInterval(() => {
        setCurrentSegmentElapsedTime(Date.now() - activeTaskInfo.startTime);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeTaskInfo]);

  const formatElapsedTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalElapsedTime = () => {
    if (!activeTaskInfo) return 0;
    return activeTaskInfo.accumulatedTime + (activeTaskInfo.isPaused ? 0 : currentSegmentElapsedTime);
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Wrapped handleLogout in useCallback
  const handleLogout = useCallback(async (isAutoLogout: boolean = false) => {
    if (activeTaskInfo) {
        await handleStopTracking(activeTaskInfo.taskId, true); // isLoggingOut = true
    }
    try {
      await apiService.auth.logout();
    } catch (error) {
      if (!isAutoLogout) console.warn("Server-side logout failed, clearing local token.", error);
    } finally {
        localStorage.removeItem('authToken');
        navigate('/'); // navigate is stable from react-router-dom
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTaskInfo, navigate]); // Added activeTaskInfo and navigate as dependencies

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleStartTracking = async (taskId: number, taskName: string) => {
    if (activeTaskInfo && activeTaskInfo.taskId !== taskId) {
      await handleStopTracking(activeTaskInfo.taskId);
    }
    setError(null);
    try {
      const taskToStart = myTasks.find(t => t.id === taskId);
      if (taskToStart && taskToStart.status === 'TODO') {
        await apiService.tasks.startProgress(taskId);
      }
      setActiveTaskInfo({ taskId, startTime: Date.now(), taskName, isPaused: false, accumulatedTime: 0 });
      setCurrentSegmentElapsedTime(0);
      handleTaskCreatedOrUpdated();
    } catch (err: any) {
      console.error("Failed to start task tracking:", err);
      setError(err.message || "Could not start tracking task.");
      setActiveTaskInfo(null);
    }
  };

  const handlePauseTracking = (taskId: number) => {
    if (activeTaskInfo && activeTaskInfo.taskId === taskId && !activeTaskInfo.isPaused) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setActiveTaskInfo({
        ...activeTaskInfo,
        isPaused: true,
        accumulatedTime: activeTaskInfo.accumulatedTime + currentSegmentElapsedTime,
      });
      setCurrentSegmentElapsedTime(0);
    }
  };

  const handleResumeTracking = (taskId: number) => {
    if (activeTaskInfo && activeTaskInfo.taskId === taskId && activeTaskInfo.isPaused) {
      setActiveTaskInfo({
        ...activeTaskInfo,
        isPaused: false,
        startTime: Date.now(),
      });
      setCurrentSegmentElapsedTime(0);
    }
  };

  const handleStopTracking = async (taskId: number, isLoggingOut: boolean = false) => {
    if (!activeTaskInfo || activeTaskInfo.taskId !== taskId) return;
    
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    
    const finalAccumulatedTime = activeTaskInfo.accumulatedTime + (activeTaskInfo.isPaused ? 0 : currentSegmentElapsedTime);
    const hours = finalAccumulatedTime / (1000 * 60 * 60);

    setError(null);

    if (hours > 0.01) {
      const workLogPayload: WorkLogCreatePayload = {
        task_id: taskId,
        hours_spent: hours.toFixed(2),
        date: new Date(Date.now() - finalAccumulatedTime).toISOString().split('T')[0],
        description: `Time tracked for task: ${activeTaskInfo.taskName}`,
      };
      try {
        await apiService.workLogs.create(workLogPayload);
        console.log(`Work log created for task ${taskId}: ${hours.toFixed(2)} hours`);
      } catch (err: any) {
        console.error("Failed to create work log:", err);
        if (!isLoggingOut) setError(err.message || "Failed to save time log. Please try again.");
      }
    }
    
    setActiveTaskInfo(null);
    setCurrentSegmentElapsedTime(0);
    if (!isLoggingOut) {
        handleTaskCreatedOrUpdated();
    }
  };

  const handleMarkTaskAsDone = async (taskId: number) => {
    if (activeTaskInfo && activeTaskInfo.taskId === taskId) {
      await handleStopTracking(taskId); 
    }
    setError(null);
    try {
      await apiService.tasks.markAsDone(taskId);
      handleTaskCreatedOrUpdated();
    } catch (err: any) {
      console.error("Failed to mark task as done:", err);
      setError(err.message || "Could not mark task as done.");
    }
  };
  
  const displayName = currentUser?.first_name && currentUser?.last_name
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser?.username || 'User';
  const displayRole = currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Employee';

  return (
    <>
      <aside className="w-96 bg-gray-50 p-6 border-l border-gray-200 flex flex-col">
        {/* User Profile Area (same) */}
        <div className="relative mb-6 pb-4 border-b border-gray-200" ref={dropdownRef}>
          <div className="flex items-center justify-between">
            <div className="flex items-center cursor-pointer min-w-0" onClick={toggleDropdown}>
               <Link to="/profile" className="flex items-center min-w-0 mr-auto">
                {isLoadingUser ? (
                  <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 animate-pulse"></div>
                ) : (
                  <UserPlaceholderIcon className="w-10 h-10 rounded-full mr-3"/>
                )}
                <div className="min-w-0">
                  {isLoadingUser ? (
                    <><div className="h-4 bg-gray-300 rounded w-24 mb-1 animate-pulse"></div><div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div></>
                  ) : (
                    <><h3 className="text-sm font-semibold text-gray-800 truncate" title={displayName}>{displayName}</h3><p className="text-xs text-gray-500 truncate" title={displayRole}>{displayRole}</p></>
                  )}
                </div>
              </Link>
            </div>
            <button
              onClick={toggleDropdown}
              className="text-gray-500 hover:text-gray-700 p-1 focus:outline-none"
              aria-expanded={isDropdownOpen}
              aria-label="Toggle user menu"
            >
              {isDropdownOpen ? <ChevronUpIcon className="w-5 h-5"/> : <ChevronDownIcon className="w-5 h-5"/>}
            </button>
          </div>
          <div
            className={`absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200 transition-all duration-300 ease-in-out transform overflow-hidden ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            style={{ transformOrigin: 'top right' }}
          >
            {isDropdownOpen && (
              <>
                <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center focus:outline-none focus:bg-gray-100">
                  <CogIcon className="w-4 h-4 mr-2" /> Profile & Settings
                </Link>
                <button onClick={() => handleLogout()} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center focus:outline-none focus:bg-red-50">
                  <LogoutIcon className="w-4 h-4 mr-2" /> Logout
                </button>
              </>
            )}
          </div>
        </div>

        {/* Active Timer Display */}
        {activeTaskInfo && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
            <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-indigo-700 truncate" title={activeTaskInfo.taskName}>
                    {activeTaskInfo.isPaused ? "Paused: " : "Tracking: "} {activeTaskInfo.taskName}
                </p>
                {activeTaskInfo.isPaused && (
                     <button
                        onClick={() => handleResumeTracking(activeTaskInfo.taskId)}
                        className="flex items-center text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                        title="Resume Tracking"
                    >
                        <PlayIcon className="w-3 h-3 mr-1" /> Resume
                    </button>
                )}
            </div>
            <p className="text-lg text-indigo-600 font-mono">{formatElapsedTime(getTotalElapsedTime())}</p>
          </div>
        )}

        {/* My Tasks Area */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">My tasks</h3>
          </div>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {isLoadingTasks || isLoadingProjects ? (
            <p className="text-sm text-gray-500">Loading tasks...</p>
          ) : myTasks.length > 0 ? (
            <div className="max-h-96 overflow-y-auto pr-1">
              {myTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onStartTracking={handleStartTracking}
                  onStopTracking={handleStopTracking}
                  onPauseTracking={handlePauseTracking}
                  onResumeTracking={handleResumeTracking}
                  onMarkTaskAsDone={handleMarkTaskAsDone}
                  isActiveTracking={activeTaskInfo?.taskId === task.id}
                  isCurrentlyPaused={!!(activeTaskInfo?.taskId === task.id && activeTaskInfo.isPaused)}
                  canBeDone={task.status === 'IN_PROGRESS' && (activeTaskInfo?.taskId !== task.id || (activeTaskInfo?.taskId === task.id && activeTaskInfo.isPaused))}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No active tasks assigned to you.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col space-y-3">
          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className="flex items-center justify-center text-sm text-indigo-600 hover:text-indigo-800 py-2"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Create new task
          </button>
        </div>
      </aside>

      {currentUser && (
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          onTaskCreated={() => {
            setIsCreateTaskModalOpen(false);
            handleTaskCreatedOrUpdated();
          }}
          projects={projects}
          currentUserId={currentUser.id}
        />
      )}
    </>
  );
};

export default TaskSidebar;