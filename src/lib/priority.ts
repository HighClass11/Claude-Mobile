// The ShaneOS priority / automation engine.
//
// Every actionable record in the system (a pipeline record, an appointment, a
// task, a campaign responsibility, a CEO project, an idea) is normalized into
// a WorkItem. WorkItems are ranked by a single cascade so every screen in the
// app — Today's One Thing, Do This Next, Top Three, the dashboard feeds —
// reads from the same ordering instead of inventing its own rules.
//
// Cascade (highest priority first), mirroring the product spec's automation
// example (Recommendation Today > Application Ready > Client Waiting >
// Appointment Tomorrow > Lead Follow-up > Campaign Task > CEO Project > Ideas)
// with Today's Appointments folded in at the very top of Priority 1.

import {
  isPast,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from "date-fns";

import type {
  Appointment,
  Campaign,
  Idea,
  PipelineRecord,
  Project,
  Task,
  WaitingItem,
} from "@/types/domain";

export type PriorityTier = 1 | 2 | 3 | 4 | 5;

export type WorkItemKind =
  | "appointment"
  | "pipeline"
  | "task"
  | "waiting"
  | "campaign"
  | "project"
  | "idea";

export interface WorkItem {
  id: string;
  kind: WorkItemKind;
  sourceId: string;
  title: string;
  subtitle?: string;
  tier: PriorityTier;
  tierLabel: string;
  categoryKey: string;
  categoryRank: number;
  categoryLabel: string;
  dueDate: string | null;
  overdue: boolean;
  dueToday: boolean;
  isRevenue: boolean;
  expectedRevenue: number | null;
  nextAction: string;
  nextActionIsGenerated: boolean;
  needsNextAction: boolean;
  route: string;
}

// Lower rank = surfaces first. Grouped into the four tiers from the spec,
// with a 5th "ideas" tier that only ever appears in the parking lot.
const CATEGORY_ORDER: { key: string; rank: number; tier: PriorityTier; label: string }[] = [
  { key: "today_appointment", rank: 0, tier: 1, label: "Today's Appointment" },
  { key: "recommendation_today", rank: 1, tier: 1, label: "Recommendation Meeting" },
  { key: "fpr_today", rank: 2, tier: 1, label: "Family Protection Review" },
  { key: "application_ready", rank: 3, tier: 1, label: "Application Waiting to be Submitted" },
  { key: "policy_ready", rank: 4, tier: 1, label: "Policy Ready for Delivery" },
  { key: "client_waiting", rank: 5, tier: 1, label: "Client Waiting on Shane" },
  { key: "revenue_followup", rank: 6, tier: 1, label: "Revenue-Producing Follow-up" },

  { key: "appointment_tomorrow", rank: 10, tier: 2, label: "Appointment Tomorrow" },
  { key: "appointment_offer", rank: 11, tier: 2, label: "Appointment Offer" },
  { key: "qualified_lead", rank: 12, tier: 2, label: "Qualified Lead" },
  { key: "discovery_followup", rank: 13, tier: 2, label: "Discovery Follow-up" },
  { key: "recommendation_scheduling", rank: 14, tier: 2, label: "Recommendation Scheduling" },
  { key: "underwriting_requirement", rank: 15, tier: 2, label: "Underwriting Requirement" },
  { key: "prospect_followup", rank: 16, tier: 2, label: "Prospect Follow-up" },

  { key: "campaign_task", rank: 20, tier: 3, label: "Campaign Responsibility" },

  { key: "ceo_project", rank: 30, tier: 4, label: "CEO Project" },

  { key: "idea", rank: 40, tier: 5, label: "Idea" },
];

const categoryByKey = new Map(CATEGORY_ORDER.map((c) => [c.key, c]));

function category(key: string) {
  const c = categoryByKey.get(key);
  if (!c) throw new Error(`Unknown priority category: ${key}`);
  return c;
}

function toDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  try {
    return parseISO(iso);
  } catch {
    return null;
  }
}

function dueFlags(dueDate: string | null | undefined) {
  const date = toDate(dueDate);
  if (!date) return { overdue: false, dueToday: false };
  return {
    overdue: isPast(startOfDay(date)) && !isToday(date),
    dueToday: isToday(date),
  };
}

// "Nothing exists without a next action." When a pipeline record's next
// action is blank, we synthesize a sensible default from its stage so the
// UI never shows an empty "Do This Next" — while still flagging the record
// red as incomplete until Shane fills in a real one.
export function getStageNextAction(stage: PipelineRecord["stage"]): string {
  switch (stage) {
    case "New Lead":
      return "Reach out to start the conversation";
    case "Conversation Started":
      return "Move the conversation toward qualifying";
    case "Qualified":
      return "Offer an appointment";
    case "Appointment Offered":
      return "Confirm an appointment time";
    case "Appointment Scheduled":
      return "Send appointment confirmation";
    case "Appointment Confirmed":
      return "Prepare for the appointment";
    case "Discovery Completed":
      return "Complete the fact finder";
    case "Fact Finder Complete":
      return "Prepare the recommendation";
    case "Recommendation":
      return "Prepare Recommendation";
    case "Decision Pending":
      return "Follow up for a decision";
    case "Application":
      return "Submit Application";
    case "Underwriting":
      return "Follow up with underwriter";
    case "Approved":
      return "Schedule policy delivery";
    case "Policy Delivered":
      return "Schedule annual review";
    case "Annual Review":
      return "Prepare for annual review";
    case "Client":
      return "Check in / ask for referrals";
    default:
      return "Determine the next action";
  }
}

function pipelineCategory(record: PipelineRecord): string {
  switch (record.stage) {
    case "Recommendation":
      return "recommendation_today";
    case "Application":
      return "application_ready";
    case "Approved":
      return "policy_ready";
    case "Decision Pending":
    case "Underwriting":
      return "underwriting_requirement";
    case "Appointment Offered":
      return "appointment_offer";
    case "Qualified":
      return "qualified_lead";
    case "Discovery Completed":
    case "Fact Finder Complete":
      return "discovery_followup";
    case "Appointment Scheduled":
    case "Appointment Confirmed":
      return "recommendation_scheduling";
    case "Policy Delivered":
    case "Annual Review":
    case "Client":
      return "client_waiting";
    case "New Lead":
    case "Conversation Started":
    default:
      return "prospect_followup";
  }
}

export function classifyPipelineRecord(record: PipelineRecord): WorkItem {
  const catKey = pipelineCategory(record);
  const cat = category(catKey);
  const { overdue, dueToday } = dueFlags(record.due_date);
  const nextAction = record.next_action?.trim() || getStageNextAction(record.stage);

  return {
    id: `pipeline:${record.id}`,
    kind: "pipeline",
    sourceId: record.id,
    title: record.name,
    subtitle: record.stage,
    tier: cat.tier,
    tierLabel: tierLabel(cat.tier),
    categoryKey: cat.key,
    categoryRank: cat.rank - (overdue ? 0.5 : 0) - (dueToday ? 0.25 : 0),
    categoryLabel: cat.label,
    dueDate: record.due_date,
    overdue,
    dueToday,
    isRevenue: cat.tier <= 2,
    expectedRevenue: record.expected_revenue,
    nextAction,
    nextActionIsGenerated: !record.next_action?.trim(),
    needsNextAction: !record.next_action?.trim(),
    route: "/pipeline",
  };
}

export function classifyAppointment(appt: Appointment): WorkItem {
  const date = toDate(appt.scheduled_at);
  const today = date ? isToday(date) : false;
  const tomorrow = date ? isTomorrow(date) : false;

  const isFprOrRecommendation = appt.type === "FPR" || appt.type === "Recommendation";
  const catKey = today
    ? isFprOrRecommendation
      ? appt.type === "FPR"
        ? "fpr_today"
        : "recommendation_today"
      : "today_appointment"
    : tomorrow
      ? "appointment_tomorrow"
      : "appointment_offer";
  const cat = category(catKey);

  return {
    id: `appointment:${appt.id}`,
    kind: "appointment",
    sourceId: appt.id,
    title: appt.title,
    subtitle: `${appt.type} · ${new Date(appt.scheduled_at).toLocaleString(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    })}`,
    tier: cat.tier,
    tierLabel: tierLabel(cat.tier),
    categoryKey: cat.key,
    categoryRank: cat.rank,
    categoryLabel: cat.label,
    dueDate: appt.scheduled_at,
    overdue: false,
    dueToday: today,
    isRevenue: true,
    expectedRevenue: null,
    nextAction: appt.next_action?.trim() || `Prepare for ${appt.type.toLowerCase()} meeting`,
    nextActionIsGenerated: !appt.next_action?.trim(),
    needsNextAction: false,
    route: "/appointments",
  };
}

export function classifyTask(task: Task): WorkItem {
  const { overdue, dueToday } = dueFlags(task.due_date);
  const catKey =
    task.category === "revenue_now"
      ? "revenue_followup"
      : task.category === "revenue_pipeline"
        ? "prospect_followup"
        : task.category === "marketing"
          ? "campaign_task"
          : "ceo_project";
  const cat = category(catKey);

  return {
    id: `task:${task.id}`,
    kind: "task",
    sourceId: task.id,
    title: task.title,
    subtitle: task.subcategory ?? undefined,
    tier: cat.tier,
    tierLabel: tierLabel(cat.tier),
    categoryKey: cat.key,
    categoryRank: cat.rank - (overdue ? 0.5 : 0) - (dueToday ? 0.25 : 0),
    categoryLabel: cat.label,
    dueDate: task.due_date,
    overdue,
    dueToday,
    isRevenue: task.is_revenue_task,
    expectedRevenue: task.expected_revenue,
    nextAction: task.title,
    nextActionIsGenerated: false,
    needsNextAction: false,
    route: "/",
  };
}

// Only "waiting on Shane" items are actionable work for Shane — everything
// waiting on someone else lives on the Waiting On board, not the task feed.
export function classifyWaitingOnShane(item: WaitingItem): WorkItem {
  const cat = category("client_waiting");
  return {
    id: `waiting:${item.id}`,
    kind: "waiting",
    sourceId: item.id,
    title: item.title,
    subtitle: "Waiting on Shane",
    tier: cat.tier,
    tierLabel: tierLabel(cat.tier),
    categoryKey: cat.key,
    categoryRank: cat.rank,
    categoryLabel: cat.label,
    dueDate: null,
    overdue: false,
    dueToday: false,
    isRevenue: true,
    expectedRevenue: null,
    nextAction: item.title,
    nextActionIsGenerated: false,
    needsNextAction: false,
    route: "/waiting-on",
  };
}

export function classifyCampaign(item: Campaign): WorkItem {
  const cat = category("campaign_task");
  const { overdue, dueToday } = dueFlags(item.due_date);
  return {
    id: `campaign:${item.id}`,
    kind: "campaign",
    sourceId: item.id,
    title: item.title,
    subtitle: `${item.action[0].toUpperCase()}${item.action.slice(1)}`,
    tier: cat.tier,
    tierLabel: tierLabel(cat.tier),
    categoryKey: cat.key,
    categoryRank: cat.rank - (overdue ? 0.5 : 0) - (dueToday ? 0.25 : 0),
    categoryLabel: cat.label,
    dueDate: item.due_date,
    overdue,
    dueToday,
    isRevenue: false,
    expectedRevenue: null,
    nextAction: item.title,
    nextActionIsGenerated: false,
    needsNextAction: false,
    route: "/campaigns",
  };
}

export function classifyProject(item: Project): WorkItem {
  const cat = category("ceo_project");
  return {
    id: `project:${item.id}`,
    kind: "project",
    sourceId: item.id,
    title: item.title,
    subtitle: item.category,
    tier: cat.tier,
    tierLabel: tierLabel(cat.tier),
    categoryKey: cat.key,
    categoryRank: cat.rank,
    categoryLabel: cat.label,
    dueDate: item.resume_date,
    overdue: false,
    dueToday: false,
    isRevenue: false,
    expectedRevenue: null,
    nextAction: item.next_step?.trim() || "Decide the next step",
    nextActionIsGenerated: !item.next_step?.trim(),
    needsNextAction: false,
    route: "/projects",
  };
}

export function classifyIdea(item: Idea): WorkItem {
  const cat = category("idea");
  return {
    id: `idea:${item.id}`,
    kind: "idea",
    sourceId: item.id,
    title: item.content,
    subtitle: "Idea",
    tier: cat.tier,
    tierLabel: tierLabel(cat.tier),
    categoryKey: cat.key,
    categoryRank: cat.rank,
    categoryLabel: cat.label,
    dueDate: null,
    overdue: false,
    dueToday: false,
    isRevenue: false,
    expectedRevenue: null,
    nextAction: "Review during the weekly ideas review",
    nextActionIsGenerated: true,
    needsNextAction: false,
    route: "/ideas",
  };
}

export function tierLabel(tier: PriorityTier): string {
  switch (tier) {
    case 1:
      return "Revenue Now";
    case 2:
      return "Revenue Pipeline";
    case 3:
      return "Marketing Responsibilities";
    case 4:
      return "CEO Work";
    case 5:
      return "Ideas";
  }
}

function urgencyScore(item: WorkItem): number {
  let score = 0;
  if (item.overdue) score += 100;
  if (item.dueToday) score += 50;
  if (item.expectedRevenue) score += Math.min(item.expectedRevenue / 1000, 30);
  return score;
}

export function rankWorkItems(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => {
    if (a.categoryRank !== b.categoryRank) return a.categoryRank - b.categoryRank;
    return urgencyScore(b) - urgencyScore(a);
  });
}

export interface BuildWorkItemsInput {
  pipeline: PipelineRecord[];
  appointments: Appointment[];
  tasks: Task[];
  waitingItems: WaitingItem[];
  campaigns: Campaign[];
  projects: Project[];
  ideas: Idea[];
}

export function buildWorkItems(input: BuildWorkItemsInput): WorkItem[] {
  const items: WorkItem[] = [
    ...input.appointments
      .filter((a) => a.status === "scheduled")
      .map(classifyAppointment),
    ...input.pipeline
      .filter((p) => p.stage !== "Client" || !!p.next_action)
      .map(classifyPipelineRecord),
    ...input.tasks.filter((t) => t.status !== "done").map(classifyTask),
    ...input.waitingItems
      .filter((w) => w.status === "waiting" && w.waiting_on === "Shane")
      .map(classifyWaitingOnShane),
    ...input.campaigns.filter((c) => c.status !== "done").map(classifyCampaign),
    ...input.projects.filter((p) => p.status !== "done").map(classifyProject),
    ...input.ideas.filter((i) => i.status === "new").map(classifyIdea),
  ];
  return rankWorkItems(items);
}

// Today's One Thing: a manual pin always wins; otherwise the single
// highest-ranked WorkItem in the whole system.
export function getTodaysOneThing(
  ranked: WorkItem[],
  pinnedWorkItemId?: string | null,
): WorkItem | null {
  if (pinnedWorkItemId) {
    const pinned = ranked.find((i) => i.id === pinnedWorkItemId);
    if (pinned) return pinned;
  }
  return ranked[0] ?? null;
}

// Do This Next is always populated — the next best action after the One
// Thing — and never left blank.
export function getDoThisNext(ranked: WorkItem[], oneThingId?: string | null): WorkItem | null {
  const next = ranked.find((i) => i.id !== oneThingId);
  return next ?? ranked[0] ?? null;
}

export function getTopThree(ranked: WorkItem[]): WorkItem[] {
  return ranked.slice(0, 3);
}
