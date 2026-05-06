import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeamMember {
  ssoUserId: string;
  joinedAt: Date;
}

export interface ITeam extends Document {
  name: string;
  description?: string;
  department: string;
  color: string; // tailwind bg class e.g. 'bg-violet-500'
  lead: string; // ssoUserId of team lead
  members: ITeamMember[];
  status: 'active' | 'onboarding' | 'inactive';
  createdBy: string; // ssoUserId
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  ssoUserId: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: { type: String },
    department: { type: String, required: true },
    color: { type: String, default: 'bg-violet-500' },
    lead: { type: String, required: true },
    members: [TeamMemberSchema],
    status: {
      type: String,
      enum: ['active', 'onboarding', 'inactive'],
      default: 'active',
    },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
