import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubmission extends Document {
  ssoUserId: string;
  contentUrl?: string;
  externalLink?: string;
  notes?: string;
  version: number;
  createdAt: Date;
}

export interface ITask extends Document {
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedToSsoId: string;
  assignedBySsoId: string;
  dueDate?: Date;
  tags?: string[];
  submissions: ISubmission[];
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>({
  ssoUserId: { type: String, required: true },
  contentUrl: { type: String },
  externalLink: { type: String },
  notes: { type: String },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    assignedToSsoId: { type: String, required: true },
    assignedBySsoId: { type: String, required: true },
    dueDate: { type: Date },
    tags: [{ type: String }],
    submissions: [SubmissionSchema],
  },
  { timestamps: true }
);

export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
