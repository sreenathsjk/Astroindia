// components/Dashboard.tsx
'use client';
import { useEffect, useState } from 'react';
import { useKundli } from '@/hooks/useKundli';
import type { UserProfile } from '@/types';

interface Props { idToken: string; profile: UserProfile | null; }

const REMEDIES: Record<string, { gemstone: string; mantra: string; pooja: string; charity: string; lifestyle: string[] }> = {
  shani_dosha: {
    gemstone: 'Blue Sapphire (Neelam)', mantra: 'Om Sham Shanicharaya Namah',
    pooja: 'Shani Shanti Puja every Saturday', charity: 'Donate mustard oil and black sesame on Saturdays',
    lifestyle: ['Wear black on Saturdays', 'Feed crows and dogs daily', 'Light sesame oil lamp on Saturday evening'],
  },
  manglik: {
    gemstone: 'Red Coral (Moonga)', mantra: 'Om Angarakaya Namah',
    pooja: 'Mangal Shanti Puja on Tuesdays', charity: 'Donate red lentils and jaggery on Tuesdays',
    lifestyle: ['Pray at Hanuman temple every Tuesday', 'Avoid big decisions on Tuesdays', 'Wear red on Tuesdays'],
  },
  gand_mool: {
    gemstone: 'Pearl (Moti)', mantra: 'Om Namah Shivaya — 108 times daily',
    pooja: 'Gand Mool Nakshatra Shanti Puja', charity: 'Donate white items on Mondays',
    lifestyle: ['Regular Shiva puja at home', 'Fast on Mondays', 'Wear white on Mondays'],
  },
  kaal_sarp: {
    gemstone: 'Hessonite (Gomed)', mantra: 'Maha Mrityunjaya Mantra — 108 times',
    pooja: 'Kaal Sarp Dosh Puja at Trimbakeshwar', charity: 'Donate black sesame on Saturdays',
    lifestyle: ['Visit Shiva temple on Mondays', 'Keep silver snake idol in puja room'],
  },
  pitru_dosha: {
    gemstone: 'Ruby (Manik)', mantra: 'Om Suryaya Namah — 108 times',
    pooja: 'Pitru Paksha Shraadh Puja annually', charity: 'Donate food to Brahmins during Pitru Paksha',
    lifestyle: ['Perform Tarpan on Amavasya', 'Serve elderly parents lovingly', 'Plant a Peepal tree'],
  },
};

export default function Dashboard({ idToken, profile }: Props) {
  const { kundli, fetchKundli } = useKundli(idToken);
  const [activeDosha, setActiveDosha] = useState<string>('shani_dosha');

  useEffect(() => { fetchKundli(); }, []);

  useEffect(() => {
    if (kundli) {
      const first = Object.entries(kundli.doshas).find(([, v]) => v)?.[0];
      if (first) setActiveDosha(first);
    }
  }, [kundli]);

  const lifeScores = [
    { label: 'Career',    score: 78, color: '#4ade80', icon: '💼', detail: 'Mars in 10th house drives career ambition. Jupiter\'s 11th house aspect supports gains.' },
    { label: 'Wealth',    score: 65, color: '#fbbf24', icon: '💰', detail: 'Mercury in 2nd house strengthens financial acumen during Venus Mahadasha.' },
    { label: 'Marriage',  score: 71, color: '#f472b6', icon: '💍', detail: 'Rahu in 7th house delays but ensures a distinguished, unconventional partner.' },
    { label: 'Health',    score: 82, color: '#60a5fa', icon: '🌿', detail: 'Sun and Moon in Lagna gives strong vitality. Watch for heart and back.' },
    { label: 'Spiritual', score: 88, color: '#a78bfa', icon: '🕉️', detail: 'Ketu in Lagna gives deep spiritual inclination and psychic abilities.' },
  ];

  const marriageTimeline = [
    { year: '2025', prob: 55, note: 'Improving — Jupiter transit favorable' },
    { year: '2026', prob: 78, note: 'Highly favorable — Venus Dasha peak' },
    { year: '2027', prob: 65, note: 'Good — Rahu transit shifting' },
    { year: '2028', prob: 45, note: 'Moderate — Saturn transit period' },
  ];

  const remedy = REMEDIES[activeDosha] || REMEDIES['shani_dosha'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: '#D4AF37', opacity: 0.8 }}>✦ Life Insights</div>
        <h1 className="font-cinzel gradient-gold" style={{ fontSize: 'clamp(20px,3vw,26px)' }}>Your Cosmic Dashboard</h1>
        {kundli && <p className="text-sm mt-1" style={{ color: '#A89F7A' }}>{kundli.lagna} Lagna • {kundli.dasha.current} Mahadasha</p>}
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Current Dasha', value: kundli?.dasha.current || '—', sub: `${kundli?.dasha.remaining_years || '—'}y remaining`, icon: '🪐' },
          { label: 'Antardasha', value: kundli?.dasha.sub_dasha || '—', sub: `Ends ${kundli?.dasha.sub_end?.slice(0,7) || '—'}`, icon: '⭐' },
          { label: 'Active Yogas', value: String(kundli?.yogas.length || '—'), sub: kundli?.yogas[0] || 'Generate Kundli', icon: '✦' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div className="text-xs uppercase tracking-widest" style={{ color: '#A89F7A' }}>{s.label}</div>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
            </div>
            <div className="font-cinzel text-xl gradient-gold my-2">{s.value}</div>
            <div className="text-xs" style={{ color: '#6B6347' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Life scores */}
        <div className="glass rounded-2xl p-6">
          <div className="text-xs uppercase tracking-widest mb-5" style={{ color: '#D4AF37', opacity: 0.8 }}>Life Area Scores</div>
          {lifeScores.map(ls => (
            <div key={ls.label} className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-sm" style={{ color: '#EDE8D0' }}>{ls.icon} {ls.label}</span>
                <span className="font-cinzel text-sm" style={{ color: ls.color }}>{ls.score}</span>
              </div>
              <div className="h-1.5 rounded-full mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: ls.score + '%', background: `linear-gradient(90deg, ${ls.color}88, ${ls.color})`, transition: 'width 0.8s ease' }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#6B6347' }}>{ls.detail}</p>
            </div>
          ))}
        </div>

        {/* Marriage timeline */}
        <div className="glass rounded-2xl p-6">
          <div className="text-xs uppercase tracking-widest mb-5" style={{ color: '#D4AF37', opacity: 0.8 }}>Marriage Probability Timeline</div>
          {marriageTimeline.map(m => {
            const color = m.prob >= 70 ? '#4ade80' : m.prob >= 50 ? '#fbbf24' : '#f87171';
            return (
              <div key={m.year} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="font-cinzel text-sm" style={{ color: '#EDE8D0' }}>{m.year}</span>
                  <span className="text-sm" style={{ color }}>{m.prob}%</span>
                </div>
                <div className="h-1.5 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: m.prob + '%', background: color, transition: 'width 0.8s ease' }} />
                </div>
                <p className="text-xs" style={{ color: '#6B6347' }}>{m.note}</p>
              </div>
            );
          })}
          <div className="mt-4 p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', color: '#A89F7A' }}>
            <strong style={{ color: '#D4AF37' }}>AI Insight:</strong> 2026 is your strongest window. Jupiter transiting Cancer will aspect your 7th house directly while Venus Mahadasha peaks.
          </div>
        </div>
      </div>

      {/* Doshas & Remedies */}
      {kundli && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <div className="text-xs uppercase tracking-widest mb-4" style={{ color: '#D4AF37', opacity: 0.8 }}>Dosha Analysis</div>
            <div className="space-y-2">
              {Object.entries(kundli.doshas).map(([key, active]) => {
                const names: Record<string, string> = { manglik: 'Manglik', kaal_sarp: 'Kaal Sarp', shani_dosha: 'Shani', pitru_dosha: 'Pitru', gand_mool: 'Gand Mool' };
                const icons: Record<string, string> = { manglik: '♂', kaal_sarp: '🐍', shani_dosha: '♄', pitru_dosha: '🪔', gand_mool: '⭐' };
                return (
                  <div key={key} onClick={() => active && REMEDIES[key] && setActiveDosha(key)}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: activeDosha === key && active ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${activeDosha === key && active ? 'rgba(212,175,55,0.3)' : 'rgba(212,175,55,0.08)'}`,
                      cursor: active && REMEDIES[key] ? 'pointer' : 'default',
                    }}>
                    <span style={{ fontSize: 18 }}>{icons[key]}</span>
                    <span className="flex-1 text-sm" style={{ color: '#EDE8D0' }}>{names[key]} Dosha</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={active
                        ? { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.22)' }
                        : { background: 'rgba(74,222,128,0.10)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.22)' }
                      }>
                      {active ? '⚠ Present' : '✓ Clear'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl p-6 space-y-4"
            style={{ background: 'linear-gradient(135deg, rgba(139,105,20,0.1), rgba(212,175,55,0.04))', border: '1px solid rgba(212,175,55,0.22)' }}>
            <div className="text-xs uppercase tracking-widest" style={{ color: '#D4AF37', opacity: 0.8 }}>🪔 Prescribed Remedies</div>
            {[
              { label: '💎 Gemstone', value: remedy.gemstone },
              { label: '🕉️ Mantra', value: remedy.mantra },
              { label: '🪔 Pooja', value: remedy.pooja },
              { label: '🤲 Charity', value: remedy.charity },
            ].map(r => (
              <div key={r.label}>
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#D4AF37' }}>{r.label}</div>
                <div className="text-sm" style={{ color: '#A89F7A', lineHeight: 1.5 }}>{r.value}</div>
              </div>
            ))}
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#D4AF37' }}>🌿 Lifestyle</div>
              {remedy.lifestyle.map((item, i) => (
                <div key={i} className="text-xs flex gap-2 mb-1.5" style={{ color: '#A89F7A' }}>
                  <span style={{ color: '#8B6914' }}>•</span>{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

