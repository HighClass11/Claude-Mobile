import * as React from "react";
import { Plus } from "lucide-react";

import { useWaitingItems } from "@/hooks/entities";
import type { WaitingItem, WaitingOnParty } from "@/types/domain";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PARTIES: WaitingOnParty[] = ["Shane", "Jori", "Client", "Carrier", "Marketing", "Operations", "DM"];

export default function WaitingOnPage() {
  const { data, insert, update } = useWaitingItems();
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [party, setParty] = React.useState<WaitingOnParty>("Shane");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const visible = showCompleted ? data : data.filter((i) => i.status === "waiting");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await insert({ title, waiting_on: party, notes: notes || null, related_type: null, related_id: null });
      setTitle("");
      setNotes("");
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function toggleDone(item: WaitingItem) {
    update(item.id, {
      status: item.status === "waiting" ? "done" : "waiting",
      resolved_at: item.status === "waiting" ? new Date().toISOString() : null,
    });
  }

  return (
    <div>
      <PageHeader
        title="Waiting On"
        description="Nothing disappears until it's actually done."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> New Item
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <Switch id="show-completed" checked={showCompleted} onCheckedChange={setShowCompleted} />
        <Label htmlFor="show-completed" className="text-sm text-muted-foreground">
          Show completed
        </Label>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Nothing waiting on anyone." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PARTIES.map((p) => {
            const items = visible.filter((i) => i.waiting_on === p);
            if (items.length === 0) return null;
            return (
              <div key={p} className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">
                  {p} <span className="text-muted-foreground">({items.length})</span>
                </h2>
                <div className="flex flex-col gap-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 rounded-md bg-secondary/50 p-2.5">
                      <Checkbox checked={item.status === "done"} onCheckedChange={() => toggleDone(item)} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className={item.status === "done" ? "text-sm line-through text-muted-foreground" : "text-sm"}>
                          {item.title}
                        </p>
                        {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Waiting Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="waiting-title">What are you waiting on?</Label>
              <Input id="waiting-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Waiting on</Label>
              <Select value={party} onValueChange={(v) => setParty(v as WaitingOnParty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="waiting-notes">Notes</Label>
              <Textarea id="waiting-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Add to board"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
