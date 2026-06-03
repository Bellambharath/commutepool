import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://commutepool-api.onrender.com';

export async function GET(_req: NextRequest) {
  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/api/corridors`, { cache: 'no-store' });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }
  const data = await backendRes.json().catch(() => []);
  return NextResponse.json(data, { status: backendRes.status });
}
