import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { MoreHorizontal, LogOut, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NAV_ITEMS } from "@/components/layout/nav";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string | null | undefined, email: string | null | undefined) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }
  return email?.[0]?.toUpperCase() ?? "S";
}

export default function AppShell() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const primaryItems = NAV_ITEMS.filter((i) => i.primary);
  const secondaryItems = NAV_ITEMS.filter((i) => !i.primary);

  return (
    <div className="flex min-h-svh bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <div className="mb-8 flex items-center justify-between px-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">ShaneOS</h1>
            <p className="text-xs text-muted-foreground">Cepher Wealth Group</p>
          </div>
          <NotificationsBell />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-secondary">
              <Avatar>
                <AvatarFallback>{initials(profile?.full_name, user?.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.full_name || "Shane"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Signed in as {user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => signOut()}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <h1 className="text-lg font-semibold tracking-tight">ShaneOS</h1>
          <div className="flex-1" />
          <NotificationsBell />
          <button
            aria-label="Search"
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
            onClick={() => navigate("/search")}
          >
            <Search className="size-5" />
          </button>
        </header>

        <main className="flex-1 pb-24 md:pb-0">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/95 py-2 backdrop-blur md:hidden">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-md py-1 text-[11px] font-medium",
                isActive ? "text-primary" : "text-muted-foreground",
              )
            }
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-1 flex-col items-center gap-0.5 rounded-md py-1 text-[11px] font-medium text-muted-foreground">
              <MoreHorizontal className="size-5" />
              More
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="mb-2 w-48">
            {secondaryItems.map((item) => (
              <DropdownMenuItem key={item.to} onSelect={() => navigate(item.to)}>
                <item.icon className="size-4" />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut()}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
