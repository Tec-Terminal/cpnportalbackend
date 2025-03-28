import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IManagers extends Document {
    _id: Types.ObjectId;
    fullname: string;
    email: string;
    password: string;
    phone: string;
    center: mongoose.Schema.Types.ObjectId;
}

const ManagerSchema: Schema = new Schema({
    fullname: {
    type: String,
    required: true,
    },
    email: {
    type: String,
    required: true,
    unique: true,
    },
    password: {
    type: String,
    required: true,
    },
    phone: {
    type: String,
    required: true,
    },
    center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center', // Referencing the Center model
    required: true,
    },
},
{timestamps: true}
);




const Manager = mongoose.model<IManagers>('Manager', ManagerSchema);
export default Manager;