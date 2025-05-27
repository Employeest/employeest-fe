// src/components/teams/CreateTeamModal.tsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { TeamCreatePayload } from '../../types/apiTypes';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ isOpen, onClose, onTeamCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Team name is required.');
      return;
    }
    setIsLoading(true);
    const payload: TeamCreatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
    };
    try {
      await apiService.teams.create(payload);
      onTeamCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create team:', err);
      setError(err.message || 'Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40 flex items-center justify-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white z-50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Create New Team</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-1 leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm" role="alert">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">Team Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyle}
              required
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="team-description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              id="team-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputStyle}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;