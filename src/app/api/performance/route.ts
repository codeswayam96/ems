import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { EmsUser } from '@/models/EmsUser';
import { getUserFromSession } from '@/lib/auth';
import mongoose, { Schema, Model, Document } from 'mongoose';

// Inline ReviewCycle model (no separate file needed)
interface IReviewCycle extends Document {
  title: string;
  period: string;
  status: 'draft' | 'active' | 'completed';
  createdBy: string;
  revieweeIds: string[];
  completedIds: string[];
}

const ReviewCycleSchema = new Schema<IReviewCycle>({
  title:       { type: String, required: true },
  period:      { type: String, required: true },
  status:      { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
  createdBy:   { type: String, required: true },
  revieweeIds: [{ type: String }],
  completedIds:[{ type: String }],
}, { timestamps: true });

const ReviewCycle: Model<IReviewCycle> =
  mongoose.models.ReviewCycle ||
  mongoose.model<IReviewCycle>('ReviewCycle', ReviewCycleSchema);

export async function GET() {
  const session = await getUserFromSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const cycles = await ReviewCycle.find({}).sort({ createdAt: -1 }).lean();

  return NextResponse.json(
    cycles.map(c => ({
      _id: c._id,
      title: c.title,
      period: c.period,
      status: c.status,
      createdAt: (c as any).createdAt,
      revieweeCount: (c.revieweeIds || []).length,
      completedCount: (c.completedIds || []).length,
    }))
  );
}

export async function POST(req: Request) {
  const session = await getUserFromSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const user = await EmsUser.findOne({ ssoUserId: session.userId });
  if (!user || !['admin', 'ceo', 'manager'].includes(user.appRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, period, status = 'draft' } = await req.json();
  if (!title?.trim() || !period?.trim()) {
    return NextResponse.json({ error: 'title and period are required' }, { status: 400 });
  }

  const cycle = await ReviewCycle.create({
    title: title.trim(),
    period: period.trim(),
    status,
    createdBy: session.userId,
    revieweeIds: [],
    completedIds: [],
  });

  return NextResponse.json({
    _id: cycle._id,
    title: cycle.title,
    period: cycle.period,
    status: cycle.status,
    revieweeCount: 0,
    completedCount: 0,
    createdAt: (cycle as any).createdAt,
  }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await getUserFromSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id, status } = await req.json();
  const cycle = await ReviewCycle.findByIdAndUpdate(id, { status }, { new: true });
  if (!cycle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ success: true, status: cycle.status });
}
