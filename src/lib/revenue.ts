import { isSameMonth, startOfMonth } from "date-fns";

import type { Appointment, PipelineRecord, RevenueEntry, RevenueGoal } from "@/types/domain";

export function currentMonthGoal(goals: RevenueGoal[], fallback: number): number {
  const now = new Date();
  const match = goals.find((g) => isSameMonth(new Date(g.month), now));
  return match?.monthly_goal ?? fallback;
}

export function currentMonthRevenue(entries: RevenueEntry[]): number {
  const now = new Date();
  return entries
    .filter((e) => isSameMonth(new Date(e.recorded_at), now))
    .reduce((sum, e) => sum + Number(e.amount), 0);
}

export function estimatedCasesNeeded(remaining: number, avgCaseValue: number): number {
  if (avgCaseValue <= 0) return 0;
  return Math.max(0, Math.ceil(remaining / avgCaseValue));
}

export function countByStage(pipeline: PipelineRecord[], stages: PipelineRecord["stage"][]): number {
  return pipeline.filter((p) => stages.includes(p.stage)).length;
}

export function monthToDatePipeline(pipeline: PipelineRecord[]): PipelineRecord[] {
  const start = startOfMonth(new Date());
  return pipeline.filter((p) => new Date(p.created_at) >= start);
}

export function conversionRate(pipeline: PipelineRecord[]): number {
  const created = monthToDatePipeline(pipeline);
  if (created.length === 0) return 0;
  const converted = created.filter((p) => p.stage === "Policy Delivered" || p.stage === "Client").length;
  return Math.round((converted / created.length) * 100);
}

export function monthToDateAppointments(appointments: Appointment[]): Appointment[] {
  const start = startOfMonth(new Date());
  return appointments.filter((a) => new Date(a.scheduled_at) >= start);
}
