import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/db';
import { Team } from '@/models/Team';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';
import { populateSsoUsers } from '@codeswayam/auth';

export async function GET() {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const teams = await Team.find({}).sort({ createdAt: -1 }).lean();

    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    // Populate the lead field with SSO user details
    const populated = await populateSsoUsers(teams as any[], 'lead', 'leadUser', {
      headers: { Cookie: cookie },
    });

    return NextResponse.json(populated);
  } catch (err: any) {
    console.error('GET /api/teams failed:', err);
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
      return NextResponse.json({ error: 'Only managers can create teams' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, department, color, lead } = body;

    if (!name || !department || !lead) {
      return NextResponse.json({ error: 'name, department and lead are required' }, { status: 400 });
    }

    const team = await Team.create({
      name,
      description,
      department,
      color: color || 'bg-violet-500',
      lead: lead,
      members: [{ ssoUserId: lead, joinedAt: new Date() }],
      createdBy: session.ssoUserId,
    });

    return NextResponse.json(team, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
