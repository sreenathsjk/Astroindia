// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAstroPrediction, translateText } from '@/lib/ai';
import { verifyToken, getKundli, checkAndDecrementQuota, adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { incrementRateLimit } from '@/lib/redis';
import type { ApiResponse, AstroPrediction, KundliData, ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const schema = z.object({
  question:    z.string().min(3).max(500),
  language:    z.string().default('English'),
  chatHistory: z.array(z.object({
    role:    z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(10).default([]),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const userId = await verifyToken(req);

    // 2. Validate
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const { question, language, chatHistory } = parsed.data;

    // 3. Check quota (Firestore transaction)
    const hasQuota = await checkAndDecrementQuota(userId);
    if (!hasQuota) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error:   'Daily question limit reached. Upgrade to Pro for unlimited questions.',
          message: 'QUOTA_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // 4. Also track in Redis for fast rate-limit checks
    await incrementRateLimit(userId);

    // 5. Get Kundli
    const kundli = await getKundli(userId) as KundliData | null;
    if (!kundli) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Please generate your Kundli first before asking questions.' },
        { status: 400 }
      );
    }

    // 6. Translate question to English if needed
    let questionInEnglish = question;
    if (language !== 'English') {
      questionInEnglish = await translateText(question, 'English');
    }

    // 7. Get AI prediction
    const prediction = await getAstroPrediction(
      questionInEnglish,
      kundli,
      chatHistory,
      language,
    );

    // 8. Save to Firestore chat history
    const userMsg: ChatMessage = {
      id:        uuidv4(),
      role:      'user',
      content:   question,
      timestamp: new Date().toISOString(),
    };
    const botMsg: ChatMessage = {
      id:         uuidv4(),
      role:       'assistant',
      content:    prediction.prediction,
      prediction,
      timestamp:  new Date().toISOString(),
    };

    const chatRef = adminDb
      .collection(COLLECTIONS.CHAT_HISTORY)
      .doc(userId)
      .collection('messages');

    await chatRef.add(userMsg);
    await chatRef.add(botMsg);

    return NextResponse.json<ApiResponse<{ prediction: AstroPrediction; messageId: string }>>({
      success: true,
      data:    { prediction, messageId: botMsg.id },
    });

  } catch (err: unknown) {
    console.error('[API /chat]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';

    if (message.includes('Authorization')) {
      return NextResponse.json<ApiResponse<null>>({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 });
  }
}

// GET: Fetch chat history
export async function GET(req: NextRequest) {
  try {
    const userId = await verifyToken(req);
    const url    = new URL(req.url);
    const limit  = parseInt(url.searchParams.get('limit') || '20');

    const snapshot = await adminDb
      .collection(COLLECTIONS.CHAT_HISTORY)
      .doc(userId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const messages = snapshot.docs
      .map(doc => doc.data() as ChatMessage)
      .reverse();

    return NextResponse.json<ApiResponse<ChatMessage[]>>({ success: true, data: messages });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 });
  }
}
