import * as React from "react";
import { Plus } from "lucide-react";

import { useCampaigns } from "@/hooks/entities";
import type { Campaign, CampaignAction } from "@/types/domain";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ACTIONS: CampaignAction[] = ["approve", "film", "record", "teach", "review", "plan"];

export default function CampaignsPage() {
  const { data, insert, update } = useCampaigns();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [action, setAction] = React.useState<CampaignAction>("approve");
  const [dueDate, setDueDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const active = data.filter((c) => c.status !== "done").sort((a, b) => {
    const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    return ad - bd;
  });
  const done = data.filter((c) => c.status === "done");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await insert({ title, action, due_date: dueDate || null, notes: notes || null, status: "pending" });
      setTitle("");
      setNotes("");
      setDueDate("");
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function cycleStatus(c: Campaign) {
    const next = c.status === "pending" ? "in_progress" : c.status === "in_progress" ? "done" : "pending";
    update(c.id, { status: next });
  }

  return (
    <div>
      <PageHeader
        title="Campaign Responsibilities"
        description="Only Shane's approvals and recordings — not Jori's production work."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> New Item
          </Button>
        }
      />

      {active.length === 0 ? (
        <EmptyState title="Nothing needs your approval right now." />
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((c) => (
            <CampaignRow key={c.id} campaign={c} onCycleStatus={() => cycleStatus(c)} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Done</h2>
          <div className="flex flex-col gap-2">
            {done.map((c) => (
              <CampaignRow key={c.id} campaign={c} onCycleStatus={() => cycleStatus(c)} />
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Campaign Responsibility</DialogTitle>
            <DialogDescription>e.g. Approve YouTube, Film Reel, Teach Masterclass.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-title">Title</Label>
              <Input id="campaign-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Action</Label>
                <Select value={action} onValueChange={(v) => setAction(v as CampaignAction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a[0].toUpperCase() + a.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="campaign-due">Due date</Label>
                <Input id="campaign-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign-notes">Notes</Label>
              <Textarea id="campaign-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CampaignRow({ campaign, onCycleStatus }: { campaign: Campaign; onCycleStatus: () => void }) {
  return (
    <button
      onClick={onCycleStatus}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-secondary/60"
    >
      <div className="min-w-0">
        <p className={campaign.status === "done" ? "text-sm font-medium line-through text-muted-foreground" : "text-sm font-medium"}>
          {campaign.title}
        </p>
        <p className="text-xs capitalize text-muted-foreground">
          {campaign.action}
          {campaign.due_date &&
            ` · Due ${new Date(campaign.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
        </p>
      </div>
      <Badge variant={campaign.status === "done" ? "secondary" : campaign.status === "in_progress" ? "accent" : "outline"}>
        {campaign.status.replace("_", " ")}
      </Badge>
    </button>
  );
}
