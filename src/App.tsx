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
import Impressum from './pages/public/Impressum'
import Datenschutz from './pages/public/Datenschutz'
import Dashboard from './pages/protected/Dashboard'
import CreateEvent from './pages/protected/CreateEvent'
import EventBoard from './pages/protected/EventBoard'
import EventMoments from './pages/protected/EventMoments'

import { AuthProvider, useAuth } from './context/AuthContext'
import { EventProvider } from './context/EventContext'

import { getUserDisplayName } from './services/database/user-service'

import BasicNavbar from './components/BasicNavbar'
import EventNavbar from './components/EventNavbar'

import UnlockEvent from "./components/UnlockEvent"
import { getEventById } from "./services/database/private-event-service"
import Layout from './layouts/layout'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

function AnimatedRoutes() {
  const location = useLocation()
  const isEventRoute = location.pathname.startsWith("/event/")

  return (
    <>
    <Layout>
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
                    <EventBoardWrapper />
              }
            />

            <Route
              path="/event/:id/moments"
              element={
                    <EventMomentsWrapper />
              }
            />

            <Route 
              path="/impressum" 
              element={
                    <Impressum />
              } 
            />

            <Route 
              path="/datenschutz" 
              element={
                      <Datenschutz />
              } 
            />

          </Routes>
        </motion.div>
      </AnimatePresence>
      </Layout>
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

  const [name, setName] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, setEvent] = useState<any>()

  useEffect(() => {
    const load = async () => {

      if (!id) return

      const eventData =
        await getEventById(id)

      setEvent(eventData)

      if (user?.uid) {
        setName(
          await getUserDisplayName(
            user.uid
          )
        )
      }
    }

    load()

  }, [id, user])

  if (!id || !event) return null

  return (
      <UnlockEvent
        eventId={id}
        event={event}
      >
        <EventBoard
          eventId={id}
          userId={user?.uid ?? ""}
          userName={name}
        />
      </UnlockEvent>
  )
}

const EventMomentsWrapper = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [name,setName] =
  useState("")
  const [event,setEvent] =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useState<any>()
  useEffect(() => {
  const load = async () => {
    if (!id) return
    setEvent(
      await getEventById(id)
    )
    if (user?.uid) {
      setName(
          await getUserDisplayName(
          user.uid
        )
      )
    }
  }
  load()
}, [id,user])

  if (!id || !event)
  return null

  return (
      <UnlockEvent
        eventId={id}
        event={event}
      >
      <EventMoments
        eventId={id}
        userId={user?.uid ?? ""}
        userName={name}
        isEventCreator={user && event?.creatorId === user.uid}
      />
      </UnlockEvent>
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