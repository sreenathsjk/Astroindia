// hooks/useKundli.ts
'use client';
import { useState, useCallback } from 'react';
import type { KundliData, ApiResponse } from '@/types';

export function useKundli(idToken: string | null) {
  const [kundli, setKundli]   = useState<KundliData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const generateKundli = useCallback(async (formData: {
    name: string; dob: string; tob: string; pob: string;
  }) => {
    if (!idToken) { setError('Not authenticated'); return null; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/kundli/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(formData),
      });
      const data: ApiResponse<KundliData> = await res.json();
      if (!data.success || !data.data) throw new Error(data.error || 'Generation failed');
      setKundli(data.data);
      return data.data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg); return null;
    } finally { setLoading(false); }
  }, [idToken]);

  const fetchKundli = useCallback(async () => {
    if (!idToken) return null;
    setLoading(true);
    try {
      const res = await fetch('/api/kundli/generate', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      const data: ApiResponse<KundliData> = await res.json();
      if (data.success && data.data) { setKundli(data.data); return data.data; }
      return null;
    } finally { setLoading(false); }
  }, [idToken]);

  return { kundli, loading, error, generateKundli, fetchKundli, setKundli };
}
