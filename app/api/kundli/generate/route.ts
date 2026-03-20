// app/api/kundli/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateKundli } from '@/lib/astrology';
import { geocodePlace } from '@/lib/geo';
import { saveKundli, verifyToken } from '@/lib/firebase/admin';
import { setCachedKundli, getCachedKundli, invalidateKundliCache } from '@/lib/redis';
import type { ApiResponse, KundliData } from '@/types';

const schema = z.object({
  name: z.string().min(2).max(100),
  dob:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  tob:  z.string().regex(/^\d{2}:\d{2}$/),         // HH:MM
  pob:  z.string().min(2).max(200),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const userId = await verifyToken(req);

    // 2. Validate input
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Invalid input', message: parsed.error.message },
        { status: 400 }
      );
    }

    const { name, dob, tob, pob } = parsed.data;

    // 3. Geocode birth place
    const geo = await geocodePlace(pob);

    // 4. Generate Kundli using Swiss Ephemeris
    const kundli = await generateKundli({
      userId,
      name,
      dob,
      tob,
      latitude:  geo.latitude,
      longitude: geo.longitude,
      timezone:  geo.timezone,
      utcOffset: geo.utcOffset,
      pob:       `${geo.city}, ${geo.state}, ${geo.country}`,
    });

    // 5. Save to Firestore
    await saveKundli(userId, kundli);

    // 6. Cache in Redis (invalidate old first)
    await invalidateKundliCache(userId);
    await setCachedKundli(userId, kundli);

    return NextResponse.json<ApiResponse<KundliData>>({
      success: true,
      data:    kundli,
      message: 'Kundli generated successfully',
    });

  } catch (err: unknown) {
    console.error('[API /kundli/generate]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';

    if (message.includes('Authorization')) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await verifyToken(req);

    // Try Redis first
    const cached = await getCachedKundli(userId);
    if (cached) {
      return NextResponse.json<ApiResponse<KundliData>>({
        success: true,
        data:    cached as KundliData,
      });
    }

    // Try Firestore
    const { getKundli } = await import('@/lib/firebase/admin');
    const kundli = await getKundli(userId);
    if (!kundli) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'No Kundli found. Please generate your birth chart first.' },
        { status: 404 }
      );
    }

    // Re-cache
    await setCachedKundli(userId, kundli);

    return NextResponse.json<ApiResponse<KundliData>>({ success: true, data: kundli as KundliData });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
