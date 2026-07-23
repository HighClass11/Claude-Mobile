// Domain types mirroring supabase/migrations/0001_init.sql

export type PipelineStage =
  | "New Lead"
  | "Conversation Started"
  | "Qualified"
  | "Appointment Offered"
  | "Appointment Scheduled"
  | "Appointment Confirmed"
  | "Discovery Completed"
  | "Fact Finder Complete"
  | "Recommendation"
  | "Decision Pending"
  | "Application"
  | "Underwriting"
  | "Approved"
  | "Policy Delivered"
  | "Annual Review"
  | "Client";

export const PIPELINE_STAGES: PipelineStage[] = [
  "New Lead",
  "Conversation Started",
  "Qualified",
  "Appointment Offered",
  "Appointment Scheduled",
  "Appointment Confirmed",
  "Discovery Completed",
  "Fact Finder Complete",
  "Recommendation",
  "Decision Pending",
  "Application",
  "Underwriting",
  "Approved",
  "Policy Delivered",
  "Annual Review",
  "Client",
];

export interface PipelineRecord {
  id: string;
  owner_user_id: string;
  name: string;
  stage: PipelineStage;
  lead_source: string | null;
  phone: string | null;
  email: string | null;
  last_meaningful_interaction: string | null;
  next_action: string | null;
  due_date: string | null;
  expected_revenue: number | null;
  owner: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskCategory = "revenue_now" | "revenue_pipeline" | "marketing" | "ceo";
export type TaskStatus = "not_started" | "in_progress" | "waiting" | "done";

export interface Task {
  id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  subcategory: string | null;
  status: TaskStatus;
  is_revenue_task: boolean;
  expected_revenue: number | null;
  due_date: string | null;
  pinned_as_one_thing: boolean;
  pipeline_record_id: string | null;
  appointment_id: string | null;
  campaign_id: string | null;
  project_id: string | null;
  resume_completed: string | null;
  resume_current_step: string | null;
  resume_next_step: string | null;
  resume_waiting_on: string | null;
  resume_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type AppointmentType = "Discovery" | "Recommendation" | "FPR" | "Annual Review" | "Client Service";
export type AppointmentStatus = "scheduled" | "completed" | "canceled" | "no_show";

export interface PrepChecklistItem {
  label: string;
  done: boolean;
}

export interface Appointment {
  id: string;
  owner_user_id: string;
  pipeline_record_id: string | null;
  title: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_minutes: number;
  prep_checklist: PrepChecklistItem[];
  meeting_notes: string | null;
  outcome: string | null;
  next_action: string | null;
  next_action_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type CampaignAction = "approve" | "film" | "record" | "teach" | "review" | "plan";
export type CampaignStatus = "pending" | "in_progress" | "done";

export interface Campaign {
  id: string;
  owner_user_id: string;
  title: string;
  action: CampaignAction;
  status: CampaignStatus;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectCategory =
  | "Licensing"
  | "Technology"
  | "Partnerships"
  | "Business Development"
  | "Systems"
  | "Hiring"
  | "Finance";
export type ProjectStatus = "not_started" | "in_progress" | "waiting" | "done";

export interface Project {
  id: string;
  owner_user_id: string;
  title: string;
  category: ProjectCategory;
  status: ProjectStatus;
  next_step: string | null;
  resume_completed: string | null;
  resume_current_step: string | null;
  resume_next_step: string | null;
  resume_waiting_on: string | null;
  resume_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type IdeaStatus = "new" | "reviewed" | "archived" | "promoted";

export interface Idea {
  id: string;
  owner_user_id: string;
  content: string;
  category: string | null;
  status: IdeaStatus;
  created_at: string;
  reviewed_at: string | null;
}

export type WaitingOnParty = "Shane" | "Jori" | "Client" | "Carrier" | "Marketing" | "Operations" | "DM";
export type WaitingStatus = "waiting" | "done";

export interface WaitingItem {
  id: string;
  owner_user_id: string;
  title: string;
  waiting_on: WaitingOnParty;
  status: WaitingStatus;
  related_type: string | null;
  related_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface RevenueGoal {
  id: string;
  owner_user_id: string;
  month: string;
  monthly_goal: number;
  created_at: string;
  updated_at: string;
}

export interface RevenueEntry {
  id: string;
  owner_user_id: string;
  pipeline_record_id: string | null;
  amount: number;
  description: string | null;
  recorded_at: string;
  created_at: string;
}

export interface DailyScorecard {
  id: string;
  owner_user_id: string;
  date: string;
  revenue: number;
  calls: number;
  texts: number;
  dms: number;
  appointments: number;
  applications: number;
  policies: number;
  content_created: number;
  biggest_win: string | null;
  biggest_obstacle: string | null;
  where_i_stopped: string | null;
  tomorrows_one_thing: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPrefs {
  appointment_starting_soon: boolean;
  application_overdue: boolean;
  revenue_task_overdue: boolean;
  client_waiting: boolean;
  recommendation_needed: boolean;
}

export interface Settings {
  owner_user_id: string;
  monthly_revenue_goal: number;
  avg_case_value: number;
  pinned_one_thing_work_item_id: string | null;
  theme: string;
  notification_prefs: NotificationPrefs;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}
