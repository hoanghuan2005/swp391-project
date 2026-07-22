import { Navigate, Outlet, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function getTokenRole(token) {
  try {
    return jwtDecode(token)?.role;
  } catch (error) {
    console.error("Invalid admin token:", error);
    return null;
  }
}

export default function AdminRouteGuard() {
  const location = useLocation();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userRole = localStorage.getItem("userRole");

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (userRole !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
