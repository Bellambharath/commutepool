import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://commutepool-api.onrender.com';

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/api/offers/available`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }

  const data = await backendRes.json().catch(() => ({}));

  return NextResponse.json(data, {
    status: backendRes.status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Vary': 'Cookie',
    },
  });
}
