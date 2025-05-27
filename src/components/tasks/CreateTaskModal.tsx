// src/components/tasks/CreateTaskModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import { TaskCreatePayload, Project as ProjectType, User as UserType } from '../../types/apiTypes';
import { ChevronDownIcon } from '../icons';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  projects: ProjectType[]; // This is the list of projects to choose from
  currentUserId?: number;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
                                                           isOpen,
                                                           onClose,
                                                           onTaskCreated,
                                                           projects, // Received from parent
                                                           currentUserId,
                                                         }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>(''); // Stores the selected project ID
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [deadline, setDeadline] = useState('');
  const [storyPoints, setStoryPoints] = useState<string>('');
  const [estimationHours, setEstimationHours] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // For Assignee Searchable Dropdown
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState('');
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [selectedAssigneeName, setSelectedAssigneeName] = useState('Select Assignee');
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // For Project Searchable Dropdown
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState('Select Project');
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch users for assignee dropdown (remains the same)
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const response = await apiService.users.getAll();
          const usersData = 'results' in response ? response.results : response;
          setAllUsers(usersData);
        } catch (err) {
          console.error('Failed to fetch users:', err);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  // Effect to reset form when modal opens or related props change
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      // Project reset
      setProjectId(projects.length > 0 ? projects[0].id.toString() : '');
      setSelectedProjectName(projects.length > 0 ? projects[0].name : 'Select Project');
      setProjectSearchTerm('');
      setIsProjectDropdownOpen(false);

      // Assignee reset
      setAssigneeId('');
      setSelectedAssigneeName('Select Assignee');
      setAssigneeSearchTerm('');
      setIsAssigneeDropdownOpen(false);
      if (currentUserId && allUsers.length > 0) {
        const currentUser = allUsers.find(u => u.id === currentUserId);
        if (currentUser) {
          setAssigneeId(currentUser.id.toString());
          setSelectedAssigneeName(
            currentUser.first_name && currentUser.last_name
              ? `${currentUser.first_name} ${currentUser.last_name} (${currentUser.username})`
              : currentUser.username
          );
        }
      }

      setDeadline('');
      setStoryPoints('');
      setEstimationHours('');
      setError(null);
    }
  }, [isOpen, projects, currentUserId, allUsers]);


  // Filter projects based on projectSearchTerm
  const filteredProjects = projectSearchTerm
    ? projects.filter(project =>
      project.name.toLowerCase().includes(projectSearchTerm.toLowerCase())
    )
    : projects;

  // Filter users based on assigneeSearchTerm (remains the same)
  const filteredUsers = assigneeSearchTerm
    ? allUsers.filter(user =>
      (user.first_name?.toLowerCase().includes(assigneeSearchTerm.toLowerCase())) ||
      (user.last_name?.toLowerCase().includes(assigneeSearchTerm.toLowerCase())) ||
      (user.username.toLowerCase().includes(assigneeSearchTerm.toLowerCase()))
    )
    : allUsers;


  const handleProjectSelect = (project: ProjectType) => {
    setProjectId(project.id.toString());
    setSelectedProjectName(project.name);
    setProjectSearchTerm(''); // Clear search term after selection
    setIsProjectDropdownOpen(false);
  };

  const toggleProjectDropdown = () => {
    setIsProjectDropdownOpen(!isProjectDropdownOpen);
    if (isProjectDropdownOpen) { // If closing
      setProjectSearchTerm('');
    }
  };

  // Close project dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
        setProjectSearchTerm('');
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectDropdownOpen]);


  const handleAssigneeSelect = (user: UserType) => {
    setAssigneeId(user.id.toString());
    const displayName = user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name} (${user.username})`
      : user.username;
    setSelectedAssigneeName(displayName);
    setAssigneeSearchTerm('');
    setIsAssigneeDropdownOpen(false);
  };

  const toggleAssigneeDropdown = () => {
    setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
    if(isAssigneeDropdownOpen) {
      setAssigneeSearchTerm('');
    }
  };

  // Close assignee dropdown if clicked outside (remains the same)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
        setAssigneeSearchTerm('');
      }
    };
    if (isAssigneeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAssigneeDropdownOpen]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!name.trim() || !projectId) {
      setError('Task name and project are required.');
      setIsLoading(false);
      return;
    }

    const payload: TaskCreatePayload = {
      name: name.trim(),
      project_id: parseInt(projectId, 10),
      description: description.trim() || undefined,
      assignee_id: assigneeId ? parseInt(assigneeId, 10) : null,
      deadline: deadline || undefined,
      story_points: storyPoints ? parseInt(storyPoints, 10) : undefined,
      estimation_hours: estimationHours || undefined,
      status: 'TODO',
    };

    try {
      await apiService.tasks.create(payload);
      onTaskCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(err.message || 'Failed to create task. Please try again.');
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
          <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 mb-1">Task Name <span className="text-red-500">*</span></label>
            <input
              type="text" id="task-name" value={name} onChange={(e) => setName(e.target.value)}
              className={inputStyle} required disabled={isLoading}
            />
          </div>

          {/* Project Searchable Dropdown */}
          <div className="relative" ref={projectDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
            <button
              type="button"
              onClick={toggleProjectDropdown}
              className={`${inputStyle} flex items-center justify-between text-left ${!projectId && projects.length > 0 ? 'text-gray-400' : 'text-gray-900'} bg-white`}
              disabled={isLoading || projects.length === 0}
              aria-haspopup="listbox"
              aria-expanded={isProjectDropdownOpen}
            >
              <span className={projectId ? "text-gray-900" : "text-gray-500"}>
                {projectId ? selectedProjectName : (projects.length > 0 ? 'Select Project' : 'No projects available')}
              </span>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ease-in-out ${
                  isProjectDropdownOpen ? 'transform rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg transition-all duration-200 ease-in-out transform
                ${isProjectDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}
              style={{ transformOrigin: 'top' }}
            >
              {isProjectDropdownOpen && (
                <>
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={projectSearchTerm}
                      onChange={(e) => setProjectSearchTerm(e.target.value)}
                      className={`${inputStyle} text-sm`}
                      autoFocus
                    />
                  </div>
                  <ul className="max-h-48 overflow-y-auto">
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (
                        <li
                          key={project.id}
                          onClick={() => handleProjectSelect(project)}
                          className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer"
                          role="option"
                          aria-selected={projectId === project.id.toString()}
                        >
                          {project.name}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-sm text-gray-500">
                        {projectSearchTerm ? 'No projects found.' : 'No projects to select.'}
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="task-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              className={inputStyle} disabled={isLoading}
            />
          </div>

          {/* Assignee Searchable Dropdown (remains the same) */}
          <div className="relative" ref={assigneeDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee (Optional)</label>
            <button
              type="button"
              onClick={toggleAssigneeDropdown}
              className={`${inputStyle} flex items-center justify-between text-left bg-white`}
              disabled={isLoading}
              aria-haspopup="listbox"
              aria-expanded={isAssigneeDropdownOpen}
            >
              <span className={assigneeId ? "text-gray-900" : "text-gray-400"}>
                {assigneeId ? selectedAssigneeName : 'Select Assignee'}
              </span>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ease-in-out ${
                  isAssigneeDropdownOpen ? 'transform rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg transition-all duration-200 ease-in-out transform
                ${isAssigneeDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`}
              style={{ transformOrigin: 'top' }}
            >
              {isAssigneeDropdownOpen && (
                <>
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search assignees..."
                      value={assigneeSearchTerm}
                      onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                      className={`${inputStyle} text-sm`}
                      autoFocus
                    />
                  </div>
                  <ul className="max-h-48 overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <li
                          key={user.id}
                          onClick={() => handleAssigneeSelect(user)}
                          className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer"
                          role="option"
                          aria-selected={assigneeId === user.id.toString()}
                        >
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name} (${user.username})`
                            : user.username}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-sm text-gray-500">
                        {assigneeSearchTerm ? 'No users found.' : 'No users available.'}
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Deadline, Story Points, Estimation (remain the same) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-deadline" className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date" id="task-deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className={inputStyle} disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="task-storypoints" className="block text-sm font-medium text-gray-700 mb-1">Story Points</label>
              <input
                type="number" id="task-storypoints" value={storyPoints} onChange={(e) => setStoryPoints(e.target.value)}
                placeholder="e.g., 3" className={inputStyle} disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <label htmlFor="task-estimation" className="block text-sm font-medium text-gray-700 mb-1">Estimation (Hours)</label>
            <input
              type="number" step="0.1" id="task-estimation" value={estimationHours} onChange={(e) => setEstimationHours(e.target.value)}
              placeholder="e.g., 2.5" className={inputStyle} disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button" onClick={onClose} disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;