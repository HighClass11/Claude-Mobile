import * as React from "react";
import { ChevronDown, ChevronUp, MoreVertical, Plus, X } from "lucide-react";

import { useAppointments } from "@/hooks/entities";
import type { Appointment, PrepChecklistItem } from "@/types/domain";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AppointmentDialog,
  type AppointmentFormValues,
} from "@/components/appointments/AppointmentDialog";

export default function AppointmentsPage() {
  const { data, insert, update, remove } = useAppointments();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Appointment | null>(null);

  const upcoming = data
    .filter((a) => a.status === "scheduled")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = data
    .filter((a) => a.status !== "scheduled")
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(appt: Appointment) {
    setEditing(appt);
    setDialogOpen(true);
  }

  async function handleSubmit(values: AppointmentFormValues) {
    const payload = {
      title: values.title,
      type: values.type,
      scheduled_at: new Date(values.scheduled_at).toISOString(),
      duration_minutes: Number(values.duration_minutes) || 30,
    };
    if (editing) await update(editing.id, payload);
    else await insert({ ...payload, prep_checklist: [] });
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Discovery, Recommendation, FPR, Annual Review, and Client Service meetings."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New Appointment
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</h2>
          {upcoming.length ? (
            <div className="flex flex-col gap-3">
              {upcoming.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onEdit={() => openEdit(appt)}
                  onDelete={() => remove(appt.id)}
                  onUpdate={(patch) => update(appt.id, patch)}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing scheduled." />
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Past</h2>
            <div className="flex flex-col gap-3">
              {past.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onEdit={() => openEdit(appt)}
                  onDelete={() => remove(appt.id)}
                  onUpdate={(patch) => update(appt.id, patch)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} onSubmit={handleSubmit} />
    </div>
  );
}

function AppointmentCard({
  appt,
  onEdit,
  onDelete,
  onUpdate,
}: {
  appt: Appointment;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<Appointment>) => Promise<void>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [newItem, setNewItem] = React.useState("");
  const [notes, setNotes] = React.useState(appt.meeting_notes ?? "");
  const [outcome, setOutcome] = React.useState(appt.outcome ?? "");
  const [nextAction, setNextAction] = React.useState(appt.next_action ?? "");

  const checklist: PrepChecklistItem[] = appt.prep_checklist ?? [];

  function toggleItem(index: number) {
    const next = checklist.map((item, i) => (i === index ? { ...item, done: !item.done } : item));
    onUpdate({ prep_checklist: next });
  }

  function addItem() {
    if (!newItem.trim()) return;
    onUpdate({ prep_checklist: [...checklist, { label: newItem.trim(), done: false }] });
    setNewItem("");
  }

  function removeItem(index: number) {
    onUpdate({ prep_checklist: checklist.filter((_, i) => i !== index) });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button className="flex-1 text-left" onClick={() => setExpanded((e) => !e)}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{appt.title}</p>
            <Badge variant="outline">{appt.type}</Badge>
            {appt.status !== "scheduled" && <Badge variant="secondary">{appt.status}</Badge>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(appt.scheduled_at).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · {appt.duration_minutes} min
          </p>
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
              {appt.status === "scheduled" && (
                <DropdownMenuItem onSelect={() => onUpdate({ status: "completed" })}>Mark completed</DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preparation checklist</p>
            <div className="flex flex-col gap-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox checked={item.done} onCheckedChange={() => toggleItem(i)} />
                  <span className={item.done ? "flex-1 text-sm line-through text-muted-foreground" : "flex-1 text-sm"}>
                    {item.label}
                  </span>
                  <button onClick={() => removeItem(i)} aria-label="Remove item">
                    <X className="size-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add checklist item…"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
                />
                <Button type="button" variant="outline" onClick={addItem}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meeting notes</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => onUpdate({ meeting_notes: notes })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome</label>
              <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} onBlur={() => onUpdate({ outcome })} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next action</label>
            <Input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              onBlur={() => onUpdate({ next_action: nextAction })}
              placeholder="What happens after this meeting?"
            />
          </div>
        </div>
      )}
    </div>
  );
}
