import * as React from "react";

import { useDailyScorecards } from "@/hooks/entities";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const today = () => new Date().toISOString().slice(0, 10);

const NUMERIC_FIELDS = [
  ["revenue", "Revenue"],
  ["calls", "Calls"],
  ["texts", "Texts"],
  ["dms", "DMs"],
  ["appointments", "Appointments"],
  ["applications", "Applications"],
  ["policies", "Policies"],
  ["content_created", "Content Created"],
] as const;

export default function ScorecardPage() {
  const { data, insert, update } = useDailyScorecards();
  const todays = data.find((s) => s.date === today());

  const [values, setValues] = React.useState({
    revenue: todays?.revenue ?? 0,
    calls: todays?.calls ?? 0,
    texts: todays?.texts ?? 0,
    dms: todays?.dms ?? 0,
    appointments: todays?.appointments ?? 0,
    applications: todays?.applications ?? 0,
    policies: todays?.policies ?? 0,
    content_created: todays?.content_created ?? 0,
    biggest_win: todays?.biggest_win ?? "",
    biggest_obstacle: todays?.biggest_obstacle ?? "",
    where_i_stopped: todays?.where_i_stopped ?? "",
    tomorrows_one_thing: todays?.tomorrows_one_thing ?? "",
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (todays) {
      setValues({
        revenue: todays.revenue,
        calls: todays.calls,
        texts: todays.texts,
        dms: todays.dms,
        appointments: todays.appointments,
        applications: todays.applications,
        policies: todays.policies,
        content_created: todays.content_created,
        biggest_win: todays.biggest_win ?? "",
        biggest_obstacle: todays.biggest_obstacle ?? "",
        where_i_stopped: todays.where_i_stopped ?? "",
        tomorrows_one_thing: todays.tomorrows_one_thing ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todays?.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (todays) await update(todays.id, values);
      else await insert({ date: today(), ...values });
    } finally {
      setSaving(false);
    }
  }

  const history = data.filter((s) => s.date !== today()).slice(0, 14);

  return (
    <div>
      <PageHeader title="Daily CEO Scorecard" description="Completed nightly. Ten minutes, every honest number." />

      <Card className="mb-8">
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {NUMERIC_FIELDS.map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label htmlFor={key} className="text-xs text-muted-foreground">
                    {label}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    min="0"
                    value={values[key]}
                    onChange={(e) => setValues((v) => ({ ...v, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biggest_win">Biggest Win</Label>
              <Textarea
                id="biggest_win"
                value={values.biggest_win}
                onChange={(e) => setValues((v) => ({ ...v, biggest_win: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biggest_obstacle">Biggest Obstacle</Label>
              <Textarea
                id="biggest_obstacle"
                value={values.biggest_obstacle}
                onChange={(e) => setValues((v) => ({ ...v, biggest_obstacle: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="where_i_stopped">Where I Stopped</Label>
              <Textarea
                id="where_i_stopped"
                value={values.where_i_stopped}
                onChange={(e) => setValues((v) => ({ ...v, where_i_stopped: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tomorrows_one_thing">Tomorrow's One Thing</Label>
              <Textarea
                id="tomorrows_one_thing"
                value={values.tomorrows_one_thing}
                onChange={(e) => setValues((v) => ({ ...v, tomorrows_one_thing: e.target.value }))}
              />
            </div>

            <Button type="submit" size="lg" disabled={saving} className="w-fit">
              {saving ? "Saving…" : "Save Today's Scorecard"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
          <div className="flex flex-col gap-2">
            {history.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="text-muted-foreground">${Number(s.revenue).toLocaleString()} revenue</span>
                </div>
                {s.biggest_win && <p className="mt-1 text-xs text-muted-foreground">Win: {s.biggest_win}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
