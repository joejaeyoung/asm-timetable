import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import MyTeamsPage from '@/pages/MyTeamsPage';
import TeamSettingsPage from '@/pages/TeamSettingsPage';
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar';
import WeeklyTimetable from '@/components/timetable/WeeklyTimetable';

function defaultCalendarPath(teamId: string) {
  const now = new Date();
  return `/teams/${teamId}/calendar/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Redirect to /login if not authenticated */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate('/login', { replace: true });
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;
  return <>{children}</>;
}

function AppRoutes() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <MyTeamsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teams/:teamId/settings"
        element={
          <ProtectedRoute>
            <TeamSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teams/:teamId/calendar/:year/:month"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MonthlyCalendar />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teams/:teamId/week/:weekId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <WeeklyTimetable />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Navigate to="/teams" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export { defaultCalendarPath };
