import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { DonutChart, BarChart, AreaChart } from '@tremor/react'
import { Activity, Users, CheckCircle, AlertTriangle, TrendingUp, Star, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { getAnalytics } from '../../lib/api'
import { cn } from '../../lib/utils'

interface AnalyticsData {
  total_sessions: number; active_sessions: number; resolved_sessions: number; escalated_sessions: number
  resolution_rate: number; avg_confidence: number; total_messages: number
  category_breakdown: Record<string, number>; sentiment_breakdown: Record<string, number>
  urgency_breakdown: Record<string, number>; queries_by_hour: [string, number][]
  feedback: { total: number; helpful: number; unhelpful: number }; tickets: any[]
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayVal, setDisplayVal] = useState(0)
  const ref = useRef<number>()
  useEffect(() => {
    const start = displayVal; const diff = value - start
    if (diff === 0) return
    const duration = 800; const startTime = performance.now()
    const animate = (time: number) => {
      const elapsed = time - startTime; const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayVal(Math.round(start + diff * eased))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value])
  return <span>{displayVal}{suffix}</span>
}

export default function AnalyticsTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [data, setData] = useState<AnalyticsData | null>(null)

  const fetchData = async () => { try { setData(await getAnalytics()) } catch {} }
  useEffect(() => { fetchData(); const i = setInterval(fetchData, 10000); return () => clearInterval(i) }, [])

  if (!data) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  )

  const statCards = [
    { label: 'Total Sessions', value: data.total_sessions, icon: Users, gradient: 'from-cyan-400 to-blue-500' },
    { label: 'Active', value: data.active_sessions, icon: Activity, gradient: 'from-emerald-400 to-green-500' },
    { label: 'Resolved', value: data.resolved_sessions, icon: CheckCircle, gradient: 'from-violet-400 to-purple-500' },
    { label: 'Escalated', value: data.escalated_sessions, icon: AlertTriangle, gradient: 'from-rose-400 to-pink-500' },
    { label: 'Resolution Rate', value: Math.round((data.resolution_rate || 0) * 100), icon: TrendingUp, gradient: 'from-amber-400 to-orange-500', suffix: '%' },
    { label: 'Avg Confidence', value: Math.round((data.avg_confidence || 0) * 100), icon: Star, gradient: 'from-indigo-400 to-blue-500', suffix: '%' },
  ]

  const categoryData = Object.entries(data.category_breakdown || {}).map(([name, value]) => ({ name, value }))
  const sentimentData = Object.entries(data.sentiment_breakdown || {}).map(([name, value]) => ({ name, value }))
  const hourlyData = (data.queries_by_hour || []).map(([hour, count]) => ({ hour, queries: count }))
  const resolvedVsEscalated = [
    { name: 'Resolved', value: data.resolved_sessions || 0 },
    { name: 'Escalated', value: data.escalated_sessions || 0 },
  ]

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '20px',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)',
    backdropFilter: 'blur(24px)',
  }

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stat-card rounded-2xl p-5 hover:scale-[1.02] transition-transform" style={cardStyle}>
            <div className={cn('w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg', card.gradient)}
              style={{ boxShadow: `0 6px 20px rgba(0,0,0,0.2)` }}>
              <card.icon size={20} className="text-white" />
            </div>
            <p className={cn('text-3xl font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
              <AnimatedCounter value={card.value} suffix={card.suffix} />
            </p>
            <p className={cn('text-xs mt-1 font-medium', isDark ? 'text-gray-500' : 'text-gray-500')}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Category Breakdown', content: categoryData.length > 0 ? (
            <DonutChart data={categoryData} category="value" index="name"
              colors={['cyan', 'blue', 'violet', 'amber', 'rose', 'emerald', 'indigo', 'orange']}
              className="h-52" showAnimation />
          ) : <p className={cn('text-sm text-center py-12', isDark ? 'text-gray-600' : 'text-gray-400')}>No data yet</p> },
          { title: 'Resolved vs Escalated', content: (
            <BarChart data={resolvedVsEscalated} index="name" categories={['value']} colors={['cyan']}
              className="h-52" showAnimation />
          ) },
          { title: 'Sentiment Breakdown', content: sentimentData.length > 0 ? (
            <BarChart data={sentimentData} index="name" categories={['value']} colors={['violet']}
              className="h-52" layout="vertical" showAnimation />
          ) : <p className={cn('text-sm text-center py-12', isDark ? 'text-gray-600' : 'text-gray-400')}>No data yet</p> },
          { title: 'Queries by Hour', content: hourlyData.length > 0 ? (
            <AreaChart data={hourlyData} index="hour" categories={['queries']} colors={['cyan']}
              className="h-52" showAnimation curveType="monotone" />
          ) : <p className={cn('text-sm text-center py-12', isDark ? 'text-gray-600' : 'text-gray-400')}>No data yet</p> },
        ].map((chart, i) => (
          <motion.div key={chart.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }} className="rounded-2xl p-6" style={cardStyle}>
            <h3 className={cn('font-bold mb-5 text-sm tracking-wide', isDark ? 'text-white' : 'text-gray-900')}>{chart.title}</h3>
            {chart.content}
          </motion.div>
        ))}
      </div>

      {/* Feedback */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }} className="rounded-2xl p-6" style={cardStyle}>
        <h3 className={cn('font-bold mb-5 text-sm tracking-wide', isDark ? 'text-white' : 'text-gray-900')}>User Feedback</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className={cn('text-4xl font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
              <AnimatedCounter value={data.feedback?.total || 0} />
            </p>
            <p className={cn('text-xs mt-2 font-medium', isDark ? 'text-gray-500' : 'text-gray-500')}>Total Feedback</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsUp size={20} className="text-emerald-400" />
              <p className="text-4xl font-bold text-emerald-400 tracking-tight">
                <AnimatedCounter value={data.feedback?.helpful || 0} />
              </p>
            </div>
            <p className={cn('text-xs mt-1 font-medium', isDark ? 'text-gray-500' : 'text-gray-500')}>Helpful</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ThumbsDown size={20} className="text-rose-400" />
              <p className="text-4xl font-bold text-rose-400 tracking-tight">
                <AnimatedCounter value={data.feedback?.unhelpful || 0} />
              </p>
            </div>
            <p className={cn('text-xs mt-1 font-medium', isDark ? 'text-gray-500' : 'text-gray-500')}>Not Helpful</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
