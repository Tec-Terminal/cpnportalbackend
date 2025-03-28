import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReport extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    date: String;
    center: Types.ObjectId;
    reportType: 'daily' | 'weekly' | 'monthly';
    enquiries: number;
    totalPayments: number;
    summary: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        date: {
            type: String,
            required: true,
        },
        center: {
            type: Types.ObjectId,
            ref: 'Center',
            required: true,
        },
        reportType: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            required: true,
        },
        enquiries: {
            type: Number,
            required: true,
            default: 0,
        },
        totalPayments: {
            type: Number,
            required: true,
            default: 0,
        },
        summary: {
            type: String,
            required: true,
            trim: true,
        },
        createdBy: {
            type: Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model<IReport>('Report', ReportSchema);
