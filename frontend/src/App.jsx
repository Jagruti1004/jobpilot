import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ResumePage } from './pages/ResumePage.jsx';
import { ApplicationBoardPage } from './pages/ApplicationBoardPage.jsx';
import { AnalysisPage } from './pages/AnalysisPage.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — wrapped in AppLayout (sidebar + header) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/board" element={<ApplicationBoardPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Route>

      {/* Default redirect: any unknown URL goes to /board (which redirects to /login if not authed) */}
      <Route path="/" element={<Navigate to="/board" replace />} />
      <Route path="*" element={<Navigate to="/board" replace />} />
    </Routes>
  );
}

export default App;