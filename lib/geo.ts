// lib/geo.ts
// Convert place name → lat/lng/timezone using Google Maps Geocoding API

import type { GeoLocation } from '@/types';

const GEOCODING_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';
const TIMEZONE_BASE  = 'https://maps.googleapis.com/maps/api/timezone/json';

/**
 * Geocode a place string to coordinates + timezone.
 * Falls back to New Delhi if geocoding fails.
 */
export async function geocodePlace(place: string): Promise<GeoLocation> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error('Missing GOOGLE_MAPS_API_KEY');

    // Step 1: Geocode
    const geoRes = await fetch(
      `${GEOCODING_BASE}?address=${encodeURIComponent(place)}&key=${apiKey}`
    );
    const geoData = await geoRes.json();

    if (geoData.status !== 'OK' || !geoData.results[0]) {
      throw new Error('Geocoding failed');
    }

    const result     = geoData.results[0];
    const { lat, lng } = result.geometry.location;

    // Extract city, state, country from address_components
    let city = '', state = '', country = '';
    for (const comp of result.address_components) {
      if (comp.types.includes('locality'))               city    = comp.long_name;
      if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
      if (comp.types.includes('country'))                country = comp.long_name;
    }

    // Step 2: Get timezone
    const timestamp = Math.floor(Date.now() / 1000);
    const tzRes     = await fetch(
      `${TIMEZONE_BASE}?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`
    );
    const tzData = await tzRes.json();

    const utcOffset  = tzData.status === 'OK'
      ? (tzData.rawOffset + tzData.dstOffset) / 3600
      : 5.5; // Default to IST

    return {
      city:      city || place,
      state,
      country:   country || 'India',
      latitude:  lat,
      longitude: lng,
      timezone:  tzData.timeZoneId || 'Asia/Kolkata',
      utcOffset,
    };
  } catch (err) {
    console.warn('[Geo] Geocoding failed, using New Delhi fallback:', err);
    // Default: New Delhi, India
    return {
      city:      'New Delhi',
      state:     'Delhi',
      country:   'India',
      latitude:  28.6139,
      longitude: 77.2090,
      timezone:  'Asia/Kolkata',
      utcOffset: 5.5,
    };
  }
}
