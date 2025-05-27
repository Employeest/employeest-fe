// src/services/apiService.ts
import {
  User, Project, Task, WorkLog, LoginCredentials, AuthTokenResponse, RegistrationData,
  ProjectCreatePayload, ProjectUpdatePayload,
  TaskCreatePayload, TaskUpdatePayload,
  WorkLogCreatePayload, WorkLogUpdatePayload,
  ChartResponse, OwnerDashboardData, EmployeeDashboardData
  // Assuming apiTypes.ts is in ../types/apiTypes.ts, adjust if necessary
} from '../types/apiTypes';

const API_BASE_URL = process.env.REACT_APP_CLIENT_BASE_URL || 'http://localhost:8000/api/v1';

interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
}

// Helper function for fetch requests (remains the same)
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) { /* Not JSON or empty */ }
    const errorMessage = errorData?.detail || errorData?.message || JSON.stringify(errorData) || response.statusText || `HTTP error ${response.status}`;
    throw new Error(errorMessage);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return Promise.resolve(undefined as unknown as T);
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const queryParams = new URLSearchParams(params);
    url += `?${queryParams.toString()}`;
  }

  const token = localStorage.getItem('authToken');
  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) { // Don't send token for login/register
    headers.set('Authorization', `Token ${token}`);
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
  };

  const response = await fetch(url, config);
  return handleResponse<T>(response);
}

// --- Authentication Service ---
const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthTokenResponse> => {
    // DRF's obtain_auth_token expects 'username' and 'password'.
    // It's important that the LoginCredentials passed in has 'username'.
    const data = await apiFetch<AuthTokenResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  register: async (userData: RegistrationData): Promise<User> => {
    // The backend UserRegistrationAPIView expects username, email, password, password2, etc.
    return apiFetch<User>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Attempt to invalidate token on server-side
        await apiFetch<void>('/auth/logout/', { method: 'POST' });
      } catch (error) {
        console.warn('Server-side logout failed or not supported for this token type, clearing local token only.', error);
      }
    }
    localStorage.removeItem('authToken');
    return Promise.resolve();
  },

  getProfile: async (): Promise<User> => {
    return apiFetch<User>('/profile/');
  },
};

// --- Project Service (remains the same as your provided version) ---
const projectService = {
  getAll: async (queryParams?: Record<string, any>): Promise<{ count: number; results: Project[] } | Project[]> => {
    return apiFetch<{ count: number; results: Project[] } | Project[]>('/projects/', { params: queryParams });
  },
  getById: async (id: number): Promise<Project> => {
    return apiFetch<Project>(`/projects/${id}/`);
  },
  create: async (data: ProjectCreatePayload): Promise<Project> => {
    return apiFetch<Project>('/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: number, data: ProjectUpdatePayload): Promise<Project> => {
    return apiFetch<Project>(`/projects/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  partialUpdate: async (id: number, data: Partial<ProjectUpdatePayload>): Promise<Project> => {
    return apiFetch<Project>(`/projects/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    await apiFetch<void>(`/projects/${id}/`, { method: 'DELETE' });
  },
  getVelocityChart: async (id: number): Promise<ChartResponse> => {
    return apiFetch<ChartResponse>(`/projects/${id}/velocity-chart/`);
  },
  getTaskStatusChart: async (id: number): Promise<ChartResponse> => {
    return apiFetch<ChartResponse>(`/projects/${id}/task-status-chart/`);
  },
};

// --- Task Service (remains the same as your provided version) ---
const taskService = {
  getAll: async (queryParams?: Record<string, any>): Promise<{ count: number; results: Task[] } | Task[]> => {
    return apiFetch<{ count: number; results: Task[] } | Task[]>('/tasks/', { params: queryParams });
  },
  getById: async (id: number): Promise<Task> => {
    return apiFetch<Task>(`/tasks/${id}/`);
  },
  create: async (data: TaskCreatePayload): Promise<Task> => {
    return apiFetch<Task>('/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: number, data: TaskUpdatePayload): Promise<Task> => {
    return apiFetch<Task>(`/tasks/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  partialUpdate: async (id: number, data: Partial<TaskUpdatePayload>): Promise<Task> => {
    return apiFetch<Task>(`/tasks/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    await apiFetch<void>(`/tasks/${id}/`, { method: 'DELETE' });
  },
  startProgress: async (id: number): Promise<{ status: string; task_status: string }> => {
    return apiFetch<{ status: string; task_status: string }>(`/tasks/${id}/start-progress/`, {
      method: 'POST',
    });
  },
  markAsDone: async (id: number): Promise<{ status: string; task_status: string }> => {
    return apiFetch<{ status: string; task_status: string }>(`/tasks/${id}/mark-as-done/`, {
      method: 'POST',
    });
  },
};

// --- WorkLog Service (remains the same as your provided version) ---
const workLogService = {
  getAll: async (queryParams?: Record<string, any>): Promise<{ count: number; results: WorkLog[] } | WorkLog[]> => {
    return apiFetch<{ count: number; results: WorkLog[] } | WorkLog[]>('/worklogs/', { params: queryParams });
  },
  getById: async (id: number): Promise<WorkLog> => {
    return apiFetch<WorkLog>(`/worklogs/${id}/`);
  },
  create: async (data: WorkLogCreatePayload): Promise<WorkLog> => {
    return apiFetch<WorkLog>('/worklogs/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: number, data: WorkLogUpdatePayload): Promise<WorkLog> => {
    return apiFetch<WorkLog>(`/worklogs/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  partialUpdate: async (id: number, data: Partial<WorkLogUpdatePayload>): Promise<WorkLog> => {
    return apiFetch<WorkLog>(`/worklogs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    await apiFetch<void>(`/worklogs/${id}/`, { method: 'DELETE' });
  },
};

// --- Statistics & Dashboard Service (remains the same as your provided version) ---
const statisticsService = {
  getBusinessStoryPointsMonthly: async (): Promise<ChartResponse> => {
    return apiFetch<ChartResponse>('/statistics/business/story-points-monthly/');
  },
  getUserPersonalTaskCompletionChart: async (): Promise<ChartResponse> => {
    return apiFetch<ChartResponse>('/me/statistics/task-completion-chart/');
  },
  getOwnerDashboard: async (): Promise<OwnerDashboardData> => {
    return apiFetch<OwnerDashboardData>('/dashboards/owner/');
  },
  getEmployeeDashboard: async (): Promise<EmployeeDashboardData> => {
    return apiFetch<EmployeeDashboardData>('/dashboards/employee/');
  },
};


const userService = {
  // Assuming paginated or direct array response similar to other getAll methods
  getAll: async (params?: Record<string, any>): Promise<{ count: number; results: User[] } | User[]> => {
    return apiFetch<{ count: number; results: User[] } | User[]>('/users/', { params });
  }
};

export const apiService = {
  auth: authService,
  projects: projectService,
  tasks: taskService,
  workLogs: workLogService,
  statistics: statisticsService,
  users: userService
};
