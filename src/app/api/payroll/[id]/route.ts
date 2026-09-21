import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Payslip } from '@/models/Payslip';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';

/**
 * GET /api/payroll/[id]  — Fetch a single payslip by MongoDB _id
 * PATCH /api/payroll/[id] — Update status (approve / mark paid) or add notes
 */

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const payslip = await Payslip.findById(id).lean();

    if (!payslip) return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });

    // Employees can only see their own
    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);
    if (!isManager && (payslip as any).ssoUserId !== session.ssoUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(payslip);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isAdmin = emsUser && ['admin', 'ceo'].includes(emsUser.appRole);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const body = await req.json();
    const allowedFields: Record<string, unknown> = {};
    if (body.status && ['draft', 'approved', 'paid'].includes(body.status)) {
      allowedFields.status = body.status;
      if (body.status === 'paid') allowedFields.paidAt = new Date();
    }
    if (body.notes !== undefined) allowedFields.notes = body.notes;
    if (body.bonus !== undefined) {
      // Recalculate net when bonus changes
      const existing = await Payslip.findById(id);
      if (existing) {
        const newBonus = Number(body.bonus);
        const proRata = existing.workingDays > 0 ? existing.daysWorked / existing.workingDays : 0;
        const grossSalary = Math.round((existing.basicSalary + existing.allowances) * proRata + newBonus);
        const netSalary = Math.max(0, grossSalary - existing.totalDeductions);
        allowedFields.bonus = newBonus;
        allowedFields.grossSalary = grossSalary;
        allowedFields.netSalary = netSalary;
      }
    }

    const updated = await Payslip.findByIdAndUpdate(id, { $set: allowedFields }, { new: true });
    if (!updated) return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
