// components/LoginPage.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { auth, setupRecaptcha } from '@/lib/firebase/client';
import { signInWithPhoneNumber, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type Step = 'phone' | 'otp' | 'name';

export default function LoginPage() {
  const [step, setStep]       = useState<Step>('phone');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [confirm, setConfirm] = useState<ConfirmationResult | null>(null);
  const otpRefs               = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaRef          = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    recaptchaRef.current = setupRecaptcha('recaptcha-container');
  }, []);

  const sendOtp = async () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit number'); return; }
    setLoading(true); setError('');
    try {
      const result = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        recaptchaRef.current!
      );
      setConfirm(result);
      setStep('otp');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6 || !confirm) return;
    setLoading(true); setError('');
    try {
      await confirm.confirm(code);
      setStep('name');
    } catch {
      setError('Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const saveName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const user = auth.currentUser!;
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        phone: `+91${phone}`,
        name: name.trim(),
        preferredLanguage: 'English',
        plan: 'free',
        questionsUsedToday: 0,
        questionsLimit: 5,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      }, { merge: true });
      // Page reloads automatically via onAuthStateChanged
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error saving profile');
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join('').length === 6) {
      setTimeout(verifyOtp, 300);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0d0b1e 0%, #080610 70%)' }}>

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-yellow-100 animate-pulse"
            style={{
              width: Math.random() * 2 + 1 + 'px', height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%', left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.1,
              animationDuration: 2 + Math.random() * 3 + 's',
              animationDelay: Math.random() * 2 + 's',
            }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-3xl p-10 shadow-2xl"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.05)' }}>

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="text-6xl mb-3" style={{ color: '#D4AF37' }}>ॐ</div>
            <h1 className="font-cinzel text-2xl font-bold gradient-gold">AstroAI India</h1>
            <p className="text-sm mt-1" style={{ color: '#A89F7A' }}>Vedic Wisdom • AI Precision</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-red-300 text-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              {error}
            </div>
          )}

          {/* Step: Phone */}
          {step === 'phone' && (
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#A89F7A' }}>
                Mobile Number
              </label>
              <div className="flex gap-2 mb-6">
                <div className="px-4 py-3 rounded-xl text-sm flex items-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)', color: '#A89F7A', whiteSpace: 'nowrap' }}>
                  🇮🇳 +91
                </div>
                <input
                  className="flex-1 px-4 py-3 rounded-xl text-base outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)', color: '#EDE8D0' }}
                  placeholder="10-digit mobile number"
                  value={phone} maxLength={10}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                  onFocus={e => e.target.style.borderColor = '#D4AF37'}
                  onBlur={e => e.target.style.borderColor = 'rgba(212,175,55,0.18)'}
                />
              </div>
              <button onClick={sendOtp} disabled={loading || phone.length < 10}
                className="w-full py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37, #F5D572)', color: '#1a1200', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>
              <p className="text-center text-xs mt-4" style={{ color: '#6B6347' }}>
                By continuing, you agree to our Terms & Privacy Policy
              </p>
            </div>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <div>
              <p className="text-center text-sm mb-6" style={{ color: '#A89F7A' }}>
                OTP sent to +91 {phone}
              </p>
              <div className="flex gap-2 justify-center mb-6">
                {otp.map((d, i) => (
                  <input key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.25)', color: '#FFF8E7', fontFamily: 'var(--font-cinzel)' }}
                    maxLength={1} value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && otpRefs.current[i - 1]?.focus()}
                    onFocus={e => e.target.style.borderColor = '#D4AF37'}
                    onBlur={e => e.target.style.borderColor = 'rgba(212,175,55,0.25)'}
                  />
                ))}
              </div>
              <button onClick={verifyOtp} disabled={loading || otp.join('').length < 6}
                className="w-full py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37, #F5D572)', color: '#1a1200' }}>
                {loading ? 'Verifying...' : 'Verify OTP ✓'}
              </button>
              <button onClick={() => setStep('phone')} className="w-full text-center text-sm mt-3 transition-colors"
                style={{ color: '#6B6347', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Change number
              </button>
            </div>
          )}

          {/* Step: Name */}
          {step === 'name' && (
            <div>
              <div className="text-center mb-6">
                <div className="text-2xl mb-2" style={{ color: '#F5D572' }}>✦ Verified ✦</div>
                <p className="text-sm" style={{ color: '#A89F7A' }}>Enter your name to begin</p>
              </div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#A89F7A' }}>Your Name</label>
              <input
                className="w-full px-4 py-3 rounded-xl text-base outline-none mb-6 transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.18)', color: '#EDE8D0' }}
                placeholder="e.g. Arjun Sharma"
                value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                onFocus={e => e.target.style.borderColor = '#D4AF37'}
                onBlur={e => e.target.style.borderColor = 'rgba(212,175,55,0.18)'}
              />
              <button onClick={saveName} disabled={loading || !name.trim()}
                className="w-full py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #8B6914, #D4AF37, #F5D572)', color: '#1a1200', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
                {loading ? 'Setting up...' : 'Begin My Cosmic Journey ✦'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" />
    </div>
  );
}

