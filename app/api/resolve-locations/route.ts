import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function geocodeLocation(location: string): Promise<{ lat: number; long: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status === 'OK' && data.results.length > 0) {
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, long: lng };
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { locations } = await req.json();
    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    // Query all locations in one go
    const placeholders = locations.map((_, i) => `$${i + 1}`).join(', ');
    const dbRes = await query(
      `SELECT location, lat, long FROM location_cache WHERE location IN (${placeholders})`,
      locations
    );
    const found: Record<string, { lat: number; long: number }> = {};
    dbRes.rows.forEach((row: any) => {
      found[row.location] = { lat: row.lat, long: row.long };
    });

    // Find missing locations
    const missing = locations.filter(loc => !(loc in found));
    const newlyResolved: Record<string, { lat: number; long: number }> = {};
    for (const loc of missing) {
      const geo = await geocodeLocation(loc);
      if (geo) {
        newlyResolved[loc] = geo;
        // Save to DB
        await query(
          'INSERT INTO location_cache (location, lat, long) VALUES ($1, $2, $3) ON CONFLICT (location) DO NOTHING',
          [loc, geo.lat, geo.long]
        );
      }
    }

    return NextResponse.json({ ...found, ...newlyResolved });
  } catch (err) {
    console.error('Error resolving locations:', err);
    return NextResponse.json({}, { status: 500 });
  }
} 