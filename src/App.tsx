import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams
} from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type JSX } from 'react'
import { Toaster } from 'react-hot-toast'

import Home from './pages/public/Home'
import Authentication from './pages/public/Authentication'
import PrivateEvent from './pages/public/PrivateEvent'
import Dashboard from './pages/protected/Dashboard'
import CreateEvent from './pages/protected/CreateEvent'
import EventBoard from './pages/protected/EventBoard'
import EventMoments from './pages/protected/EventMoments'

import { AuthProvider, useAuth } from './context/AuthContext'
import { EventProvider } from './context/EventContext'

import { getUserDisplayName } from './services/database/user-service'

import BasicNavbar from './components/BasicNavbar'
import EventNavbar from './components/EventNavbar'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AnimatedRoutes() {
  const location = useLocation()
  const isEventRoute = location.pathname.startsWith("/event/")

  return (
    <>
    <BasicNavbar />
    {isEventRoute && <EventNavbar />}

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          <Routes location={location}>

            <Route
              path="/"
              element={
                  <HomeForward />
              }
            />

            <Route
              path="/login"
              element={
                  <LoginRedirect />
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-event"
              element={
                <ProtectedRoute>
                    <CreateEvent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/event/:id"
              element={
                  <PrivateEvent />
              }
            />

            <Route
              path="/event/:id/board"
              element={
                <ProtectedRoute>
                    <EventBoardWrapper />
                </ProtectedRoute>
              }
            />

            <Route
              path="/event/:id/moments"
              element={
                <ProtectedRoute>
                    <EventMomentsWrapper />
                </ProtectedRoute>
              }
            />

          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
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
      if (!user?.uid) return
      const displayName = await getUserDisplayName(user.uid)
      setName(displayName)
    }
    load()
  }, [user])

  if (!id || !user || !name) return null

  return (
    <EventBoard
      eventId={id}
      userId={user.uid}
      userName={name}
    />
  )
}

const EventMomentsWrapper = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return
      const displayName = await getUserDisplayName(user.uid)
      setName(displayName)
    }
    load()
  }, [user])

  if (!id || !user || !name) return null

  return (
    <EventMoments
      eventId={id}
      userId={user.uid}
      userName={name}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <Router>
          <Toaster position="top-right" />
          <AnimatedRoutes />
        </Router>
      </EventProvider>
    </AuthProvider>
  )
}

export default App