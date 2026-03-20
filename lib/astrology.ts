// lib/astrology.ts
// Core Vedic Astrology Engine using Swiss Ephemeris
// All calculations run server-side only.

import type {
  KundliData, Planet, ZodiacSign, Nakshatra,
  PlanetData, DashaData, DashaPeriod, DoshaStatus,
} from '@/types';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const PLANETS: Planet[] = [
  'Sun', 'Moon', 'Mars', 'Mercury',
  'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

// Swiss Ephemeris planet IDs
const SWEPH_IDS: Record<string, number> = {
  Sun: 0, Moon: 1, Mars: 4, Mercury: 2,
  Jupiter: 5, Venus: 3, Saturn: 6,
  // Rahu = Mean Node (10), Ketu is always 180° opposite
  Rahu: 10,
};

// 27 Nakshatras (each spans 13°20' = 800')
export const NAKSHATRAS: Nakshatra[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
  'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
  'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Nakshatra lords (Vimshottari Dasha sequence)
export const NAKSHATRA_LORDS: Planet[] = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
  'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  // Repeats ×3 for 27 nakshatras
];

// Vimshottari Dasha years per planet
export const DASHA_YEARS: Record<Planet, number> = {
  Sun: 6, Moon: 10, Mars: 7, Rahu: 18,
  Jupiter: 16, Saturn: 19, Mercury: 17,
  Ketu: 7, Venus: 20,
};

// Total Vimshottari cycle = 120 years
const TOTAL_DASHA_YEARS = 120;

// Planet sign dispositors (own signs)
const OWN_SIGNS: Record<Planet, ZodiacSign[]> = {
  Sun:     ['Leo'],
  Moon:    ['Cancer'],
  Mars:    ['Aries', 'Scorpio'],
  Mercury: ['Gemini', 'Virgo'],
  Jupiter: ['Sagittarius', 'Pisces'],
  Venus:   ['Taurus', 'Libra'],
  Saturn:  ['Capricorn', 'Aquarius'],
  Rahu:    [],
  Ketu:    [],
};

// ─── SWISS EPHEMERIS WRAPPER ──────────────────────────────────────────────────

/**
 * Load sweph lazily (server-side only).
 * Returns the sweph module or null if unavailable.
 */
async function getSweph() {
  try {
    // Dynamic import keeps it out of the browser bundle
    const sweph = await import('sweph');
    // Set ephemeris data path (copy ephe/ folder to project root)
    sweph.default.set_ephe_path('./ephe');
    return sweph.default;
  } catch {
    console.warn('[AstroEngine] sweph not available, using fallback calculations');
    return null;
  }
}

/**
 * Convert a local datetime + timezone offset to Julian Day Number.
 */
function toJulianDay(
  date: string,   // YYYY-MM-DD
  time: string,   // HH:MM
  utcOffsetHours: number,
): number {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute]     = time.split(':').map(Number);

  // Convert to UTC
  const utcHour = hour + minute / 60 - utcOffsetHours;

  // Meeus formula for Julian Day
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + utcHour / 24 + B - 1524.5;
}

/**
 * Convert ecliptic longitude (0–360°) to sign index and degree within sign.
 */
function longitudeToSign(lon: number): { sign: ZodiacSign; degree: number } {
  const signIndex = Math.floor(lon / 30) % 12;
  return {
    sign: ZODIAC_SIGNS[signIndex],
    degree: lon % 30,
  };
}

/**
 * Get Nakshatra from Moon's longitude.
 */
function getNakshatra(moonLon: number): { nakshatra: Nakshatra; pada: number } {
  const nakshatraSpan = 360 / 27; // 13.333...°
  const index         = Math.floor(moonLon / nakshatraSpan) % 27;
  const posInNakshatra = moonLon % nakshatraSpan;
  const pada           = Math.floor(posInNakshatra / (nakshatraSpan / 4)) + 1;

  return {
    nakshatra: NAKSHATRAS[index],
    pada: Math.min(pada, 4),
  };
}

/**
 * Calculate Vimshottari Dasha from birth Nakshatra.
 */
function calculateDasha(
  moonLon: number,
  birthDate: string,
): DashaData {
  const nakshatraSpan = 360 / 27;
  const nakshatraIndex = Math.floor(moonLon / nakshatraSpan) % 27;
  const lordIndex      = nakshatraIndex % 9;
  const nakshatraLord  = NAKSHATRA_LORDS[lordIndex];

  // How far through the current nakshatra at birth
  const posInNakshatra = moonLon % nakshatraSpan;
  const fractionElapsed = posInNakshatra / nakshatraSpan;

  // Years elapsed in birth dasha
  const birthDashaYears    = DASHA_YEARS[nakshatraLord];
  const yearsElapsedAtBirth = fractionElapsed * birthDashaYears;

  // Build full sequence starting from birth nakshatra lord
  const DASHA_ORDER: Planet[] = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
    'Rahu', 'Jupiter', 'Saturn', 'Mercury',
  ];
  const startIdx = DASHA_ORDER.indexOf(nakshatraLord);

  const sequence: DashaPeriod[] = [];
  let cursor = new Date(birthDate);
  // Subtract elapsed time to get true start of birth dasha
  cursor = addYears(cursor, -yearsElapsedAtBirth);

  for (let i = 0; i < 9; i++) {
    const planet = DASHA_ORDER[(startIdx + i) % 9];
    const years  = DASHA_YEARS[planet];
    const start  = cursor.toISOString().split('T')[0];
    cursor = addYears(cursor, years);
    const end = cursor.toISOString().split('T')[0];
    sequence.push({ planet, start, end, years });
  }

  // Find current dasha
  const today = new Date();
  const currentDasha = sequence.find(
    d => new Date(d.start) <= today && today <= new Date(d.end)
  ) || sequence[0];

  const remainingMs  = new Date(currentDasha.end).getTime() - today.getTime();
  const remainingYrs = remainingMs / (1000 * 60 * 60 * 24 * 365.25);

  // Sub-dasha (Antardasha) within current Mahadasha
  const dashaIdx    = DASHA_ORDER.indexOf(currentDasha.planet);
  const subSequence = buildSubDasha(currentDasha, dashaIdx, DASHA_ORDER);
  const currentSub  = subSequence.find(
    s => new Date(s.start) <= today && today <= new Date(s.end)
  ) || subSequence[0];

  return {
    current:          currentDasha.planet,
    start:            currentDasha.start,
    end:              currentDasha.end,
    remaining_years:  Math.round(remainingYrs * 10) / 10,
    sub_dasha:        currentSub.planet,
    sub_start:        currentSub.start,
    sub_end:          currentSub.end,
    sequence,
  };
}

function buildSubDasha(
  mahadasha: DashaPeriod,
  dashaIdx: number,
  DASHA_ORDER: Planet[],
): DashaPeriod[] {
  const totalDays = (new Date(mahadasha.end).getTime() - new Date(mahadasha.start).getTime()) / 86400000;
  const sub: DashaPeriod[] = [];
  let cursor = new Date(mahadasha.start);

  for (let i = 0; i < 9; i++) {
    const planet   = DASHA_ORDER[(dashaIdx + i) % 9];
    const fraction = DASHA_YEARS[planet] / TOTAL_DASHA_YEARS;
    const days     = totalDays * fraction;
    const start    = cursor.toISOString().split('T')[0];
    cursor         = new Date(cursor.getTime() + days * 86400000);
    sub.push({ planet, start, end: cursor.toISOString().split('T')[0], years: days / 365.25 });
  }
  return sub;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  const ms = years * 365.25 * 24 * 60 * 60 * 1000;
  return new Date(d.getTime() + ms);
}

// ─── DOSHA DETECTION ──────────────────────────────────────────────────────────

function detectDoshas(
  planets: Record<Planet, PlanetData>,
  lagna: ZodiacSign,
): DoshaStatus {
  const mars = planets['Mars'];

  // Manglik Dosha: Mars in 1, 4, 7, 8, or 12 from Lagna
  const manglikHouses = [1, 4, 7, 8, 12];
  const manglik = manglikHouses.includes(mars.house);

  // Kaal Sarp Dosha: ALL planets between Rahu and Ketu
  const rahu = planets['Rahu'];
  const ketu = planets['Ketu'];
  const rahuLon   = ZODIAC_SIGNS.indexOf(rahu.sign) * 30 + rahu.degree;
  const ketuLon   = ZODIAC_SIGNS.indexOf(ketu.sign) * 30 + ketu.degree;
  const regularPlanets: Planet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  let kaalSarp = true;
  for (const p of regularPlanets) {
    const pLon = ZODIAC_SIGNS.indexOf(planets[p].sign) * 30 + planets[p].degree;
    // Check if planet is within Rahu–Ketu arc (clockwise)
    const inArc = isInArc(pLon, rahuLon, ketuLon);
    if (!inArc) { kaalSarp = false; break; }
  }

  // Shani Dosha: Saturn conjunct or aspecting Moon or Lagna lord
  const saturn = planets['Saturn'];
  const moon   = planets['Moon'];
  const shaniDosha =
    saturn.house === moon.house ||                    // Conjunction
    Math.abs(saturn.house - moon.house) === 7 ||      // Opposition
    moon.house === ((saturn.house + 2) % 12 + 1) ||   // Saturn 3rd aspect
    moon.house === ((saturn.house + 6) % 12 + 1);     // Saturn 7th aspect

  // Pitru Dosha: Sun afflicted by Rahu/Ketu or in 9th house with malefics
  const sun = planets['Sun'];
  const pitruDosha = sun.house === rahu.house || sun.house === ketu.house;

  // Gand Mool: Born in Ashwini, Ashlesha, Magha, Jyeshtha, Mula, or Revati
  const gandMoolNakshatras: Nakshatra[] = ['Ashwini', 'Ashlesha', 'Magha', 'Jyeshtha', 'Mula', 'Revati'];

  return {
    manglik,
    kaal_sarp: kaalSarp,
    shani_dosha: shaniDosha,
    pitru_dosha: pitruDosha,
    gand_mool: false, // Set after nakshatra calculation
    manglik_details: manglik
      ? `Mars in house ${mars.house} (${mars.sign}) causes Manglik Dosha`
      : undefined,
  };
}

function isInArc(lon: number, from: number, to: number): boolean {
  if (from <= to) return lon >= from && lon <= to;
  return lon >= from || lon <= to;
}

// ─── YOGA DETECTION ───────────────────────────────────────────────────────────

function detectYogas(planets: Record<Planet, PlanetData>): string[] {
  const yogas: string[] = [];

  const jupiter = planets['Jupiter'];
  const moon    = planets['Moon'];
  const sun     = planets['Sun'];
  const mercury = planets['Mercury'];
  const mars    = planets['Mars'];
  const saturn  = planets['Saturn'];

  // Gajakesari Yoga: Jupiter in kendra (1,4,7,10) from Moon
  const jupMoonDiff = Math.abs(jupiter.house - moon.house);
  if ([0, 3, 6, 9].includes(jupMoonDiff)) yogas.push('Gajakesari Yoga');

  // Budh-Aditya Yoga: Sun + Mercury in same house
  if (sun.house === mercury.house) yogas.push('Budh-Aditya Yoga');

  // Pancha Mahapurusha: Mars/Mercury/Jupiter/Venus/Saturn in own/exalt sign in kendra
  const kendras = [1, 4, 7, 10];
  if (kendras.includes(mars.house) && OWN_SIGNS['Mars'].includes(mars.sign))
    yogas.push('Ruchaka Yoga (Pancha Mahapurusha)');
  if (kendras.includes(jupiter.house) && OWN_SIGNS['Jupiter'].includes(jupiter.sign))
    yogas.push('Hamsa Yoga (Pancha Mahapurusha)');
  if (kendras.includes(saturn.house) && OWN_SIGNS['Saturn'].includes(saturn.sign))
    yogas.push('Shasha Yoga (Pancha Mahapurusha)');

  // Dhana Yoga: Lords of 2nd and 11th in each other's houses or conjunct
  // (Simplified: Jupiter in 11th or 2nd house)
  if ([2, 11].includes(jupiter.house)) yogas.push('Dhana Yoga');

  // Viparita Raja Yoga: Lords of 6,8,12 in 6,8,12 houses
  if ([6, 8, 12].includes(saturn.house) && [6, 8, 12].includes(mars.house))
    yogas.push('Viparita Raja Yoga');

  return yogas.slice(0, 6); // Return top 6
}

// ─── PLANET STRENGTH ──────────────────────────────────────────────────────────

function calcStrength(planet: Planet, sign: ZodiacSign, house: number): number {
  let strength = 50;

  // Own sign: +30
  if (OWN_SIGNS[planet]?.includes(sign)) strength += 30;

  // Exaltation signs
  const EXALT: Partial<Record<Planet, ZodiacSign>> = {
    Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn',
    Mercury: 'Virgo', Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra',
  };
  if (EXALT[planet] === sign) strength += 20;

  // Debilitation: -20
  const DEBIL: Partial<Record<Planet, ZodiacSign>> = {
    Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer',
    Mercury: 'Pisces', Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
  };
  if (DEBIL[planet] === sign) strength -= 20;

  // Kendra placement: +10
  if ([1, 4, 7, 10].includes(house)) strength += 10;

  // Kona placement: +8
  if ([5, 9].includes(house)) strength += 8;

  // Dusthana: -10
  if ([6, 8, 12].includes(house)) strength -= 10;

  return Math.max(10, Math.min(100, strength));
}

// ─── HOUSE CALCULATION ────────────────────────────────────────────────────────

function buildHouses(lagnaSign: ZodiacSign): Record<number, ZodiacSign> {
  const lagnaIdx = ZODIAC_SIGNS.indexOf(lagnaSign);
  const houses: Record<number, ZodiacSign> = {};
  for (let h = 1; h <= 12; h++) {
    houses[h] = ZODIAC_SIGNS[(lagnaIdx + h - 1) % 12];
  }
  return houses;
}

// ─── MAIN ENGINE ─────────────────────────────────────────────────────────────

/**
 * Generate a full Kundli from birth details.
 * Uses Swiss Ephemeris if available, falls back to mathematical approximation.
 */
export async function generateKundli(params: {
  userId: string;
  name: string;
  dob: string;        // YYYY-MM-DD
  tob: string;        // HH:MM local
  latitude: number;
  longitude: number;
  timezone: string;   // e.g. "Asia/Kolkata"
  utcOffset: number;  // +5.5 for IST
  pob: string;
}): Promise<KundliData> {
  const { userId, name, dob, tob, latitude, longitude, timezone, utcOffset, pob } = params;

  const jd   = toJulianDay(dob, tob, utcOffset);
  const sweph = await getSweph();

  // Planet longitudes (ecliptic, tropical)
  const rawLongitudes: Record<Planet, number> = {} as Record<Planet, number>;

  if (sweph) {
    // ── Real Swiss Ephemeris ────────────────────────────────────────────────
    for (const [pName, pId] of Object.entries(SWEPH_IDS)) {
      const result = sweph.calc_ut(jd, pId, sweph.FLG_SWIEPH | sweph.FLG_SPEED);
      rawLongitudes[pName as Planet] = result.data[0]; // ecliptic longitude
    }
    // Ketu = Rahu + 180°
    rawLongitudes['Ketu'] = (rawLongitudes['Rahu'] + 180) % 360;

    // Apply Lahiri Ayanamsa (sidereal correction for Vedic)
    const ayanamsa = sweph.get_ayanamsa_ut(jd);
    for (const p of PLANETS) {
      rawLongitudes[p] = ((rawLongitudes[p] - ayanamsa) + 360) % 360;
    }

    // Ascendant (Lagna) calculation
    const houses = sweph.houses(jd, latitude, longitude, 'P'); // Placidus
    const ascLon = ((houses.data.points[0] - sweph.get_ayanamsa_ut(jd)) + 360) % 360;
    rawLongitudes['Lagna' as Planet] = ascLon;
  } else {
    // ── Mathematical Fallback ────────────────────────────────────────────────
    // Approximate planetary positions (good for demo; use sweph in production)
    const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000

    rawLongitudes['Sun']     = ((280.46646 + 36000.76983 * T) % 360 + 360) % 360;
    rawLongitudes['Moon']    = ((218.3165 + 481267.8813 * T)  % 360 + 360) % 360;
    rawLongitudes['Mars']    = ((355.4337 + 19140.2993 * T)   % 360 + 360) % 360;
    rawLongitudes['Mercury'] = ((252.2503 + 149472.6746 * T)  % 360 + 360) % 360;
    rawLongitudes['Jupiter'] = ((34.3515  + 3034.9057 * T)    % 360 + 360) % 360;
    rawLongitudes['Venus']   = ((181.9798 + 58517.8156 * T)   % 360 + 360) % 360;
    rawLongitudes['Saturn']  = ((50.0774  + 1222.1138 * T)    % 360 + 360) % 360;
    rawLongitudes['Rahu']    = ((125.0445 - 1934.1363 * T)    % 360 + 360) % 360;
    rawLongitudes['Ketu']    = (rawLongitudes['Rahu'] + 180) % 360;

    // Apply Lahiri Ayanamsa approximation
    const ayanamsa = 23.85 + 0.0136 * T;
    for (const p of PLANETS) {
      rawLongitudes[p] = ((rawLongitudes[p] - ayanamsa) + 360) % 360;
    }

    // Approximate Lagna (Ascendant)
    const lst   = (100.4606 + 36000.7700 * T + longitude) % 360;
    rawLongitudes['Lagna' as Planet] = ((lst - ayanamsa) + 360) % 360;
  }

  // ── Build Lagna ─────────────────────────────────────────────────────────────
  const lagnaData = longitudeToSign(rawLongitudes['Lagna' as Planet]);
  const lagna     = lagnaData.sign;

  // ── Build Houses ─────────────────────────────────────────────────────────────
  const houses = buildHouses(lagna);

  // ── Build Planet Data ────────────────────────────────────────────────────────
  const getHouseFromLagna = (planetSign: ZodiacSign): number => {
    const lagnaIdx  = ZODIAC_SIGNS.indexOf(lagna);
    const planetIdx = ZODIAC_SIGNS.indexOf(planetSign);
    return ((planetIdx - lagnaIdx + 12) % 12) + 1;
  };

  const planets = {} as Record<Planet, PlanetData>;
  for (const p of PLANETS) {
    const { sign, degree } = longitudeToSign(rawLongitudes[p]);
    const house = getHouseFromLagna(sign);
    planets[p] = {
      sign,
      house,
      degree: Math.round(degree * 10) / 10,
      retrograde: p === 'Rahu' || p === 'Ketu', // Nodes always retrograde
      strength: calcStrength(p, sign, house),
    };
  }

  // ── Nakshatra ────────────────────────────────────────────────────────────────
  const { nakshatra, pada } = getNakshatra(rawLongitudes['Moon']);
  const nakshatraIdx        = NAKSHATRAS.indexOf(nakshatra);
  const nakshatraLord       = NAKSHATRA_LORDS[nakshatraIdx % 9];

  // ── Gand Mool ────────────────────────────────────────────────────────────────
  const gandMoolNakshatras: Nakshatra[] = ['Ashwini', 'Ashlesha', 'Magha', 'Jyeshtha', 'Mula', 'Revati'];
  const isGandMool = gandMoolNakshatras.includes(nakshatra);

  // ── Doshas & Yogas ───────────────────────────────────────────────────────────
  const doshas: DoshaStatus = {
    ...detectDoshas(planets, lagna),
    gand_mool: isGandMool,
  };
  const yogas = detectYogas(planets);

  // ── Dasha ────────────────────────────────────────────────────────────────────
  const dasha = calculateDasha(rawLongitudes['Moon'], dob);

  const lagnaLordMap: Record<ZodiacSign, Planet> = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
    Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
    Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
  };

  const now = new Date().toISOString();
  return {
    userId, name, dob, tob, pob,
    latitude, longitude, timezone,
    lagna,
    lagnaLord: lagnaLordMap[lagna],
    lagnaLordDegree: lagnaData.degree,
    moonSign: planets['Moon'].sign,
    sunSign:  planets['Sun'].sign,
    nakshatra,
    nakshatraPada: pada,
    nakshatraLord,
    planets,
    houses,
    dasha,
    doshas,
    yogas,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── TRANSIT ENGINE ───────────────────────────────────────────────────────────

/**
 * Get current planetary transits (today's positions).
 */
export async function getCurrentTransits(): Promise<Partial<Record<Planet, { sign: ZodiacSign; degree: number }>>> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const timeStr = `${today.getUTCHours().toString().padStart(2, '0')}:${today.getUTCMinutes().toString().padStart(2, '0')}`;

  const jd    = toJulianDay(dateStr, timeStr, 0); // UTC
  const sweph = await getSweph();

  const transits: Partial<Record<Planet, { sign: ZodiacSign; degree: number }>> = {};

  const rawLons: Record<Planet, number> = {} as Record<Planet, number>;

  if (sweph) {
    for (const [pName, pId] of Object.entries(SWEPH_IDS)) {
      const result       = sweph.calc_ut(jd, pId, sweph.FLG_SWIEPH);
      rawLons[pName as Planet] = result.data[0];
    }
    rawLons['Ketu'] = (rawLons['Rahu'] + 180) % 360;
    const ayanamsa  = sweph.get_ayanamsa_ut(jd);
    for (const p of PLANETS) {
      rawLons[p] = ((rawLons[p] - ayanamsa) + 360) % 360;
    }
  } else {
    const T = (jd - 2451545.0) / 36525;
    rawLons['Sun']     = ((280.46646 + 36000.76983 * T) % 360 + 360) % 360;
    rawLons['Moon']    = ((218.3165  + 481267.8813 * T) % 360 + 360) % 360;
    rawLons['Jupiter'] = ((34.3515   + 3034.9057 * T)   % 360 + 360) % 360;
    rawLons['Saturn']  = ((50.0774   + 1222.1138 * T)   % 360 + 360) % 360;
    rawLons['Mars']    = ((355.4337  + 19140.2993 * T)  % 360 + 360) % 360;
    rawLons['Mercury'] = ((252.2503  + 149472.6746 * T) % 360 + 360) % 360;
    rawLons['Venus']   = ((181.9798  + 58517.8156 * T)  % 360 + 360) % 360;
    rawLons['Rahu']    = ((125.0445  - 1934.1363 * T)   % 360 + 360) % 360;
    rawLons['Ketu']    = (rawLons['Rahu'] + 180) % 360;
    const ayanamsa     = 23.85 + 0.0136 * T;
    for (const p of PLANETS) {
      rawLons[p] = ((rawLons[p] - ayanamsa) + 360) % 360;
    }
  }

  for (const p of PLANETS) {
    transits[p] = longitudeToSign(rawLons[p]);
  }

  return transits;
}

// ─── DAILY SCORE ENGINE ───────────────────────────────────────────────────────

/**
 * Score today's transits against a natal chart (0–10 per category).
 */
export function scoreDailyTransits(
  transits: Partial<Record<Planet, { sign: ZodiacSign; degree: number }>>,
  kundli: KundliData,
): { overall: number; career: number; love: number; health: number; finance: number } {
  let career  = 5;
  let love    = 5;
  let health  = 5;
  let finance = 5;

  const moonTransit = transits['Moon'];
  const jupTransit  = transits['Jupiter'];
  const satTransit  = transits['Saturn'];
  const venTransit  = transits['Venus'];

  if (moonTransit) {
    const moonHouse = getTransitHouse(moonTransit.sign, kundli.lagna);
    if ([1, 5, 9, 11].includes(moonHouse)) { career += 1.5; health += 1; }
    if ([4, 7, 11].includes(moonHouse))    { love   += 2; }
    if ([6, 8, 12].includes(moonHouse))    { health -= 1.5; love -= 1; }
  }

  if (jupTransit) {
    const jupHouse = getTransitHouse(jupTransit.sign, kundli.lagna);
    if ([1, 5, 9, 11].includes(jupHouse)) { finance += 2; career += 1; }
    if ([2, 11].includes(jupHouse))        { finance += 2.5; }
  }

  if (satTransit) {
    const satHouse = getTransitHouse(satTransit.sign, kundli.lagna);
    if ([1, 4, 7, 10].includes(satHouse)) { health -= 1; career -= 1; }
    if ([3, 6, 11].includes(satHouse))    { career += 1; health += 0.5; }
  }

  if (venTransit) {
    const venHouse = getTransitHouse(venTransit.sign, kundli.lagna);
    if ([1, 5, 7, 11].includes(venHouse)) { love += 2.5; finance += 1; }
  }

  const clamp = (v: number) => Math.round(Math.min(10, Math.max(1, v)) * 10) / 10;
  career  = clamp(career);
  love    = clamp(love);
  health  = clamp(health);
  finance = clamp(finance);
  const overall = clamp((career + love + health + finance) / 4);

  return { overall, career, love, health, finance };
}

function getTransitHouse(transitSign: ZodiacSign, lagna: ZodiacSign): number {
  const lagnaIdx  = ZODIAC_SIGNS.indexOf(lagna);
  const signIdx   = ZODIAC_SIGNS.indexOf(transitSign);
  return ((signIdx - lagnaIdx + 12) % 12) + 1;
}
