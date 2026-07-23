import * as React from "react";

import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import type { NotificationPrefs } from "@/types/domain";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const NOTIFICATION_LABELS: Record<keyof NotificationPrefs, string> = {
  appointment_starting_soon: "Appointment starting soon",
  application_overdue: "Application overdue",
  revenue_task_overdue: "Revenue task overdue",
  client_waiting: "Client waiting",
  recommendation_needed: "Recommendation needed",
};

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const { settings, update } = useSettings();
  const [goal, setGoal] = React.useState("");
  const [avgCase, setAvgCase] = React.useState("");

  React.useEffect(() => {
    if (settings) {
      setGoal(String(settings.monthly_revenue_goal));
      setAvgCase(String(settings.avg_case_value));
    }
  }, [settings?.owner_user_id]);

  function toggleNotification(key: keyof NotificationPrefs) {
    if (!settings) return;
    update({
      notification_prefs: { ...settings.notification_prefs, [key]: !settings.notification_prefs[key] },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" />

      <Card>
        <CardHeader className="flex-col items-start">
          <CardTitle>Account</CardTitle>
          <CardDescription>{profile?.full_name || user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col items-start">
          <CardTitle>Default Revenue Targets</CardTitle>
          <CardDescription>Used whenever a specific month hasn't set its own goal.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="default-goal">Default monthly goal</Label>
            <Input
              id="default-goal"
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onBlur={() => update({ monthly_revenue_goal: Number(goal) || 0 })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="default-avgcase">Average case value</Label>
            <Input
              id="default-avgcase"
              type="number"
              value={avgCase}
              onChange={(e) => setAvgCase(e.target.value)}
              onBlur={() => update({ avg_case_value: Number(avgCase) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-col items-start">
          <CardTitle>Notifications</CardTitle>
          <CardDescription>ShaneOS only interrupts you for these — nothing else.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {settings &&
            (Object.keys(NOTIFICATION_LABELS) as (keyof NotificationPrefs)[]).map((key) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="text-sm font-normal">
                  {NOTIFICATION_LABELS[key]}
                </Label>
                <Switch id={key} checked={settings.notification_prefs[key]} onCheckedChange={() => toggleNotification(key)} />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
