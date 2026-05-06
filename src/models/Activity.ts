import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPageActivity {
  route: string;
  timeSpentSeconds: number;
  idleTimeSeconds: number;
  createdAt: Date;
}

export interface ISession extends Document {
  ssoUserId: string;
  loginTime: Date;
  logoutTime?: Date;
  activeDurationMinutes: number;
  pageActivities: IPageActivity[];
}

const PageActivitySchema = new Schema<IPageActivity>({
  route: { type: String, required: true },
  timeSpentSeconds: { type: Number, default: 0 },
  idleTimeSeconds: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const SessionSchema = new Schema<ISession>({
  ssoUserId: { type: String, required: true },
  loginTime: { type: Date, default: Date.now },
  logoutTime: { type: Date },
  activeDurationMinutes: { type: Number, default: 0 },
  pageActivities: [PageActivitySchema]
});

export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
