import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/layout/Layout";

import NoAccessPage from "../pages/NoAccessPage";

import Dashboard from "../features/dashboard/pages/Dashboard";
import TrackingPage from "../features/tracking/pages/TrackingPage";
import UsersPage from "../features/users/pages/UsersPage";
import AssignmentsPage from "../features/assignments/pages/AssignmentsPage";
import TeamDashboard from "../features/leader/pages/TeamDashboard";
import TeamsPage from "../features/teams/pages/TeamsPage";
import ActionPlanPage from "../features/actionPlan/pages/ActionPlanPage";
import EvidencePage from "../features/evidence/pages/EvidencePage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/no-access" element={<NoAccessPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          <Route
            path="tracking"
            element={<TrackingPage />}
          />

          <Route
            path="action-plan"
            element={<ActionPlanPage />}
          />

          <Route
            path="evidence"
            element={<EvidencePage />}
          />

          <Route
            path="leader"
            element={<TeamDashboard />}
          />

          <Route
            path="teams"
            element={<TeamsPage />}
          />

          <Route
            path="users"
            element={<UsersPage />}
          />

          <Route
            path="assignments"
            element={<AssignmentsPage />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
