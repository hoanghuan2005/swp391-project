import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import Homepage from "./pages/Homepage";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import MyLibrary from "./pages/MyLibrary";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import LoginPage from "./pages/Auth/LoginPage";
import SignUpPage from "./pages/Auth/SignUpPage";
import VerifyOTPPage from "./pages/Auth/VerifyOTPPage";
import ChangePasswordPage from "./pages/Auth/ChangePasswordPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import Survey from "./pages/Survey";
import DashboardPage from "./pages/Admin/DashboardPage";
import UserListPage from "./pages/Admin/UserListPage";
import DocumentListPage from "./pages/Admin/DocumentListPage";
import CatalogSchoolsPage from "./pages/Admin/CatalogSchoolsPage";
import CatalogTagsPage from "./pages/Admin/CatalogTagsPage";
import CatalogLanguagesPage from "./pages/Admin/CatalogLanguagesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CatalogCoursesPage from "./pages/Admin/CatalogCoursesPage";

function ComingSoon({ pageName }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
      <h2 className="text-2xl font-bold mb-2 text-slate-800">{pageName}</h2>
      <p className="text-slate-500">
        This feature is currently under development.
      </p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-account" element={<VerifyOTPPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/survey" element={<Survey />} />

        {/* (Student) Dashboard layout */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Homepage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/my-library" element={<MyLibrary />} />
          <Route
            path="/ai-notes"
            element={<ComingSoon pageName="AI Notes" />}
          />
          <Route path="/ask-ai" element={<ComingSoon pageName="Ask AI" />} />
          <Route path="/ai-quiz" element={<ComingSoon pageName="AI Quiz" />} />
          <Route path="/courses" element={<ComingSoon pageName="Courses" />} />
          <Route
            path="/projects"
            element={<ComingSoon pageName="Projects" />}
          />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
        </Route>

        {/* Admin dashboard layout */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/users" element={<UserListPage />} />
          <Route path="/admin/documents" element={<DocumentListPage />} />
          <Route path="/admin/documents/:id" element={<DocumentDetailPage />} />
          <Route
            path="/admin/courses"
            element={<CatalogCoursesPage />}
          />
          <Route
            path="/admin/catalog/schools"
            element={<CatalogSchoolsPage />}
          />
          <Route path="/admin/catalog/tags" element={<CatalogTagsPage />} />
          <Route
            path="/admin/catalog/languages"
            element={<CatalogLanguagesPage />}
          />
          <Route
            path="/admin/settings"
            element={<Navigate to="/admin/catalog/schools" replace />}
          />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
