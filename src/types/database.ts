import type {
  Appointment,
  Campaign,
  DailyScorecard,
  Idea,
  PipelineRecord,
  Profile,
  Project,
  RevenueEntry,
  RevenueGoal,
  Settings,
  Task,
  WaitingItem,
} from "@/types/domain";

// Minimal hand-written Supabase Database type. Row/Insert/Update all default
// to the domain shape; Insert makes server-generated columns optional.
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row> & Omit<Row, "id" | "created_at" | "updated_at" | "owner_user_id">;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>;
      pipeline_records: Table<PipelineRecord>;
      tasks: Table<Task>;
      appointments: Table<Appointment>;
      campaigns: Table<Campaign>;
      projects: Table<Project>;
      ideas: Table<Idea>;
      waiting_items: Table<WaitingItem>;
      revenue_goals: Table<RevenueGoal>;
      revenue_entries: Table<RevenueEntry>;
      daily_scorecards: Table<DailyScorecard>;
      settings: Table<Settings>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
