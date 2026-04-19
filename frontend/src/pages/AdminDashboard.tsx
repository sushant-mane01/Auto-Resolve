import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Sun, Moon, Bell, BarChart3, Ticket, MessageSquare, BookOpen, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '../context/ThemeContext'
import { adminLogout, createSSEConnection } from '../lib/api'
import { cn, playBeep } from '../lib/utils'
import AnalyticsTab from '../components/admin/AnalyticsTab'
import TicketsTab from '../components/admin/TicketsTab'
import SessionsTab from '../components/admin/SessionsTab'
import KBManagerTab from '../components/admin/KBManagerTab'

const tabs = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'sessions', label: 'Sessions', icon: MessageSquare },
  { id: 'kb', label: 'KB Manager', icon: BookOpen },
]

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('analytics')
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    if (!localStorage.getItem('admin-token')) navigate('/admin')
  }, [navigate])

  useEffect(() => {
    const token = localStorage.getItem('admin-token')
    if (!token) return
    const es = createSSEConnection((data) => {
      if (data.type === 'escalation' || data.type === 'new_ticket') {
        setNotificationCount(c => c + 1)
        playBeep()
        toast.error(`🚨 New escalation: ${data.category || 'Unknown'}`, {
          description: data.first_message?.slice(0, 80) || 'A ticket has been escalated',
          duration: 8000,
        })
      }
    })
    return () => es.close()
  }, [])

  const handleLogout = useCallback(async () => {
    try { await adminLogout() } catch {}
    localStorage.removeItem('admin-token')
    toast.success('Logged out successfully')
    navigate('/admin')
  }, [navigate])

  return (
    <div className="relative z-10 h-screen flex flex-col">
      {/* Header */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className={cn('flex items-center justify-between px-6 py-4 mx-4 mt-4 rounded-2xl',
          isDark ? 'glass-card' : 'glass-card-light')}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Bot size={18} className="text-white" />
          </div>
          <h1 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
            Auto-Resolve <span className="text-cyan-400">Admin</span>
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setNotificationCount(0)}
            className={cn('p-2.5 rounded-xl relative transition-colors',
              isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800')}>
            <Bell size={18} />
            {notificationCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-rose-500/30">
                {notificationCount > 9 ? '9+' : notificationCount}
              </motion.span>
            )}
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleTheme}
            className={cn('p-2.5 rounded-xl transition-colors',
              isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800')}>
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ml-1 transition-colors',
              isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800')}>
            <LogOut size={16} /> Logout
          </motion.button>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className={cn('flex rounded-2xl p-1.5 gap-1', isDark ? 'glass-card' : 'glass-card-light')}>
          {tabs.map(tab => (
            <motion.button key={tab.id} onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={cn('relative flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                activeTab === tab.id ? 'text-white' : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}>
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" transition={{ type: 'spring', duration: 0.4 }}
                  className="absolute inset-0 rounded-xl shadow-lg shadow-cyan-500/15"
                  style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }} />
              )}
              <tab.icon size={16} className="relative z-10" />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'tickets' && <TicketsTab />}
            {activeTab === 'sessions' && <SessionsTab />}
            {activeTab === 'kb' && <KBManagerTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
