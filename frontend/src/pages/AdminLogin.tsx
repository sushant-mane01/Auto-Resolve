import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '../context/ThemeContext'
import { adminLogin } from '../lib/api'
import { cn } from '../lib/utils'

export default function AdminLogin() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || loading) return
    setLoading(true); setError('')
    try {
      const data = await adminLogin(password)
      if (data.success && data.token) {
        localStorage.setItem('admin-token', data.token)
        toast.success('Welcome, Admin! 🎉')
        navigate('/admin/dashboard')
      } else { triggerError(data.message || 'Invalid credentials') }
    } catch { triggerError('Invalid password. Try again.') }
    finally { setLoading(false) }
  }

  const triggerError = (msg: string) => {
    setError(msg); setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
        <motion.div animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}
          className="w-full max-w-[420px] p-10 rounded-3xl"
          style={{
            background: isDark ? 'rgba(18, 18, 30, 0.8)' : 'rgba(255,255,255,0.9)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: isDark
              ? '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.06), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 25px 80px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
            backdropFilter: 'blur(24px)',
          }}>
          {/* Icon */}
          <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-xl shadow-cyan-500/25 glow-cyan">
              <Shield size={34} className="text-white" />
            </div>
          </motion.div>

          <h1 className={cn('text-2xl font-bold text-center mb-2 tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
            Admin Access
          </h1>
          <p className={cn('text-sm text-center mb-8', isDark ? 'text-gray-500' : 'text-gray-500')}>
            Enter your admin password to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className={cn('flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300',
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] focus-within:border-cyan-500/40 focus-within:bg-white/[0.06]'
                  : 'bg-gray-50 border-gray-200 focus-within:border-cyan-400 focus-within:bg-white',
                isDark ? 'focus-within:shadow-[0_0_20px_rgba(6,182,212,0.08)]' : 'focus-within:shadow-[0_0_20px_rgba(6,182,212,0.06)]'
              )}>
                <Lock size={18} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter password"
                  className={cn('flex-1 bg-transparent outline-none text-sm font-medium',
                    isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400')}
                  autoFocus />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className={cn('transition-colors p-1 rounded-lg', isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-rose-400 text-xs mt-2.5 ml-1 font-medium">{error}</motion.p>
              )}
            </div>

            <motion.button type="submit" disabled={loading || !password.trim()}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={cn('w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                password.trim()
                  ? 'btn-gradient text-white shadow-lg shadow-cyan-500/20'
                  : isDark ? 'bg-white/[0.04] text-gray-600 border border-white/[0.06]' : 'bg-gray-100 text-gray-300 border border-gray-200')}>
              {loading ? (<><Loader2 size={18} className="animate-spin" /> Signing in...</>) : 'Sign In'}
            </motion.button>
          </form>

          <div className="flex items-center justify-center gap-2 mt-8">
            <div className={cn('w-8 h-px', isDark ? 'bg-white/[0.06]' : 'bg-gray-200')} />
            <p className={cn('text-[10px] font-semibold tracking-widest uppercase', isDark ? 'text-gray-600' : 'text-gray-400')}>
              Auto-Resolve
            </p>
            <div className={cn('w-8 h-px', isDark ? 'bg-white/[0.06]' : 'bg-gray-200')} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
