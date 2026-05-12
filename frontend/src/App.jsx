import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Homepage from './pages/Homepage';
import LandingPage from './pages/LandingPage';

function ComingSoon({ pageName }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8 bg-white border border-slate-100 rounded-3xl shadow-sm">
      <h2 className="text-2xl font-bold mb-2 text-slate-800">{pageName}</h2>
      <p className="text-slate-500">This feature is currently under development.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Homepage />} />
          <Route path="/my-library" element={<ComingSoon pageName="My Library" />} />
          <Route path="/ai-notes" element={<ComingSoon pageName="AI Notes" />} />
          <Route path="/ask-ai" element={<ComingSoon pageName="Ask AI" />} />
          <Route path="/ai-quiz" element={<ComingSoon pageName="AI Quiz" />} />
          <Route path="/courses" element={<ComingSoon pageName="Courses" />} />
          <Route path="/projects" element={<ComingSoon pageName="Projects" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
