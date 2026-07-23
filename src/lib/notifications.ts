// Notification rules — deliberately narrow. ShaneOS should almost never
// interrupt; a notification only fires for the five situations in the spec.

import { differenceInMinutes, isFuture } from "date-fns";

import type { Appointment } from "@/types/domain";
import type { WorkItem } from "@/lib/priority";

export interface AppNotification {
  id: string;
  message: string;
  route: string;
}

export function computeNotifications(ranked: WorkItem[], appointments: Appointment[]): AppNotification[] {
  const notifications: AppNotification[] = [];

  for (const appt of appointments) {
    if (appt.status !== "scheduled") continue;
    const scheduled = new Date(appt.scheduled_at);
    if (isFuture(scheduled) && differenceInMinutes(scheduled, new Date()) <= 60) {
      notifications.push({
        id: `appt-soon:${appt.id}`,
        message: `Appointment starts soon: ${appt.title}`,
        route: "/appointments",
      });
    }
  }

  for (const item of ranked) {
    if (item.categoryKey === "application_ready" && item.overdue) {
      notifications.push({ id: `app-overdue:${item.id}`, message: `Application overdue: ${item.title}`, route: item.route });
    }
    if (item.tier === 1 && item.isRevenue && item.overdue && item.categoryKey !== "application_ready") {
      notifications.push({ id: `rev-overdue:${item.id}`, message: `Revenue task overdue: ${item.title}`, route: item.route });
    }
    if (item.categoryKey === "client_waiting" && (item.overdue || item.dueToday)) {
      notifications.push({ id: `client-waiting:${item.id}`, message: `Client waiting: ${item.title}`, route: item.route });
    }
    if (item.categoryKey === "recommendation_today") {
      notifications.push({ id: `rec-needed:${item.id}`, message: `Recommendation needed: ${item.title}`, route: item.route });
    }
  }

  return notifications;
}
