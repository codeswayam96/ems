import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/db';
import { TimeEntry } from '@/models/TimeEntry';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';
import { populateSsoUsers } from '@/lib/sso';

export async function GET() {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    const query = isManager ? {} : { ssoUserId: session.ssoUserId };
    const entries = await TimeEntry.find(query).sort({ date: -1 }).lean();

    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    const populated = await populateSsoUsers(entries as any[], 'ssoUserId', 'userDetails', {
      headers: { Cookie: cookie },
    });

    return NextResponse.json(populated);
  } catch (err: any) {
    console.error('GET /api/tracking failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const { project, description, hours, date } = body;

    if (!project || !hours || !date) {
      return NextResponse.json({ error: 'project, hours and date are required' }, { status: 400 });
    }

    const entry = await TimeEntry.create({
      ssoUserId: session.ssoUserId,
      project,
      description,
      hours: parseFloat(hours),
      date: new Date(date),
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
