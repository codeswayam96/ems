import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmsUser extends Document {
  ssoUserId: string;
  appRole: 'admin' | 'manager' | 'employee' | 'viewer' | 'ceo' | 'intern';
  department: string;
  theme: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
}

const EmsUserSchema = new Schema<IEmsUser>({
  ssoUserId: { type: String, required: true, unique: true },
  appRole: { 
    type: String, 
    enum: ['admin', 'manager', 'employee', 'viewer', 'ceo', 'intern'],
    default: 'employee' 
  },
  department: { type: String, default: 'General' },
  theme: { type: String, default: 'dark' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

export const EmsUser: Model<IEmsUser> = mongoose.models.EmsUser || mongoose.model<IEmsUser>('EmsUser', EmsUserSchema);
