import { timeStamp } from 'console';
import mongoose, { Schema, Document, Types } from 'mongoose';

// Define the interface for the Admin document
export interface IAdmin extends Document {
  _id: Types.ObjectId;
  fullname: string;
  email: string;
  password: string;
}


const AdminSchema: Schema = new Schema({
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
  
},
{timestamps: true}
);


const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
export default Admin;
