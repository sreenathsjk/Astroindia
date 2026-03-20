// components/KundliPage.tsx
'use client';
import { useState, useEffect } from 'react';
import { useKundli } from '@/hooks/useKundli';
import type { KundliData } from '@/types';

const PLANETS_META: Record<string, { symbol: string; color: string }> = {
  Sun:     { symbol: '☉', color: '#FFB347' },
  Moon:    { symbol: '☽', color: '#C8D8E8' },
  Mars:    { symbol: '♂', color: '#FF6B6B' },
  Mercury: { symbol: '☿', color: '#90EE90' },
  Jupiter: { symbol: '♃', color: '#FFD700' },
  Venus:   { symbol: '♀', color: '#FFB6C1' },
  Saturn:  { symbol: '♄', color: '#8899AA' },
  Rahu:    { symbol: '☊', color: '#9B59B6' },
  Ketu:    { symbol: '☋', color: '#E74C3C' },
};

const SIGNS_SHORT = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis'];

interface Props { idToken: string; language: string; }

type Tab = 'chart' | 'planets' | 'dasha' | 'doshas';

export default function KundliPage({ idToken, language }: Props) {
  const { kundli, loading, error, generateKundli, fetchKundli } = useKundli(idToken);
  const [form, setForm]       = useState({ name: '', dob: '', tob: '', pob: '' });
  const [tab, setTab]         = useState<Tab>('chart');
  const [generated, setGenerated] = useState(false);

  useEffect(() => { fetchKundli().then(k => { if (k) setGenerated(true); }); }, []);

  const handleGenerate = async () => {
    const k = await generateKundli(form);
    if (k) setGenerated(true);
  };

  const getPlanetsInHouse = (h: number, k: KundliData) =>
    Object.entries(k.planets).filter(([, p]) => p.house === h).map(([n]) => n.slice(0, 2));

  const ZODIAC_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

  // North Indian chart layout: 4×4 grid
  const chartLayout = [
    { h: 12 }, { h: 1  }, { h: 2  }, { h: 3  },
    { h: 11 }, { center: true }, { center: true }, { h: 4  },
    { h: 10 }, { center: true }, { center: true }, { h: 5  },
    { h: 9  }, { h: 8  }, { h: 7  }, { h: 6  },
  ];

  const inputCls = "w-full px-4 py-3 rounded-xl text-base outline-none transition-all font-crimson"
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)', color: '#EDE8D0' }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: '#D4AF37', opacity: 0.8 }}>✦ Birth Chart</div>
        <h1 className="font-cinzel gradient-gold" style={{ fontSize: 'clamp(20px,3vw,28px)' }}>Kundli Generator</h1>
        <p className="text-sm mt-2" style={{ color: '#A89F7A' }}>Authentic Vedic calculations using Swiss Ephemeris</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass rounded-2xl p-6 glow-gold">
          <div className="flex items-center gap-3 mb-6">
            <span style={{ color: '#D4AF37', fontSize: 20 }}>ॐ</span>
            <span className="font-cinzel text-sm" style={{ color: '#F5D572' }}>Birth Details</span>
          </div>
          <div className="space-y-4">
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'e.g. Arjun Sharma' },
              { key: 'dob',  label: 'Date of Birth', type: 'date', placeholder: '' },
              { key: 'tob',  label: 'Time of Birth', type: 'time', placeholder: '' },
              { key: 'pob',  label: 'Place of Birth', type: 'text', placeholder: 'City, State, Country' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#A89F7A' }}>
                  {field.label}
                </label>
                <input type={field.type} className={inputCls} style={inputStyle}
                  placeholder={field.placeholder}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = '#D4AF37'}
                  onBlur={e => e.target.style.borderColor = 'rgba(212,175,55,0.18)'}
                />
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <button onClick={handleGenerate} disabled={loading || !form.name || !form.dob}
            className="w-full mt-6 py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37, #F5D572)', color: '#1a1200', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
            {loading ? '⟳ Calculating Planetary Positions...' : '✦ Generate Kundli'}
          </button>
          {loading && (
            <p className="text-center text-xs mt-3" style={{ color: '#6B6347', lineHeight: 1.6 }}>
              Fetching Swiss Ephemeris data...<br />Calculating Lagna, Nakshatras, Dashas...
            </p>
          )}
        </div>

        {/* Chart preview */}
        {generated && kundli && (
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-semibold text-base" style={{ color: '#FFF8E7' }}>{kundli.name}</div>
                <div className="text-xs mt-1" style={{ color: '#A89F7A' }}>{kundli.dob} • {kundli.tob} • {kundli.pob}</div>
              </div>
              <div className="flex gap-2 flex-col items-end">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                  {kundli.lagna} Lagna
                </span>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(123,47,190,0.12)', border: '1px solid rgba(123,47,190,0.3)', color: '#a78bfa' }}>
                  {kundli.nakshatra}
                </span>
              </div>
            </div>

            {/* North Indian Chart Grid */}
            <div className="grid grid-cols-4 gap-0.5 aspect-square max-w-64 mx-auto mb-4"
              style={{ border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8 }}>
              {chartLayout.map((cell, i) => {
                if (cell.center) {
                  if (i === 5) return (
                    <div key={i} className="col-span-2 row-span-2 flex flex-col items-center justify-center"
                      style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <span style={{ fontSize: 24, color: 'rgba(212,175,55,0.5)' }}>ॐ</span>
                      <span className="font-cinzel text-center mt-1" style={{ fontSize: 9, color: '#D4AF37' }}>
                        {kundli.lagna}<br />Lagna
                      </span>
                    </div>
                  );
                  return null;
                }
                const hp = getPlanetsInHouse(cell.h!, kundli);
                return (
                  <div key={i} className="relative flex flex-col items-center justify-center p-1"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.08)', minHeight: 52 }}>
                    <span className="absolute top-1 left-1.5" style={{ fontSize: 7, color: '#6B6347' }}>{cell.h}</span>
                    <span style={{ fontSize: 9, color: '#F5D572', marginBottom: 2 }}>
                      {kundli.houses[cell.h!]?.slice(0, 3)}
                    </span>
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {hp.map(p => (
                        <span key={p} style={{ fontSize: 8, color: '#A89F7A', background: 'rgba(212,175,55,0.08)', padding: '1px 2px', borderRadius: 2 }}>{p}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-6 text-center">
              <div>
                <div className="text-xs" style={{ color: '#6B6347', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dasha</div>
                <div className="text-sm font-semibold" style={{ color: '#F5D572' }}>{kundli.dasha.current} / {kundli.dasha.sub_dasha}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(212,175,55,0.2)' }} />
              <div>
                <div className="text-xs" style={{ color: '#6B6347', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Yoga</div>
                <div className="text-sm" style={{ color: '#F5D572' }}>{kundli.yogas[0] || '—'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail tabs */}
      {generated && kundli && (
        <div className="glass rounded-2xl p-6 mt-6">
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {(['chart','planets','dasha','doshas'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-xs transition-all capitalize"
                style={{
                  background: tab === t ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: tab === t ? '#D4AF37' : '#A89F7A',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-crimson)',
                }}>
                {t}
              </button>
            ))}
          </div>

          {/* Planets tab */}
          {tab === 'planets' && (
            <div className="space-y-2">
              {Object.entries(kundli.planets).map(([name, p]) => {
                const meta = PLANETS_META[name] || { symbol: '●', color: '#A89F7A' };
                return (
                  <div key={name} className="grid grid-cols-4 items-center gap-3 py-2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 18, color: meta.color }}>{meta.symbol}</span>
                      <span className="text-sm font-semibold" style={{ color: '#FFF8E7' }}>{name}</span>
                    </div>
                    <div>
                      <div className="text-sm" style={{ color: '#EDE8D0' }}>{p.sign} • H{p.house}</div>
                      <div className="text-xs" style={{ color: '#6B6347' }}>{p.degree.toFixed(1)}° {p.retrograde ? '℞' : ''}</div>
                    </div>
                    <div className="text-xs" style={{ color: '#A89F7A' }}>Strength</div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#A89F7A' }}>{p.strength}%</div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: p.strength + '%', background: meta.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chart tab */}
          {tab === 'chart' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#D4AF37', opacity: 0.8 }}>Key Details</div>
                {[
                  ['Lagna (Ascendant)', kundli.lagna],
                  ['Moon Sign (Rashi)', kundli.moonSign],
                  ['Sun Sign', kundli.sunSign],
                  ['Nakshatra', `${kundli.nakshatra} Pada ${kundli.nakshatraPada}`],
                  ['Nakshatra Lord', kundli.nakshatraLord],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm" style={{ color: '#A89F7A' }}>{label}</span>
                    <span className="text-sm font-semibold" style={{ color: '#EDE8D0' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#D4AF37', opacity: 0.8 }}>Active Yogas</div>
                {kundli.yogas.map(y => (
                  <div key={y} className="flex gap-2 items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#D4AF37', fontSize: 12 }}>✦</span>
                    <span className="text-sm" style={{ color: '#EDE8D0' }}>{y}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dasha tab */}
          {tab === 'dasha' && (
            <div>
              <div className="p-4 rounded-xl mb-6" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#A89F7A' }}>Current Mahadasha</div>
                <div className="font-cinzel text-2xl gradient-gold">{kundli.dasha.current} Dasha</div>
                <div className="text-sm mt-2" style={{ color: '#A89F7A' }}>
                  {kundli.dasha.start} → {kundli.dasha.end} • {kundli.dasha.remaining_years}y remaining
                </div>
                <div className="text-sm mt-3" style={{ color: '#A89F7A', lineHeight: 1.6 }}>
                  Antardasha: <strong style={{ color: '#D4AF37' }}>{kundli.dasha.sub_dasha}</strong> ({kundli.dasha.sub_start} → {kundli.dasha.sub_end})
                </div>
              </div>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#A89F7A' }}>Full Dasha Sequence</div>
              {kundli.dasha.sequence.map(d => {
                const isCurrent = d.planet === kundli.dasha.current;
                const meta = PLANETS_META[d.planet] || { symbol: '●', color: '#A89F7A' };
                return (
                  <div key={d.planet} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: isCurrent ? 1 : 0.5 }}>
                    <span style={{ fontSize: 16, color: meta.color }}>{meta.symbol}</span>
                    <span className="text-sm flex-1" style={{ color: isCurrent ? '#FFF8E7' : '#A89F7A', fontWeight: isCurrent ? 600 : 400 }}>{d.planet} Mahadasha</span>
                    <span className="text-xs" style={{ color: '#6B6347' }}>{d.start?.slice(0,4)} – {d.end?.slice(0,4)}</span>
                    {isCurrent && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>Active</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Doshas tab */}
          {tab === 'doshas' && (
            <div className="space-y-3">
              {[
                { key: 'manglik',    name: 'Manglik Dosha',        icon: '♂', desc: 'Mars in 1/4/7/8/12 houses' },
                { key: 'kaal_sarp',  name: 'Kaal Sarp Dosha',      icon: '🐍', desc: 'All planets between Rahu & Ketu' },
                { key: 'shani_dosha',name: 'Shani Dosha',          icon: '♄', desc: 'Saturn afflicts Moon or Lagna' },
                { key: 'pitru_dosha',name: 'Pitru Dosha',          icon: '🪔', desc: 'Sun conjunct Rahu or Ketu' },
                { key: 'gand_mool', name: 'Gand Mool Nakshatra', icon: '⭐', desc: 'Born in Gand Mool Nakshatra' },
              ].map(d => {
                const active = kundli.doshas[d.key as keyof typeof kundli.doshas];
                return (
                  <div key={d.key} className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.1)' }}>
                    <span style={{ fontSize: 22 }}>{d.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: '#FFF8E7' }}>{d.name}</div>
                      <div className="text-xs" style={{ color: '#6B6347' }}>{d.desc}</div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={active
                        ? { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }
                        : { background: 'rgba(74,222,128,0.10)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.22)' }
                      }>
                      {active ? '⚠ Present' : '✓ Clear'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

