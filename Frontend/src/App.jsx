import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import NightSkyBackground from './components/NightSkyBackground';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitasListPage from './pages/CitasListPage';
import CitaDetailPage from './pages/CitaDetailPage';
import CitaFormPage from './pages/CitaFormPage';
import EntryFormPage from './pages/EntryFormPage';
import ParejaPage from './pages/ParejaPage';
import BacklogPage from './pages/BacklogPage';

export default function App() {
  return (
    <>
      <NightSkyBackground />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CitasListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citas/nueva"
          element={
            <ProtectedRoute>
              <CitaFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citas/:id"
          element={
            <ProtectedRoute>
              <CitaDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citas/:id/mi-entrada"
          element={
            <ProtectedRoute>
              <EntryFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pareja"
          element={
            <ProtectedRoute>
              <ParejaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backlog"
          element={
            <ProtectedRoute>
              <BacklogPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
