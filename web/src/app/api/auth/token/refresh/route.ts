import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://commutepool-api.onrender.com';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const { refreshToken } = body;
  if (!refreshToken || typeof refreshToken !== 'string') {
    return NextResponse.json({ message: 'refreshToken is required' }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE}/api/auth/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }

  const data = await backendRes.json().catch(() => ({})) as Record<string, unknown>;

  if (!backendRes.ok) {
    // 401 from backend = refresh token expired/invalid — let the client know
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json(data, { status: 200 });

  // Write refreshed cookies.
  // httpOnly: false — must match otp/verify/route.ts so that:
  //   (a) Edge middleware can read the cookie server-side, AND
  //   (b) lib/auth.ts getAccessToken() can read it via document.cookie.
  if (typeof data.accessToken === 'string') {
    response.cookies.set('accessToken', data.accessToken, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,        // 1 day
      secure: process.env.NODE_ENV === 'production',
    });
  }
  if (typeof data.refreshToken === 'string') {
    response.cookies.set('refreshToken', data.refreshToken, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,  // 30 days
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}
