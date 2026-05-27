import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuth2Callback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (token) {
      localStorage.setItem("token", token);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      navigate("/home");
    } else {
      navigate("/login");
    }
  }, []);

  return <div>Logging in...</div>;
}
