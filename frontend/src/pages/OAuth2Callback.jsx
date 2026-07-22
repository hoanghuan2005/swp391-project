import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuth2Callback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");

    if (token || document.cookie.includes("accessToken")) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.setItem("isLoggedIn", "true");

      const redirectUrl = localStorage.getItem("oauth2_redirect");
      if (redirectUrl) {
        localStorage.removeItem("oauth2_redirect");
        navigate(decodeURIComponent(redirectUrl));
      } else {
        navigate("/home");
      }
    } else {
      navigate("/login");
    }
  }, []);

  return <div>Logging in...</div>;
}
