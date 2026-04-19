import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ChatPage from './pages/ChatPage'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function AppContent() {
  const { theme } = useTheme()
  return (
    <div className={theme === 'dark' ? 'gradient-bg-dark' : 'gradient-bg-light'} style={{ minHeight: '100vh' }}>
      <div className="mesh-gradient" />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#12121a' : '#ffffff',
            color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            backdropFilter: 'blur(20px)',
          },
        }}
        richColors
      />
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
