import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, X, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '../../context/ThemeContext'
import { getKnowledgeBase, addKBEntry, updateKBEntry, deleteKBEntry, testKBQuery } from '../../lib/api'
import { cn, getCategoryIcon } from '../../lib/utils'

interface KBEntry { id: string; category: string; keywords: string[]; resolution: string; follow_up: string }
interface KBFormData { category: string; keywords: string; resolution: string; follow_up: string }
const emptyForm: KBFormData = { category: '', keywords: '', resolution: '', follow_up: '' }

export default function KBManagerTab() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [entries, setEntries] = useState<KBEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null)
  const [formData, setFormData] = useState<KBFormData>(emptyForm)
  const [testQuery, setTestQuery] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    try { setEntries(await getKnowledgeBase().then(d => Array.isArray(d) ? d : [])) } catch {} finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchEntries() }, [fetchEntries])

  const handleTestQuery = async () => {
    if (!testQuery.trim() || testing) return
    setTesting(true)
    try { setTestResult(await testKBQuery(testQuery)) } catch { toast.error('Test query failed') }
    finally { setTesting(false) }
  }

  const handleAdd = async () => {
    if (!formData.category.trim() || !formData.resolution.trim()) { toast.error('Category and resolution are required'); return }
    try {
      await addKBEntry({ category: formData.category, keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean), resolution: formData.resolution, follow_up: formData.follow_up })
      toast.success('Entry added! ✅'); setShowAddModal(false); setFormData(emptyForm); fetchEntries()
    } catch { toast.error('Failed to add entry') }
  }

  const handleEdit = async () => {
    if (!editingEntry) return
    try {
      await updateKBEntry(editingEntry.id, { category: formData.category, keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean), resolution: formData.resolution, follow_up: formData.follow_up })
      toast.success('Entry updated! ✅'); setEditingEntry(null); setFormData(emptyForm); fetchEntries()
    } catch { toast.error('Failed to update entry') }
  }

  const handleDelete = async (id: string) => {
    try { await deleteKBEntry(id); toast.success('Entry deleted'); setDeleteConfirm(null); fetchEntries() }
    catch { toast.error('Failed to delete entry') }
  }

  const openEdit = (entry: KBEntry) => {
    setEditingEntry(entry)
    setFormData({ category: entry.category, keywords: entry.keywords.join(', '), resolution: entry.resolution, follow_up: entry.follow_up })
  }

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '20px',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.04)',
    backdropFilter: 'blur(24px)',
  }

  const inputClass = cn('w-full px-4 py-3 rounded-2xl text-sm outline-none font-medium border transition-colors',
    isDark
      ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder:text-gray-500 focus:border-cyan-500/40'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400')

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  )

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div>
        <label className={cn('text-xs font-bold mb-2 block uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Category</label>
        <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., Password Reset" className={inputClass} />
      </div>
      <div>
        <label className={cn('text-xs font-bold mb-2 block uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Keywords (comma-separated)</label>
        <input type="text" value={formData.keywords} onChange={e => setFormData({ ...formData, keywords: e.target.value })}
          placeholder="password, reset, forgot, locked" className={inputClass} />
      </div>
      <div>
        <label className={cn('text-xs font-bold mb-2 block uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Resolution</label>
        <textarea value={formData.resolution} onChange={e => setFormData({ ...formData, resolution: e.target.value })}
          placeholder="Step-by-step resolution..." rows={4} className={cn(inputClass, 'resize-none')} />
      </div>
      <div>
        <label className={cn('text-xs font-bold mb-2 block uppercase tracking-wider', isDark ? 'text-gray-500' : 'text-gray-400')}>Follow Up</label>
        <input type="text" value={formData.follow_up} onChange={e => setFormData({ ...formData, follow_up: e.target.value })}
          placeholder="Follow-up question..." className={inputClass} />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setShowAddModal(false); setEditingEntry(null); setFormData(emptyForm) }}
          className={cn('px-5 py-2.5 rounded-xl text-sm font-semibold',
            isDark ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
          Cancel
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={isEdit ? handleEdit : handleAdd}
          className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
          {isEdit ? 'Update' : 'Add Entry'}
        </motion.button>
      </div>
    </div>
  )

  return (
    <>
      {/* Test Query */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 mb-4" style={cardStyle}>
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={18} className="text-cyan-400" />
          <h3 className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>Test Knowledge Base</h3>
        </div>
        <div className="flex gap-3">
          <input type="text" value={testQuery} onChange={e => setTestQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTestQuery()}
            placeholder="Type a test query..." className={cn(inputClass, 'flex-1')} />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleTestQuery} disabled={testing || !testQuery.trim()}
            className="btn-gradient px-6 py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-cyan-500/20">
            {testing ? 'Testing...' : 'Test'}
          </motion.button>
        </div>
        <AnimatePresence>
          {testResult && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 rounded-2xl p-5"
              style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
              }}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-bold', isDark ? 'text-gray-500' : 'text-gray-400')}>Category:</span>
                  <span className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                    {getCategoryIcon(testResult.issue_category)} {testResult.issue_category}
                  </span>
                </div>
                <div>
                  <span className={cn('text-xs font-bold', isDark ? 'text-gray-500' : 'text-gray-400')}>Resolution:</span>
                  <p className={cn('text-sm mt-1 leading-relaxed', isDark ? 'text-gray-200' : 'text-gray-700')}>{testResult.resolution}</p>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <span className={cn('text-xs font-medium', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    Confidence: <strong className="text-cyan-400">{Math.round((testResult.confidence || 0) * 100)}%</strong>
                  </span>
                  <span className={cn('text-xs font-medium', isDark ? 'text-gray-500' : 'text-gray-400')}>
                    Source: <strong>{testResult.source}</strong>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* KB Entries */}
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }} className="rounded-2xl overflow-hidden" style={cardStyle}>
            <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              className={cn('w-full flex items-center justify-between px-6 py-5 text-left transition-colors',
                isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50')}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{getCategoryIcon(entry.category)}</span>
                <span className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>{entry.category}</span>
                <div className="flex gap-1.5 ml-2">
                  {(entry.keywords || []).slice(0, 3).map(kw => (
                    <span key={kw} className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                      isDark ? 'bg-white/[0.04] text-gray-400 border-white/[0.06]' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                      {kw}
                    </span>
                  ))}
                  {(entry.keywords || []).length > 3 && (
                    <span className={cn('text-[10px] font-medium', isDark ? 'text-gray-600' : 'text-gray-400')}>+{entry.keywords.length - 3}</span>
                  )}
                </div>
              </div>
              {expandedId === entry.id ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>
            <AnimatePresence>
              {expandedId === entry.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className={cn('px-6 pb-5 border-t', isDark ? 'border-white/[0.06]' : 'border-black/[0.05]')}>
                    <div className="pt-5 space-y-4">
                      <div>
                        <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Keywords</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(entry.keywords || []).map(kw => (
                            <span key={kw} className={cn('px-3 py-1 rounded-full text-xs font-semibold border',
                              isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200')}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Resolution</p>
                        <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-200' : 'text-gray-700')}>{entry.resolution}</p>
                      </div>
                      {entry.follow_up && (
                        <div>
                          <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-gray-500' : 'text-gray-400')}>Follow Up</p>
                          <p className={cn('text-sm leading-relaxed', isDark ? 'text-gray-200' : 'text-gray-700')}>{entry.follow_up}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openEdit(entry)}
                          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors',
                            isDark ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                          <Edit2 size={14} /> Edit
                        </motion.button>
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center gap-1">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => handleDelete(entry.id)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/25">
                              Confirm Delete
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => setDeleteConfirm(null)}
                              className={cn('px-4 py-2 rounded-xl text-xs font-semibold', isDark ? 'text-gray-400' : 'text-gray-500')}>
                              Cancel
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors">
                            <Trash2 size={14} /> Delete
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className={cn('text-center py-20', isDark ? 'text-gray-600' : 'text-gray-400')}>
          <p className="text-sm font-medium">No knowledge base entries yet</p>
        </div>
      )}

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={() => { setShowAddModal(true); setFormData(emptyForm) }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl flex items-center justify-center z-40 btn-gradient text-white shadow-xl shadow-cyan-500/30">
        <Plus size={24} />
      </motion.button>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(showAddModal || editingEntry) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setShowAddModal(false); setEditingEntry(null); setFormData(emptyForm) }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl p-8"
              style={{
                background: isDark ? '#0d0d14' : '#ffffff',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
              }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
                  {editingEntry ? 'Edit Entry' : 'Add Entry'}
                </h2>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => { setShowAddModal(false); setEditingEntry(null); setFormData(emptyForm) }}
                  className={cn('p-2 rounded-xl', isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500')}>
                  <X size={20} />
                </motion.button>
              </div>
              {renderForm(!!editingEntry)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
