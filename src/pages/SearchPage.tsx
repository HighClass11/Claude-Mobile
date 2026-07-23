import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";

import {
  useAppointments,
  useCampaigns,
  useIdeas,
  usePipeline,
  useProjects,
  useTasks,
} from "@/hooks/entities";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  route: string;
}

function matches(query: string, ...fields: (string | null | undefined)[]) {
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const pipeline = usePipeline();
  const tasks = useTasks();
  const appointments = useAppointments();
  const campaigns = useCampaigns();
  const projects = useProjects();
  const ideas = useIdeas();
  const navigate = useNavigate();

  const results: SearchResult[] = React.useMemo(() => {
    if (!query.trim()) return [];
    const out: SearchResult[] = [];

    for (const r of pipeline.data) {
      if (matches(query, r.name, r.notes, r.next_action, r.lead_source)) {
        out.push({ id: r.id, type: "Client", title: r.name, subtitle: r.stage, route: "/pipeline" });
      }
    }
    for (const t of tasks.data) {
      if (matches(query, t.title, t.description, t.subcategory)) {
        out.push({ id: t.id, type: "Task", title: t.title, subtitle: t.subcategory ?? undefined, route: "/" });
      }
    }
    for (const a of appointments.data) {
      if (matches(query, a.title, a.meeting_notes, a.outcome, a.next_action)) {
        out.push({ id: a.id, type: "Appointment", title: a.title, subtitle: a.type, route: "/appointments" });
      }
    }
    for (const c of campaigns.data) {
      if (matches(query, c.title, c.notes)) {
        out.push({ id: c.id, type: "Campaign", title: c.title, subtitle: c.action, route: "/campaigns" });
      }
    }
    for (const p of projects.data) {
      if (matches(query, p.title, p.notes, p.next_step)) {
        out.push({ id: p.id, type: "Project", title: p.title, subtitle: p.category, route: "/projects" });
      }
    }
    for (const i of ideas.data) {
      if (matches(query, i.content, i.category)) {
        out.push({ id: i.id, type: "Idea", title: i.content, route: "/ideas" });
      }
    }
    return out;
  }, [query, pipeline.data, tasks.data, appointments.data, campaigns.data, projects.data, ideas.data]);

  return (
    <div>
      <PageHeader title="Universal Search" description="Clients, tasks, campaigns, projects, ideas, appointments, notes — everything." />

      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything…"
          className="pl-9"
        />
      </div>

      {!query.trim() ? (
        <EmptyState title="Start typing to search." />
      ) : results.length === 0 ? (
        <EmptyState title="No matches." />
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((r) => (
            <button
              key={`${r.type}:${r.id}`}
              onClick={() => navigate(r.route)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-secondary/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.title}</p>
                {r.subtitle && <p className="truncate text-xs text-muted-foreground">{r.subtitle}</p>}
              </div>
              <Badge variant="outline">{r.type}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
