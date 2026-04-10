import { useState } from 'react'
import {
  SIGNS, SIGN_SYMBOLS,
  type ChartEntry, type Sign,
  computeAllPairs, groupScore, computeSuperlatives,
  type PairResult,
} from './astrology'
import './App.css'

let nextId = 1;

function emptyChart(): ChartEntry {
  return {
    id: String(nextId++),
    name: '',
    sun: 'Aries',
    moon: 'Aries',
    rising: 'Aries',
    venus: 'Aries',
    mercury: 'Aries',
  };
}

function SignSelect({ value, onChange, label }: {
  value: Sign; onChange: (s: Sign) => void; label: string;
}) {
  return (
    <label className="sign-select">
      <span className="sign-label">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value as Sign)}>
        {SIGNS.map(s => (
          <option key={s} value={s}>{SIGN_SYMBOLS[s]} {s}</option>
        ))}
      </select>
    </label>
  );
}

function ScoreBar({ score, size = 'normal' }: { score: number; size?: 'normal' | 'small' }) {
  const hue = score < 50 ? 0 : score < 70 ? 30 : score < 85 ? 200 : 270;
  return (
    <div className={`score-bar ${size}`}>
      <div className="score-fill" style={{
        width: `${score}%`,
        background: `hsl(${hue}, 70%, 60%)`,
      }} />
      <span className="score-text">{score}%</span>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 85) return '#c084fc';
  if (score >= 70) return '#60a5fa';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
}

function ChartForm({ chart, onUpdate, onRemove }: {
  chart: ChartEntry;
  onUpdate: (c: ChartEntry) => void;
  onRemove: () => void;
}) {
  const update = (field: keyof ChartEntry, val: string) =>
    onUpdate({ ...chart, [field]: val });

  return (
    <div className="chart-card">
      <div className="chart-header">
        <input
          className="name-input"
          placeholder="Name"
          value={chart.name}
          onChange={e => update('name', e.target.value)}
        />
        <button className="remove-btn" onClick={onRemove} title="Remove">x</button>
      </div>
      <div className="placements">
        <SignSelect label="Sun" value={chart.sun} onChange={v => update('sun', v)} />
        <SignSelect label="Moon" value={chart.moon} onChange={v => update('moon', v)} />
        <SignSelect label="Rising" value={chart.rising} onChange={v => update('rising', v)} />
        <SignSelect label="Venus" value={chart.venus} onChange={v => update('venus', v)} />
        <SignSelect label="Mercury" value={chart.mercury} onChange={v => update('mercury', v)} />
      </div>
    </div>
  );
}

function CompatibilityMatrix({ charts, pairs }: { charts: ChartEntry[]; pairs: PairResult[] }) {
  const pairMap = new Map<string, PairResult>();
  for (const p of pairs) {
    pairMap.set(`${p.personA}|${p.personB}`, p);
    pairMap.set(`${p.personB}|${p.personA}`, p);
  }

  return (
    <div className="matrix-wrapper">
      <table className="matrix">
        <thead>
          <tr>
            <th></th>
            {charts.map(c => (
              <th key={c.id} className="matrix-name">{c.name || '?'}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {charts.map(row => (
            <tr key={row.id}>
              <td className="matrix-name">{row.name || '?'}</td>
              {charts.map(col => {
                if (row.id === col.id) {
                  return <td key={col.id} className="matrix-cell self">{SIGN_SYMBOLS[row.sun]}</td>;
                }
                const pair = pairMap.get(`${row.name}|${col.name}`);
                const score = pair?.score ?? 0;
                return (
                  <td key={col.id} className="matrix-cell" style={{ color: scoreColor(score) }}>
                    {score}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PairDetail({ pair }: { pair: PairResult }) {
  return (
    <div className="pair-card">
      <div className="pair-names">
        {pair.personA} & {pair.personB}
      </div>
      <ScoreBar score={pair.score} />
      <div className="breakdown">
        {(['sun', 'moon', 'rising', 'venus', 'mercury'] as const).map(p => (
          <div key={p} className="breakdown-row">
            <span className="breakdown-label">{p}</span>
            <ScoreBar score={pair.breakdown[p]} size="small" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SuperlativeCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="superlative-card">
      <div className="superlative-title">{title}</div>
      <div className="superlative-content">{content}</div>
    </div>
  );
}

function App() {
  const [charts, setCharts] = useState<ChartEntry[]>([emptyChart(), emptyChart()]);
  const [showResults, setShowResults] = useState(false);
  const [selectedPair, setSelectedPair] = useState<PairResult | null>(null);

  const validCharts = charts.filter(c => c.name.trim());
  const canCalculate = validCharts.length >= 2;
  const pairs = showResults ? computeAllPairs(validCharts) : [];
  const group = showResults ? groupScore(pairs) : 0;
  const superlatives = showResults ? computeSuperlatives(validCharts, pairs) : null;

  const addChart = () => setCharts([...charts, emptyChart()]);
  const removeChart = (id: string) => {
    setCharts(charts.filter(c => c.id !== id));
    setShowResults(false);
  };
  const updateChart = (id: string, updated: ChartEntry) => {
    setCharts(charts.map(c => c.id === id ? updated : c));
    setShowResults(false);
  };

  return (
    <div className="app">
      <div className="stars" />
      <div className="stars2" />
      <div className="stars3" />

      <header>
        <h1>Co-Star Friends</h1>
        <p className="subtitle">Enter your group's charts to discover your cosmic compatibility</p>
      </header>

      <section className="input-section">
        <div className="charts-grid">
          {charts.map(c => (
            <ChartForm
              key={c.id}
              chart={c}
              onUpdate={updated => updateChart(c.id, updated)}
              onRemove={() => removeChart(c.id)}
            />
          ))}
        </div>

        <div className="actions">
          <button className="add-btn" onClick={addChart}>+ Add Friend</button>
          <button
            className="calculate-btn"
            disabled={!canCalculate}
            onClick={() => { setShowResults(true); setSelectedPair(null); }}
          >
            Read the Stars
          </button>
        </div>
      </section>

      {showResults && pairs.length > 0 && (
        <>
          <section className="results-section">
            <h2>Group Compatibility</h2>
            <div className="group-score">
              <div className="group-score-number" style={{ color: scoreColor(group) }}>
                {group}%
              </div>
              <ScoreBar score={group} />
            </div>
          </section>

          <section className="results-section">
            <h2>Compatibility Matrix</h2>
            <CompatibilityMatrix charts={validCharts} pairs={pairs} />
            <p className="hint">Click a pair below to see the full breakdown</p>
          </section>

          {superlatives && (
            <section className="results-section">
              <h2>Superlatives</h2>
              <div className="superlatives-grid">
                {superlatives.mostCompatible && (
                  <SuperlativeCard
                    title="Most Compatible"
                    content={`${superlatives.mostCompatible.personA} & ${superlatives.mostCompatible.personB} (${superlatives.mostCompatible.score}%)`}
                  />
                )}
                {superlatives.leastCompatible && superlatives.leastCompatible !== superlatives.mostCompatible && (
                  <SuperlativeCard
                    title="Least Compatible"
                    content={`${superlatives.leastCompatible.personA} & ${superlatives.leastCompatible.personB} (${superlatives.leastCompatible.score}%)`}
                  />
                )}
                {superlatives.bestSunMatch && (
                  <SuperlativeCard
                    title="Best Sun Match"
                    content={`${superlatives.bestSunMatch.personA} & ${superlatives.bestSunMatch.personB}`}
                  />
                )}
                {superlatives.bestMoonMatch && (
                  <SuperlativeCard
                    title="Deepest Emotional Bond"
                    content={`${superlatives.bestMoonMatch.personA} & ${superlatives.bestMoonMatch.personB}`}
                  />
                )}
                {superlatives.bestVenusMatch && (
                  <SuperlativeCard
                    title="Best Love Language Match"
                    content={`${superlatives.bestVenusMatch.personA} & ${superlatives.bestVenusMatch.personB}`}
                  />
                )}
                {superlatives.groupHeart && (
                  <SuperlativeCard
                    title="Group Heart"
                    content={`${superlatives.groupHeart} — most cosmically connected to everyone`}
                  />
                )}
                {superlatives.wildCard && (
                  <SuperlativeCard
                    title="Wild Card"
                    content={`${superlatives.wildCard} — most unpredictable compatibility`}
                  />
                )}
              </div>
            </section>
          )}

          <section className="results-section">
            <h2>All Pairs</h2>
            <div className="pairs-list">
              {[...pairs].sort((a, b) => b.score - a.score).map(p => (
                <button
                  key={`${p.personA}-${p.personB}`}
                  className={`pair-button ${selectedPair === p ? 'active' : ''}`}
                  onClick={() => setSelectedPair(selectedPair === p ? null : p)}
                >
                  <span>{p.personA} & {p.personB}</span>
                  <span style={{ color: scoreColor(p.score) }}>{p.score}%</span>
                </button>
              ))}
            </div>
            {selectedPair && <PairDetail pair={selectedPair} />}
          </section>
        </>
      )}

      <footer>
        <p>Co-Star Friends — for entertainment purposes only</p>
      </footer>
    </div>
  );
}

export default App
