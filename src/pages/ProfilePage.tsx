import React, { useEffect, useState } from 'react';
import { User } from '../types/apiTypes';
import { apiService } from '../services/apiService';
import { UserPlaceholderIcon } from '../components/icons';
import { useParams } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);


  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let profileData;
      if (userId) {
        profileData = await apiService.auth.getProfile();
        if (userId && profileData.id.toString() !== userId) {
             console.warn("Accessing /profile/:userId, but currently only showing logged-in user's profile data.");
             setIsOwnProfile(profileData.id.toString() === userId);
        } else {
            setIsOwnProfile(true);
        }

      } else {
        profileData = await apiService.auth.getProfile();
        setIsOwnProfile(true);
      }
      setUser(profileData);
    } catch (err: any) {
      console.error("Failed to fetch profile:", err);
      setError(err.message || "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const pageRootClasses = "flex-1 bg-gray-100 p-8 overflow-y-auto";

  if (isLoading) {
    return (
      <div className={`${pageRootClasses} flex items-center justify-center`}>
        <p className="text-gray-500 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${pageRootClasses} flex flex-col items-center justify-center`}>
        <p className="text-red-500 text-lg mb-4">Error: {error}</p>
         <button
          onClick={fetchProfile}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${pageRootClasses} flex items-center justify-center`}>
        <p className="text-gray-500 text-lg">User profile not found.</p>
      </div>
    );
  }

  const displayName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username;
  const displayRole = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A';
  const pageTitle = isOwnProfile ? "My Profile" : `Profile: ${displayName}`;


  return (
    <div className={pageRootClasses}>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">{pageTitle}</h1>
      </header>

      <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center md:flex-row md:items-start">
          <UserPlaceholderIcon className="w-24 h-24 md:w-32 md:h-32 rounded-full mb-6 md:mb-0 md:mr-8 flex-shrink-0 text-indigo-500" />
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-md text-indigo-600">{displayRole}</p>
            <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Username</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
            </div>
            {user.first_name && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">First Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.first_name}</dd>
              </div>
            )}
            {user.last_name && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.last_name}</dd>
              </div>
            )}
            {user.phone_number && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.phone_number}</dd>
              </div>
            )}
             <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.id}</dd>
            </div>
          </dl>
        </div>
        {/* Placeholder for future actions like "Edit Profile" if it's own profile */}
        {/* {isOwnProfile && (
            <div className="mt-8 text-right">
            <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm">
                Edit Profile
            </button>
            </div>
        )} */}
      </div>
    </div>
  );
};

export default ProfilePage;
