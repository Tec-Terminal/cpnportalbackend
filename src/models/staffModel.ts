import { timeStamp } from 'console';
import mongoose, { Schema, Document, Types } from 'mongoose';


// Define interface
interface Certificate{
    _id: Types.ObjectId,
    name: string,
    url: string
}


export interface IStaff extends Document {
    _id: Types.ObjectId;
    fullname: string;
    email: string;
    phone: number;
    image: string;
    certificate: Certificate[];
    center: mongoose.Schema.Types.ObjectId;
    courses: Types.Array<Types.ObjectId>;
    salary: number;
}

const StaffShema: Schema = new Schema({
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
    image:{
        type: String,
    },
    certificate:[{
        _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: {
            type: String,
            default: ''
        },
        url:{
            type: String,
            default: ''
        }

    }],
    center: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Center', // Referencing the Center model
        required: true,
        },
    courses: [{
        type: Schema.Types.ObjectId,
        ref: 'Course',
    }],
    salary:{
        type: Number,
        required: true,
    },
},
{timestamps: true}
);

const Staff = mongoose.model<IStaff>('Staff', StaffShema);
export default Staff;