// src/services/apiService.ts
import {
  User, Project, Task, WorkLog, LoginCredentials, AuthTokenResponse, RegistrationData,
  ProjectCreatePayload, ProjectUpdatePayload,
  TaskCreatePayload, TaskUpdatePayload,
  WorkLogCreatePayload, WorkLogUpdatePayload,
  ChartResponse, OwnerDashboardData, EmployeeDashboardData,
  Team, // Added Team
  TaskComment, // Added TaskComment if you plan to use it via apiService directly
  TeamMemberCreatePayload, // Added for creating team members
  TeamCreatePayload, // Added for creating teams
  TaskHistory,
  TeamMember,
  TeamUpdatePayload,
  TeamMemberUpdatePayload
} from '../types/apiTypes'; // Ensure Team is exported from apiTypes.ts

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';


interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) { /* Not JSON or empty */ }
    // Try to extract a more specific message
    const specificError = errorData?.detail || errorData?.message || 
                         (typeof errorData === 'object' && errorData !== null ? Object.values(errorData).flat().join(' ') : null);
    const errorMessage = specificError || JSON.stringify(errorData) || response.statusText || `HTTP error ${response.status}`;
    throw new Error(errorMessage);
  }
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    // Handle cases where the response might be empty but still JSON (e.g., 204 No Content with an empty JSON body)
    const text = await response.text();
    if (!text) {
        return Promise.resolve(undefined as unknown as T);
    }
    try {
        return JSON.parse(text) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", e, "Response text:", text);
        throw new Error("Invalid JSON response from server.");
    }
  }
  return Promise.resolve(undefined as unknown as T); // For non-JSON responses like 204 No Content
}


async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const queryParams = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) { // Ensure only defined values are added
            queryParams.append(key, params[key].toString());
        }
    }
    if (queryParams.toString()) { // Only add '?' if there are actual parameters
        url += `?${queryParams.toString()}`;
    }
  }


  const token = localStorage.getItem('authToken');
  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
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
    return apiFetch<User>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        await apiFetch<void>('/auth/logout/', { method: 'POST' });
      } catch (error) {
        console.warn('Server-side logout failed or not supported, clearing local token only.', error);
      }
    }
    localStorage.removeItem('authToken');
    return Promise.resolve();
  },

  getProfile: async (): Promise<User> => {
    return apiFetch<User>('/profile/');
  },
};

// --- Project Service ---
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

// --- Task Service ---
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
  // Add methods for task comments and history if needed
  getComments: async (taskId: number): Promise<TaskComment[]> => {
    // apiFetch will use handleResponse. If handleResponse correctly returns [] for empty JSON arrays
    // or for "no content" when an array is expected, this should be fine.
    const comments = await apiFetch<TaskComment[]>(`/tasks/${taskId}/comments/`);
    return comments || []; // Defensive: ensure an array is always returned from this service call.
  },
  addComment: async (taskId: number, commentData: { comment: string }): Promise<TaskComment> => {
    return apiFetch<TaskComment>(`/tasks/${taskId}/comments/`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },
  getHistory: async (taskId: number): Promise<TaskHistory[]> => {
    const history = await apiFetch<TaskHistory[]>(`/tasks/${taskId}/history/`);
    return history || []; // Defensive: ensure an array is always returned.
  },
};

// --- WorkLog Service ---
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

// --- Statistics & Dashboard Service ---
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

// --- User Service ---
const userService = {
  getAll: async (params?: Record<string, any>): Promise<{ count: number; results: User[] } | User[]> => {
    return apiFetch<{ count: number; results: User[] } | User[]>('/users/', { params });
  },
  // getById: async (id: number): Promise<User> => { // If you need to fetch a single user's public profile
  //   return apiFetch<User>(`/users/${id}/`);
  // }
};

// --- Team Service ---
const teamService = {
  getAll: async (queryParams?: Record<string, any>): Promise<{ count: number; results: Team[] } | Team[]> => {
    // The backend TeamViewSet is paginated by default.
    return apiFetch<{ count: number; results: Team[] } | Team[]>(`/teams/`, { params: queryParams });
  },
  getById: async (id: number): Promise<Team> => {
    return apiFetch<Team>(`/teams/${id}/`);
  },
  create: async (data: TeamCreatePayload): Promise<Team> => {
    return apiFetch<Team>('/teams/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: number, data: TeamUpdatePayload): Promise<Team> => {
    return apiFetch<Team>(`/teams/${id}/`, {
      method: 'PUT', // or PATCH for partial updates
      body: JSON.stringify(data),
    });
  },
  partialUpdate: async (id: number, data: Partial<TeamUpdatePayload>): Promise<Team> => {
    return apiFetch<Team>(`/teams/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    await apiFetch<void>(`/teams/${id}/`, { method: 'DELETE' });
  },

  // Team Members
  getTeamMembers: async (teamId: number, queryParams?: Record<string, any>): Promise<{ count: number; results: TeamMember[] } | TeamMember[]> => {
    return apiFetch<{ count: number; results: TeamMember[] } | TeamMember[]>(`/teams/${teamId}/members/`, { params: queryParams });
  },
  addTeamMember: async (teamId: number, memberData: TeamMemberCreatePayload): Promise<TeamMember> => {
    return apiFetch<TeamMember>(`/teams/${teamId}/members/`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },
  getTeamMemberById: async (teamId: number, memberId: number): Promise<TeamMember> => {
    return apiFetch<TeamMember>(`/teams/${teamId}/members/${memberId}/`);
  },
  updateTeamMember: async (teamId: number, memberId: number, data: TeamMemberUpdatePayload): Promise<TeamMember> => {
    return apiFetch<TeamMember>(`/teams/${teamId}/members/${memberId}/`, {
      method: 'PATCH', // Or PUT if full update is required
      body: JSON.stringify(data),
    });
  },
  removeTeamMember: async (teamId: number, memberId: number): Promise<void> => {
    await apiFetch<void>(`/teams/${teamId}/members/${memberId}/`, { method: 'DELETE' });
  },
};

export const apiService = {
  auth: authService,
  projects: projectService,
  tasks: taskService,
  workLogs: workLogService,
  statistics: statisticsService,
  users: userService,
  teams: teamService,
};