import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Download, Plus, Send, Bot, Copy, ThumbsUp, ThumbsDown, AlertTriangle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { useTheme } from '../context/ThemeContext'
import { sendMessage, sendFeedback } from '../lib/api'
import { cn, getCategoryIcon, getSentimentEmoji, getUrgencyInfo, parseResolution, formatTime } from '../lib/utils'

interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
  displayedContent?: string
  timestamp: string
  sentiment?: string
  urgency?: string
  category?: string
  messageIndex?: number
  escalated?: boolean
  ticketId?: string
  feedbackGiven?: 'up' | 'down' | null
  awaitingConfirmation?: boolean
}

export default function ChatPage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem('chat-session-id'))
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding-complete'))
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [isEscalated, setIsEscalated] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { revealTimers.current.forEach(clearTimeout) }
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const revealWords = useCallback((msgId: string, fullContent: string) => {
    const words = fullContent.split(' ')
    let i = 0
    const reveal = () => {
      if (i <= words.length) {
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, displayedContent: words.slice(0, i).join(' ') } : m))
        i++
        if (i <= words.length) {
          const t = setTimeout(reveal, 30)
          revealTimers.current.push(t)
        }
      }
    }
    reveal()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading || isEscalated) return
    const userMsg: Message = { id: uuidv4(), role: 'user', content: input.trim(), timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    try {
      const data = await sendMessage(sessionId, userMsg.content)
      const newSid = data.session_id || sessionId
      if (newSid) { setSessionId(newSid); localStorage.setItem('chat-session-id', newSid) }
      setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, sentiment: data.sentiment, urgency: data.urgency } : m))
      const botMsg: Message = {
        id: uuidv4(), role: 'bot', content: data.reply, displayedContent: '', timestamp: new Date().toISOString(),
        category: data.category, messageIndex: data.message_index, escalated: data.escalated,
        ticketId: data.ticket_id, awaitingConfirmation: data.awaiting_confirmation, feedbackGiven: null,
      }
      setMessages(prev => [...prev, botMsg])
      revealWords(botMsg.id, data.reply)
      if (data.escalated) setIsEscalated(true)
    } catch { toast.error('Failed to send message. Please try again.') }
    finally { setIsLoading(false) }
  }

  const handleFeedback = async (msgId: string, messageIndex: number, helpful: boolean) => {
    try {
      if (!sessionId) return
      await sendFeedback(sessionId, messageIndex, helpful)
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedbackGiven: helpful ? 'up' : 'down' } : m))
      toast.success(helpful ? 'Thanks for the feedback! 🎉' : "Sorry to hear that. We'll improve!")
    } catch { toast.error('Failed to submit feedback') }
  }

  const handleExport = () => {
    const text = messages.map(m => {
      const time = formatTime(m.timestamp)
      return `[${time}] ${m.role === 'user' ? 'You' : 'Auto-Resolve'}: ${m.content}`
    }).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`
    a.click(); URL.revokeObjectURL(url)
    toast.success('Chat exported! 📄')
  }

  const handleNewChat = () => {
    setMessages([]); setSessionId(null); setIsEscalated(false)
    localStorage.removeItem('chat-session-id')
    toast.success('New chat started! ✨')
  }

  const finishOnboarding = () => {
    setShowOnboarding(false); localStorage.setItem('onboarding-complete', 'true')
    inputRef.current?.focus()
  }

  const onboardingSteps = [
    { icon: '💬', title: 'Describe Your Issue', desc: 'Tell us what\'s going wrong in plain language. Our AI understands context.' },
    { icon: '🤖', title: 'AI Resolution', desc: 'Get an instant, intelligent resolution powered by advanced AI.' },
    { icon: '✅', title: 'Confirm or Escalate', desc: 'Tell us if it worked. If not, we\'ll escalate to a human agent.' },
  ]

  const parsed = (content: string) => parseResolution(content)

  return (
    <div className="relative z-10 flex flex-col h-screen">
      {/* ───── ONBOARDING OVERLAY ───── */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-md mx-4 p-8 rounded-3xl"
              style={{
                background: isDark ? 'rgba(18, 18, 30, 0.95)' : 'rgba(255,255,255,0.95)',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.08)',
              }}>
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Sparkles size={22} className="text-white" />
                </div>
                <h2 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  Auto-Resolve
                </h2>
              </div>
              <div className="space-y-3 mb-8">
                {onboardingSteps.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: onboardingStep >= i ? 1 : 0.35, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={cn('flex items-start gap-4 p-4 rounded-2xl transition-all duration-300',
                      onboardingStep === i
                        ? isDark ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50 border border-cyan-200'
                        : 'border border-transparent'
                    )}>
                    <span className="text-3xl mt-0.5">{step.icon}</span>
                    <div>
                      <h3 className={cn('font-semibold text-sm', isDark ? 'text-white' : 'text-gray-900')}>{step.title}</h3>
                      <p className={cn('text-xs mt-1 leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-500')}>{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <button onClick={onboardingStep < 2 ? () => setOnboardingStep(s => s + 1) : finishOnboarding}
                className="btn-gradient w-full py-3.5 rounded-2xl text-white font-semibold text-sm shadow-lg shadow-cyan-500/20">
                {onboardingStep < 2 ? 'Next' : 'Get Started 🚀'}
              </button>
              <button onClick={finishOnboarding}
                className={cn('mt-3 w-full text-center text-xs py-1', isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600')}>
                Skip
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───── HEADER ───── */}
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className={cn('mx-4 mt-4 px-6 py-4 flex items-center justify-between rounded-2xl',
          isDark ? 'glass-card' : 'glass-card-light'
        )}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Bot size={18} className="text-white" />
          </div>
          <h1 className={cn('text-lg font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
            Auto-Resolve
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {[
            { icon: isDark ? Moon : Sun, action: toggleTheme, title: 'Toggle theme' },
            { icon: Download, action: handleExport, title: 'Export chat', disabled: messages.length === 0 },
            { icon: Plus, action: handleNewChat, title: 'New chat' },
          ].map((btn, i) => (
            <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={btn.action} disabled={btn.disabled} title={btn.title}
              className={cn('p-2.5 rounded-xl transition-colors',
                isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-800')}>
              <btn.icon size={18} />
            </motion.button>
          ))}
        </div>
      </motion.header>

      {/* ───── MESSAGES AREA ───── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {/* Empty state */}
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-xl shadow-cyan-500/20 glow-cyan">
                <Bot size={36} className="text-white" />
              </div>
            </motion.div>
            <h2 className={cn('text-3xl font-bold mb-3 tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
              How can I help you?
            </h2>
            <p className={cn('text-sm max-w-sm leading-relaxed mb-8', isDark ? 'text-gray-500' : 'text-gray-500')}>
              Describe your IT issue and I'll provide an instant AI-powered resolution.
            </p>
            <div className="flex flex-wrap gap-2.5 max-w-lg justify-center">
              {['🔒 Password Reset', '📧 Email Not Working', '📶 WiFi Issues', '🖥️ VPN Problems', '💻 Software Install'].map(q => (
                <motion.button key={q} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setInput(q.slice(2).trim())}
                  className={cn('px-5 py-2.5 rounded-2xl text-sm font-medium transition-all',
                    isDark
                      ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.12] border border-white/[0.08] hover:border-cyan-500/30 hover:text-cyan-300'
                      : 'bg-white text-gray-600 hover:bg-cyan-50 border border-gray-200 hover:border-cyan-300 hover:text-cyan-700 shadow-sm'
                  )}>
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] md:max-w-[65%]')}>
                {/* ── USER MESSAGE ── */}
                {msg.role === 'user' && (
                  <div>
                    <div className="rounded-2xl rounded-br-md px-5 py-3.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 text-white shadow-lg shadow-cyan-500/15">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                    {(msg.sentiment || msg.urgency) && (
                      <div className="flex items-center justify-end gap-2 mt-2 mr-1">
                        {msg.sentiment && (() => {
                          const s = getSentimentEmoji(msg.sentiment)
                          const colors: Record<string,string> = {
                            emerald: isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            slate: isDark ? 'bg-slate-500/15 text-slate-300 border-slate-500/20' : 'bg-slate-50 text-slate-700 border-slate-200',
                            amber: isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200',
                            rose: isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200',
                          }
                          return (
                            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border', colors[s.color] || colors.slate)}>
                              {s.emoji} {s.label}
                            </span>
                          )
                        })()}
                        {msg.urgency && (() => {
                          const u = getUrgencyInfo(msg.urgency)
                          return (
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border',
                              isDark ? 'bg-white/[0.05] border-white/[0.08] text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600')}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', u.dotColor)} />
                              {u.label}
                            </span>
                          )
                        })()}
                      </div>
                    )}
                    <span className={cn('text-[10px] mt-1 mr-1.5 block text-right', isDark ? 'text-gray-600' : 'text-gray-400')}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                )}

                {/* ── BOT MESSAGE ── */}
                {msg.role === 'bot' && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-cyan-500/20">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Escalation */}
                      {msg.escalated ? (
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                          className="rounded-2xl rounded-tl-md p-5"
                          style={{
                            background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)',
                            border: isDark ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(245,158,11,0.3)',
                            boxShadow: '0 4px 24px rgba(245,158,11,0.08)',
                          }}>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={18} className="text-amber-400" />
                            <span className={cn('font-bold text-sm', isDark ? 'text-amber-300' : 'text-amber-700')}>Escalated to Human Agent</span>
                          </div>
                          <p className={cn('text-sm mb-3 leading-relaxed', isDark ? 'text-gray-300' : 'text-gray-600')}>
                            {msg.displayedContent || msg.content}
                          </p>
                          {msg.ticketId && (
                            <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold',
                              isDark ? 'bg-white/[0.05] text-cyan-300 border border-white/[0.08]' : 'bg-gray-100 text-cyan-700 border border-gray-200')}>
                              🎫 Ticket: {msg.ticketId}
                            </div>
                          )}
                        </motion.div>
                      ) : (() => {
                        const resolution = parsed(msg.content)
                        if (resolution) {
                          return (
                            <div className="rounded-2xl rounded-tl-md overflow-hidden"
                              style={{
                                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
                              }}>
                              {/* Category header */}
                              <div className={cn('px-5 py-3.5 flex items-center gap-3 border-b',
                                isDark ? 'border-white/[0.06]' : 'border-black/[0.05]')}>
                                <span className="text-xl">{getCategoryIcon(resolution.category)}</span>
                                <span className={cn('px-3 py-1 rounded-full text-xs font-bold tracking-wide',
                                  isDark ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200')}>
                                  {resolution.category}
                                </span>
                              </div>
                              {/* Steps */}
                              <div className="p-5 space-y-3">
                                {resolution.steps.map((step, si) => (
                                  <motion.div key={si} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: si * 0.1 }} className="flex items-start gap-3">
                                    <div className="w-1 self-stretch rounded-full flex-shrink-0"
                                      style={{ background: 'linear-gradient(to bottom, #06b6d4, #3b82f6)' }} />
                                    <div className="flex items-start gap-2">
                                      <span className="text-cyan-400 font-bold text-sm mt-0.5 flex-shrink-0">{si + 1}.</span>
                                      <span className={cn('text-sm leading-relaxed', isDark ? 'text-gray-200' : 'text-gray-700')}>{step}</span>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                              {/* Confidence */}
                              {resolution.confidence > 0 && (
                                <div className={cn('px-5 py-3.5 border-t', isDark ? 'border-white/[0.06]' : 'border-black/[0.05]')}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={cn('text-xs font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>Confidence</span>
                                    <span className="text-xs font-bold text-cyan-400">{Math.round(resolution.confidence * 100)}%</span>
                                  </div>
                                  <div className={cn('h-2.5 rounded-full overflow-hidden', isDark ? 'bg-white/[0.06]' : 'bg-gray-100')}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${resolution.confidence * 100}%` }}
                                      transition={{ duration: 1, ease: 'easeOut' }}
                                      className="h-full rounded-full"
                                      style={{ background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)' }} />
                                  </div>
                                </div>
                              )}
                              {/* Actions */}
                              <div className={cn('px-5 py-3.5 border-t flex items-center justify-between', isDark ? 'border-white/[0.06]' : 'border-black/[0.05]')}>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                  onClick={() => { navigator.clipboard.writeText(resolution.resolution); toast.success('Copied! 📋') }}
                                  className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                                    isDark ? 'hover:bg-white/[0.06] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800')}>
                                  <Copy size={14} /> Copy
                                </motion.button>
                                {msg.messageIndex !== undefined && msg.feedbackGiven === null && (
                                  <div className="flex items-center gap-1">
                                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                      onClick={() => handleFeedback(msg.id, msg.messageIndex!, true)}
                                      className="p-2 rounded-xl hover:bg-emerald-500/15 text-gray-400 hover:text-emerald-400 transition-all">
                                      <ThumbsUp size={16} />
                                    </motion.button>
                                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                      onClick={() => handleFeedback(msg.id, msg.messageIndex!, false)}
                                      className="p-2 rounded-xl hover:bg-rose-500/15 text-gray-400 hover:text-rose-400 transition-all">
                                      <ThumbsDown size={16} />
                                    </motion.button>
                                  </div>
                                )}
                                {msg.feedbackGiven && (
                                  <span className={cn('text-xs font-semibold', msg.feedbackGiven === 'up' ? 'text-emerald-400' : 'text-rose-400')}>
                                    {msg.feedbackGiven === 'up' ? '👍 Helpful' : '👎 Not helpful'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        }
                        // Regular bot message
                        return (
                          <div className="rounded-2xl rounded-tl-md px-5 py-3.5"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                              boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                            }}>
                            <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-200' : 'text-gray-700')}>
                              {msg.displayedContent ?? msg.content}
                            </p>
                          </div>
                        )
                      })()}
                      <span className={cn('text-[10px] mt-1.5 ml-1 block', isDark ? 'text-gray-600' : 'text-gray-400')}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-cyan-500/20">
              <Bot size={16} className="text-white" />
            </div>
            <div className="rounded-2xl rounded-tl-md px-5 py-4"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
              }}>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[0,1,2].map(d => <div key={d} className={cn('w-2 h-2 rounded-full typing-dot', isDark ? 'bg-cyan-400' : 'bg-cyan-500')} />)}
                </div>
                <span className={cn('text-xs font-medium', isDark ? 'text-gray-500' : 'text-gray-400')}>thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ───── INPUT ───── */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 pb-5 pt-2">
        <div className={cn('flex items-center gap-3 p-2', isDark ? 'chat-input-container' : 'chat-input-container-light',
          isEscalated && 'opacity-40 pointer-events-none')}>
          <input ref={inputRef} type="text" value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isEscalated ? 'Chat has been escalated to a human agent' : 'Describe your IT issue...'}
            disabled={isEscalated || isLoading}
            className={cn('flex-1 px-4 py-3 bg-transparent outline-none text-sm font-medium',
              isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400')} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleSend} disabled={!input.trim() || isLoading || isEscalated}
            className={cn('p-3.5 rounded-xl transition-all',
              input.trim() && !isLoading
                ? 'btn-gradient text-white shadow-lg shadow-cyan-500/20'
                : isDark ? 'bg-white/[0.04] text-gray-600' : 'bg-gray-100 text-gray-300')}>
            <Send size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
