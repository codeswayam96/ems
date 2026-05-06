import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITimeEntry extends Document {
  ssoUserId: string;
  project: string;
  description?: string;
  hours: number; // decimal e.g. 7.5
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // ssoUserId of manager
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
  {
    ssoUserId: { type: String, required: true },
    project: { type: String, required: true },
    description: { type: String },
    hours: { type: Number, required: true, min: 0.25, max: 24 },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const TimeEntry: Model<ITimeEntry> =
  mongoose.models.TimeEntry || mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);
