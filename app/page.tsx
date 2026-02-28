'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { extractTextFromFile } from '@/lib/extractText'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Risk {
  level: 'high' | 'medium' | 'low'
  title: string
  description: string
}

interface Analysis {
  title: string
  documentType: string
  summary: string
  keyPoints: string[]
  risks: Risk[]
  importantDates: string[]
  partiesInvolved: string[]
  recommendation: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

type Tab = 'summary' | 'risks' | 'chat'

// ─── Icons ─────────────────────────────────────────────────────────────────

const Icon = {
  Upload: ({ className = 'w-6 h-6' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  ),
  File: ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Shield: ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
    </svg>
  ),
  ShieldFilled: ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.705-3.08zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zM12 15a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75v-.008A.75.75 0 0012 15z" clipRule="evenodd" />
    </svg>
  ),
  Chat: ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
  Send: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  ),
  Reset: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  Check: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  Calendar: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  Users: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  Sparkle: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  ),
  Warning: ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  Sun: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Moon: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ),
  Words: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
  ),
}

// ─── Risk level config ──────────────────────────────────────────────────────

const RISK_CFG = {
  high:   { emoji: '🔴', label: 'High Risk',   cls: 'risk-high',   bar: 'risk-card-high'   },
  medium: { emoji: '🟡', label: 'Medium Risk', cls: 'risk-medium', bar: 'risk-card-medium' },
  low:    { emoji: '🟢', label: 'Low Risk',    cls: 'risk-low',    bar: 'risk-card-low'    },
} as const

// ─── Components ────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  const cfg = RISK_CFG[level as keyof typeof RISK_CFG] ?? RISK_CFG.low
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className="text-xs leading-none">{cfg.emoji}</span>
      {cfg.label}
    </span>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  )
}

function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass-card p-6 space-y-3">
      <div className="skeleton h-4 w-24 rounded-full" />
      <div className="skeleton h-5 w-3/4 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton rounded" style={{ height: 14, width: `${85 - i * 10}%` }} />
      ))}
    </div>
  )
}

// ─── Gradient shield logo ───────────────────────────────────────────────────

function GradientShield() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <defs>
        <linearGradient id="lgShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path fill="url(#lgShield)" fillRule="evenodd"
        d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.705-3.08z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [documentText, setDocumentText] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [isDragging, setIsDragging] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Restore saved theme on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lx-theme') : null
    if (saved === 'dark') setIsDark(true)
  }, [])

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    if (typeof window !== 'undefined') localStorage.setItem('lx-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading])

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    setError('')
    setAnalysis(null)
    setChatMessages([])
    setIsExtracting(true)
    try {
      const text = await extractTextFromFile(f)
      setDocumentText(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
      setFile(null)
    } finally {
      setIsExtracting(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleAnalyze = async () => {
    if (!documentText) return
    setIsAnalyzing(true)
    setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: documentText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data)
      setActiveTab('summary')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return
    const question = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: question }])
    setIsChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          documentText,
          history: chatMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const reset = () => {
    setFile(null); setDocumentText(''); setAnalysis(null)
    setChatMessages([]); setError(''); setIsExtracting(false); setIsAnalyzing(false)
  }

  const tabs: { id: Tab; label: string; icon: keyof typeof Icon }[] = [
    { id: 'summary', label: 'Summary',       icon: 'File'   },
    { id: 'risks',   label: 'Risk Flags',    icon: 'Shield' },
    { id: 'chat',    label: 'Ask Questions', icon: 'Chat'   },
  ]

  const highRisks = analysis?.risks.filter(r => r.level === 'high').length ?? 0
  const wordCount = documentText ? documentText.split(/\s+/).filter(Boolean).length : 0

  return (
    <>
      {/* Animated mesh background */}
      <div className="mesh-bg" aria-hidden="true">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── Header ──────────────────────────────────────── */}
        <header style={{
          background: 'var(--header-glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            {/* Left: logo + wordmark */}
            <div className="flex items-center gap-3">
              <div className="logo-mark">
                <GradientShield />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  LexPlain
                </h1>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                  Legal Simplifier
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {file && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium transition-all"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-base)', background: 'var(--surface)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-base)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  <Icon.Reset className="w-3.5 h-3.5" />
                  New Document
                </button>
              )}
              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDark(d => !d)}
                className="theme-toggle"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle dark mode"
              >
                {isDark ? <Icon.Sun className="w-4 h-4" /> : <Icon.Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* ── Page body ───────────────────────────────────── */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">

          {/* ── UPLOAD STATE ──────────────────────────────── */}
          {!file && (
            <div className="animate-fade-up">

              {/* Hero */}
              <div className="text-center mb-14">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-7"
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(124,58,237,0.18)',
                  }}
                >
                  <span style={{ color: 'var(--accent)' }}><Icon.Sparkle className="w-3 h-3" /></span>
                  Powered by Gemini AI
                </div>

                <h2
                  className="gradient-text text-5xl font-black mb-5 leading-none"
                  style={{ letterSpacing: '-0.03em' }}
                >
                  Understand Any<br />Legal Document
                </h2>
                <p className="text-lg max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Upload a contract, NDA, or lease and get a plain-English breakdown&thinsp;—&thinsp;no law degree required.
                </p>
              </div>

              {/* Drop zone */}
              <div
                className={`drop-zone p-16 text-center mb-6 ${isDragging ? 'dragging' : ''}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                <div className="upload-icon-wrap mb-6">
                  <Icon.Upload className="w-8 h-8" />
                </div>

                <p className="font-bold text-xl mb-2" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  Drop your document here
                </p>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  or click to browse your files
                </p>
                <span className="stat-badge">
                  PDF &nbsp;·&nbsp; TXT
                </span>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: 'File'   as const, color: 'purple', title: 'Plain-English Summary', desc: 'Cut through legalese and get straight to what matters in seconds.' },
                  { icon: 'Shield' as const, color: 'amber',  title: 'Risk Detection',        desc: 'Identify clauses that could put you at a disadvantage.' },
                  { icon: 'Chat'   as const, color: 'cyan',   title: 'Ask Anything',          desc: 'Chat directly with your document and get instant answers.' },
                ].map(f => {
                  const Ic = Icon[f.icon]
                  return (
                    <div key={f.title} className="glass-card p-5 cursor-default">
                      <div className={`icon-badge icon-badge-${f.color} mb-4`}>
                        <Ic className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text)' }}>{f.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── FILE LOADED — NOT YET ANALYZED ────────────── */}
          {file && !analysis && !isAnalyzing && (
            <div className="animate-fade-up max-w-lg mx-auto">
              <div className="glass-card p-10 text-center">

                {/* File icon */}
                <div className="icon-badge icon-badge-purple mx-auto mb-5"
                  style={{ width: 64, height: 64, borderRadius: 16 }}>
                  <Icon.File className="w-7 h-7" />
                </div>

                {/* Filename */}
                <p className="font-bold text-lg mb-4" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {file.name}
                </p>

                {/* Stat badges */}
                <div className="flex justify-center gap-2 mb-8 flex-wrap">
                  <span className="stat-badge">
                    <Icon.File className="w-3 h-3" />
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                  {wordCount > 0 && (
                    <span className="stat-badge stat-badge-accent">
                      <Icon.Words className="w-3 h-3" />
                      {wordCount.toLocaleString()} words
                    </span>
                  )}
                </div>

                {isExtracting ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="spin-ring" />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Extracting text…</span>
                  </div>
                ) : (
                  <button onClick={handleAnalyze} disabled={!documentText}
                    className="btn-primary px-10 py-3 text-base rounded-xl">
                    Analyze Document
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-3 p-4 rounded-xl text-sm"
                  style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
                  <Icon.Warning className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── ANALYZING STATE ───────────────────────────── */}
          {isAnalyzing && (
            <div className="animate-fade-up">
              {/* Animated loading hero */}
              <div className="text-center py-16 mb-8">
                <div className="relative inline-flex items-center justify-center mb-7">
                  <div className="spin-ring" />
                  <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 1 }}>
                    <div className="logo-mark" style={{ width: 44, height: 44 }}>
                      <GradientShield />
                    </div>
                  </div>
                </div>
                <p className="font-bold text-xl mb-2" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  Analyzing your document
                </p>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  AI is reading and summarizing the legal content…
                </p>
                <div className="progress-track">
                  <div className="progress-fill" />
                </div>
              </div>

              {/* Skeleton preview */}
              <div className="space-y-4">
                <SkeletonCard lines={3} />
                <SkeletonCard lines={5} />
                <div className="grid grid-cols-2 gap-4">
                  <SkeletonCard lines={2} />
                  <SkeletonCard lines={2} />
                </div>
              </div>
            </div>
          )}

          {/* ── RESULTS ───────────────────────────────────── */}
          {analysis && !isAnalyzing && (
            <div className="animate-fade-up">

              {/* Document header */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest mb-2 font-mono gradient-text">
                      {analysis.documentType}
                    </span>
                    <h2 className="font-black text-2xl truncate" style={{ color: 'var(--text)', letterSpacing: '-0.025em' }}>
                      {analysis.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    {analysis.partiesInvolved.length > 0 && (
                      <span className="stat-badge">
                        <Icon.Users className="w-3 h-3" />
                        {analysis.partiesInvolved.length} {analysis.partiesInvolved.length === 1 ? 'party' : 'parties'}
                      </span>
                    )}
                    {highRisks > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full risk-high border">
                        🔴 {highRisks} high risk{highRisks > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 p-1 rounded-2xl w-fit"
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)' }}>
                {tabs.map(tab => {
                  const Ic = Icon[tab.icon as keyof typeof Icon]
                  const active = activeTab === tab.id
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={active
                        ? { background: 'linear-gradient(135deg, var(--grad-start), var(--grad-mid))', color: '#fff', boxShadow: '0 2px 12px var(--accent-glow-str)' }
                        : { color: 'var(--text-secondary)' }
                      }
                    >
                      <Ic className="w-4 h-4" />
                      {tab.label}
                      {tab.id === 'risks' && highRisks > 0 && (
                        <span className="ml-0.5 text-xs font-bold w-4 h-4 rounded-full inline-flex items-center justify-center"
                          style={active
                            ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                            : { background: 'var(--danger-bg)', color: 'var(--danger)' }
                          }
                        >
                          {highRisks}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* ── Summary ────────────────────────────────── */}
              {activeTab === 'summary' && (
                <div className="space-y-4 animate-fade-up">

                  {/* Summary card */}
                  <div className="glass-card p-6" style={{ borderLeft: '3px solid var(--accent)' }}>
                    <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2"
                      style={{ color: 'var(--accent)', letterSpacing: '0.06em' }}>
                      <span><Icon.Sparkle className="w-3.5 h-3.5" /></span>
                      What This Document Says
                    </h3>
                    <p className="leading-relaxed text-[0.95rem]" style={{ color: 'var(--text-secondary)' }}>
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Key points */}
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-base mb-4" style={{ color: 'var(--text)' }}>Key Points</h3>
                    <ul className="space-y-3">
                      {analysis.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                            <Icon.Check className="w-3 h-3" />
                          </span>
                          <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Parties + dates */}
                  {(analysis.partiesInvolved.length > 0 || analysis.importantDates.length > 0) && (
                    <div className="grid grid-cols-2 gap-4">
                      {analysis.partiesInvolved.length > 0 && (
                        <div className="glass-card p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="icon-badge icon-badge-blue" style={{ width: 32, height: 32, borderRadius: 8 }}>
                              <Icon.Users className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Parties Involved</h3>
                          </div>
                          <ul className="space-y-2">
                            {analysis.partiesInvolved.map((p, i) => (
                              <li key={i} className="text-sm font-mono flex items-center gap-2"
                                style={{ color: 'var(--text-secondary)' }}>
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.importantDates.length > 0 && (
                        <div className="glass-card p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="icon-badge icon-badge-cyan" style={{ width: 32, height: 32, borderRadius: 8 }}>
                              <Icon.Calendar className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Important Dates</h3>
                          </div>
                          <ul className="space-y-2">
                            {analysis.importantDates.map((d, i) => (
                              <li key={i} className="text-sm font-mono flex items-center gap-2"
                                style={{ color: 'var(--text-secondary)' }}>
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent-3)' }} />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="rounded-2xl p-5" style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.07), rgba(5,150,105,0.03))',
                    border: '1px solid var(--success-border)',
                  }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span style={{ color: 'var(--success)' }}>✦</span>
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--success)' }}>
                        Recommendation
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {analysis.recommendation}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Risks ──────────────────────────────────── */}
              {activeTab === 'risks' && (
                <div className="space-y-3 animate-fade-up">
                  {analysis.risks.length === 0 ? (
                    <div className="glass-card p-14 text-center">
                      <div className="icon-badge icon-badge-green mx-auto mb-4"
                        style={{ width: 56, height: 56, borderRadius: 16 }}>
                        <Icon.Check className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>No significant risks detected</p>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This document appears to be low-risk.</p>
                    </div>
                  ) : (
                    analysis.risks
                      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.level] - { high: 0, medium: 1, low: 2 }[b.level]))
                      .map((risk, i) => {
                        const cfg = RISK_CFG[risk.level as keyof typeof RISK_CFG] ?? RISK_CFG.low
                        return (
                          <div key={i} className={`glass-card p-5 ${cfg.bar}`}>
                            <div className="flex items-start gap-4">
                              <span className="text-xl leading-none flex-shrink-0 mt-0.5">{cfg.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <RiskBadge level={risk.level} />
                                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                                    {risk.title}
                                  </h4>
                                </div>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                  {risk.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  )}
                </div>
              )}

              {/* ── Chat ───────────────────────────────────── */}
              {activeTab === 'chat' && (
                <div className="glass-card flex flex-col overflow-hidden animate-fade-up" style={{ height: 548 }}>

                  {/* Chat header */}
                  <div className="px-5 py-3.5 flex items-center gap-3"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="icon-badge icon-badge-purple" style={{ width: 34, height: 34, borderRadius: 9 }}>
                      <Icon.Chat className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Document Q&amp;A</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ask anything about this document</p>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4"
                    style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'var(--surface-2)' }}>
                    {chatMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-5">
                        <div className="icon-badge icon-badge-cyan" style={{ width: 56, height: 56, borderRadius: 16 }}>
                          <Icon.Chat className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>Ask anything</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Get plain-English answers from your document
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[
                            'What are the termination clauses?',
                            'Can I get out of this contract?',
                            'What are my obligations?',
                            'Is there a non-compete clause?',
                          ].map(q => (
                            <button key={q} onClick={() => setChatInput(q)} className="suggestion-chip">{q}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="chat-assistant rounded-2xl"><TypingIndicator /></div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input row */}
                  <div className="p-4 flex gap-3"
                    style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                      placeholder="Ask a question about this document…"
                      className="flex-1 text-sm px-4 py-3 rounded-xl outline-none transition-all"
                      style={{
                        border: '1px solid var(--border-base)',
                        background: 'var(--surface-2)',
                        color: 'var(--text)',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-base)'; e.currentTarget.style.boxShadow = 'none' }}
                    />
                    <button
                      onClick={handleChat}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="btn-primary flex items-center gap-2 px-4 py-3 rounded-xl"
                    >
                      <Icon.Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <footer className="text-center py-8">
          <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            LexPlain&nbsp;·&nbsp;Powered by Gemini AI&nbsp;·&nbsp;Not a substitute for legal advice
          </p>
        </footer>

      </div>
    </>
  )
}
