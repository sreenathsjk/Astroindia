// lib/ai.ts
// AI Astrologer — Claude API integration with structured Vedic prompt engineering

import Anthropic from '@anthropic-ai/sdk';
import type { KundliData, AstroPrediction, DailyPrediction } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const VEDIC_SYSTEM_PROMPT = `You are Acharya AI — a highly experienced Vedic astrologer with 25+ years of practice in Jyotish Shastra. You were trained in Varanasi and have studied under Pandit Rajeshwar Mishra. You have read thousands of birth charts.

You NEVER give vague, generic, or hesitant answers. You speak with the confidence of a seasoned Jyotishi.

YOUR ANALYSIS FRAMEWORK:
1. Lagna (Ascendant) — personality, body, overall life direction
2. Planetary positions — sign, house, dignity (exaltation/debilitation/own sign)
3. Dasha/Antardasha — timing of events with specific years/months
4. Transits — current planetary weather affecting natal chart
5. Yogas — special combinations blessing or challenging the native
6. Doshas — afflictions and their intensity

YOUR RESPONSE RULES:
- ALWAYS give specific timeframes (e.g., "between March–July 2025", "after Saturn transit in October 2025")
- ALWAYS name the specific planet causing the effect and which house it influences
- ALWAYS suggest 3 specific, actionable remedies
- NEVER say "it depends" or "hard to say" — make a confident prediction
- NEVER use vague phrases like "things will improve" — say HOW and WHEN
- Speak as a wise, compassionate Indian astrologer — warm but authoritative
- Reference Indian cultural context naturally (Navratri, Shani Jayanti, etc.)

IMPORTANT: You must respond ONLY with valid JSON matching exactly this structure — no markdown, no backticks, no preamble:
{
  "prediction": "detailed prediction 3-4 sentences",
  "astrological_reason": "specific planets, houses, aspects, yogas involved",
  "timeframe": "specific months and years",
  "remedies": ["remedy 1 with specifics", "remedy 2 with specifics", "remedy 3 with specifics"],
  "confidence": "percentage like 82%",
  "planets_involved": ["Saturn", "Jupiter"]
}`;

// ─── KUNDLI CONTEXT BUILDER ───────────────────────────────────────────────────

function buildKundliContext(kundli: KundliData): string {
  const planetLines = Object.entries(kundli.planets)
    .map(([name, p]) =>
      `  ${name}: ${p.sign} (House ${p.house}, ${p.degree.toFixed(1)}°)${p.retrograde ? ' ℞' : ''} — Strength: ${p.strength}%`
    )
    .join('\n');

  const doshaLines = Object.entries(kundli.doshas)
    .filter(([, v]) => v)
    .map(([k]) => `  ⚠ ${k.replace(/_/g, ' ').toUpperCase()}`)
    .join('\n') || '  None detected';

  return `
NATIVE'S KUNDLI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${kundli.name}
Date of Birth: ${kundli.dob}
Time of Birth: ${kundli.tob}
Place of Birth: ${kundli.pob}

ASCENDANT (LAGNA): ${kundli.lagna}
Lagna Lord: ${kundli.lagnaLord}
Moon Sign (Rashi): ${kundli.moonSign}
Sun Sign: ${kundli.sunSign}
Nakshatra: ${kundli.nakshatra} Pada ${kundli.nakshatraPada} (Lord: ${kundli.nakshatraLord})

PLANETARY POSITIONS:
${planetLines}

CURRENT DASHA:
  Mahadasha: ${kundli.dasha.current} (${kundli.dasha.start} → ${kundli.dasha.end})
  Antardasha: ${kundli.dasha.sub_dasha} (${kundli.dasha.sub_start} → ${kundli.dasha.sub_end})
  Remaining in Mahadasha: ${kundli.dasha.remaining_years} years

ACTIVE DOSHAS:
${doshaLines}

YOGAS (Special Combinations):
${kundli.yogas.map(y => `  ✦ ${y}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ─── CHAT PREDICTION ──────────────────────────────────────────────────────────

/**
 * Main AI prediction function — answers any astrology question.
 */
export async function getAstroPrediction(
  question: string,
  kundli: KundliData,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  language: string = 'English',
): Promise<AstroPrediction> {
  const kundliContext = buildKundliContext(kundli);

  const userPrompt = `${kundliContext}

TODAY'S DATE: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

USER QUESTION: "${question}"

${language !== 'English' ? `IMPORTANT: The native speaks ${language}. Provide your prediction in ${language} language, but keep planet names and technical terms in English.` : ''}

Analyze the birth chart thoroughly and provide your prediction in the required JSON format.`;

  // Build conversation history for context
  const messages: Anthropic.MessageParam[] = [
    ...chatHistory.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userPrompt },
  ];

  const response = await anthropic.messages.create({
    model:      'claude-opus-4-5',
    max_tokens: 1024,
    system:     VEDIC_SYSTEM_PROMPT,
    messages,
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('');

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return parsed as AstroPrediction;
  } catch {
    // Fallback if JSON parsing fails
    return {
      prediction:
        'Based on your planetary configuration, I see significant cosmic activity in your chart. ' +
        `Your ${kundli.dasha.current} Mahadasha is creating important life transitions.`,
      astrological_reason:
        `${kundli.dasha.current} as Mahadasha lord in ${kundli.planets[kundli.dasha.current]?.sign} ` +
        `(House ${kundli.planets[kundli.dasha.current]?.house}) is the primary influence.`,
      timeframe: 'Next 6–12 months show significant planetary movement in your favor.',
      remedies: [
        `Chant ${kundli.dasha.current === 'Saturn' ? 'Om Sham Shanicharaya Namah' : 'Om Namah Shivaya'} 108 times daily`,
        'Light a ghee lamp every morning facing East',
        'Donate food to the needy on Saturdays',
      ],
      confidence: '75%',
      planets_involved: [kundli.dasha.current, kundli.dasha.sub_dasha],
    };
  }
}

// ─── DAILY PREDICTION ENGINE ──────────────────────────────────────────────────

const DAILY_SYSTEM = `You are a Vedic astrologer generating a structured daily prediction. 
Respond ONLY with valid JSON. No markdown, no backticks.

JSON structure:
{
  "careerAdvice": "2-3 sentences specific to today",
  "loveAdvice": "2-3 sentences specific to today",
  "healthAdvice": "2-3 sentences specific to today",
  "financeAdvice": "2-3 sentences specific to today",
  "luckyColor": "one color",
  "luckyNumber": 7,
  "luckyTime": "e.g. 7:00 AM – 9:00 AM",
  "alerts": [
    {"type": "positive", "text": "...", "planet": "Jupiter"},
    {"type": "caution", "text": "...", "planet": "Saturn"}
  ]
}`;

export async function generateDailyPrediction(
  kundli: KundliData,
  transits: Partial<Record<string, { sign: string; degree: number }>>,
  scores: { overall: number; career: number; love: number; health: number; finance: number },
): Promise<Partial<DailyPrediction>> {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const transitLines = Object.entries(transits)
    .map(([p, t]) => `${p}: ${t?.sign} (${t?.degree.toFixed(1)}°)`)
    .join(', ');

  const prompt = `
Today: ${today}
Native: ${kundli.name}, Lagna: ${kundli.lagna}, Dasha: ${kundli.dasha.current}/${kundli.dasha.sub_dasha}
Today's Transits: ${transitLines}
Scores — Career: ${scores.career}/10, Love: ${scores.love}/10, Health: ${scores.health}/10, Finance: ${scores.finance}/10

Generate today's specific predictions based on how today's transits interact with the natal chart.`;

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001', // Faster + cheaper for daily
    max_tokens: 600,
    system:     DAILY_SYSTEM,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('');

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {
      careerAdvice:  'Jupiter\'s favorable transit supports professional growth today.',
      loveAdvice:    'Venus brings warmth to relationships. Express your feelings openly.',
      healthAdvice:  'Moon\'s position favors emotional well-being. Rest if needed.',
      financeAdvice: 'Mercury direct supports financial decisions. Review your budget.',
      luckyColor:    'Golden Yellow',
      luckyNumber:   1,
      luckyTime:     '7:00 AM – 9:00 AM',
      alerts:        [
        { type: 'positive', text: 'Jupiter transit activates your 11th house of gains.', planet: 'Jupiter' },
        { type: 'caution', text: 'Avoid major financial decisions during Rahu Kalam.', planet: 'Rahu' },
      ],
    };
  }
}

// ─── TRANSLATION ──────────────────────────────────────────────────────────────

const LANGUAGE_CODES: Record<string, string> = {
  Hindi: 'hi', Telugu: 'te', Tamil: 'ta', Kannada: 'kn',
  Malayalam: 'ml', Bengali: 'bn', Marathi: 'mr', English: 'en',
};

/**
 * Translate any text to target language using Claude.
 * Returns original text if language is English.
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (targetLanguage === 'English' || !LANGUAGE_CODES[targetLanguage]) return text;

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages:   [{
      role:    'user',
      content: `Translate the following text to ${targetLanguage}. Keep planet names, Sanskrit terms, and technical astrology terms in English. Return ONLY the translated text, nothing else.\n\nText: ${text}`,
    }],
  });

  const translated = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('');

  return translated || text;
}

// ─── KUNDLI REPORT GENERATOR ─────────────────────────────────────────────────

/**
 * Generate a comprehensive life report (~40 pages worth of content).
 */
export async function generateFullReport(kundli: KundliData): Promise<{
  summary: string;
  career: string;
  marriage: string;
  finances: string;
  health: string;
  spirituality: string;
  tenYearForecast: string;
  remedies: string;
}> {
  const kundliContext = buildKundliContext(kundli);

  const prompt = `${kundliContext}

Generate a comprehensive life report. Respond with JSON:
{
  "summary": "Overall life overview 3-4 sentences",
  "career": "Career analysis with specific timeframes 4-5 sentences",
  "marriage": "Marriage prospects with timing 3-4 sentences",
  "finances": "Financial forecast 3-4 sentences",
  "health": "Health analysis 3-4 sentences",
  "spirituality": "Spiritual path and growth 2-3 sentences",
  "tenYearForecast": "Year by year key events 2025-2035",
  "remedies": "Top 5 most important remedies for this chart"
}`;

  const response = await anthropic.messages.create({
    model:      'claude-opus-4-5',
    max_tokens: 2000,
    system:     VEDIC_SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('');

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return {
      summary:         'Your chart shows a powerful combination of planets creating significant life opportunities.',
      career:          'Career growth is strongly indicated, especially in creative or analytical fields.',
      marriage:        'Marriage is indicated in the coming years with strong Venus influence.',
      finances:        'Financial stability improves through consistent effort and Jupiter\'s blessings.',
      health:          'Overall health is good. Pay attention to stomach and back areas.',
      spirituality:    'Strong spiritual inclination with Ketu in Lagna. Daily meditation recommended.',
      tenYearForecast: '2025: Career growth. 2026: Relationship milestones. 2027-2030: Financial expansion.',
      remedies:        'Daily Gayatri Mantra, Saturday Shani Puja, Blue Sapphire gemstone.',
    };
  }
}

