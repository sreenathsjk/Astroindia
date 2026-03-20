// components/ChatPage.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import type { AstroPrediction, ApiResponse } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content?: string;
  prediction?: AstroPrediction;
  typing?: boolean;
}

interface Props { idToken: string; language: string; }

const QUICK_Q = [
  'When will I get a job?',
  'Will I get married this year?',
  'Is 2025 good for my business?',
  'When will my finances improve?',
  'What are my lucky months in 2025?',
  'Should I change my career?',
];

export default function ChatPage({ idToken, language }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'bot',
      content: 'Namaste! 🙏 I am Acharya AI — your Vedic astrologer. I have analyzed your birth chart and am ready to answer your questions.\n\nYou may ask me about career, marriage, finances, health, spirituality, or any aspect of your life. I will give you specific, time-bound predictions tied to your planetary positions.',
    },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [quota, setQuota]       = useState<number | null>(null);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: question };
    const typingMsg: Message = { id: 'typing', role: 'bot', typing: true };
    setMessages(m => [...m, userMsg, typingMsg]);

    const history = messages.slice(-6).map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user' as 'user' | 'assistant',
      content: m.content || m.prediction?.prediction || '',
    })).filter(m => m.content);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ question, language, chatHistory: history }),
      });
      const data: ApiResponse<{ prediction: AstroPrediction }> = await res.json();

      if (!data.success) {
        setMessages(m => m.filter(x => x.id !== 'typing').concat({
          id: Date.now().toString(), role: 'bot',
          content: data.error === 'QUOTA_EXCEEDED'
            ? '⚠️ You\'ve reached today\'s free limit of 5 questions. Upgrade to Pro for unlimited access!'
            : (data.error || 'Something went wrong. Please try again.'),
        }));
        return;
      }

      setMessages(m => m.filter(x => x.id !== 'typing').concat({
        id: Date.now().toString(), role: 'bot',
        prediction: data.data!.prediction,
      }));
    } catch {
      setMessages(m => m.filter(x => x.id !== 'typing').concat({
        id: Date.now().toString(), role: 'bot',
        content: 'Connection error. Please check your internet and try again.',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 p-4 rounded-xl glass">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #4a1a8c, #8B6914)' }}>🔮</div>
        <div className="flex-1">
          <div className="font-semibold text-sm" style={{ color: '#FFF8E7' }}>Acharya AI</div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#4ade80' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            Online • Vedic Expert
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            style={{ maxWidth: '88%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', marginLeft: msg.role === 'user' ? 'auto' : 0 }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0`}
              style={{ background: msg.role === 'bot' ? 'linear-gradient(135deg, #4a1a8c, #8B6914)' : 'linear-gradient(135deg, #8B6914, #D4AF37)' }}>
              {msg.role === 'bot' ? '🔮' : '👤'}
            </div>
            <div className="rounded-2xl px-4 py-3 text-sm"
              style={{
                background: msg.role === 'user' ? 'rgba(212,175,55,0.10)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.12)'}`,
                borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                lineHeight: 1.6,
              }}>

              {msg.typing && (
                <div className="flex gap-1.5 items-center py-1">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              )}

              {msg.content && (
                <p style={{ color: '#EDE8D0', whiteSpace: 'pre-line' }}>{msg.content}</p>
              )}

              {msg.prediction && (
                <div className="space-y-3">
                  {[
                    { label: '📿 Prediction',           value: msg.prediction.prediction },
                    { label: '🪐 Astrological Reason',   value: msg.prediction.astrological_reason },
                    { label: '📅 Timeframe',             value: msg.prediction.timeframe },
                  ].map(s => (
                    <div key={s.label} style={{ borderLeft: '3px solid #8B6914', paddingLeft: 12 }}>
                      <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#D4AF37' }}>{s.label}</div>
                      <p style={{ color: s.label.includes('Timeframe') ? '#F5D572' : '#A89F7A', fontSize: 13, lineHeight: 1.6 }}>{s.value}</p>
                    </div>
                  ))}
                  <div style={{ borderLeft: '3px solid #8B6914', paddingLeft: 12 }}>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#D4AF37' }}>🪔 Remedies</div>
                    {msg.prediction.remedies.map((r, i) => (
                      <p key={i} style={{ color: '#A89F7A', fontSize: 13, marginBottom: 4 }}>• {r}</p>
                    ))}
                  </div>
                  {msg.prediction.confidence && (
                    <div className="flex items-center gap-2 mt-2">
                      <span style={{ fontSize: 11, color: '#6B6347' }}>Confidence</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.25)' }}>
                        {msg.prediction.confidence}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div className="flex gap-2 flex-wrap mb-3">
        {QUICK_Q.slice(0, 4).map(q => (
          <button key={q} onClick={() => ask(q)} disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
            style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)', color: '#A89F7A', cursor: 'pointer', fontFamily: 'var(--font-crimson)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#D4AF37')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(212,175,55,0.18)')}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 items-end p-3 rounded-2xl glass">
        <button className="text-xl pb-1 transition-opacity hover:opacity-70" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6347' }}
          title="Voice input (coming soon)">🎤</button>
        <textarea ref={textareaRef}
          className="flex-1 bg-transparent outline-none resize-none text-sm"
          style={{ color: '#EDE8D0', fontFamily: 'var(--font-crimson)', minHeight: 40, maxHeight: 120, lineHeight: 1.5 }}
          placeholder="Ask anything... career, marriage, finance, health..."
          value={input} rows={1}
          onChange={e => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
        />
        <button onClick={() => ask(input)} disabled={loading || !input.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          →
        </button>
      </div>
    </div>
  );
}

