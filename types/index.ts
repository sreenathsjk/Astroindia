// ─── KUNDLI TYPES ─────────────────────────────────────────────────────────────

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type Planet =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury'
  | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

export type Nakshatra =
  | 'Ashwini' | 'Bharani' | 'Krittika' | 'Rohini' | 'Mrigashira'
  | 'Ardra' | 'Punarvasu' | 'Pushya' | 'Ashlesha' | 'Magha'
  | 'Purva Phalguni' | 'Uttara Phalguni' | 'Hasta' | 'Chitra'
  | 'Swati' | 'Vishakha' | 'Anuradha' | 'Jyeshtha' | 'Mula'
  | 'Purva Ashadha' | 'Uttara Ashadha' | 'Shravana' | 'Dhanishta'
  | 'Shatabhisha' | 'Purva Bhadrapada' | 'Uttara Bhadrapada' | 'Revati';

export interface PlanetData {
  sign: ZodiacSign;
  house: number;          // 1–12
  degree: number;         // 0–30
  retrograde: boolean;
  strength: number;       // 0–100
  nakshatra?: Nakshatra;
  nakshatraPada?: number; // 1–4
}

export interface DashaData {
  current: Planet;
  start: string;          // ISO date
  end: string;
  remaining_years: number;
  sub_dasha: Planet;
  sub_start: string;
  sub_end: string;
  sequence: DashaPeriod[];
}

export interface DashaPeriod {
  planet: Planet;
  start: string;
  end: string;
  years: number;
}

export interface DoshaStatus {
  manglik: boolean;
  kaal_sarp: boolean;
  shani_dosha: boolean;
  pitru_dosha: boolean;
  gand_mool: boolean;
  manglik_details?: string;
  kaal_sarp_details?: string;
}

export interface KundliData {
  // Identity
  userId: string;
  name: string;
  dob: string;            // YYYY-MM-DD
  tob: string;            // HH:MM (local time)
  pob: string;            // "City, State, Country"
  latitude: number;
  longitude: number;
  timezone: string;       // e.g. "Asia/Kolkata"

  // Chart
  lagna: ZodiacSign;
  lagnaLord: Planet;
  lagnaLordDegree: number;
  moonSign: ZodiacSign;
  sunSign: ZodiacSign;
  nakshatra: Nakshatra;
  nakshatraPada: number;
  nakshatraLord: Planet;

  // Positions
  planets: Record<Planet, PlanetData>;
  houses: Record<number, ZodiacSign>;  // house 1–12 → sign

  // Time periods
  dasha: DashaData;

  // Afflictions & Yogas
  doshas: DoshaStatus;
  yogas: string[];

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ─── USER TYPES ───────────────────────────────────────────────────────────────

export type SupportedLanguage =
  | 'English' | 'Hindi' | 'Telugu' | 'Tamil'
  | 'Kannada' | 'Malayalam' | 'Bengali' | 'Marathi';

export type SubscriptionPlan = 'free' | 'pro' | 'report';

export interface UserProfile {
  userId: string;
  phone: string;
  name: string;
  email?: string;
  preferredLanguage: SupportedLanguage;
  plan: SubscriptionPlan;
  questionsUsedToday: number;
  questionsLimit: number;          // 5 free, unlimited pro
  kundliId?: string;
  createdAt: string;
  lastActiveAt: string;
}

// ─── CHAT TYPES ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  prediction?: AstroPrediction;
  timestamp: string;
}

export interface AstroPrediction {
  prediction: string;
  astrological_reason: string;
  timeframe: string;
  remedies: string[];
  confidence: string;
  planets_involved?: Planet[];
}

// ─── DAILY PREDICTION ─────────────────────────────────────────────────────────

export interface DailyScore {
  overall: number;        // 1–10
  career: number;
  love: number;
  health: number;
  finance: number;
}

export interface DailyAlert {
  type: 'positive' | 'caution' | 'warning';
  text: string;
  planet?: Planet;
}

export interface DailyPrediction {
  userId: string;
  date: string;           // YYYY-MM-DD
  scores: DailyScore;
  moonTransit: ZodiacSign;
  sunTransit: ZodiacSign;
  luckyColor: string;
  luckyNumber: number;
  luckyTime: string;
  alerts: DailyAlert[];
  careerAdvice: string;
  loveAdvice: string;
  healthAdvice: string;
  financeAdvice: string;
  cachedAt: string;
}

// ─── REMEDIES ─────────────────────────────────────────────────────────────────

export interface RemedyPlan {
  dosha: keyof DoshaStatus;
  gemstone: string;
  gemstoneDetails: string;
  mantra: string;
  mantraCount: number;
  pooja: string;
  poojaDay: string;
  charity: string;
  lifestyle: string[];
  yantra?: string;
  color?: string;
}

// ─── PAYMENT ──────────────────────────────────────────────────────────────────

export interface PaymentOrder {
  orderId: string;
  amount: number;         // in paise
  currency: 'INR';
  plan: SubscriptionPlan | 'per_question';
  userId: string;
  status: 'created' | 'paid' | 'failed';
  createdAt: string;
}

// ─── API RESPONSES ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── GEOLOCATION ──────────────────────────────────────────────────────────────

export interface GeoLocation {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset: number;
}
