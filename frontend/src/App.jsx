import LoginPage from "./pages/Auth/LoginPage";
import SignUpPage from "./pages/Auth/SignUpPage";

import VerifyOTPPage from "./pages/Auth/VerifyOTPPage";
import ChangePasswordPage from "./pages/Auth/ChangePasswordPage";
import { Routes, Route, Navigate } from "react-router-dom";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-account" element={<VerifyOTPPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

    </Routes>
  );
}

export default App;