import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { TimeEntry } from '@/models/TimeEntry';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';

// PATCH /api/tracking/[id] — manager approves or rejects; employee can update own pending entry
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    const body = await req.json();

    if (isManager) {
      // Manager can approve/reject
      const { status, rejectionReason } = body;
      const update: any = { status };
      if (status === 'approved') {
        update.approvedBy = session.ssoUserId;
        update.approvedAt = new Date();
      }
      if (rejectionReason) update.rejectionReason = rejectionReason;

      const entry = await TimeEntry.findByIdAndUpdate(id, update, { new: true });
      if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      return NextResponse.json(entry);
    } else {
      // Employee can update own pending entry
      const entry = await TimeEntry.findOne({ _id: id, ssoUserId: session.ssoUserId, status: 'pending' });
      if (!entry) return NextResponse.json({ error: 'Entry not found or already approved' }, { status: 404 });

      const { project, description, hours, date } = body;
      if (project) entry.project = project;
      if (description !== undefined) entry.description = description;
      if (hours) entry.hours = parseFloat(hours);
      if (date) entry.date = new Date(date);

      await entry.save();
      return NextResponse.json(entry);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    // Only owner can delete their own pending entry
    const entry = await TimeEntry.findOne({ _id: id, ssoUserId: session.ssoUserId, status: 'pending' });
    if (!entry) return NextResponse.json({ error: 'Cannot delete approved or non-existent entry' }, { status: 404 });

    await entry.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
