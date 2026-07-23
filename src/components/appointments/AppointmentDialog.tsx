import * as React from "react";

import type { Appointment, AppointmentType } from "@/types/domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const APPOINTMENT_TYPES: AppointmentType[] = ["Discovery", "Recommendation", "FPR", "Annual Review", "Client Service"];

export interface AppointmentFormValues {
  title: string;
  type: AppointmentType;
  scheduled_at: string;
  duration_minutes: string;
}

function toLocalDatetimeInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm: AppointmentFormValues = {
  title: "",
  type: "Discovery",
  scheduled_at: "",
  duration_minutes: "30",
};

export function AppointmentDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Appointment | null;
  onSubmit: (values: AppointmentFormValues) => Promise<void>;
}) {
  const [values, setValues] = React.useState<AppointmentFormValues>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setValues(
        initial
          ? {
              title: initial.title,
              type: initial.type,
              scheduled_at: toLocalDatetimeInput(initial.scheduled_at),
              duration_minutes: String(initial.duration_minutes),
            }
          : { ...emptyForm, scheduled_at: toLocalDatetimeInput(new Date().toISOString()) },
      );
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Appointment" : "New Appointment"}</DialogTitle>
          <DialogDescription>Discovery, Recommendation, FPR, Annual Review, or Client Service.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              placeholder="e.g. Marcus Webb — Recommendation Meeting"
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={values.type} onValueChange={(type) => setValues((v) => ({ ...v, type: type as AppointmentType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="duration">Duration (min)</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                value={values.duration_minutes}
                onChange={(e) => setValues((v) => ({ ...v, duration_minutes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scheduled_at">Date &amp; time</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              required
              value={values.scheduled_at}
              onChange={(e) => setValues((v) => ({ ...v, scheduled_at: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
