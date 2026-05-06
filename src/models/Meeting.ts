import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeetingAttendee extends Document {
  ssoUserId: string;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface IMeeting extends Document {
  title: string;
  description?: string;
  meetingLink?: string;
  platform?: 'teams' | 'meet' | 'other';
  hostSsoId: string;
  department?: string;
  scheduledTime: Date;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendees: IMeetingAttendee[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<IMeetingAttendee>({
  ssoUserId: { type: String, required: true },
  joinedAt: { type: Date },
  leftAt: { type: Date }
});

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true },
    description: { type: String },
    meetingLink: { type: String },
    platform: { type: String, enum: ['teams', 'meet', 'other'] },
    hostSsoId: { type: String, required: true },
    department: { type: String },
    scheduledTime: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], 
      default: 'scheduled' 
    },
    attendees: [AttendeeSchema]
  },
  { timestamps: true }
);

export const Meeting: Model<IMeeting> = mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
