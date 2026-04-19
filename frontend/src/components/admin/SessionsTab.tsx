import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '../../context/ThemeContext'
import { getAdminSessions, getAdminSession } from '../../lib/api'
import { cn, getCategoryIcon, getSentimentEmoji, getUrgencyInfo, formatDate } from '../../lib/utils'

interface SessionData {
  session_id: string; status: string; category: string; sentiment: string; urgency: string
  message_count: number; first_message: string; created_at: string; ticket_id: string | null; ticket_status: string | null
}

export default function SessionsTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')
  const [filterUrgency, setFilterUrgency] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const fetchSessions = useCallback(async () => {
    try { setSessions(await getAdminSessions().then(d => Array.isArray(d) ? d : [])) } catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchSessions() }, [fetchSessions])

  const viewSession = async (sessionId: string) => {
    try { setSelectedSession(await getAdminSession(sessionId)); setShowModal(true) }
    catch { toast.error('Failed to load session') }
  }

  const filtered = sessions.filter(s => {
    if (search && !s.first_message?.toLowerCase().includes(search.toLowerCase()) && !s.session_id?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus && s.status !== filterStatus) return false
    if (filterCategory && s.category !== filterCategory) return false
    if (filterSentiment && s.sentiment !== filterSentiment) return false
    if (filterUrgency && s.urgency !== filterUrgency) return false
    return true
  })

  const uniqueCategories = [...new Set(sessions.map(s => s.category).filter(Boolean))]

  const getStatusBadge = (status: string) => {
    const c: Record<string, string> = {
      active: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      resolved: isDark ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' : 'bg-blue-50 text-blue-700 border-blue-200',
      escalated: isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/25' : 'bg-rose-50 text-rose-700 border-rose-200',
    }
    return c[status?.toLowerCase()] || (isDark ? 'bg-gray-500/15 text-gray-300 border-gray-500/25' : 'bg-gray-50 text-gray-700 border-gray-200')
  }

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '20px',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)',
    backdropFilter: 'blur(24px)',
  }

  const selectStyle = cn('px-3 py-2 rounded-xl text-xs outline-none cursor-pointer font-medium',
    isDark ? 'bg-white/[0.04] text-gray-300 border border-white/[0.08]' : 'bg-white text-gray-600 border border-gray-200')

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <>
      {/* Search + Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            }}>
            <Search size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className={cn('flex-1 bg-transparent outline-none text-sm font-medium',
                isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400')} />
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={cn('px-5 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition-all border',
              showFilters
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : isDark ? 'bg-white/[0.04] text-gray-300 border-white/[0.08]' : 'bg-white text-gray-600 border-gray-200')}>
            <Filter size={16} /> Filters
          </motion.button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap gap-2">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectStyle}>
                  <option value="">All Status</option><option value="active">Active</option>
                  <option value="resolved">Resolved</option><option value="escalated">Escalated</option>
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectStyle}>
                  <option value="">All Categories</option>
                  {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)} className={selectStyle}>
                  <option value="">All Sentiments</option><option value="positive">Positive</option>
                  <option value="neutral">Neutral</option><option value="frustrated">Frustrated</option><option value="angry">Angry</option>
                </select>
                <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)} className={selectStyle}>
                  <option value="">All Urgency</option><option value="low">Low</option>
                  <option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((session, i) => {
          const sentiment = getSentimentEmoji(session.sentiment)
          const urgency = getUrgencyInfo(session.urgency)
          return (
            <motion.div key={session.session_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.01, y: -2 }}
              onClick={() => viewSession(session.session_id)}
              className="rounded-2xl p-5 cursor-pointer transition-all" style={cardStyle}>
              <div className="flex items-start justify-between mb-3">
                <span className={cn('inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                  getStatusBadge(session.status))}>
                  {session.status}
                </span>
                <span className={cn('text-[10px] font-medium', isDark ? 'text-gray-600' : 'text-gray-400')}>
                  {formatDate(session.created_at)}
                </span>
              </div>
              <p className={cn('text-sm font-semibold mb-3 line-clamp-2 leading-relaxed', isDark ? 'text-white' : 'text-gray-900')}>
                {session.first_message || 'No message'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {session.category && (
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border',
                    isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200')}>
                    {getCategoryIcon(session.category)} {session.category}
                  </span>
                )}
                <span className="text-xs">{sentiment.emoji}</span>
                <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold', urgency.color)}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', urgency.dotColor)} /> {urgency.label}
                </span>
                <span className={cn('text-[10px] ml-auto font-semibold', isDark ? 'text-gray-600' : 'text-gray-400')}>
                  {session.message_count} msgs
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className={cn('text-center py-20', isDark ? 'text-gray-600' : 'text-gray-400')}>
          <p className="text-sm font-medium">No sessions found</p>
        </div>
      )}

      {/* Session Detail Modal */}
      <AnimatePresence>
        {showModal && selectedSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-3xl p-6"
              style={{
                background: isDark ? '#0d0d14' : '#ffffff',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
              }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Session Detail</h2>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowModal(false)}
                  className={cn('p-2 rounded-xl', isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500')}>
                  <X size={20} />
                </motion.button>
              </div>
              <div className="space-y-3">
                {(selectedSession.conversation_history || selectedSession.messages || []).map((msg: any, i: number) => (
                  <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : isDark ? 'bg-white/[0.06] text-gray-200 border border-white/[0.08]' : 'bg-gray-100 text-gray-700')}>
                      {msg.content || msg.message || msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
