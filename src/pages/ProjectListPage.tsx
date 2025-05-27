import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, User } from '../types/apiTypes';
import { apiService } from '../services/apiService';
import { PlusIcon, ProjectPlaceholderIcon } from '../components/icons';
import CreateProjectModal from '../components/projects/CreateProjectModal';

const ProjectListPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // For permission checks

  const fetchProjectsAndUser = async () => {
    setIsLoading(true);
    try {
      // Fetch current user for potential permission checks (e.g., show "New Project" button)
      const user = await apiService.auth.getProfile();
      setCurrentUser(user);

      // Fetch projects
      const response = await apiService.projects.getAll();
      setProjects('results' in response ? response.results : (response as Project[]));
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch projects or user:", err);
      setError(err.message || "Failed to load projects.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndUser();
  }, []);

  const handleProjectCreated = () => {
    fetchProjectsAndUser(); // Refresh the list
  };

  // Example permission: only owners or admins can create projects
  const canCreateProject = currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin');

  // Common root class for the page, ensuring it takes up flexible space
  const pageRootClasses = "flex-1 bg-gray-100 p-8 overflow-y-auto";

  if (isLoading) {
    return (
      <div className={`${pageRootClasses} flex items-center justify-center`}>
        <p className="text-gray-500 text-lg">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${pageRootClasses} flex flex-col items-center justify-center`}>
        <p className="text-red-500 text-lg mb-4">Error: {error}</p>
        <button 
          onClick={fetchProjectsAndUser} 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={pageRootClasses}>
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800">All Projects</h1>
        {canCreateProject && ( // Show button based on permission
          <button
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Project
          </button>
        )}
      </header>

      {projects.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          No projects found.
          {canCreateProject && " Why not create one?"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link to={`/project/${project.id}`} key={project.id} className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start">
                <ProjectPlaceholderIcon className="w-12 h-12 mr-4 flex-shrink-0 text-indigo-500" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-indigo-700 truncate" title={project.name}>{project.name}</h2>
                  <p className="text-sm text-gray-600 mt-1 truncate" title={project.description || ''}>
                    {project.description || 'No description available.'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Owner: {project.owner.first_name && project.owner.last_name ? `${project.owner.first_name} ${project.owner.last_name}` : project.owner.username}
                  </p>
                  <p className="text-xs text-gray-500">Tasks: {project.tasks_count || 0}</p>
                   <p className="text-xs text-gray-500 mt-1">Status: <span className={`font-medium ${project.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>{project.status}</span></p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {canCreateProject && (
        <CreateProjectModal
          isOpen={isCreateProjectModalOpen}
          onClose={() => setIsCreateProjectModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
};

export default ProjectListPage;