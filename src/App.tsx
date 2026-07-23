import { Route, Routes } from "react-router-dom";

import AppShell from "@/components/layout/AppShell";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PipelinePage from "@/pages/PipelinePage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import WaitingOnPage from "@/pages/WaitingOnPage";
import RevenuePage from "@/pages/RevenuePage";
import CampaignsPage from "@/pages/CampaignsPage";
import ProjectsPage from "@/pages/ProjectsPage";
import IdeasPage from "@/pages/IdeasPage";
import ScorecardPage from "@/pages/ScorecardPage";
import MorningBriefPage from "@/pages/MorningBriefPage";
import SearchPage from "@/pages/SearchPage";
import SettingsPage from "@/pages/SettingsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/waiting-on" element={<WaitingOnPage />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/scorecard" element={<ScorecardPage />} />
          <Route path="/morning-brief" element={<MorningBriefPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
