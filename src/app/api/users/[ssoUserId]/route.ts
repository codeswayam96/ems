import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';

// PATCH /api/users/[ssoUserId] - Update user role/department
export async function PATCH(req: Request, { params }: { params: Promise<{ ssoUserId: string }> }) {
  const session = await getUserFromSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ssoUserId } = await params;
  await connectToDatabase();

  // Check if current user is admin/ceo
  const currentUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
  const isAdmin = currentUser && ['admin', 'ceo'].includes(currentUser.appRole);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await EmsUser.findOneAndUpdate(
      { ssoUserId },
      { $set: body },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// DELETE /api/users/[ssoUserId] - Remove user from EMS (Fire)
export async function DELETE(_req: Request, { params }: { params: Promise<{ ssoUserId: string }> }) {
  const session = await getUserFromSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ssoUserId } = await params;
  await connectToDatabase();

  // Check if current user is admin/ceo
  const currentUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
  const isAdmin = currentUser && ['admin', 'ceo'].includes(currentUser.appRole);

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  }

  try {
    const deleted = await EmsUser.findOneAndDelete({ ssoUserId });
    if (!deleted) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ message: 'User removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
