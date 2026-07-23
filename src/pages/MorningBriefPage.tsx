import * as React from "react";
import { isToday } from "date-fns";

import { useSettings } from "@/hooks/useSettings";
import {
  useAppointments,
  useCampaigns,
  useIdeas,
  usePipeline,
  useProjects,
  useRevenueEntries,
  useRevenueGoals,
  useTasks,
  useWaitingItems,
} from "@/hooks/entities";
import { buildWorkItems, getTodaysOneThing, getTopThree } from "@/lib/priority";
import { currentMonthGoal, currentMonthRevenue } from "@/lib/revenue";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { WorkItemRow } from "@/components/shared/WorkItemRow";

export default function MorningBriefPage() {
  const { settings } = useSettings();
  const pipeline = usePipeline();
  const tasks = useTasks();
  const appointments = useAppointments();
  const waitingItems = useWaitingItems();
  const campaigns = useCampaigns();
  const projects = useProjects();
  const ideas = useIdeas();
  const revenueGoals = useRevenueGoals();
  const revenueEntries = useRevenueEntries();

  const ranked = React.useMemo(
    () =>
      buildWorkItems({
        pipeline: pipeline.data,
        appointments: appointments.data,
        tasks: tasks.data,
        waitingItems: waitingItems.data,
        campaigns: campaigns.data,
        projects: projects.data,
        ideas: ideas.data,
      }),
    [pipeline.data, appointments.data, tasks.data, waitingItems.data, campaigns.data, projects.data, ideas.data],
  );

  const oneThing = getTodaysOneThing(ranked, settings?.pinned_one_thing_work_item_id);
  const topThree = getTopThree(ranked);
  const overdue = ranked.filter((i) => i.overdue);
  const urgentFollowUps = ranked.filter((i) => i.tier === 1).slice(0, 6);
  const todaysAppointments = appointments.data.filter(
    (a) => a.status === "scheduled" && isToday(new Date(a.scheduled_at)),
  );
  const waitingOnShane = waitingItems.data.filter((w) => w.status === "waiting" && w.waiting_on === "Shane");
  const goal = currentMonthGoal(revenueGoals.data, settings?.monthly_revenue_goal ?? 0);
  const earned = currentMonthRevenue(revenueEntries.data);
  const remaining = Math.max(0, goal - earned);
  const campaignProgress = campaigns.data.filter((c) => c.status !== "done");

  return (
    <div>
      <PageHeader
        title="Morning Brief"
        description={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      />

      <div className="flex flex-col gap-6">
        <Card className="border-primary/20 bg-primary text-primary-foreground">
          <CardContent className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Revenue Remaining This Month</p>
            <p className="text-2xl font-semibold">${remaining.toLocaleString()}</p>
          </CardContent>
        </Card>

        <BriefSection title="Today's One Thing">
          {oneThing ? <WorkItemRow item={oneThing} /> : <EmptyState title="Nothing pinned yet." />}
        </BriefSection>

        <BriefSection title="Top Three">
          {topThree.length ? (
            <div className="flex flex-col gap-2">
              {topThree.map((i) => (
                <WorkItemRow key={i.id} item={i} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing on the board." />
          )}
        </BriefSection>

        <BriefSection title={`Today's Appointments (${todaysAppointments.length})`}>
          {todaysAppointments.length ? (
            <div className="flex flex-col gap-2">
              {todaysAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
                  <span>{a.title}</span>
                  <span className="text-muted-foreground">
                    {new Date(a.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No appointments today." />
          )}
        </BriefSection>

        <BriefSection title="Urgent Follow-ups">
          {urgentFollowUps.length ? (
            <div className="flex flex-col gap-2">
              {urgentFollowUps.map((i) => (
                <WorkItemRow key={i.id} item={i} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing urgent." />
          )}
        </BriefSection>

        <BriefSection title={`Overdue (${overdue.length})`}>
          {overdue.length ? (
            <div className="flex flex-col gap-2">
              {overdue.map((i) => (
                <WorkItemRow key={i.id} item={i} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing overdue. Clean board." />
          )}
        </BriefSection>

        <BriefSection title={`Waiting on Shane (${waitingOnShane.length})`}>
          {waitingOnShane.length ? (
            <div className="flex flex-col gap-2">
              {waitingOnShane.map((w) => (
                <div key={w.id} className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
                  {w.title}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing waiting on you." />
          )}
        </BriefSection>

        <BriefSection title={`Campaign Progress (${campaignProgress.length} open)`}>
          {campaignProgress.length ? (
            <div className="flex flex-col gap-2">
              {campaignProgress.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
                  <span>{c.title}</span>
                  <span className="capitalize text-muted-foreground">{c.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing pending on campaigns." />
          )}
        </BriefSection>
      </div>
    </div>
  );
}

function BriefSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
