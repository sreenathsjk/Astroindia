// app/api/payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { z } from 'zod';
import { verifyToken, adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import type { ApiResponse, PaymentOrder } from '@/types';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Plan pricing in paise (1 INR = 100 paise)
const PLAN_PRICES = {
  pro:          9900,   // ₹99/month
  report:       29900,  // ₹299 one-time
  per_question: 1000,   // ₹10 per question
} as const;

const PLAN_NAMES = {
  pro:          'AstroAI Pro Monthly',
  report:       'AstroAI Full Life Report',
  per_question: 'Single Question',
} as const;

const createOrderSchema = z.object({
  plan: z.enum(['pro', 'report', 'per_question']),
});

const verifySchema = z.object({
  orderId:          z.string(),
  paymentId:        z.string(),
  signature:        z.string(),
  plan:             z.enum(['pro', 'report', 'per_question']),
});

// POST /api/payment — Create Razorpay order
export async function POST(req: NextRequest) {
  try {
    const userId = await verifyToken(req);
    const body   = await req.json();
    const url    = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';

    if (action === 'verify') {
      // ── Payment Verification ──────────────────────────────────────────────
      const parsed = verifySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: parsed.error.message }, { status: 400 });
      }

      const { orderId, paymentId, signature, plan } = parsed.data;

      // Verify Razorpay signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Payment verification failed. Invalid signature.' },
          { status: 400 }
        );
      }

      // Update payment status in Firestore
      await adminDb.collection(COLLECTIONS.PAYMENTS).doc(orderId).update({
        status:    'paid',
        paymentId,
        paidAt:    new Date().toISOString(),
      });

      // Upgrade user plan
      const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);
      if (plan === 'pro') {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        await userRef.update({
          plan:              'pro',
          questionsLimit:    999999,
          proExpiresAt:      expiresAt.toISOString(),
        });
      } else if (plan === 'report') {
        await userRef.update({ hasDetailedReport: true });
      } else if (plan === 'per_question') {
        const snap = await userRef.get();
        const data = snap.data()!;
        await userRef.update({
          questionsLimit: (data.questionsLimit || 5) + 1,
        });
      }

      return NextResponse.json<ApiResponse<{ verified: boolean }>>({
        success: true,
        data:    { verified: true },
        message: plan === 'pro' ? 'Pro plan activated!' : 'Payment successful!',
      });

    } else {
      // ── Create Order ──────────────────────────────────────────────────────
      const parsed = createOrderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json<ApiResponse<null>>({ success: false, error: parsed.error.message }, { status: 400 });
      }

      const { plan } = parsed.data;
      const amount   = PLAN_PRICES[plan];

      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt:  `receipt_${userId}_${Date.now()}`,
        notes:    { userId, plan },
      });

      // Save order to Firestore
      const paymentRecord: PaymentOrder = {
        orderId:   order.id,
        amount,
        currency:  'INR',
        plan:      plan as PaymentOrder['plan'],
        userId,
        status:    'created',
        createdAt: new Date().toISOString(),
      };
      await adminDb.collection(COLLECTIONS.PAYMENTS).doc(order.id).set(paymentRecord);

      return NextResponse.json<ApiResponse<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        planName: string;
      }>>({
        success: true,
        data: {
          orderId:  order.id,
          amount,
          currency: 'INR',
          keyId:    process.env.RAZORPAY_KEY_ID!,
          planName: PLAN_NAMES[plan],
        },
      });
    }

  } catch (err: unknown) {
    console.error('[API /payment]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json<ApiResponse<null>>({ success: false, error: message }, { status: 500 });
  }
}
