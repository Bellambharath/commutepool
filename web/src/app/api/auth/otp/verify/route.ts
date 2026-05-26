import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://commutepool-api.onrender.com';

export async function POST(req: NextRequest) {
  const body = await req.json();

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }

  const data = await backendRes.json().catch(() => ({})) as Record<string, unknown>;

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json(data, { status: 200 });

  // Set HttpOnly cookies so Edge middleware can read them on the next request
  if (typeof data.accessToken === 'string') {
    response.cookies.set('accessToken', data.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,          // 1 day
      secure: process.env.NODE_ENV === 'production',
    });
  }
  if (typeof data.refreshToken === 'string') {
    response.cookies.set('refreshToken', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,     // 30 days
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}
