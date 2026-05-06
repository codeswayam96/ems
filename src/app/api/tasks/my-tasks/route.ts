import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Task } from '@/models/Task';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const tasks = await Task.find({ assignedToSsoId: user.ssoUserId }).sort({ createdAt: -1 });
  
  return NextResponse.json(tasks);
}
