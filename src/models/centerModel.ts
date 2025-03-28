import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for Center
export interface ICenter extends Document {
    _id: Types.ObjectId;
    name: string;
    location: string;
    code: string;
}

// Center Schema
const CenterSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    code: {
        
        type: String,
        required: true,
    },
}, { timestamps: true });

const Center = mongoose.model<ICenter>('Center', CenterSchema);
export default Center;
