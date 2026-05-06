import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  console.log('GET /api/users/me hit');
  const session = await getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  try {
    // Find or create the EMS-specific user profile
    let emsProfile = await EmsUser.findOne({ ssoUserId: session.ssoUserId });

    if (!emsProfile) {
      emsProfile = await EmsUser.create({
        ssoUserId: session.ssoUserId,
        appRole: 'employee', // Default role
        department: 'General',
      });
    }

    return NextResponse.json(emsProfile);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getUserFromSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    await connectToDatabase();

    const emsProfile = await EmsUser.findOneAndUpdate(
      { ssoUserId: session.ssoUserId },
      { $set: body },
      { new: true }
    );

    return NextResponse.json(emsProfile);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
