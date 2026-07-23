import * as React from "react";

import { PIPELINE_STAGES, type PipelineRecord } from "@/types/domain";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PipelineFormValues {
  name: string;
  stage: PipelineRecord["stage"];
  lead_source: string;
  phone: string;
  email: string;
  next_action: string;
  due_date: string;
  expected_revenue: string;
  owner: string;
  notes: string;
}

const emptyForm: PipelineFormValues = {
  name: "",
  stage: "New Lead",
  lead_source: "",
  phone: "",
  email: "",
  next_action: "",
  due_date: "",
  expected_revenue: "",
  owner: "Shane",
  notes: "",
};

export function PipelineRecordDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PipelineRecord | null;
  onSubmit: (values: PipelineFormValues) => Promise<void>;
}) {
  const [values, setValues] = React.useState<PipelineFormValues>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setValues(
        initial
          ? {
              name: initial.name,
              stage: initial.stage,
              lead_source: initial.lead_source ?? "",
              phone: initial.phone ?? "",
              email: initial.email ?? "",
              next_action: initial.next_action ?? "",
              due_date: initial.due_date ?? "",
              expected_revenue: initial.expected_revenue?.toString() ?? "",
              owner: initial.owner,
              notes: initial.notes ?? "",
            }
          : emptyForm,
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
          <DialogTitle>{initial ? "Edit Record" : "New Pipeline Record"}</DialogTitle>
          <DialogDescription>Every record needs a next action — it's how ShaneOS knows what to surface.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Stage</Label>
              <Select value={values.stage} onValueChange={(stage) => setValues((v) => ({ ...v, stage: stage as PipelineRecord["stage"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead_source">Lead Source</Label>
              <Input
                id="lead_source"
                value={values.lead_source}
                onChange={(e) => setValues((v) => ({ ...v, lead_source: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="next_action">Next Action</Label>
            <Input
              id="next_action"
              placeholder="e.g. Submit application to carrier"
              value={values.next_action}
              onChange={(e) => setValues((v) => ({ ...v, next_action: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={values.due_date}
                onChange={(e) => setValues((v) => ({ ...v, due_date: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expected_revenue">Expected Revenue</Label>
              <Input
                id="expected_revenue"
                type="number"
                min="0"
                value={values.expected_revenue}
                onChange={(e) => setValues((v) => ({ ...v, expected_revenue: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="owner">Owner</Label>
            <Input id="owner" value={values.owner} onChange={(e) => setValues((v) => ({ ...v, owner: e.target.value }))} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={values.notes} onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Create record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
