import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';

// PATCH /api/attendance/[id] — manager approves/rejects leave, or updates status
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
    const { leaveStatus } = body; // 'approved' | 'rejected'

    if (!leaveStatus) return NextResponse.json({ error: 'leaveStatus required' }, { status: 400 });

    const record = await Attendance.findByIdAndUpdate(
      id,
      {
        $set: {
          'leaveRequest.status': leaveStatus,
          'leaveRequest.approvedBy': session.ssoUserId,
          'leaveRequest.approvedAt': new Date(),
        },
      },
      { new: true }
    );

    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
