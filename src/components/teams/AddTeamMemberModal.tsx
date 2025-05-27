import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import { TeamMemberCreatePayload, UserSimple } from '../../types/apiTypes';
import { ChevronDownIcon } from '../icons';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
  teamId: number;
  currentMembers: UserSimple[]; // To exclude already added members
}

const AddTeamMemberModal: React.FC<AddTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
  teamId,
  currentMembers,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'member' | 'lead' | 'pm'>('member');
  const [allUsers, setAllUsers] = useState<UserSimple[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('Select User');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      setSelectedRole('member');
      setSearchTerm('');
      setIsDropdownOpen(false);
      setSelectedUserName('Select User');
      setError(null);
      setIsLoading(false);
      
      const fetchUsers = async () => {
        setIsFetchingUsers(true);
        try {
          const response = await apiService.users.getAll(); // Assuming this fetches UserSimple[]
          const usersData = 'results' in response ? response.results : response as UserSimple[];
          const currentMemberIds = new Set(currentMembers.map(m => m.id));
          setAllUsers(usersData.filter(user => !currentMemberIds.has(user.id)));
        } catch (err) {
          console.error('Failed to fetch users:', err);
          setError('Could not load users.');
        } finally {
          setIsFetchingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, currentMembers]);

  const filteredUsers = searchTerm
    ? allUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allUsers;

  const handleUserSelect = (user: UserSimple) => {
    setSelectedUserId(user.id.toString());
    setSelectedUserName(user.first_name && user.last_name ? `${user.first_name} ${user.last_name} (${user.username})` : user.username);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (isDropdownOpen) setSearchTerm(''); // Clear search on close
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!selectedUserId) {
      setError('Please select a user.');
      return;
    }
    setIsLoading(true);
    const payload: TeamMemberCreatePayload = {
      user_id: parseInt(selectedUserId, 10),
      role: selectedRole,
    };
    try {
      await apiService.teams.addTeamMember(teamId, payload);
      onMemberAdded();
      onClose();
    } catch (err: any) {
      console.error('Failed to add team member:', err);
      setError(err.message || 'Failed to add member. They might already be on the team.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const selectStyle = `${inputStyle} bg-white`;


  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white z-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add Team Member</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-1 leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm" role="alert">
              {error}
            </div>
          )}
          
          {/* User Searchable Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">User <span className="text-red-500">*</span></label>
            <button
              type="button"
              onClick={toggleDropdown}
              className={`${inputStyle} flex items-center justify-between text-left ${!selectedUserId ? 'text-gray-400' : 'text-gray-900'} bg-white`}
              disabled={isLoading || isFetchingUsers}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span className={selectedUserId ? "text-gray-900 truncate" : "text-gray-500"}>
                {selectedUserName}
              </span>
              <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ease-in-out ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>
            <div className={`absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg transition-all duration-200 ease-in-out transform ${isDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'}`} style={{ transformOrigin: 'top' }}>
              {isDropdownOpen && (
                <>
                  <div className="p-2">
                    <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputStyle} text-sm`} autoFocus />
                  </div>
                  <ul className="max-h-48 overflow-y-auto">
                    {isFetchingUsers ? <li className="px-3 py-2 text-sm text-gray-500">Loading users...</li> :
                     filteredUsers.length > 0 ? filteredUsers.map((user) => (
                      <li key={user.id} onClick={() => handleUserSelect(user)} className="px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer" role="option" aria-selected={selectedUserId === user.id.toString()}>
                        {user.first_name && user.last_name ? `${user.first_name} ${user.last_name} (${user.username})` : user.username}
                      </li>
                    )) : <li className="px-3 py-2 text-sm text-gray-500">{searchTerm ? 'No users found.' : 'No users to add.'}</li>}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="member-role" className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
            <select
              id="member-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'member' | 'lead' | 'pm')}
              className={selectStyle}
              disabled={isLoading}
            >
              <option value="member">Member</option>
              <option value="lead">Team Lead</option>
              <option value="pm">Project Manager</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm">Cancel</button>
            <button type="submit" disabled={isLoading || isFetchingUsers} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm disabled:opacity-50">
              {isLoading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamMemberModal;