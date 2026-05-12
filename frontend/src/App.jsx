import LoginPage from "./pages/Auth/LoginPage";
import SignUpPage from "./pages/Auth/SignUpPage";

import VerifyOTPPage from "./pages/Auth/VerifyOTPPage";
import ChangePasswordPage from "./pages/Auth/ChangePasswordPage";
import { Routes, Route, Navigate } from "react-router-dom";


function App() {
  return (
    <Routes>
      {/* Mặc định vào web sẽ hiện trang Login */}
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      <Route path="/verify-account" element={<VerifyOTPPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      {/* Trang Dashboard sau khi login thành công */}
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
    </Routes>
  );
}

export default App;