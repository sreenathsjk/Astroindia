// app/layout.tsx
import type { Metadata } from 'next';
import { Cinzel_Decorative, Crimson_Pro, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const cinzel = Cinzel_Decorative({
  weight:   ['400', '700', '900'],
  subsets:  ['latin'],
  variable: '--font-cinzel',
  display:  'swap',
});

const crimson = Crimson_Pro({
  weight:  ['300', '400', '600'],
  style:   ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  weight:  ['300', '400', '600'],
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title:       'AstroAI India — Vedic Astrology Powered by AI',
  description: 'Get accurate Vedic birth chart (Kundli), AI-powered personalized predictions, Dasha analysis, Dosha detection, and personalized remedies.',
  keywords:    'Kundli, Vedic astrology, Jyotish, AI astrologer, birth chart, dasha, horoscope India',
  openGraph: {
    title:       'AstroAI India',
    description: 'Authentic Vedic Astrology + AI Predictions',
    type:        'website',
    locale:      'en_IN',
    siteName:    'AstroAI India',
  },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${crimson.variable} ${devanagari.variable}`}
    >
      <body className="bg-cosmic-bg text-cosmic-text font-crimson antialiased">
        {children}

        {/* Razorpay SDK */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

