import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { startOfDay, endOfDay, startOfMonth } from 'date-fns';
import connectToDatabase from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';
import { populateSsoUsers } from '@codeswayam/auth';

export async function GET(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    let query: any;
    if (isManager) {
      // Managers see all attendance for the selected date
      query = {
        date: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
      };
    } else {
      // Employees see their own records for the current month
      const monthStart = startOfMonth(targetDate);
      query = {
        ssoUserId: session.ssoUserId,
        date: { $gte: monthStart, $lte: new Date() },
      };
    }

    const records = await Attendance.find(query).sort({ date: -1 }).lean();

    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    const populated = await populateSsoUsers(records as any[], 'ssoUserId', 'userDetails', {
      headers: { Cookie: cookie },
    });

    return NextResponse.json(populated);
  } catch (err: any) {
    console.error('GET /api/attendance failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();
    const { action } = body; // 'checkin' | 'checkout' | 'leave_request'

    const today = startOfDay(new Date());

    if (action === 'checkin') {
      const existing = await Attendance.findOne({
        ssoUserId: session.ssoUserId,
        date: { $gte: today, $lte: endOfDay(today) },
      });

      if (existing?.checkIn) {
        return NextResponse.json({ error: 'Already checked in today' }, { status: 400 });
      }

      const record = existing
        ? await Attendance.findByIdAndUpdate(existing._id, {
            checkIn: new Date(),
            status: 'present',
          }, { new: true })
        : await Attendance.create({
            ssoUserId: session.ssoUserId,
            date: today,
            checkIn: new Date(),
            status: 'present',
          });

      return NextResponse.json(record, { status: 201 });
    }

    if (action === 'checkout') {
      const record = await Attendance.findOneAndUpdate(
        {
          ssoUserId: session.ssoUserId,
          date: { $gte: today, $lte: endOfDay(today) },
          checkIn: { $exists: true },
          checkOut: { $exists: false },
        },
        { checkOut: new Date() },
        { new: true }
      );

      if (!record) {
        return NextResponse.json({ error: 'No active check-in found for today' }, { status: 400 });
      }

      return NextResponse.json(record);
    }

    if (action === 'leave_request') {
      const { type, startDate, endDate, days, reason } = body;

      if (!type || !startDate || !endDate || !reason) {
        return NextResponse.json({ error: 'Missing required leave request fields' }, { status: 400 });
      }

      const start = startOfDay(new Date(startDate));

      // Create attendance record with embedded leave request
      const record = await Attendance.findOneAndUpdate(
        { ssoUserId: session.ssoUserId, date: start },
        {
          $setOnInsert: { ssoUserId: session.ssoUserId, date: start },
          status: 'leave',
          leaveRequest: { type, startDate: new Date(startDate), endDate: new Date(endDate), days, reason, status: 'pending' },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json(record, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
