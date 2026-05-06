import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/db';
import { Announcement } from '@/models/Announcement';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';
import { populateSsoUsers } from '@codeswayam/auth';

export async function GET(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 50;

    // Build query: not expired
    const query: any = {
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: { $exists: false } }],
    };

    const announcements = await Announcement.find(query)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    const populated = await populateSsoUsers(announcements as any[], 'authorSsoId', 'authorDetails', {
      headers: { Cookie: cookie },
    });

    return NextResponse.json(populated);
  } catch (err: any) {
    console.error('GET /api/announcements failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    if (!isManager) {
      return NextResponse.json({ error: 'Only managers can post announcements' }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, priority, pinned, targetDepartment, expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority: priority || 'normal',
      authorSsoId: session.ssoUserId,
      pinned: pinned ?? false,
      targetDepartment: targetDepartment || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
