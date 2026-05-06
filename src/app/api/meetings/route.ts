import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Meeting } from '@/models/Meeting';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const meetings = await Meeting.find({}).sort({ scheduledTime: 1 });
    
    return NextResponse.json(meetings);
  } catch (err: any) {
    console.error("GET /api/meetings failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const meeting = new Meeting({
      ...body,
      hostSsoId: user.ssoUserId,
    });

    await meeting.save();
    return NextResponse.json(meeting, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
