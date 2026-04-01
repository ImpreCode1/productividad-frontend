import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getCurrentUser } from "../utils/hydra";
import { setHydraCookie } from "../api/client";

export default function ProtectedRoute({ children }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      const result = getCurrentUser();
      if (result) {
        setHydraCookie(result.token);
        login(result.user, result.token);
      }
    }
  }, [user, login]);

  if (!user) {
    return null;
  }

  return children;
}
