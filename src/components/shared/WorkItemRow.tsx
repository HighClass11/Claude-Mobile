import { useNavigate } from "react-router-dom";
import { ArrowRight, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { WorkItem } from "@/lib/priority";

function formatDue(dueDate: string | null) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WorkItemRow({ item }: { item: WorkItem }) {
  const navigate = useNavigate();
  const due = formatDue(item.dueDate);

  return (
    <button
      onClick={() => navigate(item.route)}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/60"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{item.title}</p>
          {item.needsNextAction && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="size-3" /> No next action
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.categoryLabel}
          {item.subtitle ? ` · ${item.subtitle}` : ""}
        </p>
        <p className="mt-1 truncate text-xs font-medium text-primary">→ {item.nextAction}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {item.expectedRevenue ? (
          <Badge variant="revenue">${item.expectedRevenue.toLocaleString()}</Badge>
        ) : null}
        {due && (
          <span
            className={cn(
              "text-xs font-medium",
              item.overdue ? "text-destructive" : item.dueToday ? "text-accent-foreground" : "text-muted-foreground",
            )}
          >
            {item.overdue ? "Overdue" : item.dueToday ? "Today" : due}
          </span>
        )}
        <ArrowRight className="size-4 text-muted-foreground" />
      </div>
    </button>
  );
}
