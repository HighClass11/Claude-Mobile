import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import type {
  Appointment,
  Campaign,
  DailyScorecard,
  Idea,
  PipelineRecord,
  Project,
  RevenueEntry,
  RevenueGoal,
  Task,
  WaitingItem,
} from "@/types/domain";

type Insertable<Row> = Partial<Row>;
type Updatable<Row> = Partial<Row>;

export function usePipeline() {
  return useSupabaseTable<PipelineRecord, Insertable<PipelineRecord>, Updatable<PipelineRecord>>(
    "pipeline_records",
    { orderBy: "updated_at", ascending: false },
  );
}

export function useTasks() {
  return useSupabaseTable<Task, Insertable<Task>, Updatable<Task>>("tasks", {
    orderBy: "due_date",
    ascending: true,
  });
}

export function useAppointments() {
  return useSupabaseTable<Appointment, Insertable<Appointment>, Updatable<Appointment>>("appointments", {
    orderBy: "scheduled_at",
    ascending: true,
  });
}

export function useCampaigns() {
  return useSupabaseTable<Campaign, Insertable<Campaign>, Updatable<Campaign>>("campaigns", {
    orderBy: "due_date",
    ascending: true,
  });
}

export function useProjects() {
  return useSupabaseTable<Project, Insertable<Project>, Updatable<Project>>("projects", {
    orderBy: "updated_at",
    ascending: false,
  });
}

export function useIdeas() {
  return useSupabaseTable<Idea, Insertable<Idea>, Updatable<Idea>>("ideas", {
    orderBy: "created_at",
    ascending: false,
  });
}

export function useWaitingItems() {
  return useSupabaseTable<WaitingItem, Insertable<WaitingItem>, Updatable<WaitingItem>>("waiting_items", {
    orderBy: "created_at",
    ascending: false,
  });
}

export function useRevenueGoals() {
  return useSupabaseTable<RevenueGoal, Insertable<RevenueGoal>, Updatable<RevenueGoal>>("revenue_goals", {
    orderBy: "month",
    ascending: false,
  });
}

export function useRevenueEntries() {
  return useSupabaseTable<RevenueEntry, Insertable<RevenueEntry>, Updatable<RevenueEntry>>("revenue_entries", {
    orderBy: "recorded_at",
    ascending: false,
  });
}

export function useDailyScorecards() {
  return useSupabaseTable<DailyScorecard, Insertable<DailyScorecard>, Updatable<DailyScorecard>>(
    "daily_scorecards",
    { orderBy: "date", ascending: false },
  );
}
