import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Team, User } from '../types/apiTypes';
import { PlusIcon, UsersIcon } from '../components/icons';
import CreateTeamModal from '../components/teams/CreateTeamModal';

const TeamListPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchTeamsAndUser = async () => {
    setIsLoading(true);
    try {
      const user = await apiService.auth.getProfile();
      setCurrentUser(user);
      const dashboardData = await apiService.statistics.getEmployeeDashboard();
      setTeams(dashboardData.my_teams || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch teams or user:", err);
      setError(err.message || "Failed to load teams.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndUser();
  }, []);

  const handleTeamCreated = () => {
    fetchTeamsAndUser();
  };

  const canCreateTeam = currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin');

  // Common root class for the page, ensuring it takes up flexible space
  const pageRootClasses = "flex-1 bg-gray-100 p-8 overflow-y-auto";

  if (isLoading && !currentUser) { // Initial loading before user is fetched
      return (
        <div className={`${pageRootClasses} flex items-center justify-center`}>
          <p className="text-gray-500 text-lg">Loading user data...</p>
        </div>
      );
  }
  
  if (isLoading && teams.length === 0 && !error) { // Loading teams specifically
    return (
      <div className={`${pageRootClasses} flex items-center justify-center`}>
        <p className="text-gray-500 text-lg">Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${pageRootClasses} flex flex-col items-center justify-center`}>
        <p className="text-red-500 text-lg mb-4">Error: {error}</p>
         <button 
          onClick={fetchTeamsAndUser} 
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
        <h1 className="text-3xl font-semibold text-gray-800">My Teams</h1>
        {canCreateTeam && (
            <button
                onClick={() => setIsCreateTeamModalOpen(true)}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Team
            </button>
        )}
      </header>

      {teams.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          You are not part of any teams, or no teams found.
          {canCreateTeam && " Why not create one?"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <Link to={`/team/${team.id}`} key={team.id} className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start">
                <div className="p-3 bg-indigo-100 rounded-full mr-4">
                    <UsersIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-indigo-700 truncate" title={team.name}>{team.name}</h2>
                  <p className="text-sm text-gray-600 mt-1 truncate" title={team.description || ''}>
                    {team.description || 'No description available.'}
                  </p>
                  {team.owner && (
                     <p className="text-xs text-gray-500 mt-2">
                        Owner: {team.owner.first_name && team.owner.last_name ? `${team.owner.first_name} ${team.owner.last_name}` : team.owner.username}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Members: {team.memberships?.length || 0}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {canCreateTeam && (
        <CreateTeamModal
            isOpen={isCreateTeamModalOpen}
            onClose={() => setIsCreateTeamModalOpen(false)}
            onTeamCreated={handleTeamCreated}
        />
      )}
    </div>
  );
};

export default TeamListPage;
