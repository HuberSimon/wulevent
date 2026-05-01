import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/public/Home'
import Authentication from './pages/public/Authentication'
import PrivateEvent from './pages/public/PrivateEvent'
import PublicEvent from './pages/public/PublicEvents'
import Dashboard from './pages/protected/Dashboard'
import CreateEvent from './pages/protected/CreateEvent'
import PublicLayout from './layouts/PublicLayout'
import ProtectedLayout from './layouts/ProtectedLayout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useEffect, useState, type JSX } from 'react'
import { Toaster } from 'react-hot-toast'
import CreatePublicEvent from './pages/protected/CreatePublicEvent'
import EventBoard from './pages/protected/EventBoard'
import { getUserDisplayName } from './services/database/user-service'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>

          <Route path="/" element={<PublicLayout><HomeForward /></PublicLayout>} />

          <Route path="/login" element={<PublicLayout><LoginRedirect /></PublicLayout>} />

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

          <Route
            path="/event/:id/board"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <EventBoardWrapper />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/public-events"
            element={
              <PublicLayout>
                <PublicEvent />
              </PublicLayout>
            }
          />

          <Route
            path="/create-public-event"
            element={
              <PublicLayout>
                <CreatePublicEvent />
              </PublicLayout>
            }
          />

        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

const LoginRedirect = () => {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" />
  return <Authentication />
}

const HomeForward = () => {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" />
  return <Home />
}

const EventBoardWrapper = () => {
  const { id } = useParams()
  const { user } = useAuth()

  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;

      const displayName = await getUserDisplayName(user.uid);
      setName(displayName);
    }

    load()
  }, [user])

  if (!id || !user || !name) return null;

  return (
    <EventBoard
      eventId={id}
      userId={user.uid}
      userName={name}
    />
  )
}


function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />

        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App