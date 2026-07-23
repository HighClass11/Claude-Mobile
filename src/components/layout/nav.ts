import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Hourglass,
  DollarSign,
  Megaphone,
  Briefcase,
  Lightbulb,
  ClipboardList,
  Sunrise,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/", icon: LayoutDashboard, primary: true },
  { label: "Pipeline", to: "/pipeline", icon: TrendingUp, primary: true },
  { label: "Appointments", to: "/appointments", icon: Calendar, primary: true },
  { label: "Waiting On", to: "/waiting-on", icon: Hourglass, primary: true },
  { label: "Revenue", to: "/revenue", icon: DollarSign },
  { label: "Campaigns", to: "/campaigns", icon: Megaphone },
  { label: "Projects", to: "/projects", icon: Briefcase },
  { label: "Ideas", to: "/ideas", icon: Lightbulb },
  { label: "Scorecard", to: "/scorecard", icon: ClipboardList },
  { label: "Morning Brief", to: "/morning-brief", icon: Sunrise },
  { label: "Search", to: "/search", icon: Search },
  { label: "Settings", to: "/settings", icon: Settings },
];
