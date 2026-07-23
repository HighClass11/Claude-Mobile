import * as React from "react";
import { Plus } from "lucide-react";

import { useAppointments, usePipeline, useRevenueEntries, useRevenueGoals } from "@/hooks/entities";
import { useSettings } from "@/hooks/useSettings";
import {
  conversionRate,
  countByStage,
  currentMonthGoal,
  currentMonthRevenue,
  estimatedCasesNeeded,
  monthToDateAppointments,
} from "@/lib/revenue";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RevenuePage() {
  const { settings, update: updateSettings } = useSettings();
  const revenueGoals = useRevenueGoals();
  const revenueEntries = useRevenueEntries();
  const pipeline = usePipeline();
  const appointments = useAppointments();

  const [goalDialogOpen, setGoalDialogOpen] = React.useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = React.useState(false);
  const [goalInput, setGoalInput] = React.useState("");
  const [avgCaseInput, setAvgCaseInput] = React.useState("");
  const [entryAmount, setEntryAmount] = React.useState("");
  const [entryDescription, setEntryDescription] = React.useState("");

  const goal = currentMonthGoal(revenueGoals.data, settings?.monthly_revenue_goal ?? 0);
  const earned = currentMonthRevenue(revenueEntries.data);
  const remaining = Math.max(0, goal - earned);
  const casesNeeded = estimatedCasesNeeded(remaining, settings?.avg_case_value ?? 0);

  const applications = countByStage(pipeline.data, ["Application"]);
  const policies = countByStage(pipeline.data, ["Policy Delivered"]);
  const monthAppointments = monthToDateAppointments(appointments.data);
  const fprs = monthAppointments.filter((a) => a.type === "FPR").length;
  const recommendationMeetings = monthAppointments.filter((a) => a.type === "Recommendation").length;
  const conversion = conversionRate(pipeline.data);

  async function saveGoal(e: React.FormEvent) {
    e.preventDefault();
    const month = new Date();
    month.setDate(1);
    await revenueGoals.insert({
      month: month.toISOString().slice(0, 10),
      monthly_goal: Number(goalInput) || 0,
    });
    await updateSettings({ avg_case_value: Number(avgCaseInput) || 0 });
    setGoalDialogOpen(false);
  }

  async function saveEntry(e: React.FormEvent) {
    e.preventDefault();
    await revenueEntries.insert({
      amount: Number(entryAmount) || 0,
      description: entryDescription || null,
      recorded_at: new Date().toISOString().slice(0, 10),
      pipeline_record_id: null,
    });
    setEntryAmount("");
    setEntryDescription("");
    setEntryDialogOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Revenue Command Center"
        description="Everything that determines whether this month hits goal."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setGoalInput(String(goal));
                setAvgCaseInput(String(settings?.avg_case_value ?? ""));
                setGoalDialogOpen(true);
              }}
            >
              Set Goal
            </Button>
            <Button onClick={() => setEntryDialogOpen(true)}>
              <Plus className="size-4" /> Log Revenue
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-semibold">${earned.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">of ${goal.toLocaleString()} monthly goal</span>
          </div>
          <Progress value={goal > 0 ? Math.min(100, (earned / goal) * 100) : 0} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Revenue Remaining" value={`$${remaining.toLocaleString()}`} />
        <MetricCard label="Est. Cases Needed" value={String(casesNeeded)} />
        <MetricCard label="Applications" value={String(applications)} />
        <MetricCard label="Policies" value={String(policies)} />
        <MetricCard label="FPRs" value={String(fprs)} />
        <MetricCard label="Recommendation Meetings" value={String(recommendationMeetings)} />
        <MetricCard label="Appointments (MTD)" value={String(monthAppointments.length)} />
        <MetricCard label="Conversion Rate" value={`${conversion}%`} />
      </div>

      {revenueEntries.data.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent Revenue</h2>
          <div className="flex flex-col gap-2">
            {revenueEntries.data.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
                <span>{e.description || "Revenue entry"}</span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  {new Date(e.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  <span className="font-medium text-foreground">${Number(e.amount).toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Monthly Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveGoal} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal">This month's revenue goal</Label>
              <Input id="goal" type="number" min="0" value={goalInput} onChange={(e) => setGoalInput(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="avgcase">Average case value</Label>
              <Input id="avgcase" type="number" min="0" value={avgCaseInput} onChange={(e) => setAvgCaseInput(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Revenue</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEntry} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" min="0" required value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit">Log</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-1 p-4">
      <CardHeader className="p-0">
        <CardTitle className="text-xs font-normal uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 text-xl font-semibold">{value}</CardContent>
    </Card>
  );
}
