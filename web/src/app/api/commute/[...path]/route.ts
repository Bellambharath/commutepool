import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://commutepool-api.onrender.com';

async function proxy(req: NextRequest, params: { path: string[] }, method: string, hasBody: boolean) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const subPath = params.path.join('/');
  const url = `${API_BASE}/api/commute/${subPath}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  let body: string | undefined;
  if (hasBody) {
    body = await req.text();
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(url, { method, headers, body, cache: 'no-store' });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }

  const text = await backendRes.text();
  const ct = backendRes.headers.get('content-type') ?? '';
  const data = ct.includes('application/json') ? JSON.parse(text || 'null') : text;

  return NextResponse.json(data, { status: backendRes.status });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params, 'GET', false);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params, 'PUT', true);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params, 'POST', false);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params, 'DELETE', false);
}
