// app/api/daily/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getKundli, getDailyPrediction, saveDailyPrediction } from '@/lib/firebase/admin';
import { getCachedDailyPrediction, setCachedDailyPrediction, getCachedTransits, setCachedTransits } from '@/lib/redis';
import { generateDailyPrediction } from '@/lib/ai';
import { getCurrentTransits, scoreDailyTransits } from '@/lib/astrology';
import type { ApiResponse, DailyPrediction, KundliData } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const userId = await verifyToken(req);
    const today  = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Check Redis cache first (fastest)
    const cached = await getCachedDailyPrediction(userId, today);
    if (cached) {
      return NextResponse.json<ApiResponse<DailyPrediction>>({
        success: true,
        data:    cached as DailyPrediction,
        message: 'cached',
      });
    }

    // 2. Check Firestore (second layer)
    const firestoreCached = await getDailyPrediction(userId, today);
    if (firestoreCached) {
      await setCachedDailyPrediction(userId, today, firestoreCached);
      return NextResponse.json<ApiResponse<DailyPrediction>>({ success: true, data: firestoreCached as DailyPrediction });
    }

    // 3. Get Kundli
    const kundli = await getKundli(userId) as KundliData | null;
    if (!kundli) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Generate your Kundli first to get daily predictions.' },
        { status: 400 }
      );
    }

    // 4. Get current transits (cached per hour for all users)
    let transits = await getCachedTransits();
    if (!transits) {
      transits = await getCurrentTransits() as Record<string, { sign: string; degree: number }>;
      await setCachedTransits(transits);
    }

    // 5. Score transits against natal chart
    const scores = scoreDailyTransits(transits as Parameters<typeof scoreDailyTransits>[0], kundli);

    // 6. Generate AI advice
    const aiAdvice = await generateDailyPrediction(kundli, transits, scores);

    // 7. Build full prediction object
    const moonTransit = (transits['Moon'] as { sign: string } | undefined)?.sign || 'Scorpio';
    const sunTransit  = (transits['Sun']  as { sign: string } | undefined)?.sign || 'Pisces';

    const LUCKY_COLORS  = ['Golden Yellow', 'Royal Blue', 'Crimson Red', 'Forest Green', 'Pearl White', 'Deep Purple', 'Saffron Orange'];
    const LUCKY_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const dayOfYear     = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

    const prediction: DailyPrediction = {
      userId,
      date:         today,
      scores,
      moonTransit:  moonTransit as DailyPrediction['moonTransit'],
      sunTransit:   sunTransit  as DailyPrediction['sunTransit'],
      luckyColor:   aiAdvice.luckyColor  || LUCKY_COLORS[dayOfYear % LUCKY_COLORS.length],
      luckyNumber:  aiAdvice.luckyNumber || LUCKY_NUMBERS[dayOfYear % LUCKY_NUMBERS.length],
      luckyTime:    aiAdvice.luckyTime   || '7:00 AM – 9:00 AM',
      alerts:       aiAdvice.alerts      || [],
      careerAdvice: aiAdvice.careerAdvice  || '',
      loveAdvice:   aiAdvice.loveAdvice    || '',
      healthAdvice: aiAdvice.healthAdvice  || '',
      financeAdvice: aiAdvice.financeAdvice || '',
      cachedAt:     new Date().toISOString(),
    };

    // 8. Store in both Firestore and Redis
    await saveDailyPrediction(userId, today, prediction);
    await setCachedDailyPrediction(userId, today, prediction);

    return NextResponse.json<ApiResponse<DailyPrediction>>({ success: true, data: prediction });

  } catch (err: unknown) {
    console.error('[API /daily]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 });
  }
}

