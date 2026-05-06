import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';
import { populateSsoUsers } from '@codeswayam/auth';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const users = await EmsUser.find({}).sort({ createdAt: -1 }).lean();
    
    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';
    
    const populatedUsers = await populateSsoUsers(users, 'ssoUserId' as any, 'ssoDetails', {
        headers: { Cookie: cookie }
    });
    
    return NextResponse.json(populatedUsers);
  } catch (err: any) {
    console.error("GET /api/users failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const currentUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isAdmin = currentUser && ['admin', 'ceo'].includes(currentUser.appRole);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const body = await req.json();
    const { ssoUserId, appRole, department } = body;

    if (!ssoUserId) {
        return NextResponse.json({ error: 'ssoUserId is required' }, { status: 400 });
    }

    const existing = await EmsUser.findOne({ ssoUserId });
    if (existing) {
        return NextResponse.json({ error: 'User already exists in EMS' }, { status: 400 });
    }

    const newUser = await EmsUser.create({
        ssoUserId,
        appRole: appRole || 'employee',
        department: department || 'General',
        status: body.status || 'pending',
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
