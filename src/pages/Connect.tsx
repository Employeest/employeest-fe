// src/pages/Connect.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/apiService'; // Adjust path if needed
import { LoginCredentials } from '../types/apiTypes'; // Adjust path if needed

// If you place your logo in src/assets:
// import logoImage from '../assets/logo.png';

const Connect: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Optional: Clear the message from location state after displaying
      // navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]); // Added navigate to dependency array

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const formData: LoginCredentials = {
      username: username,
      password,
    };

    try {
      const authResponse = await apiService.auth.login(formData);
      console.log('Login successful', authResponse);

      if (authResponse.token) {
        localStorage.setItem('authToken', authResponse.token);
        navigate(from, { replace: true });
      } else {
        console.warn('Auth token not found in login response.');
        setError('Login failed: Could not retrieve authentication token.');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      // Attempt to parse backend error message
      let displayError = 'Login failed. Please check your credentials.'; // Default error
      if (err.message) {
        try {
          // Check if the error message is a JSON string
          const parsedError = JSON.parse(err.message);
          if (parsedError.non_field_errors && Array.isArray(parsedError.non_field_errors)) {
            displayError = parsedError.non_field_errors.join(' '); // Join multiple non-field errors
          } else if (parsedError.detail) {
            displayError = parsedError.detail;
          } else {
            // Handle other structured errors if necessary, e.g., field-specific errors
            const fieldErrors = Object.entries(parsedError)
              .map(([key, value]) => `${key}: ${(Array.isArray(value) ? value.join(', ') : value)}`)
              .join('; ');
            if(fieldErrors) displayError = fieldErrors;
            else displayError = err.message; // Fallback to the raw message if specific parsing fails
          }
        } catch (e) {
          // If err.message is not a JSON string, use it directly
          displayError = err.message;
        }
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <img
            className="h-20 w-auto mb-2"
            src="/logo.png"
            alt="Employeest Logo"
          />
        </div>

        <div className="bg-white shadow-xl rounded-lg px-8 py-10 sm:px-10">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-8">
            Log in
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
                disabled={isLoading}
              />
            </div>

            <div className="text-sm text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <Link
                to="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up
              </Link>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Connect;