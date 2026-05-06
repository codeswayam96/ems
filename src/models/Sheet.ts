import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISheetColumn {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  orderIndex: number;
}

export interface ISheetRow {
  data: Record<string, any>; // maps column name -> value
}

export interface ISheet extends Document {
  name: string;
  ownerSsoId: string;
  department?: string;
  columns: ISheetColumn[];
  rows: ISheetRow[];
  createdAt: Date;
  updatedAt: Date;
}

const ColumnSchema = new Schema<ISheetColumn>({
  name: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'boolean', 'date'], required: true },
  orderIndex: { type: Number, required: true }
}, { _id: false });

const RowSchema = new Schema<ISheetRow>({
  data: { type: Schema.Types.Mixed, required: true }
});

const SheetSchema = new Schema<ISheet>(
  {
    name: { type: String, required: true },
    ownerSsoId: { type: String, required: true },
    department: { type: String },
    columns: [ColumnSchema],
    rows: [RowSchema]
  },
  { timestamps: true }
);

export const Sheet: Model<ISheet> = mongoose.models.Sheet || mongoose.model<ISheet>('Sheet', SheetSchema);
