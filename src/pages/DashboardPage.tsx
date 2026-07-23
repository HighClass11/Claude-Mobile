import * as React from "react";
import { useNavigate } from "react-router-dom";
import { isToday } from "date-fns";
import { Pin, PinOff, Calendar, Hourglass, Briefcase, Megaphone, RotateCcw } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
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
import { buildWorkItems, getDoThisNext, getTodaysOneThing, getTopThree, tierLabel } from "@/lib/priority";
import { currentMonthGoal, currentMonthRevenue, estimatedCasesNeeded, countByStage, conversionRate } from "@/lib/revenue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WorkItemRow } from "@/components/shared/WorkItemRow";
import { EmptyState } from "@/components/shared/EmptyState";

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const pipeline = usePipeline();
  const tasks = useTasks();
  const appointments = useAppointments();
  const waitingItems = useWaitingItems();
  const campaigns = useCampaigns();
  const projects = useProjects();
  const ideas = useIdeas();
  const revenueGoals = useRevenueGoals();
  const revenueEntries = useRevenueEntries();
  const navigate = useNavigate();

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
  const doNext = getDoThisNext(ranked, oneThing?.id);
  const topThree = getTopThree(ranked);

  const todaysAppointments = appointments.data
    .filter((a) => a.status === "scheduled" && isToday(new Date(a.scheduled_at)))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const revenueNowItems = ranked.filter((i) => i.tier === 1 && i.kind !== "appointment");

  const waitingOnShane = waitingItems.data.filter((w) => w.status === "waiting" && w.waiting_on === "Shane");

  const activeProjects = projects.data.filter((p) => p.status !== "done");
  const shaneCampaigns = campaigns.data.filter((c) => c.status !== "done");

  const resumable = [...tasks.data, ...projects.data]
    .filter((r) => r.resume_next_step && r.resume_next_step.trim().length > 0)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  const goal = currentMonthGoal(revenueGoals.data, settings?.monthly_revenue_goal ?? 0);
  const earned = currentMonthRevenue(revenueEntries.data);
  const remaining = Math.max(0, goal - earned);
  const casesNeeded = estimatedCasesNeeded(remaining, settings?.avg_case_value ?? 0);
  const applications = countByStage(pipeline.data, ["Application", "Underwriting"]);
  const policies = countByStage(pipeline.data, ["Policy Delivered"]);
  const conversion = conversionRate(pipeline.data);

  const isPinned = !!oneThing && settings?.pinned_one_thing_work_item_id === oneThing.id;

  async function togglePin() {
    if (!oneThing) return;
    await updateSettings({
      pinned_one_thing_work_item_id: isPinned ? null : oneThing.id,
    });
  }

  const displayName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Shane";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {greeting}, {displayName}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </h1>
      </div>

      {/* 1. Today's One Thing */}
      <Card className="border-primary/20 bg-primary text-primary-foreground">
        <CardHeader className="items-start">
          <div>
            <CardTitle className="text-primary-foreground/80 text-xs uppercase tracking-wide">
              Today's One Thing
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10"
            onClick={togglePin}
            aria-label={isPinned ? "Unpin" : "Pin as One Thing"}
          >
            {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {oneThing ? (
            <div className="flex flex-col gap-3">
              <p className="text-xl font-semibold">{oneThing.title}</p>
              <p className="text-sm text-primary-foreground/80">→ {oneThing.nextAction}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{oneThing.categoryLabel}</Badge>
                {isPinned && <Badge className="bg-white/20 text-primary-foreground">Pinned by Shane</Badge>}
              </div>
              <Button variant="accent" className="mt-1 w-fit" onClick={() => navigate(oneThing.route)}>
                Go do it
              </Button>
            </div>
          ) : (
            <p className="text-sm text-primary-foreground/80">
              Nothing urgent right now — check Revenue Pipeline for the next best move.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2. Do This Next */}
      <Card>
        <CardHeader>
          <CardTitle>Do This Next</CardTitle>
        </CardHeader>
        <CardContent>{doNext ? <WorkItemRow item={doNext} /> : <EmptyState title="Nothing queued up." />}</CardContent>
      </Card>

      {/* 3. Revenue Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Progress</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/revenue")}>
            Revenue Command Center
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold">${earned.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">of ${goal.toLocaleString()} goal</span>
          </div>
          <Progress value={goal > 0 ? Math.min(100, (earned / goal) * 100) : 0} />
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="Remaining" value={`$${remaining.toLocaleString()}`} />
            <Stat label="Cases Needed" value={String(casesNeeded)} />
            <Stat label="Applications" value={String(applications)} />
            <Stat label="Policies" value={String(policies)} />
          </div>
          <p className="text-xs text-muted-foreground">Conversion rate this month: {conversion}%</p>
        </CardContent>
      </Card>

      {/* 4. Top Three Priorities */}
      <Section title="Top Three Priorities">
        {topThree.length ? (
          <div className="flex flex-col gap-2">
            {topThree.map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing on the board yet." />
        )}
      </Section>

      {/* 5. Today's Appointments */}
      <Section title="Today's Appointments" icon={Calendar} onSeeAll={() => navigate("/appointments")}>
        {todaysAppointments.length ? (
          <div className="flex flex-col gap-2">
            {todaysAppointments.map((appt) => (
              <button
                key={appt.id}
                onClick={() => navigate("/appointments")}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-secondary/60"
              >
                <div>
                  <p className="text-sm font-medium">{appt.title}</p>
                  <p className="text-xs text-muted-foreground">{appt.type}</p>
                </div>
                <span className="text-sm font-medium">
                  {new Date(appt.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="No appointments today." />
        )}
      </Section>

      {/* 6. Revenue Tasks Waiting */}
      <Section title="Revenue Tasks Waiting" onSeeAll={() => navigate("/pipeline")}>
        {revenueNowItems.length ? (
          <div className="flex flex-col gap-2">
            {revenueNowItems.slice(0, 6).map((item) => (
              <WorkItemRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState title="No revenue tasks waiting." description="Nice work staying ahead of the pipeline." />
        )}
      </Section>

      {/* 7. Resume Where I Stopped */}
      <Section title="Resume Where I Stopped" icon={RotateCcw}>
        {resumable ? (
          <Card className="bg-secondary/40">
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm font-medium">{resumable.title}</p>
              {resumable.resume_completed && (
                <p className="text-xs text-muted-foreground">Completed: {resumable.resume_completed}</p>
              )}
              {resumable.resume_current_step && (
                <p className="text-xs text-muted-foreground">Current step: {resumable.resume_current_step}</p>
              )}
              <p className="text-sm font-medium text-primary">Next: {resumable.resume_next_step}</p>
              {resumable.resume_waiting_on && (
                <p className="text-xs text-muted-foreground">Waiting on: {resumable.resume_waiting_on}</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="Nothing paused." description="Anything you leave mid-flight will show up here." />
        )}
      </Section>

      {/* 8. Waiting on Shane */}
      <Section title="Waiting on Shane" icon={Hourglass} onSeeAll={() => navigate("/waiting-on")}>
        {waitingOnShane.length ? (
          <div className="flex flex-col gap-2">
            {waitingOnShane.slice(0, 5).map((w) => (
              <div key={w.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                {w.title}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing waiting on you." />
        )}
      </Section>

      {/* 9. Current CEO Projects */}
      <Section title="Current CEO Projects" icon={Briefcase} onSeeAll={() => navigate("/projects")}>
        {activeProjects.length ? (
          <div className="flex flex-col gap-2">
            {activeProjects.slice(0, 5).map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.category} · {p.next_step || "No next step set"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No active CEO projects." />
        )}
      </Section>

      {/* 10. Campaign Responsibilities */}
      <Section title="Campaign Responsibilities" icon={Megaphone} onSeeAll={() => navigate("/campaigns")}>
        {shaneCampaigns.length ? (
          <div className="flex flex-col gap-2">
            {shaneCampaigns.slice(0, 5).map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs capitalize text-muted-foreground">{c.action}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing needs your approval right now." />
        )}
      </Section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        {tierLabel(1)} → {tierLabel(2)} → {tierLabel(3)} → {tierLabel(4)}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  onSeeAll,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {Icon && <Icon className="size-4" />}
          {title}
        </h2>
        {onSeeAll && (
          <Button variant="link" size="sm" onClick={onSeeAll} className="h-auto p-0 text-xs">
            See all
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}
