import { timeStamp } from 'console';
import mongoose, { Schema, Document, Types } from 'mongoose';


// Define interface
export interface IStudent extends Document {
    _id: Types.ObjectId;
    fullname: string;
    email: string;
    phone: number;
    center: mongoose.Schema.Types.ObjectId;
    reg_date: string;
    birth_date: string;
    student_id: string;
    plan: Types.Array<Types.ObjectId>;
}

const StudentShema: Schema = new Schema({
    fullname:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,   
    },
    phone:{
        type: Number,
        required: true,
    },
    center: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Center', // Referencing the Center model
        required: true,
        },
    reg_date:{
        type: String,
        required: true,
    },
    birth_date:{
        type: String,
        required: true,
    },
    student_id:{
        type: String,
        required: true,
    },
    plan: [{
        type: Schema.Types.ObjectId,
        ref: 'Paymentplan',
    }]
},
{timestamps: true}
);

const Student = mongoose.model<IStudent>('Student', StudentShema);
export default Student;