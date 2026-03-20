// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/components/LoginPage';
import AppShell from '@/components/AppShell';

export default function Home() {
  const { user, profile, loading, idToken } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-bg">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">ॐ</div>
          <div className="font-cinzel text-cosmic-gold text-sm tracking-widest animate-pulse">
            LOADING YOUR COSMOS...
          </div>
        </div>
      </div>
    );
  }

  if (!user || !idToken) {
    return <LoginPage />;
  }

  return <AppShell user={user} profile={profile} idToken={idToken} />;
}
