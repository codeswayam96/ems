import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import { EmsUser } from '@/models/EmsUser';
import { LeaveBalance } from '@/models/LeaveBalance';
import { getUserFromSession } from '@/lib/auth';

/** Map leave type to balance bucket */
function balanceBucket(type: string): 'sickUsed' | 'casualUsed' | 'annualUsed' {
  if (type === 'sick' || type === 'medical') return 'sickUsed';
  if (type === 'casual') return 'casualUsed';
  return 'annualUsed'; // vacation, other → annual
}

/**
 * PATCH /api/attendance/[id]
 * Manager approves/rejects a leave request.
 * On approval: increments the correct LeaveBalance bucket.
 * On rejection (after prior approval): decrements the bucket back.
 */
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

    if (!leaveStatus || !['approved', 'rejected'].includes(leaveStatus)) {
      return NextResponse.json({ error: 'leaveStatus must be approved or rejected' }, { status: 400 });
    }

    // Fetch existing record to get leave details
    const existing = await Attendance.findById(id);
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    const leaveReq = existing.leaveRequest;
    if (!leaveReq) return NextResponse.json({ error: 'No leave request on this record' }, { status: 400 });

    const prevStatus = leaveReq.status;

    // Update the attendance record
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

    // Sync LeaveBalance
    const year = new Date(leaveReq.startDate).getFullYear();
    const bucket = balanceBucket(leaveReq.type);
    const days = leaveReq.days || 1;

    if (leaveStatus === 'approved' && prevStatus !== 'approved') {
      // Increment used days — upsert so the balance row is auto-created if missing
      await LeaveBalance.findOneAndUpdate(
        { ssoUserId: existing.ssoUserId, year },
        { $inc: { [bucket]: days } },
        { upsert: true, new: true }
      );
    } else if (leaveStatus === 'rejected' && prevStatus === 'approved') {
      // Revert: decrement back (don't go below 0)
      const bal = await LeaveBalance.findOne({ ssoUserId: existing.ssoUserId, year });
      if (bal) {
        const current = (bal as any)[bucket] ?? 0;
        await LeaveBalance.findOneAndUpdate(
          { ssoUserId: existing.ssoUserId, year },
          { $set: { [bucket]: Math.max(0, current - days) } }
        );
      }
    }

    return NextResponse.json(record);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
