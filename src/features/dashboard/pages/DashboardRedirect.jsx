import { Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

export default function DashboardRedirect() {
  const { user } = useAuth();
  
  const isAdmin = user?.roles?.includes("ADMIN");
  const isLeader = user?.roles?.includes("LEADER");
  
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  
  if (isLeader) {
    return <Navigate to="/leader" replace />;
  }
  
  return <Navigate to="/employee" replace />;
}