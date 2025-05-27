import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Project, Team, TeamMember, User } from '../types/apiTypes';
import { apiService } from '../services/apiService';
import { PlusIcon, UserPlaceholderIcon, ProjectPlaceholderIcon, TrashIcon } from '../components/icons';
import AddTeamMemberModal from '../components/teams/AddTeamMemberModal';

const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchTeamData = useCallback(async () => {
    if (!teamId) {
      setError("Team ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const teamData = await apiService.teams.getById(Number(teamId));
      setTeam(teamData);

      const allProjects = await apiService.projects.getAll();
      const filteredProjects = ('results' in allProjects ? allProjects.results : allProjects as Project[]).filter(p =>
        (p.team && Array.isArray(p.team) && p.team.some(t_id => t_id === Number(teamId))) ||
        (p.team_details && Array.isArray(p.team_details) && p.team_details.some(td => td.id === Number(teamId)))
      );
      setProjects(filteredProjects);

      if (!currentUser) {
        const userProfile = await apiService.auth.getProfile();
        setCurrentUser(userProfile);
      }
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch team data:", err);
      setError(err.message || "Failed to load team details.");
       if (err.message?.includes("404") || err.message?.includes("Not found")) {
            navigate('/teams');
        }
    } finally {
      setIsLoading(false);
    }
  }, [teamId, currentUser, navigate]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleMemberAddedOrUpdated = () => {
    fetchTeamData();
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!teamId || !window.confirm("Are you sure you want to remove this member?")) return;
    try {
        await apiService.teams.removeTeamMember(Number(teamId), memberId);
        fetchTeamData();
    } catch (err:any) {
        setError(err.message || "Failed to remove member.");
    }
  }

  if (isLoading && !team) {
    return <div className="p-8 text-center">Loading team details...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }
  if (!team) {
    return <div className="p-8 text-center">Team not found.</div>;
  }

  const canManageTeam = currentUser && team.owner && team.owner.id === currentUser.id;
  const currentMemberUsers = team.memberships?.map(m => m.user) || [];


  return (
    <div className="flex-1 bg-gray-100 p-8 overflow-y-auto">
      <header className="mb-8 pb-4 border-b border-gray-300">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold text-gray-800">{team.name}</h1>
            {/* {canManageTeam && (
                <button
                // onClick={() => setIsEditTeamModalOpen(true)}
                className="p-2 text-gray-500 hover:text-indigo-600 rounded-md"
                title="Edit Team Settings"
                >
                <CogIcon className="w-6 h-6" />
                </button>
            )} */}
        </div>
        <p className="text-gray-600 mt-1">{team.description || "No description provided."}</p>
        {team.owner && (
            <p className="text-sm text-gray-500 mt-1">
            Owned by: <Link to={`/profile/${team.owner.id}`} className="text-indigo-600 hover:underline">{team.owner.first_name && team.owner.last_name ? `${team.owner.first_name} ${team.owner.last_name}` : team.owner.username}</Link>
            </p>
        )}
      </header>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-800">Members ({team.memberships?.length || 0})</h2>
            {canManageTeam && (
                 <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm"
                >
                    <PlusIcon className="w-4 h-4 mr-1.5" />
                    Add Member
                </button>
            )}
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          {team.memberships && team.memberships.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {team.memberships.map((membership: TeamMember) => {
                return (
                  <li key={membership.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center">
                      <UserPlaceholderIcon className="w-10 h-10 rounded-full mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          <Link to={`/profile/${membership.user.id}`} className="hover:text-indigo-600">
                            {membership.user.first_name && membership.user.last_name ? `${membership.user.first_name} ${membership.user.last_name}` : membership.user.username}
                          </Link>
                        </p>
                        <p className="text-xs text-gray-500">{membership.role.charAt(0).toUpperCase() + membership.role.slice(1)}</p>
                      </div>
                    </div>
                    {canManageTeam && membership.user.id !== team.owner?.id && (
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleRemoveMember(membership.id)} title="Remove Member" className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="p-4 text-sm text-gray-500 text-center">No members in this team.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Associated Projects ({projects.length})</h2>
        <div className="bg-white p-2 rounded-lg shadow">
          {projects.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {projects.map(project => (
                <li key={project.id} className="p-3 hover:bg-gray-50">
                   <Link to={`/project/${project.id}`} className="block">
                    <div className="flex items-center">
                        <ProjectPlaceholderIcon className="w-8 h-8 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-indigo-600 truncate">{project.name}</p>
                        <p className="text-xs text-gray-500">Tasks: {project.tasks_count || 0}</p>
                        </div>
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {project.status}
                        </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-sm text-gray-500 text-center">No projects directly associated with this team on this view.</p>
          )}
        </div>
      </section>

      {canManageTeam && teamId && (
        <AddTeamMemberModal
          isOpen={isAddMemberModalOpen}
          onClose={() => setIsAddMemberModalOpen(false)}
          onMemberAdded={handleMemberAddedOrUpdated}
          teamId={Number(teamId)}
          currentMembers={currentMemberUsers}
        />
      )}
      {/* {canManageTeam && teamId && isEditTeamModalOpen && (
          <EditTeamModal
            isOpen={isEditTeamModalOpen}
            onClose={() => setIsEditTeamModalOpen(false)}
            onTeamUpdated={handleMemberAddedOrUpdated} // Re-fetch team data
            team={team}
          />
      )} */}
    </div>
  );
};

export default TeamDetailPage;