// components/AppShell.tsx
'use client';
import { useState } from 'react';
import { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import type { UserProfile } from '@/types';
import KundliPage from './KundliPage';
import ChatPage from './ChatPage';
import DailyPage from './DailyPage';
import Dashboard from './Dashboard';
import PricingPage from './PricingPage';

type Page = 'kundli' | 'chat' | 'daily' | 'dashboard' | 'pricing';

const NAV = [
  { id: 'kundli',    label: 'Kundli',    icon: '⭕' },
  { id: 'chat',      label: 'Ask AI',    icon: '🔮' },
  { id: 'daily',     label: 'Daily',     icon: '🌞' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'pricing',   label: 'Plans',     icon: '✦'  },
] as const;

const LANGUAGES = ['English', 'हिंदी', 'తెలుగు', 'தமிழ்', 'ಕನ್ನಡ', 'മലയാളം', 'বাংলা', 'मराठी'];

interface Props {
  user: User;
  profile: UserProfile | null;
  idToken: string;
}

export default function AppShell({ user, profile, idToken }: Props) {
  const [page, setPage]         = useState<Page>('kundli');
  const [language, setLanguage] = useState('English');

  const handleSignOut = async () => {
    if (confirm('Sign out of AstroAI India?')) await signOut(auth);
  };

  return (
    <div className="min-h-screen" style={{ background: '#080610' }}>

      {/* Cosmic background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(123,47,190,0.10) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.06) 0%, transparent 40%),
          radial-gradient(ellipse at 60% 80%, rgba(200,75,49,0.05) 0%, transparent 40%)`
      }} />

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-6"
        style={{ background: 'rgba(8,6,16,0.90)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>

        <div className="font-cinzel font-bold" style={{ fontSize: 15 }}>
          <span className="gradient-gold">AstroAI</span>
          <span style={{ color: '#8B6914', marginLeft: 4 }}>India</span>
          <span className="block text-xs font-normal" style={{ color: '#6B6347', letterSpacing: '0.1em' }}>Vedic Wisdom • AI Precision</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              className="px-4 py-2 rounded-full text-sm transition-all font-crimson"
              style={{
                background: page === n.id ? 'rgba(212,175,55,0.12)' : 'transparent',
                border: page === n.id ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
                color: page === n.id ? '#D4AF37' : '#A89F7A',
              }}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="text-xs rounded-lg px-2 py-1 outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)', color: '#A89F7A' }}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={handleSignOut}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg, #8B6914, #7B2FBE)', color: '#FFF8E7' }}
            title="Sign out">
            {profile?.name?.charAt(0) || user.phoneNumber?.slice(-2) || 'A'}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 pt-16" key={page}
        style={{ animation: 'pageEnter 0.35s ease forwards' }}>
        {page === 'kundli'    && <KundliPage    idToken={idToken} language={language} />}
        {page === 'chat'      && <ChatPage      idToken={idToken} language={language} />}
        {page === 'daily'     && <DailyPage     idToken={idToken} />}
        {page === 'dashboard' && <Dashboard     idToken={idToken} profile={profile} />}
        {page === 'pricing'   && <PricingPage   idToken={idToken} />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
        style={{ background: 'rgba(8,6,16,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(212,175,55,0.15)' }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className="flex-1 flex flex-col items-center py-2 gap-1 transition-all"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span style={{ fontSize: 9, color: page === n.id ? '#D4AF37' : '#6B6347', letterSpacing: '0.04em' }}>
              {n.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

