import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/db';
import { LeaveBalance } from '@/models/LeaveBalance';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';
import { populateSsoUsers } from '@/lib/sso';

/**
 * GET /api/attendance/leave-balance
 * - Employees: their own balance for the current year
 * - Managers: all employees' balances
 *
 * Query params:
 *   ?year=2025      — defaults to current year
 *   ?ssoUserId=xxx  — fetch a specific user's balance (manager only)
 */
export async function GET(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const url = new URL(req.url);
    const year = Number(url.searchParams.get('year') || new Date().getFullYear());
    const queriedId = url.searchParams.get('ssoUserId');

    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    // Determine which users to fetch
    const query: any = { year };
    if (!isManager) {
      query.ssoUserId = session.ssoUserId;
    } else if (queriedId) {
      query.ssoUserId = queriedId;
    }

    const balances = await LeaveBalance.find(query).lean();

    if (!isManager || queriedId) {
      // Just return own / single balance
      return NextResponse.json(balances[0] || null);
    }

    // For managers, populate employee names
    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';
    const populated = await populateSsoUsers(balances as any[], 'ssoUserId', 'employeeDetails', {
      headers: { Cookie: cookie },
    });

    return NextResponse.json(populated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/attendance/leave-balance
 * Admin-only: set (upsert) a leave balance config for an employee.
 * Body: { ssoUserId, year?, annualAllotted, sickAllotted, casualAllotted, carryForward? }
 */
export async function POST(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isAdmin = emsUser && ['admin', 'ceo'].includes(emsUser.appRole);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const {
      ssoUserId,
      year = new Date().getFullYear(),
      annualAllotted = 12,
      sickAllotted = 7,
      casualAllotted = 7,
      carryForward = 0,
    } = body;

    if (!ssoUserId) return NextResponse.json({ error: 'ssoUserId required' }, { status: 400 });

    const balance = await LeaveBalance.findOneAndUpdate(
      { ssoUserId, year },
      {
        $set: {
          annualAllotted: Number(annualAllotted),
          sickAllotted: Number(sickAllotted),
          casualAllotted: Number(casualAllotted),
          carryForward: Number(carryForward),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(balance, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
