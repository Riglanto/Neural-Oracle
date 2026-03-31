import { useState } from 'react'

const C = {
  blue: '#3080ff', indigo: '#625fff', purple: '#ac4bff', green: '#00c758', red: '#fb2c36',
  bg: '#0c0c0e', surface: '#141416', surface2: '#1c1c1f', border: '#2a2a2e', text: '#a1a1aa', textBright: '#fafafa',
  yellow: '#eab308',
}

type Validator = {
  name: string; icon: string; desc: string; address: string
  attention: number; engagement: number; stress: number; focus: number; cognitiveLoad: number
  focusMax: number
}

const validators: Validator[] = [
  { name: 'Careful Validator', icon: '\u{1F9E0}', desc: 'High attention, low stress, deep focus sessions',
    address: '0x2e5fEA809Cc4679DdEc0c6cEB5F9f5B34Ce6263F',
    attention: 92, engagement: 88, stress: 12, focus: 50, cognitiveLoad: 30, focusMax: 65 },
  { name: 'Rushed Validator', icon: '\u{26A1}', desc: 'Low attention, high stress, minimal focus time',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    attention: 28, engagement: 25, stress: 80, focus: 7, cognitiveLoad: 85, focusMax: 11 },
  { name: 'Distracted Validator', icon: '\u{1F4F1}', desc: 'Variable attention, moderate stress and engagement',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    attention: 50, engagement: 42, stress: 50, focus: 20, cognitiveLoad: 55, focusMax: 30 },
]

function computeScore(v: Validator) {
  const focusNorm = (v.focus / v.focusMax) * 100
  return Math.round(
    v.attention * 0.30 + v.engagement * 0.25 + (100 - v.stress) * 0.20 + focusNorm * 0.15 + (100 - v.cognitiveLoad) * 0.10
  )
}

function classify(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'HIGH', color: C.green }
  if (score >= 50) return { label: 'MEDIUM', color: C.yellow }
  return { label: 'LOW', color: C.red }
}

function barColor(value: number, inverted: boolean) {
  const effective = inverted ? 100 - value : value
  if (effective >= 70) return C.green
  if (effective >= 40) return C.indigo
  return C.red
}

function SignalBar({ label, value, weight, inverted = false, unit = '' }: {
  label: string; value: number; weight: string; inverted?: boolean; unit?: string
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1 text-sm">
        <span style={{ color: C.textBright }}>{label} <span style={{ color: C.text }}>({weight}){inverted ? ' - inverted' : ''}</span></span>
        <span style={{ color: C.textBright }} className="font-mono">{value}{unit}</span>
      </div>
      <div className="w-full h-3" style={{ background: C.surface2 }}>
        <div className="h-full transition-all duration-500" style={{
          width: `${Math.min(value, 100)}%`,
          background: barColor(value, inverted),
        }} />
      </div>
    </div>
  )
}

const steps = [
  { num: '01', title: 'BCI Signals', desc: 'EEG headset captures raw neural signals during validation tasks' },
  { num: '02', title: 'Neural Agent', desc: 'Autonomous agent processes signals into attention, engagement, stress metrics' },
  { num: '03', title: 'NeuralOracle.sol', desc: 'On-chain oracle contract computes weighted confidence score' },
  { num: '04', title: 'ERC-8004 Registry', desc: 'Score recorded as verifiable reputation in the identity registry' },
]

const stats = [
  { label: 'Validators active', value: '3' },
  { label: 'Agents scored', value: '5' },
  { label: 'Avg confidence', value: '72' },
  { label: 'On-chain records', value: '15' },
]

export default function App() {
  const [selected, setSelected] = useState(0)
  const [search, setSearch] = useState('')
  const [searchError, setSearchError] = useState(false)
  const v = validators[selected]
  const score = computeScore(v)
  const cls = classify(score)
  const focusNorm = Math.round((v.focus / v.focusMax) * 100)

  const doSearch = () => {
    const idx = validators.findIndex(x => x.address.toLowerCase() === search.trim().toLowerCase())
    if (idx >= 0) { setSelected(idx); setSearchError(false) }
    else setSearchError(true)
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: C.purple }}>Neural Oracle</span>
          <span className="text-sm" style={{ color: C.text }}>BCI Trust Scoring</span>
        </div>
        <a href="https://github.com/Riglanto/NeuralOracle" target="_blank" rel="noreferrer"
          className="text-sm hover:underline" style={{ color: C.blue }}>GitHub</a>
      </nav>

      {/* Hero */}
      <div className="text-center py-12 px-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <h1 className="text-3xl font-bold mb-3" style={{ color: C.textBright }}>Trust what the brain reveals.</h1>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed mb-6" style={{ color: C.text }}>
          BCI-powered validation scores for autonomous agents. Measures attention, engagement, and cognitive load to produce on-chain confidence scores.
        </p>
        <div className="flex max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Look up validator by address (0x...)"
            value={search}
            onChange={e => { setSearch(e.target.value); setSearchError(false) }}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            className="flex-1 px-4 py-3 text-sm font-mono focus:outline-none"
            style={{ background: C.surface, border: `1px solid ${searchError ? C.red : C.border}`, color: C.textBright, borderRight: 'none' }}
          />
          <button
            onClick={doSearch}
            className="px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.purple})` }}
          >
            Look up
          </button>
        </div>
        {searchError && <p className="text-xs mt-2" style={{ color: C.red }}>Validator not found</p>}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto p-6 gap-6">
        {/* Sidebar - Validator Profiles */}
        <div className="lg:w-72 shrink-0 flex flex-col gap-3">
          <h2 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: C.text }}>Validator Profiles</h2>
          {validators.map((val, i) => {
            const s = computeScore(val)
            const c = classify(s)
            const active = i === selected
            return (
              <button key={i} onClick={() => setSelected(i)}
                className="text-left p-4 transition-colors cursor-pointer"
                style={{
                  background: active ? C.surface2 : C.surface,
                  border: `1px solid ${active ? C.purple : C.border}`,
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{val.icon}</span>
                  <span className="font-medium text-sm" style={{ color: C.textBright }}>{val.name}</span>
                </div>
                <p className="text-xs mb-1" style={{ color: C.text }}>{val.desc}</p>
                <code className="text-[10px] block truncate mb-2" style={{ color: '#52525b' }}>{val.address}</code>
                <span className="text-xs font-mono lz-pill px-2 py-0.5" style={{ background: c.color + '22', color: c.color }}>
                  {c.label} ({s})
                </span>
              </button>
            )
          })}
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-6">
          {/* BCI Signals */}
          <div className="p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: C.text }}>
              BCI Signals — {v.name}
            </h2>
            <SignalBar label="Attention" value={v.attention} weight="30%" />
            <SignalBar label="Engagement" value={v.engagement} weight="25%" />
            <SignalBar label="Stress" value={v.stress} weight="20%" inverted />
            <SignalBar label="Focus Duration" value={focusNorm} weight="15%" unit={` (${v.focus}s)`} />
            <SignalBar label="Cognitive Load" value={v.cognitiveLoad} weight="10%" inverted />
          </div>

          {/* Confidence Score */}
          <div className="p-6 text-center" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: C.text }}>Confidence Score</h2>
            <div className="text-6xl font-bold font-mono mb-3 transition-all duration-500" style={{ color: cls.color }}>
              {score}
            </div>
            <span className="text-sm font-bold lz-pill px-4 py-1" style={{ background: cls.color + '22', color: cls.color }}>
              {cls.label} CONFIDENCE
            </span>
            <p className="mt-4 text-xs font-mono" style={{ color: C.text }}>
              {v.attention}*0.30 + {v.engagement}*0.25 + (100-{v.stress})*0.20 + {focusNorm}*0.15 + (100-{v.cognitiveLoad})*0.10
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xs font-bold tracking-widest uppercase mb-6 text-center" style={{ color: C.text }}>How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="text-2xl font-bold font-mono mb-2" style={{ color: C.purple }}>{s.num}</div>
              <div className="font-medium text-sm mb-1" style={{ color: C.textBright }}>{s.title}</div>
              <p className="text-xs leading-relaxed" style={{ color: C.text }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Network Stats */}
      <div className="max-w-6xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="p-5 text-center" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="text-2xl font-bold font-mono" style={{ color: C.blue }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: C.text }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs" style={{ color: C.text, borderTop: `1px solid ${C.border}` }}>
        Neural Oracle — Trust what the brain reveals. — ERC-8004 Validation
      </footer>
    </div>
  )
}
