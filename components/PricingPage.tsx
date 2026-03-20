// components/PricingPage.tsx
'use client';
import { useState } from 'react';
import { usePayment } from '@/hooks/usePayment';

interface Props { idToken: string; }

const PLANS = [
  {
    name: 'Free', price: { monthly: '₹0', yearly: '₹0' }, period: '',
    features: ['5 questions/day', 'Basic Kundli chart', 'Daily prediction', 'Dosha detection'],
    cta: 'Current Plan', popular: false, plan: null,
  },
  {
    name: 'Pro', price: { monthly: '₹99', yearly: '₹79' }, period: '/month',
    features: ['Unlimited questions', 'Detailed Kundli + Yogas', 'Transit alerts', 'Full remedy guide', 'Voice input', 'Multi-language', 'Priority support'],
    cta: 'Upgrade to Pro', popular: true, plan: 'pro' as const,
  },
  {
    name: 'Life Report', price: { monthly: '₹299', yearly: '₹299' }, period: '/one-time',
    features: ['Full 40-page life report', '10-year detailed forecast', 'Marriage compatibility', 'Career roadmap', 'PDF download', 'Email delivery within 24h'],
    cta: 'Get Full Report', popular: false, plan: 'report' as const,
  },
];

export default function PricingPage({ idToken }: Props) {
  const [billing, setBilling]     = useState<'monthly' | 'yearly'>('monthly');
  const { initiatePayment, loading } = usePayment(idToken);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="text-xs tracking-widest uppercase mb-1" style={{ color: '#D4AF37', opacity: 0.8 }}>✦ Sacred Plans</div>
        <h1 className="font-cinzel gradient-gold mb-3" style={{ fontSize: 'clamp(22px,3vw,30px)' }}>Choose Your Path</h1>
        <p className="text-sm max-w-md mx-auto" style={{ color: '#A89F7A' }}>
          Unlock the full power of Vedic wisdom with AI precision. All plans include authentic Swiss Ephemeris calculations.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex mt-6 p-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {(['monthly', 'yearly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className="px-5 py-2 rounded-full text-sm transition-all capitalize"
              style={{
                background: billing === b ? 'rgba(212,175,55,0.18)' : 'transparent',
                color: billing === b ? '#D4AF37' : '#A89F7A',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font-crimson)',
              }}>
              {b}{b === 'yearly' && ' (save 20%)'}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {PLANS.map(plan => (
          <div key={plan.name} className="glass rounded-2xl p-6 relative transition-all hover:-translate-y-1"
            style={{
              border: plan.popular ? '1px solid #D4AF37' : '1px solid rgba(212,175,55,0.18)',
              boxShadow: plan.popular ? '0 0 30px rgba(212,175,55,0.12)' : 'none',
              transition: 'all 0.3s',
            }}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 rounded-full text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37)', color: '#1a1200' }}>
                ⭐ Most Popular
              </div>
            )}

            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#A89F7A' }}>{plan.name}</div>
            <div>
              <span className="font-cinzel text-3xl" style={{ color: '#F5D572' }}>{plan.price[billing]}</span>
              <span className="text-sm" style={{ color: '#A89F7A' }}>{plan.period}</span>
            </div>

            <div className="my-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, #8B6914, transparent)' }} />

            <ul className="space-y-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#A89F7A' }}>
                  <span style={{ color: '#8B6914', fontSize: 10, marginTop: 4 }}>✦</span>{f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => plan.plan && initiatePayment(plan.plan)}
              disabled={!plan.plan || loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={plan.popular
                ? { background: 'linear-gradient(135deg, #8B6914, #D4AF37, #F5D572)', color: '#1a1200', border: 'none', cursor: plan.plan ? 'pointer' : 'default', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }
                : { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', cursor: plan.plan ? 'pointer' : 'default' }
              }>
              {loading ? 'Processing...' : plan.cta}
            </button>
            {plan.popular && (
              <p className="text-center text-xs mt-2" style={{ color: '#6B6347' }}>🔐 Secure via Razorpay</p>
            )}
          </div>
        ))}
      </div>

      {/* Pay per question */}
      <div className="rounded-2xl p-8 text-center mb-8"
        style={{ background: 'linear-gradient(135deg, rgba(123,47,190,0.1), rgba(212,175,55,0.05))', border: '1px solid rgba(123,47,190,0.25)' }}>
        <div className="font-cinzel text-xl gradient-gold mb-2">Pay Per Question</div>
        <div className="font-cinzel text-4xl mb-3" style={{ color: '#D4AF37' }}>₹10</div>
        <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: '#A89F7A' }}>
          No subscription needed. Ask one question and get a detailed AI astrologer response tied to your birth chart.
        </p>
        <button onClick={() => initiatePayment('per_question')} disabled={loading}
          className="px-8 py-3 rounded-xl text-sm transition-all disabled:opacity-50"
          style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', cursor: 'pointer', fontFamily: 'var(--font-crimson)' }}>
          Ask One Question — ₹10
        </button>
      </div>

      {/* Trust signals */}
      <div className="flex flex-wrap gap-6 justify-center">
        {['🔐 256-bit SSL', '🏆 50,000+ Users', '💯 Swiss Ephemeris', '📞 24/7 Support', '🇮🇳 Made in India'].map(t => (
          <div key={t} className="text-xs flex items-center gap-1.5" style={{ color: '#A89F7A' }}>{t}</div>
        ))}
      </div>
    </div>
  );
}

