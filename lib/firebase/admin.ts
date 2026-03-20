// lib/firebase/admin.ts
// Firebase ADMIN SDK (server-side only — API routes)

import * as admin from 'firebase-admin';

// Prevent re-initialization during hot reload
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON!
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminAuth    = admin.auth();
export const adminDb      = admin.firestore();
export const adminStorage = admin.storage();

// ─── FIRESTORE COLLECTIONS ────────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS:        'users',
  KUNDLIS:      'kundlis',
  CHAT_HISTORY: 'chat_history',
  DAILY_PREDS:  'daily_predictions',
  PAYMENTS:     'payments',
} as const;

// ─── SERVER-SIDE AUTH HELPER ──────────────────────────────────────────────────
/**
 * Verify Firebase ID token from Authorization header.
 * Usage in API routes: const userId = await verifyToken(req)
 */
export async function verifyToken(req: Request): Promise<string> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

// ─── USER HELPERS ─────────────────────────────────────────────────────────────
export async function getOrCreateUser(uid: string, phone: string, name: string) {
  const userRef = adminDb.collection(COLLECTIONS.USERS).doc(uid);
  const snap = await userRef.get();

  if (!snap.exists) {
    const now = new Date().toISOString();
    const newUser = {
      userId: uid,
      phone,
      name,
      preferredLanguage: 'English',
      plan: 'free',
      questionsUsedToday: 0,
      questionsLimit: 5,
      createdAt: now,
      lastActiveAt: now,
    };
    await userRef.set(newUser);
    return newUser;
  }

  // Update last active
  await userRef.update({ lastActiveAt: new Date().toISOString() });
  return snap.data();
}

// ─── KUNDLI HELPERS ───────────────────────────────────────────────────────────
export async function saveKundli(userId: string, kundliData: object) {
  const kundliRef = adminDb.collection(COLLECTIONS.KUNDLIS).doc(userId);
  const now = new Date().toISOString();
  await kundliRef.set({ ...kundliData, userId, updatedAt: now }, { merge: true });

  // Link kundliId on user doc
  await adminDb.collection(COLLECTIONS.USERS).doc(userId).update({
    kundliId: userId,
  });
  return userId;
}

export async function getKundli(userId: string) {
  const snap = await adminDb.collection(COLLECTIONS.KUNDLIS).doc(userId).get();
  return snap.exists ? snap.data() : null;
}

// ─── DAILY PREDICTION HELPERS ─────────────────────────────────────────────────
export async function getDailyPrediction(userId: string, date: string) {
  const docId = `${userId}_${date}`;
  const snap = await adminDb.collection(COLLECTIONS.DAILY_PREDS).doc(docId).get();
  return snap.exists ? snap.data() : null;
}

export async function saveDailyPrediction(userId: string, date: string, data: object) {
  const docId = `${userId}_${date}`;
  await adminDb.collection(COLLECTIONS.DAILY_PREDS).doc(docId).set({
    ...data,
    userId,
    date,
    cachedAt: new Date().toISOString(),
  });
}

// ─── QUESTION QUOTA HELPER ────────────────────────────────────────────────────
export async function checkAndDecrementQuota(userId: string): Promise<boolean> {
  const userRef = adminDb.collection(COLLECTIONS.USERS).doc(userId);

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data()!;

    if (data.plan !== 'free') return true; // Paid users: unlimited

    const today = new Date().toDateString();
    const lastReset = data.lastQuotaReset || '';

    // Reset counter daily
    if (lastReset !== today) {
      tx.update(userRef, { questionsUsedToday: 1, lastQuotaReset: today });
      return true;
    }

    if (data.questionsUsedToday >= data.questionsLimit) return false;

    tx.update(userRef, {
      questionsUsedToday: admin.firestore.FieldValue.increment(1),
    });
    return true;
  });
}
