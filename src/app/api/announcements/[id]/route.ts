import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Announcement } from '@/models/Announcement';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    if (!isManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const announcement = await Announcement.findById(id);
    if (!announcement) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only author or admin can delete
    const isAdmin = emsUser && ['admin', 'ceo'].includes(emsUser.appRole);
    if (announcement.authorSsoId !== session.ssoUserId && !isAdmin) {
      return NextResponse.json({ error: 'Can only delete your own announcements' }, { status: 403 });
    }

    await announcement.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);
    if (!isManager) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const announcement = await Announcement.findByIdAndUpdate(id, { $set: body }, { new: true });

    if (!announcement) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(announcement);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
