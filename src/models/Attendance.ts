import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILeaveRequest {
  type: 'sick' | 'casual' | 'vacation' | 'medical' | 'other';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // ssoUserId of approver
  approvedAt?: Date;
}

export interface IAttendance extends Document {
  ssoUserId: string;
  date: Date; // normalized to start of day
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'partial' | 'leave' | 'holiday';
  leaveRequest?: ILeaveRequest;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  type: { type: String, enum: ['sick', 'casual', 'vacation', 'medical', 'other'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: String },
  approvedAt: { type: Date },
}, { _id: false });

const AttendanceSchema = new Schema<IAttendance>(
  {
    ssoUserId: { type: String, required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ['present', 'absent', 'partial', 'leave', 'holiday'],
      default: 'absent',
    },
    leaveRequest: LeaveRequestSchema,
    notes: { type: String },
  },
  { timestamps: true }
);

// Compound unique index: one record per user per day
AttendanceSchema.index({ ssoUserId: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
