import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/public/Home'
import Authentication from './pages/public/Authentication'
import PrivateEvent from './pages/public/PrivateEvent'
import Dashboard from './pages/protected/Dashboard'
import CreateEvent from './pages/protected/CreateEvent'

import PublicLayout from './layouts/PublicLayout'
import ProtectedLayout from './layouts/ProtectedLayout'

import { AuthProvider, useAuth } from './context/AuthContext'
import type { JSX } from 'react'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>

      <Route path="/" element={<PublicLayout><HomeForward /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><LoginRedirect /></PublicLayout>} />
      {/* <Route path="/publicevents" element={<PublicLayout><PublicEvents /></PublicLayout>} /> */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <CreateEvent />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/event/:id"
        element={
          <PublicLayout>
            <PrivateEvent />
          </PublicLayout>
        }
      />
    </Routes>
  );
}

const LoginRedirect = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Authentication />;
};

const HomeForward = () => {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" />;

  return <Home />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;