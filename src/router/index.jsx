import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../components/layout/Layout";
import LoginPage from "../pages/LoginPage";
import NoAccessPage from "../pages/NoAccessPage";
import Dashboard from "../features/dashboard/pages/Dashboard";
import TrackingPage from "../features/tracking/pages/TrackingPage";
import IndicatorsPage from "../features/indicators/pages/IndicatorsPage";
import OrganizationPage from "../features/organization/pages/OrganizationPage";
import UsersPage from "../features/users/pages/UsersPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/no-access" element={<NoAccessPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tracking"
          element={
            <ProtectedRoute>
              <Layout>
                <TrackingPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/indicators"
          element={
            <ProtectedRoute>
              <Layout>
                <IndicatorsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization"
          element={
            <ProtectedRoute>
              <Layout>
                <OrganizationPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
