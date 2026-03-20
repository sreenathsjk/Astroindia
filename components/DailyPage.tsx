// components/DailyPage.tsx
'use client';
import { useState, useEffect } from 'react';
import type { DailyPrediction, ApiResponse } from '@/types';

interface Props { idToken: string; }

function ScoreDonut({ score, size = 90 }: { score: number; size?: number }) {
  const r = size * 0.4, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 10;
  const color = score >= 8 ? '#4ade80' : score >= 6 ? '#fbbf24' : '#f87171';
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeDasharray={`${circ * pct} ${circ}`} style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x={cx} y={cy + 2} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: color, fontFamily: 'var(--font-cinzel)', fontSize: size * 0.2, fontWeight: 700 }}>
        {score}
      </text>
    </svg>
  );
}

export default function DailyPage({ idToken }: Props) {
  const [data, setData]   = useState<DailyPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/daily', { headers: { 'Authorization': `Bearer ${idToken}` } })
      .then(r => r.json())
      .then((d: ApiResponse<DailyPrediction>) => { if (d.success && d.data) setData(d.data); })
      .finally(() => setLoading(false));
  }, [idToken]);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4 animate-pulse">🌞</div>
      <div className="font-cinzel text-sm tracking-widest" style={{ color: '#D4AF37', opacity: 0.7 }}>
        READING TODAY'S COSMIC WEATHER...
      </div>
    </div>
  );

  if (!data) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p style={{ color: '#A89F7A' }}>Please generate your Kundli first to get daily predictions.</p>
    </div>
  );

  const cats = [
    { key: 'career',  label: 'Career',  icon: '💼', advice: data.careerAdvice  },
    { key: 'love',    label: 'Love',    icon: '💕', advice: data.loveAdvice    },
    { key: 'health',  label: 'Health',  icon: '🌿', advice: data.healthAdvice  },
    { key: 'finance', label: 'Finance', icon: '💰', advice: data.financeAdvice },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: '#D4AF37', opacity: 0.8 }}>✦ Today's Cosmic Weather</div>
        <h1 className="font-cinzel gradient-gold" style={{ fontSize: 'clamp(20px,3vw,26px)' }}>Daily Prediction</h1>
        <p className="text-sm mt-1" style={{ color: '#A89F7A' }}>{today}</p>
      </div>

      {/* Overall */}
      <div className="glass rounded-2xl p-6 text-center glow-gold relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ fontSize: 200, opacity: 0.04 }}>☸</div>
        <div className="relative">
          <ScoreDonut score={data.scores.overall} size={100} />
          <div className="font-cinzel text-xl gradient-gold mt-2">Overall Score</div>
          <div className="text-sm mt-1" style={{ color: '#A89F7A' }}>
            Moon in {data.moonTransit} • Sun in {data.sunTransit}
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            {[['🎨', 'Lucky Color', data.luckyColor], ['🔢', 'Lucky Number', String(data.luckyNumber)], ['⏰', 'Lucky Time', data.luckyTime]].map(([icon, label, val]) => (
              <div key={label} className="px-3 py-1.5 rounded-full text-xs"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.18)' }}>
                {icon} {label}: <strong style={{ color: '#F5D572' }}>{val}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category scores */}
      <div className="grid grid-cols-2 gap-4">
        {cats.map(c => {
          const score = data.scores[c.key];
          const color = score >= 8 ? '#4ade80' : score >= 6 ? '#fbbf24' : '#f87171';
          return (
            <div key={c.key} className="glass rounded-xl p-4">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#A89F7A' }}>{c.icon} {c.label}</div>
              <div className="font-cinzel text-2xl mb-1" style={{ color }}>{score}<span className="text-sm">/10</span></div>
              <div className="h-1.5 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: score * 10 + '%', background: color, transition: 'width 0.8s ease' }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#6B6347' }}>{c.advice}</p>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest" style={{ color: '#D4AF37', opacity: 0.8 }}>Today's Alerts</div>
          {data.alerts.map((alert, i) => (
            <div key={i} className="flex gap-3 items-start p-3 rounded-xl text-sm"
              style={{
                background: alert.type === 'positive' ? 'rgba(74,222,128,0.06)' : 'rgba(251,191,36,0.06)',
                border: `1px solid ${alert.type === 'positive' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}`,
              }}>
              <span style={{ fontSize: 16 }}>{alert.type === 'positive' ? '✨' : '⚠️'}</span>
              <span style={{ color: '#EDE8D0', lineHeight: 1.5 }}>{alert.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

