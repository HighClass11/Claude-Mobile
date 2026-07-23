import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

import {
  useAppointments,
  useCampaigns,
  useIdeas,
  usePipeline,
  useProjects,
  useTasks,
  useWaitingItems,
} from "@/hooks/entities";
import { buildWorkItems } from "@/lib/priority";
import { computeNotifications } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";

export function NotificationsBell() {
  const pipeline = usePipeline();
  const tasks = useTasks();
  const appointments = useAppointments();
  const waitingItems = useWaitingItems();
  const campaigns = useCampaigns();
  const projects = useProjects();
  const ideas = useIdeas();
  const navigate = useNavigate();

  const ranked = React.useMemo(
    () =>
      buildWorkItems({
        pipeline: pipeline.data,
        appointments: appointments.data,
        tasks: tasks.data,
        waitingItems: waitingItems.data,
        campaigns: campaigns.data,
        projects: projects.data,
        ideas: ideas.data,
      }),
    [pipeline.data, appointments.data, tasks.data, waitingItems.data, campaigns.data, projects.data, ideas.data],
  );

  const notifications = React.useMemo(
    () => computeNotifications(ranked, appointments.data),
    [ranked, appointments.data],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-5" />
          {notifications.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        {notifications.length === 0 ? (
          <div className="p-2">
            <EmptyState title="Nothing needs your attention." />
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <DropdownMenuItem key={n.id} onSelect={() => navigate(n.route)}>
              {n.message}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
