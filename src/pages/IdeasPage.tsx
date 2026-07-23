import * as React from "react";
import { Archive, ArrowUpRight, Check, Lightbulb, MoreVertical } from "lucide-react";

import { useIdeas } from "@/hooks/entities";
import type { Idea } from "@/types/domain";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function IdeasPage() {
  const { data, insert, update } = useIdeas();
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const fresh = data.filter((i) => i.status === "new");
  const reviewed = data.filter((i) => i.status !== "new");

  async function capture(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await insert({ content: draft.trim(), category: null, status: "new" });
      setDraft("");
    } finally {
      setSaving(false);
    }
  }

  function mark(idea: Idea, status: Idea["status"]) {
    update(idea.id, { status, reviewed_at: new Date().toISOString() });
  }

  return (
    <div>
      <PageHeader title="Ideas Parking Lot" description="Quick capture. Never interrupts today's work — review weekly." />

      <form onSubmit={capture} className="mb-6 flex flex-col gap-2 sm:flex-row">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Capture an idea before it slips away…"
          className="min-h-12 flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              capture(e);
            }
          }}
        />
        <Button type="submit" disabled={saving} className="sm:self-start">
          Capture
        </Button>
      </form>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Lightbulb className="size-4" /> To review ({fresh.length})
        </h2>
        {fresh.length ? (
          <div className="flex flex-col gap-2">
            {fresh.map((idea) => (
              <div key={idea.id} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3">
                <p className="text-sm">{idea.content}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Actions">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => mark(idea, "reviewed")}>
                      <Check className="size-4" /> Mark reviewed
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => mark(idea, "promoted")}>
                      <ArrowUpRight className="size-4" /> Promote to project/task
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => mark(idea, "archived")}>
                      <Archive className="size-4" /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Parking lot is empty." description="Ideas you capture will wait here until your weekly review." />
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Reviewed</h2>
          <div className="flex flex-col gap-2">
            {reviewed.map((idea) => (
              <div key={idea.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-sm text-muted-foreground">{idea.content}</p>
                <Badge variant="secondary">{idea.status}</Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
