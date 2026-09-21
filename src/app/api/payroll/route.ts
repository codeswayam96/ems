import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { startOfMonth, endOfMonth, getDaysInMonth, isWeekend } from 'date-fns';
import connectToDatabase from '@/lib/db';
import { Payslip } from '@/models/Payslip';
import { SalaryConfig } from '@/models/SalaryConfig';
import { EmsUser } from '@/models/EmsUser';
import { Attendance } from '@/models/Attendance';
import { getUserFromSession } from '@/lib/auth';
import { populateSsoUsers } from '@/lib/sso';

/** Count working (weekday) days in a given month */
function countWorkingDays(year: number, month: number): number {
  const total = getDaysInMonth(new Date(year, month - 1));
  let count = 0;
  for (let d = 1; d <= total; d++) {
    if (!isWeekend(new Date(year, month - 1, d))) count++;
  }
  return count;
}

/**
 * GET /api/payroll
 * - Admins/managers: see all payslips (optionally filtered by payPeriod query param)
 * - Employees: see only their own payslips
 */
export async function GET(req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const url = new URL(req.url);
    const payPeriod = url.searchParams.get('payPeriod'); // "2025-05"
    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    const query: any = {};
    if (!isManager) query.ssoUserId = session.ssoUserId;
    if (payPeriod) query.payPeriod = payPeriod;

    const payslips = await Payslip.find(query).sort({ year: -1, month: -1 }).lean();

    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    const populated = await populateSsoUsers(payslips as any[], 'ssoUserId', 'employeeDetails', {
      headers: { Cookie: cookie },
    });

    return NextResponse.json(populated);
  } catch (err: any) {
    console.error('GET /api/payroll failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/payroll
 * Admin-only: generate payslips for a pay period.
 * Body: { month: number, year: number, bonus?: Record<ssoUserId, number>, notes?: string }
 *
 * Algorithm:
 *  1. Get all approved EmsUsers with a SalaryConfig
 *  2. For each user, count their "present" attendance days in the period
 *  3. Calculate gross = (basic + allowances) × (daysWorked / workingDays) + bonus
 *  4. Calculate deductions (PF, PT, other)
 *  5. netSalary = gross - deductions
 *  6. Upsert Payslip (idempotent — re-running payroll updates the draft)
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
    const { month, year, bonus = {}, notes = '' } = body;

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const payPeriod = `${year}-${String(month).padStart(2, '0')}`;
    const workingDays = countWorkingDays(year, month);

    // Period boundaries for attendance lookup
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));

    // Fetch all approved employees that have salary configs
    const [allUsers, allConfigs] = await Promise.all([
      EmsUser.find({ status: 'approved' }).lean(),
      SalaryConfig.find({}).lean(),
    ]);

    const configMap: Record<string, any> = {};
    allConfigs.forEach((c) => { configMap[c.ssoUserId] = c; });

    // Only process users that have a salary config
    const eligibleUsers = allUsers.filter((u) => configMap[u.ssoUserId]);

    if (eligibleUsers.length === 0) {
      return NextResponse.json({ error: 'No employees with salary configurations found. Set up salary configs first.' }, { status: 422 });
    }

    // Fetch attendance for the period for all eligible users
    const ssoIds = eligibleUsers.map((u) => u.ssoUserId);
    const attendanceRecords = await Attendance.find({
      ssoUserId: { $in: ssoIds },
      date: { $gte: periodStart, $lte: periodEnd },
      status: { $in: ['present', 'partial'] },
    }).lean();

    // Build attendance count map
    const attendanceMap: Record<string, number> = {};
    attendanceRecords.forEach((r) => {
      const uid = r.ssoUserId as string;
      // partial day counts as 0.5
      attendanceMap[uid] = (attendanceMap[uid] || 0) + (r.status === 'partial' ? 0.5 : 1);
    });

    const upsertOps = eligibleUsers.map((u) => {
      const config = configMap[u.ssoUserId];
      const daysWorked = Math.min(attendanceMap[u.ssoUserId] || 0, workingDays);
      const employeeBonus = (bonus as Record<string, number>)[u.ssoUserId] || 0;

      const proRata = workingDays > 0 ? daysWorked / workingDays : 0;
      const grossSalary = Math.round((config.basicSalary + config.allowances) * proRata + employeeBonus);

      const pfDeduction = Math.round((config.basicSalary * config.pfPercent) / 100);
      const professionalTax = config.professionalTax ?? 200;
      const otherDeductions = config.otherDeductions ?? 0;
      const totalDeductions = pfDeduction + professionalTax + otherDeductions;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      return {
        updateOne: {
          filter: { ssoUserId: u.ssoUserId, payPeriod },
          update: {
            $set: {
              payPeriod, month, year,
              basicSalary: config.basicSalary,
              allowances: config.allowances,
              bonus: employeeBonus,
              workingDays,
              daysWorked,
              grossSalary,
              pfDeduction,
              professionalTax,
              otherDeductions,
              totalDeductions,
              netSalary,
              generatedBy: session.ssoUserId,
              notes,
              status: 'draft' as const,
            } as any,
          },
          upsert: true,
        },
      };
    });

    await Payslip.bulkWrite(upsertOps);

    const generated = await Payslip.find({ payPeriod }).lean();
    return NextResponse.json({
      message: `Payroll generated for ${generated.length} employee(s) — period: ${payPeriod}`,
      payPeriod,
      count: generated.length,
    }, { status: 201 });

  } catch (err: any) {
    console.error('POST /api/payroll failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
