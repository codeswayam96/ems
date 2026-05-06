import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectToDatabase from '@/lib/db';
import { Task } from '@/models/Task';
import { getUserFromSession } from '@/lib/auth';
import { EmsUser } from '@/models/EmsUser';
import { populateSsoUsers } from '@/lib/sso';

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const emsUser = await EmsUser.findOne({ ssoUserId: user.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    // Managers see all tasks; employees see only their own
    const query = isManager ? {} : { assignedToSsoId: user.ssoUserId };
    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();

    const headersList = await headers();
    const cookie = headersList.get('cookie') || '';

    // Forward the cookie to the SSO server for user details
    const populatedTasks = await populateSsoUsers(tasks, 'assignedToSsoId' as any, 'assignedToUser', {
      headers: { Cookie: cookie }
    });

    return NextResponse.json(populatedTasks);
  } catch (err: any) {
    console.error("GET /api/tasks failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emsUser = await EmsUser.findOne({ ssoUserId: user.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    if (!isManager) {
      return NextResponse.json({ error: 'Only managers can create tasks' }, { status: 403 });
    }

    const body = await req.json();
    await connectToDatabase();

    const task = new Task({
      title: body.title,
      description: body.description,
      assignedToSsoId: body.assignedToSsoId,
      priority: body.priority || 'medium',
      dueDate: body.dueDate || undefined,
      tags: body.tags || [],
      assignedBySsoId: user.ssoUserId,
    });

    await task.save();
    return NextResponse.json(task, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
