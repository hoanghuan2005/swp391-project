import LoginPage from "./pages/Auth/LoginPage";
import SignUpPage from "./pages/Auth/SignUpPage";

import { Routes, Route, Navigate } from "react-router-dom";


function App() {
  return (
    <Routes>
      {/* Mặc định vào web sẽ hiện trang Login */}
      <Route path="/" element={<Navigate to="/login" />} />
      
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      {/* Trang Dashboard sau khi login thành công */}
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
    </Routes>
  );
}

export default App;