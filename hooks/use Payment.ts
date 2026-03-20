// hooks/usePayment.ts
'use client';
import { useState, useCallback } from 'react';

export function usePayment(idToken: string | null) {
  const [loading, setLoading] = useState(false);

  const initiatePayment = useCallback(async (plan: 'pro' | 'report' | 'per_question') => {
    if (!idToken) return;
    setLoading(true);
    try {
      const orderRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ plan }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error);

      const { orderId, amount, currency, keyId, planName } = orderData.data;

      const options = {
        key: keyId, amount, currency,
        name: 'AstroAI India',
        description: planName,
        order_id: orderId,
        image: '/logo.png',
        theme: { color: '#D4AF37' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch('/api/payment?action=verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              plan,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('🎉 Payment successful! Your plan has been upgraded.');
            window.location.reload();
          }
        },
      };
      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Payment failed');
    } finally { setLoading(false); }
  }, [idToken]);

  return { initiatePayment, loading };
}

