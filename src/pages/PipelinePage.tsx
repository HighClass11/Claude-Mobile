import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, MoreVertical, Plus } from "lucide-react";

import { usePipeline } from "@/hooks/entities";
import { PIPELINE_STAGES, type PipelineRecord } from "@/types/domain";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PipelineRecordDialog,
  type PipelineFormValues,
} from "@/components/pipeline/PipelineRecordDialog";

export default function PipelinePage() {
  const { data, insert, update, remove } = usePipeline();
  const [stageFilter, setStageFilter] = React.useState<string>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PipelineRecord | null>(null);

  const filtered = stageFilter === "all" ? data : data.filter((r) => r.stage === stageFilter);
  const sorted = [...filtered].sort((a, b) => {
    const aBlank = !a.next_action?.trim();
    const bBlank = !b.next_action?.trim();
    if (aBlank !== bBlank) return aBlank ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(record: PipelineRecord) {
    setEditing(record);
    setDialogOpen(true);
  }

  async function handleSubmit(values: PipelineFormValues) {
    const payload = {
      name: values.name,
      stage: values.stage,
      lead_source: values.lead_source || null,
      phone: values.phone || null,
      email: values.email || null,
      next_action: values.next_action || null,
      due_date: values.due_date || null,
      expected_revenue: values.expected_revenue ? Number(values.expected_revenue) : null,
      owner: values.owner || "Shane",
      notes: values.notes || null,
    };
    if (editing) await update(editing.id, payload);
    else await insert(payload);
  }

  return (
    <div>
      <PageHeader
        title="Sales Pipeline"
        description="Every record needs a next action — blank ones are flagged red until fixed."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New Record
          </Button>
        }
      />

      <div className="mb-4">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages ({data.length})</SelectItem>
            {PIPELINE_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage} ({data.filter((r) => r.stage === stage).length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No records here yet." description="Add your first lead, prospect, or client." />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((record) => (
            <PipelineCard key={record.id} record={record} onEdit={() => openEdit(record)} onDelete={() => remove(record.id)} />
          ))}
        </div>
      )}

      <PipelineRecordDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} onSubmit={handleSubmit} />
    </div>
  );
}

function PipelineCard({
  record,
  onEdit,
  onDelete,
}: {
  record: PipelineRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const missingNextAction = !record.next_action?.trim();
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/pipeline/${record.id}`)}
      className={
        "cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-secondary/40 " +
        (missingNextAction ? "border-destructive/50 bg-destructive/5" : "border-border")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{record.name}</p>
            <Badge variant="outline">{record.stage}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {record.lead_source || "No lead source"} · Owner: {record.owner}
          </p>
          {(record.phone || record.email) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[record.phone, record.email].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {record.expected_revenue ? <Badge variant="revenue">${record.expected_revenue.toLocaleString()}</Badge> : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {missingNextAction ? (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="size-3" /> No next action — incomplete
          </Badge>
        ) : (
          <p className="font-medium text-primary">→ {record.next_action}</p>
        )}
        {record.due_date && (
          <span className="text-xs text-muted-foreground">
            Due {new Date(record.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      {record.notes && <p className="mt-2 text-xs text-muted-foreground">{record.notes}</p>}
    </div>
  );
}
