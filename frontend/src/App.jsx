import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import AdminLayout from "./components/layout/AdminLayout";
import Homepage from "./pages/Homepage";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import MyLibrary from "./pages/MyLibrary";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import Survey from "./pages/Survey";
import DashboardPage from "./pages/admin/DashboardPage";
import UserListPage from "./pages/admin/UserListPage";
import DocumentListPage from "./pages/admin/DocumentListPage";
import CatalogSchoolsPage from "./pages/admin/CatalogSchoolsPage";
import CatalogTagsPage from "./pages/admin/CatalogTagsPage";
import CatalogLanguagesPage from "./pages/admin/CatalogLanguagesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CatalogCoursesPage from "./pages/admin/CatalogCoursesPage";
import AskAIPage from "./pages/ai/ai_ask/AskAIPage";
import ProjectWorkspacePage from "./pages/workspace/ProjectWorkspacePage";
import AIFlashcard from "./pages/ai/ai_flashcard/AIFlashcard";
import AIQuizPage from "./pages/ai/ai_quiz/AIToolsPage";
import AIQuizTakePage from "./pages/ai/ai_quiz/AIQuizTakePage";
import WorkspaceOverviewPage from "./pages/workspace/WorkspaceOverviewPage";
import OAuth2Callback from "./pages/OAuth2Callback";
import AIFlashcardGenerator from "./pages/ai/ai_flashcard/AIFlashcardGenerator";
import AIQuizGenerator from "./pages/ai/ai_quiz/AIQuizGenerator";

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
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />

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
          <Route path="/ask-ai" element={<AskAIPage />} />
          <Route path="/ai-tools" element={<AIQuizPage />} />
          <Route
            path="/ai-tools/ai-flashcard"
            element={<AIFlashcardGenerator />}
          />
          <Route path="/ai-tools/ai-quiz" element={<AIQuizGenerator />} />
          <Route path="/courses" element={<ComingSoon pageName="Courses" />} />
          <Route
            path="/projects"
            element={<ComingSoon pageName="Projects" />}
          />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/quiz/:id" element={<AIQuizTakePage />} />
          <Route path="/flashcard" element={<AIFlashcard />} />
          <Route
            path="/workspace/:projectId"
            element={<WorkspaceOverviewPage />}
          />
          <Route
            path="/workspace/:projectId/ai"
            element={<ProjectWorkspacePage />}
          />
          <Route
            path="/workspace/shared/:token"
            element={<ProjectWorkspacePage />}
          />
        </Route>

        {/* Admin dashboard layout */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/users" element={<UserListPage />} />
          <Route path="/admin/documents" element={<DocumentListPage />} />
          <Route path="/admin/documents/:id" element={<DocumentDetailPage />} />
          <Route path="/admin/courses" element={<CatalogCoursesPage />} />
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
