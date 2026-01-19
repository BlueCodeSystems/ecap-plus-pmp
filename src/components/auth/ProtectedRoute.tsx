import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();

  console.log("ProtectedRoute render:", { user: !!user, isLoading });

  if (isLoading) {
    console.log("ProtectedRoute: still loading, showing nothing");
    return null;
  }

  if (!user) {
    console.log("ProtectedRoute: no user, redirecting to /");
    return <Navigate to="/" replace />;
  }

  console.log("ProtectedRoute: user authenticated, rendering children");
  return children;
};

export default ProtectedRoute;
