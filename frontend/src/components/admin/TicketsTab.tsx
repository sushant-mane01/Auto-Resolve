import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '../../context/ThemeContext'
import { getTickets, updateTicketStatus, getAdminSession } from '../../lib/api'
import { cn, getCategoryIcon, getSentimentEmoji, getUrgencyInfo, formatDate } from '../../lib/utils'

interface TicketData {
  ticket_id: string; session_id: string; category: string; urgency: string; sentiment: string
  ticket_status: string; first_message: string; message_count: number; failed_attempts: number; created_at: string
}

export default function TicketsTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const fetchTickets = useCallback(async () => {
    try { setTickets(await getTickets().then(d => Array.isArray(d) ? d : [])) } catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchTickets() }, [fetchTickets])

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    try {
      await updateTicketStatus(sessionId, newStatus)
      setTickets(prev => prev.map(t => t.session_id === sessionId ? { ...t, ticket_status: newStatus } : t))
      toast.success(`Ticket status updated to ${newStatus}`)
    } catch { toast.error('Failed to update ticket status') }
  }

  const viewConversation = async (sessionId: string) => {
    try { setSelectedSession(await getAdminSession(sessionId)); setShowModal(true) }
    catch { toast.error('Failed to load conversation') }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/25' : 'bg-rose-50 text-rose-700 border-rose-200'
      case 'in_progress': return isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-amber-50 text-amber-700 border-amber-200'
      case 'resolved': return isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default: return isDark ? 'bg-gray-500/15 text-gray-300' : 'bg-gray-50 text-gray-700'
    }
  }

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '20px',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)',
    backdropFilter: 'blur(24px)',
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  )

  if (tickets.length === 0) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-5 shadow-xl shadow-cyan-500/20">
        <PartyPopper size={28} className="text-white" />
      </div>
      <h2 className={cn('text-xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>No escalations 🎉</h2>
      <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-500')}>All issues are being resolved by AI. Great job!</p>
    </motion.div>
  )

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn('border-b', isDark ? 'border-white/[0.06]' : 'border-black/[0.05]')}>
                {['Ticket ID', 'Issue', 'Category', 'Urgency', 'Sentiment', 'Status', 'Time', ''].map(h => (
                  <th key={h} className={cn('px-5 py-4 text-left text-[10px] font-bold uppercase tracking-widest',
                    isDark ? 'text-gray-500' : 'text-gray-400')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, i) => {
                const sentiment = getSentimentEmoji(ticket.sentiment)
                const urgency = getUrgencyInfo(ticket.urgency)
                return (
                  <motion.tr key={ticket.ticket_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn('border-b transition-colors',
                      isDark ? 'border-white/[0.04] hover:bg-white/[0.03]' : 'border-black/[0.03] hover:bg-black/[0.01]')}>
                    <td className={cn('px-5 py-4 font-mono text-xs font-semibold', isDark ? 'text-cyan-300' : 'text-cyan-700')}>
                      {ticket.ticket_id?.slice(0, 8) || '—'}
                    </td>
                    <td className={cn('px-5 py-4 text-sm max-w-[200px] truncate', isDark ? 'text-gray-200' : 'text-gray-700')}>
                      {ticket.first_message || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
                        isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200')}>
                        {getCategoryIcon(ticket.category)} {ticket.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', urgency.color)}>
                        <span className={cn('w-2 h-2 rounded-full', urgency.dotColor)} /> {urgency.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">{sentiment.emoji} {sentiment.label}</td>
                    <td className="px-5 py-4">
                      <select value={ticket.ticket_status || 'open'}
                        onChange={e => handleStatusChange(ticket.session_id, e.target.value)}
                        className={cn('px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer outline-none',
                          getStatusColor(ticket.ticket_status), isDark ? 'bg-transparent' : '')}>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className={cn('px-5 py-4 text-xs font-medium', isDark ? 'text-gray-500' : 'text-gray-400')}>
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => viewConversation(ticket.session_id)}
                        className={cn('p-2.5 rounded-xl transition-colors',
                          isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800')}>
                        <Eye size={16} />
                      </motion.button>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversation Slide-over */}
      <AnimatePresence>
        {showModal && selectedSession && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg h-full overflow-y-auto p-6"
              style={{
                background: isDark ? '#0d0d14' : '#ffffff',
                borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
              }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Conversation</h2>
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
                      {msg.content || msg.message}
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
