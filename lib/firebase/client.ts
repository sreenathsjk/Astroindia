// lib/firebase/client.ts
// Firebase CLIENT-SIDE SDK (used in browser)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Prevent duplicate initialization in dev (hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// ─── OTP AUTH HELPERS ─────────────────────────────────────────────────────────

/**
 * Set up invisible reCAPTCHA on the given button ID.
 * Call once on the login page.
 */
export function setupRecaptcha(buttonId: string) {
  return new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {},
  });
}

/**
 * Send OTP to an Indian phone number.
 * @param phone  E.164 format, e.g. "+919876543210"
 * @param appVerifier  RecaptchaVerifier instance
 */
export async function sendOtp(phone: string, appVerifier: RecaptchaVerifier) {
  const result = await signInWithPhoneNumber(auth, phone, appVerifier);
  return result; // store confirmationResult → call .confirm(otp)
}
