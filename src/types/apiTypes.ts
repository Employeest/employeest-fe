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
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'in_review' | 'CANCELLED'; // Added more statuses
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // Added priority
  assignee?: UserSimple;
  deadline?: string; // YYYY-MM-DD
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  owner: UserSimple;
  managers?: UserSimple[]; // Added managers
  status: 'draft' | 'active' | 'on_hold' | 'completed'; // Added status
  created_at: string; // ISO DateTime string
  updated_at: string; // ISO DateTime string
  tasks_count: number;
  tasks: TaskSimple[]; // This might not be directly on Project list, but on detail
  team_details?: TeamSimple[]; // Use TeamSimple for brevity
  team?: number[]; // For write operations if projects are associated with teams by ID lists
}
export interface ProjectCreatePayload {
  name: string;
  description?: string;
  owner_id?: number; // Set by backend based on authenticated user
  manager_ids?: number[];
  team_ids?: number[]; // For associating with teams on creation
  status?: 'draft' | 'active' | 'on_hold' | 'completed';
}

export interface ProjectUpdatePayload extends Partial<ProjectCreatePayload> {}


export interface UserSimple {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface ProjectSimple { // If needed for embedding in Task
    id: number;
    name: string;
    owner: UserSimple; // Project owner
}

export interface Task {
  id: number;
  name: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'in_review' | 'DONE' | 'CANCELLED';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  story_points?: number;
  deadline?: string; 
  estimation_hours?: string;
  project_id: number;       // Foreign key to Project
  project: ProjectSimple; // Contains project.owner.id via ProjectSimple.owner.id
  project_name: string;     // Likely from serializer source='project.name'
  project_status?: string;
  assignee_id?: number | null;
  assignee?: UserSimple;
  parent_task_id?: number | null;
  parent_task?: TaskSimple;
  subtasks?: TaskSimple[];
  comments_count?: number;
  created_at: string; 
  updated_at: string; 
}

export interface TaskCreatePayload {
  name: string;
  description?: string;
  project_id: number;
  status?: 'TODO' | 'IN_PROGRESS' | 'in_review' | 'DONE' | 'CANCELLED';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee_id?: number | null;
  parent_task_id?: number | null;
  story_points?: number;
  deadline?: string;
  estimation_hours?: string;
}

export interface TaskUpdatePayload extends Partial<TaskCreatePayload> {}

export interface WorkLog {
  id: number;
  user: UserSimple;
  task?: number; // task ID
  task_details?: TaskSimple; // Optional: for displaying task name in work log list
  project?: number; // project ID
  project_details?: { id: number; name: string }; // Optional: for displaying project name
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
  projects_list: Project[]; // This should ideally be ProjectSimple or a summarized Project
}

export interface EmployeeDashboardData {
  my_projects: Project[]; // This should ideally be ProjectSimple or a summarized Project
  my_teams: Team[];
  my_current_tasks: Task[]; // This could be TaskSimple
}

// For auth
export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface AuthTokenResponse {
  token: string;
}

export interface RegistrationData {
  username: string;
  email: string;
  password?: string;
  password2?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: 'owner' | 'employee' | 'topemployee' | 'admin'; // Role might not be settable by user during registration
}

// Extended User interface (already present, ensure it's consistent)
// export interface User extends UserSimple {
//   first_name?: string;
//   last_name?: string;
//   phone_number?: string;
//   role?: 'owner' | 'employee' | 'topemployee' | 'admin';
// }


// Team related types
export interface TeamSimple {
  id: number;
  name: string;
}

export interface TeamMember {
  id: number;
  user: UserSimple; // UserSimple should have id, username, email, first_name?, last_name?
  team: number; // Team ID, useful if not already in context
  role: 'pm' | 'member' | 'lead';
  date_joined: string; // ISO DateTime string
}

export interface Team {
  id: number;
  name: string;
  description?: string | null; // Allow null if backend sends it
  owner: UserSimple; // Owner details
  memberships: TeamMember[]; // Detailed membership info including roles
  // The 'members' field in TeamSerializer (api/serializers.py) uses TeamMember,
  // but it's nested under 'memberships'. The direct 'members' field from the model might be different if exposed.
  // For now, focusing on 'memberships' as per TeamSerializer/TeamDetailSerializer
  // projects?: ProjectSimple[]; // If teams are directly linked to projects in TeamSerializer
}

export interface TeamCreatePayload {
  name: string;
  description?: string;
  // owner_id is set by the backend
}

export interface TeamUpdatePayload {
  name?: string;
  description?: string;
}

export interface TeamMemberCreatePayload {
  user_id: number;
  role: 'pm' | 'member' | 'lead'; // Role is required on creation by TeamMember model
}

export interface TeamMemberUpdatePayload {
  role?: 'pm' | 'member' | 'lead';
}

// Ensure Project type includes team details if projects can show their teams


// Make sure ProjectCreatePayload and ProjectUpdatePayload can handle team associations
export interface ProjectCreatePayload {
  // ... other fields
  team?: number[]; // Array of team IDs
}
export interface ProjectUpdatePayload {
  // ... other fields
  team?: number[];
}

// Task Comment & History
export interface TaskComment { // Renamed from TaskCommentType for consistency if preferred
  id: number;
  task: number; // Task ID
  user: UserSimple;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface TaskHistory { // Renamed from TaskHistoryType for consistency
  id: number;
  task: number; // Task ID
  user: UserSimple | null; 
  timestamp: string;
  field_changed?: string | null; // Make nullable to match backend (blank=True, null=True)
  old_value?: string | null;     // Make nullable
  new_value?: string | null;     // Make nullable
  change_description: string;
}