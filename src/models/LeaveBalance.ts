import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * LeaveBalance — annual leave quota per employee per calendar year.
 * Admins set the allotted days; the system auto-decrements used days when a leave is approved.
 */
export interface ILeaveBalance extends Document {
  ssoUserId: string;
  year: number;
  // Allotted days (set by admin)
  annualAllotted: number;
  sickAllotted: number;
  casualAllotted: number;
  // Used days (auto-tracked)
  annualUsed: number;
  sickUsed: number;
  casualUsed: number;
  // Carry-forward from previous year
  carryForward: number;
}

const LeaveBalanceSchema = new Schema<ILeaveBalance>({
  ssoUserId:       { type: String, required: true },
  year:            { type: Number, required: true },
  annualAllotted:  { type: Number, default: 12 },
  sickAllotted:    { type: Number, default: 7 },
  casualAllotted:  { type: Number, default: 7 },
  annualUsed:      { type: Number, default: 0 },
  sickUsed:        { type: Number, default: 0 },
  casualUsed:      { type: Number, default: 0 },
  carryForward:    { type: Number, default: 0 },
}, { timestamps: true });

// One balance record per user per year
LeaveBalanceSchema.index({ ssoUserId: 1, year: 1 }, { unique: true });

export const LeaveBalance: Model<ILeaveBalance> =
  mongoose.models.LeaveBalance ||
  mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
