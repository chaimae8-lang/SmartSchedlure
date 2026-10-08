import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Teachers from './pages/Teachers'
import Classes from './pages/Classes'
import Rooms from './pages/Rooms'
import Generator from './pages/Generator'
import Schedule from './pages/Schedule'

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="pl-64">
        <Topbar />
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

function Protected({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <Shell>{children}</Shell>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/teachers" element={<Protected><Teachers /></Protected>} />
        <Route path="/classes" element={<Protected><Classes /></Protected>} />
        <Route path="/rooms" element={<Protected><Rooms /></Protected>} />
        <Route path="/generator" element={<Protected><Generator /></Protected>} />
        <Route path="/schedule" element={<Protected><Schedule /></Protected>} />
      </Routes>
    </BrowserRouter>
  )
}
