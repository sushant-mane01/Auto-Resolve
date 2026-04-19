import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    'password': '🔒',
    'password reset': '🔒',
    'email': '📧',
    'email issues': '📧',
    'printer': '🖨️',
    'printer issues': '🖨️',
    'wifi': '📶',
    'wifi/network': '📶',
    'network': '📶',
    'vpn': '🖥️',
    'vpn issues': '🖥️',
    'software': '💻',
    'software installation': '💻',
    'performance': '⚡',
    'performance issues': '⚡',
    'access': '🔑',
    'access control': '🔑',
    'hardware': '🔧',
    'general': '❓',
  }
  const lower = category.toLowerCase()
  for (const [key, icon] of Object.entries(map)) {
    if (lower.includes(key)) return icon
  }
  return '🔧'
}

export function getSentimentEmoji(sentiment: string): { emoji: string; label: string; color: string } {
  const map: Record<string, { emoji: string; label: string; color: string }> = {
    positive: { emoji: '😊', label: 'Positive', color: 'emerald' },
    neutral: { emoji: '😐', label: 'Neutral', color: 'slate' },
    frustrated: { emoji: '😤', label: 'Frustrated', color: 'amber' },
    angry: { emoji: '😡', label: 'Angry', color: 'rose' },
  }
  return map[sentiment?.toLowerCase()] || map.neutral
}

export function getUrgencyInfo(urgency: string): { label: string; color: string; dotColor: string } {
  const map: Record<string, { label: string; color: string; dotColor: string }> = {
    low: { label: 'Low', color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
    medium: { label: 'Medium', color: 'text-amber-400', dotColor: 'bg-amber-400' },
    high: { label: 'High', color: 'text-orange-400', dotColor: 'bg-orange-400' },
    critical: { label: 'Critical', color: 'text-rose-400', dotColor: 'bg-rose-400' },
  }
  return map[urgency?.toLowerCase()] || map.low
}

export interface ParsedResolution {
  category: string
  resolution: string
  confidence: number
  steps: string[]
  raw: string
}

export function parseResolution(reply: string): ParsedResolution | null {
  if (!reply.includes('Issue Category:') && !reply.includes('Suggested Resolution:')) {
    return null
  }

  const categoryMatch = reply.match(/Issue Category:\s*(.+?)(?:\n|$)/i)
  const resolutionMatch = reply.match(/Suggested Resolution:\s*([\s\S]+?)(?=Confidence:|Did that resolve|$)/i)
  const confidenceMatch = reply.match(/Confidence:\s*(\d+(?:\.\d+)?)/i)

  const category = categoryMatch?.[1]?.trim() || 'General'
  const resolutionText = resolutionMatch?.[1]?.trim() || ''
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0

  // Parse numbered steps
  const stepRegex = /(?:^|\n)\s*(\d+)\.\s+(.+?)(?=\n\s*\d+\.|$)/gs
  const steps: string[] = []
  let match
  while ((match = stepRegex.exec(resolutionText)) !== null) {
    steps.push(match[2].trim())
  }

  // If no numbered steps found, treat the whole resolution as one step
  if (steps.length === 0 && resolutionText) {
    steps.push(resolutionText)
  }

  return { category, resolution: resolutionText, confidence, steps, raw: reply }
}

export function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function playBeep() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gain.gain.value = 0.3
    oscillator.start()
    setTimeout(() => {
      oscillator.stop()
      ctx.close()
    }, 100)
  } catch {
    // Audio not available
  }
}
