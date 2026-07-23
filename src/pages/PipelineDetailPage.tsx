import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";

import { usePipeline } from "@/hooks/entities";
import type { PipelineDetails } from "@/types/domain";
import { PIPELINE_DETAIL_SECTIONS } from "@/components/pipeline/detailSections";
import { PipelineRecordDialog, type PipelineFormValues } from "@/components/pipeline/PipelineRecordDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";

export default function PipelineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, update } = usePipeline();
  const record = data.find((r) => r.id === id);

  const [details, setDetails] = React.useState<PipelineDetails>(record?.details ?? {});
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  React.useEffect(() => {
    if (record) {
      setDetails(record.details ?? {});
      setDirty(false);
    }
  }, [record?.id]);

  const defaultTab =
    PIPELINE_DETAIL_SECTIONS.find((s) => record && s.relevantStages.includes(record.stage))?.key ??
    PIPELINE_DETAIL_SECTIONS[0].key;

  if (!record) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/pipeline")} className="mb-4">
          <ArrowLeft className="size-4" /> Back to Pipeline
        </Button>
        <EmptyState title="Record not found." description="It may have been deleted, or hasn't loaded yet." />
      </div>
    );
  }

  function setField(sectionKey: string, fieldKey: string, value: string) {
    setDetails((d) => ({ ...d, [sectionKey]: { ...d[sectionKey], [fieldKey]: value } }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await update(record!.id, { details });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(values: PipelineFormValues) {
    await update(record!.id, {
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
    });
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/pipeline")} className="mb-4">
        <ArrowLeft className="size-4" /> Back to Pipeline
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{record.name}</h1>
            <Badge variant="outline">{record.stage}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[record.phone, record.email, record.lead_source].filter(Boolean).join(" · ") || "No contact info yet"}
          </p>
          {record.next_action && <p className="mt-1 text-sm font-medium text-primary">→ {record.next_action}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit core info
          </Button>
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save Details"}
          </Button>
        </div>
      </div>

      {record.notes && (
        <div className="mb-6 rounded-lg border border-border bg-secondary/30 p-4 text-sm">{record.notes}</div>
      )}

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {PIPELINE_DETAIL_SECTIONS.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {PIPELINE_DETAIL_SECTIONS.map((section) => (
          <TabsContent key={section.key} value={section.key}>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => {
                const value = details[section.key]?.[field.key] ?? "";
                return (
                  <div
                    key={field.key}
                    className={field.type === "textarea" ? "flex flex-col gap-1.5 sm:col-span-2" : "flex flex-col gap-1.5"}
                  >
                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        value={value}
                        onChange={(e) => setField(section.key, field.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        type={field.type === "date" ? "date" : "text"}
                        value={value}
                        onChange={(e) => setField(section.key, field.key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <PipelineRecordDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={record}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
