import * as React from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

import { useProjects } from "@/hooks/entities";
import type { Project, ProjectCategory, ProjectStatus } from "@/types/domain";
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
} from "@/components/ui/dialog";

const CATEGORIES: ProjectCategory[] = [
  "Licensing",
  "Technology",
  "Partnerships",
  "Business Development",
  "Systems",
  "Hiring",
  "Finance",
];

const STATUSES: ProjectStatus[] = ["not_started", "in_progress", "waiting", "done"];

export default function ProjectsPage() {
  const { data, insert, update } = useProjects();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<ProjectCategory>("Systems");
  const [nextStep, setNextStep] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await insert({ title, category, next_step: nextStep || null, status: "not_started" });
      setTitle("");
      setNextStep("");
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="CEO Projects"
        description="Separate from daily tasks — licensing, partnerships, hiring, systems, finance."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> New Project
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState title="No CEO projects yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((cat) => {
            const items = data.filter((p) => p.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">{cat}</h2>
                <div className="flex flex-col gap-3">
                  {items.map((p) => (
                    <ProjectRow key={p.id} project={p} onUpdate={(patch) => update(p.id, patch)} />
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
            <DialogTitle>New CEO Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-title">Title</Label>
              <Input id="project-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ProjectCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-next">Next step</Label>
              <Input id="project-next" value={nextStep} onChange={(e) => setNextStep(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectRow({ project, onUpdate }: { project: Project; onUpdate: (patch: Partial<Project>) => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const [nextStep, setNextStep] = React.useState(project.next_step ?? "");
  const [resumeCompleted, setResumeCompleted] = React.useState(project.resume_completed ?? "");
  const [resumeCurrent, setResumeCurrent] = React.useState(project.resume_current_step ?? "");
  const [resumeNext, setResumeNext] = React.useState(project.resume_next_step ?? "");
  const [resumeWaitingOn, setResumeWaitingOn] = React.useState(project.resume_waiting_on ?? "");
  const [resumeDate, setResumeDate] = React.useState(project.resume_date ?? "");

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <button className="flex w-full items-start justify-between gap-2 text-left" onClick={() => setExpanded((e) => !e)}>
        <div>
          <p className="text-sm font-medium">{project.title}</p>
          <p className="text-xs text-muted-foreground">{project.next_step || "No next step set"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.status === "done" ? "secondary" : project.status === "in_progress" ? "accent" : "outline"}>
            {project.status.replace("_", " ")}
          </Badge>
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={project.status} onValueChange={(v) => onUpdate({ status: v as ProjectStatus })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Next step</Label>
            <Input value={nextStep} onChange={(e) => setNextStep(e.target.value)} onBlur={() => onUpdate({ next_step: nextStep })} />
          </div>

          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resume state — saved for next time you pick this up
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Completed</Label>
              <Textarea
                value={resumeCompleted}
                onChange={(e) => setResumeCompleted(e.target.value)}
                onBlur={() => onUpdate({ resume_completed: resumeCompleted })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Current step</Label>
              <Textarea
                value={resumeCurrent}
                onChange={(e) => setResumeCurrent(e.target.value)}
                onBlur={() => onUpdate({ resume_current_step: resumeCurrent })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Next step</Label>
              <Textarea
                value={resumeNext}
                onChange={(e) => setResumeNext(e.target.value)}
                onBlur={() => onUpdate({ resume_next_step: resumeNext })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Waiting on</Label>
              <Input
                value={resumeWaitingOn}
                onChange={(e) => setResumeWaitingOn(e.target.value)}
                onBlur={() => onUpdate({ resume_waiting_on: resumeWaitingOn })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Resume date</Label>
            <Input
              type="date"
              value={resumeDate}
              onChange={(e) => setResumeDate(e.target.value)}
              onBlur={() => onUpdate({ resume_date: resumeDate || null })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
