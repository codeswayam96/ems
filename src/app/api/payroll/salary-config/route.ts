import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/db';
import { SalaryConfig } from '@/models/SalaryConfig';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';
import { populateSsoUsers } from '@/lib/sso';

/**
 * GET /api/payroll/salary-config
 * - Admins: all configs with employee details
 * - Employees: only their own config
 */
export async function GET(_req: Request) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    const query = isManager ? {} : { ssoUserId: session.ssoUserId };
    const configs = await SalaryConfig.find(query).lean();

    if (!isManager) return NextResponse.json(configs);

    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';
    const populated = await populateSsoUsers(configs as any[], 'ssoUserId', 'employeeDetails', {
      headers: { Cookie: cookie },
    });

    return NextResponse.json(populated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/payroll/salary-config
 * Admin-only: create or update salary config for an employee.
 * Body: { ssoUserId, basicSalary, allowances, pfPercent, professionalTax, otherDeductions, bankAccount?, ifsc? }
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
    const { ssoUserId, basicSalary, allowances, pfPercent, professionalTax, otherDeductions, bankAccount, ifsc } = body;

    if (!ssoUserId || basicSalary == null) {
      return NextResponse.json({ error: 'ssoUserId and basicSalary are required' }, { status: 400 });
    }

    const config = await SalaryConfig.findOneAndUpdate(
      { ssoUserId },
      {
        $set: {
          basicSalary: Number(basicSalary),
          allowances: Number(allowances ?? 0),
          pfPercent: Number(pfPercent ?? 12),
          professionalTax: Number(professionalTax ?? 200),
          otherDeductions: Number(otherDeductions ?? 0),
          ...(bankAccount !== undefined && { bankAccount }),
          ...(ifsc !== undefined && { ifsc }),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(config, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
