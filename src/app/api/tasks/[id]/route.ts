import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/db';
import { Task } from '@/models/Task';
import { getUserFromSession } from '@/lib/auth';
import { EmsUser } from '@/models/EmsUser';
import { populateSsoUsers } from '@/lib/sso';

// GET /api/tasks/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectToDatabase();

  const task = await Task.findById(id);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  // Employees can only view their own tasks
  const emsUser = await EmsUser.findOne({ ssoUserId: user.ssoUserId });
  const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

  if (!isManager && task.assignedToSsoId !== user.ssoUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Populate users
  const rawTask = task.toObject();
  const headersList = await headers();
  const cookie = headersList.get('cookie') || '';

  let [populatedTask] = await populateSsoUsers([rawTask], 'assignedToSsoId' as any, 'assignedToUser', {
    headers: { cookie }
  });
  [populatedTask] = await populateSsoUsers([populatedTask], 'assignedBySsoId' as any, 'assignedByUser', {
    headers: { cookie }
  });

  return NextResponse.json(populatedTask);
}

// PATCH /api/tasks/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectToDatabase();

  const task = await Task.findById(id);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const emsUser = await EmsUser.findOne({ ssoUserId: user.ssoUserId });
  const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

  const body = await req.json();

  // Employees can only update status (submit their own task)
  if (!isManager) {
    if (task.assignedToSsoId !== user.ssoUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Employees may only change status to in_progress or submitted
    const allowedStatuses = ['in_progress', 'submitted'];
    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'You can only set status to in_progress or submitted' }, { status: 403 });
    }
    // Strip fields employees cannot touch
    const { status } = body;
    const updateData: any = {};
    if (status) updateData.status = status;

    // Handle submission
    if (body.submission) {
      const submission = {
        ssoUserId: user.ssoUserId,
        contentUrl: body.submission.contentUrl,
        externalLink: body.submission.externalLink,
        notes: body.submission.notes,
        version: (task.submissions?.length || 0) + 1,
        createdAt: new Date(),
      };
      updateData.$push = { submissions: submission };
      updateData.status = 'submitted';
    }

    const updated = await Task.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updated);
  }

  // Managers can update everything
  const { submission, ...managerUpdate } = body;
  const updated = await Task.findByIdAndUpdate(id, managerUpdate, { new: true });
  return NextResponse.json(updated);
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await connectToDatabase();

  const emsUser = await EmsUser.findOne({ ssoUserId: user.ssoUserId });
  const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

  if (!isManager) {
    return NextResponse.json({ error: 'Only managers can delete tasks' }, { status: 403 });
  }

  const task = await Task.findByIdAndDelete(id);
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json({ message: 'Task deleted successfully' });
}
