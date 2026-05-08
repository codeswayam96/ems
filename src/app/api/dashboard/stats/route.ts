import { NextResponse } from 'next/server';
import { startOfDay, endOfDay } from 'date-fns';
import connectToDatabase from '@/lib/db';
import { Task } from '@/models/Task';
import { EmsUser } from '@/models/EmsUser';
import { Attendance } from '@/models/Attendance';
import { Meeting } from '@/models/Meeting';
import { Team } from '@/models/Team';
import { getUserFromSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getUserFromSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const emsUser = await EmsUser.findOne({ ssoUserId: session.ssoUserId });
    const isManager = emsUser && ['admin', 'ceo', 'manager'].includes(emsUser.appRole);

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const taskQuery = isManager ? {} : { assignedToSsoId: session.ssoUserId };

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      overdueTasks,
      todayAttendance,
      upcomingMeetings,
      activeTeams,
      totalEmployees,
      tasksByDepartment,
    ] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'approved' }),
      Task.countDocuments({ ...taskQuery, status: 'pending' }),
      Task.countDocuments({ ...taskQuery, status: 'in_progress' }),
      Task.countDocuments({ ...taskQuery, status: { $nin: ['approved'] }, dueDate: { $lt: today } }),
      // Today's present count (managers see all, employee sees own)
      isManager
        ? Attendance.countDocuments({ date: { $gte: todayStart, $lte: todayEnd }, status: 'present' })
        : Attendance.countDocuments({ ssoUserId: session.ssoUserId, date: { $gte: todayStart, $lte: todayEnd } }),
      // Next 5 upcoming meetings
      Meeting.find({ scheduledTime: { $gte: today }, status: 'scheduled' })
        .sort({ scheduledTime: 1 })
        .limit(5)
        .lean(),
      Team.countDocuments({ status: 'active' }),
      isManager ? EmsUser.countDocuments({ status: 'approved' }) : null,
      // Tasks grouped by assignee's department (managers see all, employees see own)
      Task.aggregate([
        ...(isManager ? [] : [{ $match: { assignedToSsoId: session.ssoUserId } }]),
        {
          $lookup: {
            from: 'emsusers',
            localField: 'assignedToSsoId',
            foreignField: 'ssoUserId',
            as: 'assignee',
          },
        },
        { $unwind: { path: '$assignee', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$assignee.department', 'General'] },
            tasks: { $sum: 1 },
          },
        },
        { $project: { _id: 0, name: '$_id', tasks: 1 } },
        { $sort: { tasks: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      tasks: { total: totalTasks, completed: completedTasks, pending: pendingTasks, inProgress: inProgressTasks, overdue: overdueTasks, completionRate },
      attendance: { todayCount: todayAttendance },
      upcomingMeetings,
      activeTeams,
      totalEmployees,
      tasksByDepartment,
    });
  } catch (err: any) {
    console.error('GET /api/dashboard/stats failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
