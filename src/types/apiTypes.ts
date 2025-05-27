// src/types/apiTypes.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: 'owner' | 'employee' | 'topemployee' | 'admin';
}


export interface TaskSimple {
  id: number;
  name: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee?: UserSimple;
  deadline?: string; // YYYY-MM-DD
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  owner: UserSimple;
  created_at: string; // ISO DateTime string
  updated_at: string; // ISO DateTime string
  tasks_count: number;
  tasks: TaskSimple[];
}

export interface ProjectCreatePayload {
  name: string;
  description?: string;
  owner_id?: number; // Assuming we pass owner_id on creation as per serializer
}

export interface ProjectUpdatePayload {
  name?: string;
  description?: string;
  // owner_id might also be updatable
}

export interface UserSimple {
  id: number;
  username: string;
  email: string;
}

export interface Task {
  id: number;
  name: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  story_points?: number;
  deadline?: string; // YYYY-MM-DD
  estimation_hours?: string; // Decimal string e.g., "2.50"
  project_id: number;
  project_name: string;
  assignee_id?: number | null;
  assignee?: UserSimple;
  created_at: string; // ISO DateTime string
  updated_at: string; // ISO DateTime string
}

export interface TaskCreatePayload {
  name: string;
  description?: string;
  project_id: number;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee_id?: number | null;
  story_points?: number;
  deadline?: string;
  estimation_hours?: string;
}

export interface TaskUpdatePayload extends Partial<TaskCreatePayload> {}

export interface WorkLog {
  id: number;
  user: UserSimple;
  task?: number; // task ID
  project?: number; // project ID
  date: string; // YYYY-MM-DD
  hours_spent: string; // Decimal string e.g., "3.00"
  description?: string;
  created_at: string; // ISO DateTime string
}

export interface WorkLogCreatePayload {
  task_id?: number | null;
  project_id?: number | null;
  date?: string; // YYYY-MM-DD, defaults to today on backend if not sent for create
  hours_spent: string; // Decimal string
  description?: string;
  // user_id is set to CurrentUserDefault on backend
}

export interface WorkLogUpdatePayload extends Partial<WorkLogCreatePayload> {}


export interface ChartResponse {
  chart_url?: string;
  message?: string; // For errors or info
  error?: string;
}

export interface OwnerDashboardData {
  summary_stats: {
    total_projects: number;
    active_projects: number;
    total_tasks: number;
    tasks_todo: number;
    tasks_inprogress: number;
    tasks_done: number;
  };
  projects_list: Project[];
}

export interface EmployeeDashboardData {
  my_projects: Project[];
  my_teams: Team[]; // Note: my_teams is empty in current backend implementation
  my_current_tasks: Task[];
}

// For auth
export interface LoginCredentials {
  username: string; // DRF's obtain_auth_token expects 'username'
  password?: string;
}

// This is a typical token response. The backend /api-auth/login/
// uses session auth and HTML response by default.
// For a real token-based auth, the backend would need an endpoint
// like /api/v1/auth/token/ that returns something like this.
export interface AuthTokenResponse {
  token: string; // This matches DRF's obtain_auth_token response
  // user?: User; // obtain_auth_token doesn't return user details by default
}

export interface RegistrationData {
  username: string;
  email: string;
  password?: string; // Password will be set
  password2?: string; // For password confirmation, matching the serializer
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface User extends UserSimple {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: 'owner' | 'employee' | 'topemployee' | 'admin';
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  owner?: UserSimple;
  members?: User[]; // Array of User objects
}
