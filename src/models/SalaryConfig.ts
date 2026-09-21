import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * SalaryConfig — stores each employee's salary structure.
 * One document per EMS user (ssoUserId).
 */
export interface ISalaryConfig extends Document {
  ssoUserId: string;
  /** Gross CTC in INR per month */
  basicSalary: number;
  /** Flat allowance (HRA, travel, etc.) */
  allowances: number;
  /** PF deduction percentage (typically 12% of basic) */
  pfPercent: number;
  /** Professional tax (flat, INR/month) */
  professionalTax: number;
  /** Any other deductions (loan EMI, etc.) */
  otherDeductions: number;
  /** Pay frequency — monthly is standard */
  payFrequency: 'monthly';
  /** Bank account number (optional) */
  bankAccount?: string;
  /** IFSC code */
  ifsc?: string;
  updatedAt: Date;
  createdAt: Date;
}

const SalaryConfigSchema = new Schema<ISalaryConfig>({
  ssoUserId:        { type: String, required: true, unique: true, index: true },
  basicSalary:      { type: Number, required: true, min: 0 },
  allowances:       { type: Number, default: 0, min: 0 },
  pfPercent:        { type: Number, default: 12, min: 0, max: 100 },
  professionalTax:  { type: Number, default: 200, min: 0 },
  otherDeductions:  { type: Number, default: 0, min: 0 },
  payFrequency:     { type: String, enum: ['monthly'], default: 'monthly' },
  bankAccount:      { type: String },
  ifsc:             { type: String },
}, { timestamps: true });

export const SalaryConfig: Model<ISalaryConfig> =
  mongoose.models.SalaryConfig ||
  mongoose.model<ISalaryConfig>('SalaryConfig', SalaryConfigSchema);
