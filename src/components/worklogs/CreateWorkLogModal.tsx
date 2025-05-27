// src/components/worklogs/CreateWorkLogModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import { WorkLogCreatePayload, Task, Project, User } from '../../types/apiTypes';
import { ChevronDownIcon } from '../icons';

interface CreateWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkLogCreated: () => void;
  initialTaskId?: number | null;
  initialProjectId?: number | null;
}

const CreateWorkLogModal: React.FC<CreateWorkLogModalProps> = ({
  isOpen,
  onClose,
  onWorkLogCreated,
  initialTaskId = null,
  initialProjectId = null,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursSpent, setHoursSpent] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId ? initialTaskId.toString() : null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId ? initialProjectId.toString() : null);

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);
  const [selectedTaskName, setSelectedTaskName] = useState('Select Task (Optional)');
  const taskDropdownRef = useRef<HTMLDivElement>(null);

  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState('Select Project (Optional)');
  const projectDropdownRef = useRef<HTMLDivElement>(null);


  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form fields when modal opens
      setDate(new Date().toISOString().split('T')[0]);
      setHoursSpent('');
      setDescription('');
      setError(null);
      setIsLoading(false);

      const fetchData = async () => {
        try {
          const user = await apiService.auth.getProfile();
          setCurrentUser(user);

          // Fetch user's tasks (TODO or IN_PROGRESS) and all projects
          // This might need to be more specific based on what user should be able to log time against.
          const tasksResponse = await apiService.tasks.getAll({
            assignee_id: user.id.toString(),
            // status__in: ['TODO', 'IN_PROGRESS'].join(','), // Or all tasks if needed for logging past work
          });
          setAllTasks('results' in tasksResponse ? tasksResponse.results : tasksResponse);
          
          const projectsResponse = await apiService.projects.getAll(); // Consider filtering by user involvement
          setAllProjects('results' in projectsResponse ? projectsResponse.results : projectsResponse);

           // Pre-select if initial IDs are provided
           if (initialTaskId) {
            const task = ('results' in tasksResponse ? tasksResponse.results : tasksResponse).find(t => t.id === initialTaskId);
            if (task) {
                setSelectedTaskId(initialTaskId.toString());
                setSelectedTaskName(task.name);
                setSelectedProjectId(null); // Clear project if task is selected
                setSelectedProjectName('Select Project (Optional)');
            }
           } else if (initialProjectId) {
            const project = ('results' in projectsResponse ? projectsResponse.results : projectsResponse).find(p => p.id === initialProjectId);
            if (project) {
                setSelectedProjectId(initialProjectId.toString());
                setSelectedProjectName(project.name);
                setSelectedTaskId(null); // Clear task if project is selected
                setSelectedTaskName('Select Task (Optional)');
            }
           } else {
            setSelectedTaskId(null);
            setSelectedTaskName('Select Task (Optional)');
            setSelectedProjectId(null);
            setSelectedProjectName('Select Project (Optional)');
           }


        } catch (err) {
          console.error("Failed to fetch data for work log modal:", err);
          setError("Could not load necessary data.");
        }
      };
      fetchData();
    }
  }, [isOpen, initialTaskId, initialProjectId]);


  const filteredTasks = taskSearchTerm
    ? allTasks.filter(task => task.name.toLowerCase().includes(taskSearchTerm.toLowerCase()))
    : allTasks;

  const filteredProjects = projectSearchTerm
    ? allProjects.filter(project => project.name.toLowerCase().includes(projectSearchTerm.toLowerCase()))
    : allProjects;


  const handleTaskSelect = (task: Task) => {
    setSelectedTaskId(task.id.toString());
    setSelectedTaskName(task.name);
    setIsTaskDropdownOpen(false);
    setTaskSearchTerm('');
    // Clear project selection if a task is selected
    setSelectedProjectId(null);
    setSelectedProjectName('Select Project (Optional)');
  };

  const toggleTaskDropdown = () => {
    setIsTaskDropdownOpen(!isTaskDropdownOpen);
    if (isTaskDropdownOpen) setTaskSearchTerm('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(event.target as Node)) {
        setIsTaskDropdownOpen(false);
        setTaskSearchTerm('');
      }
    };
    if (isTaskDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTaskDropdownOpen]);


  const handleProjectSelect = (project: Project) => {
    setSelectedProjectId(project.id.toString());
    setSelectedProjectName(project.name);
    setIsProjectDropdownOpen(false);
    setProjectSearchTerm('');
    // Clear task selection if a project is selected
    setSelectedTaskId(null);
    setSelectedTaskName('Select Task (Optional)');
  };

  const toggleProjectDropdown = () => {
    setIsProjectDropdownOpen(!isProjectDropdownOpen);
    if (isProjectDropdownOpen) setProjectSearchTerm('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
        setProjectSearchTerm('');
      }
    };
    if (isProjectDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProjectDropdownOpen]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!hoursSpent || parseFloat(hoursSpent) <= 0) {
      setError('Hours spent must be a positive number.');
      return;
    }
    if (!selectedTaskId && !selectedProjectId) {
      setError('Please select either a task or a project to log time against.');
      return;
    }
    if (selectedTaskId && selectedProjectId) {
      setError('Please select either a task OR a project, not both.');
      return;
    }

    setIsLoading(true);

    const payload: WorkLogCreatePayload = {
      date: date,
      hours_spent: hoursSpent,
      description: description.trim() || undefined,
      task_id: selectedTaskId ? parseInt(selectedTaskId, 10) : null,
      project_id: selectedProjectId ? parseInt(selectedProjectId, 10) : null,
    };

    try {
      await apiService.workLogs.create(payload);
      onWorkLogCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create work log:', err);
      setError(err.message || 'Failed to create work log. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }
  const inputStyle = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40 flex items-center justify-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white z-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Log Time</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm" role="alert">
              {error}
            </div>
          )}

          {/* Task Dropdown */}
          <div className="relative" ref={taskDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task (Optional)</label>
            <button
              type="button" onClick={toggleTaskDropdown}
              className={`${inputStyle} flex items-center justify-between text-left bg-white`}
              disabled={isLoading} aria-haspopup="listbox" aria-expanded={isTaskDropdownOpen}
            >
              <span className={selectedTaskId ? "text-gray-900" : "text-gray-400"}>{selectedTaskName}</span>
              <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isTaskDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isTaskDropdownOpen && (
              <div className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="p-2"><input type="text" placeholder="Search tasks..." value={taskSearchTerm} onChange={(e) => setTaskSearchTerm(e.target.value)} className={`${inputStyle} text-sm`} autoFocus /></div>
                <ul className="max-h-48 overflow-y-auto">
                  {filteredTasks.length > 0 ? filteredTasks.map(task => (
                    <li key={task.id} onClick={() => handleTaskSelect(task)} className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer">{task.name} <span className="text-xs text-gray-400">({task.project_name})</span></li>
                  )) : <li className="px-3 py-2 text-sm text-gray-500">{taskSearchTerm ? 'No tasks found.' : 'No tasks available.'}</li>}
                </ul>
              </div>
            )}
          </div>

           {/* Project Dropdown */}
           <div className="relative" ref={projectDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Or Project (Optional)</label>
            <button
              type="button" onClick={toggleProjectDropdown}
              className={`${inputStyle} flex items-center justify-between text-left bg-white`}
              disabled={isLoading} aria-haspopup="listbox" aria-expanded={isProjectDropdownOpen}
            >
              <span className={selectedProjectId ? "text-gray-900" : "text-gray-400"}>{selectedProjectName}</span>
              <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProjectDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                <div className="p-2"><input type="text" placeholder="Search projects..." value={projectSearchTerm} onChange={(e) => setProjectSearchTerm(e.target.value)} className={`${inputStyle} text-sm`} autoFocus /></div>
                <ul className="max-h-48 overflow-y-auto">
                  {filteredProjects.length > 0 ? filteredProjects.map(project => (
                    <li key={project.id} onClick={() => handleProjectSelect(project)} className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer">{project.name}</li>
                  )) : <li className="px-3 py-2 text-sm text-gray-500">{projectSearchTerm ? 'No projects found.' : 'No projects available.'}</li>}
                </ul>
              </div>
            )}
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="worklog-date" className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" id="worklog-date" value={date} onChange={(e) => setDate(e.target.value)} className={inputStyle} required disabled={isLoading} />
            </div>
            <div>
              <label htmlFor="worklog-hours" className="block text-sm font-medium text-gray-700 mb-1">Hours Spent <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" id="worklog-hours" value={hoursSpent} onChange={(e) => setHoursSpent(e.target.value)} placeholder="e.g., 2.5" className={inputStyle} required disabled={isLoading} />
            </div>
          </div>

          <div>
            <label htmlFor="worklog-description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea id="worklog-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputStyle} disabled={isLoading} />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {isLoading ? 'Logging...' : 'Log Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkLogModal;