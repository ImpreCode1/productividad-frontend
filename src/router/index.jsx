import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/layout/Layout";

import NoAccessPage from "../pages/NoAccessPage";

// Features
import Dashboard from "../features/dashboard/pages/Dashboard";
import TrackingPage from "../features/tracking/pages/TrackingPage";
import UsersPage from "../features/users/pages/UsersPage";
import AssignmentsPage from "../features/assignments/pages/AssignmentsPage";
import TeamPage from "../features/team/pages/TeamPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Público */}
        <Route path="/no-access" element={<NoAccessPage />} />

        {/* Privado */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Usuario */}
          <Route path="tracking" element={<TrackingPage />} />

          {/* Líder */}
          <Route path="team" element={<TeamPage />} />

          {/* Admin */}
          <Route path="users" element={<UsersPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}