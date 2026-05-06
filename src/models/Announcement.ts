import mongoose, { Schema, Document, Model } from 'mongoose';

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  priority: AnnouncementPriority;
  authorSsoId: string;
  pinned: boolean;
  targetDepartment?: string; // undefined = company-wide
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    authorSsoId: { type: String, required: true },
    pinned: { type: Boolean, default: false },
    targetDepartment: { type: String }, // null = all departments
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
