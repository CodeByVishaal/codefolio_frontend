import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { Dashboard } from '@/pages/Dashboard';
import { ProjectDetail } from '@/pages/ProjectDetail';
import { Projects } from '@/pages/Projects';
import { Tasks } from '@/pages/Tasks';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from './pages/Analytics';
import { Journal } from './pages/Journal';
import { Profile } from './pages/Profile';
import { PublicProfile } from './pages/PublicProfile';
import { Sessions } from './pages/Sessions';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public routes ─────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          // Public profile sits OUTSIDE ProtectedRoute — no login needed
          // Add this at the top level, alongside /login and /register:
          <Route path="/profile/:id" element={<PublicProfile />} />

          {/* ── Protected routes ──────────────────────────────── */}
          {/* ProtectedRoute checks auth, then renders Outlet.    */}
          {/* DashboardLayout renders the sidebar + Outlet.       */}
          {/* Individual pages render inside that Outlet.         */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* ── Fallback ──────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}