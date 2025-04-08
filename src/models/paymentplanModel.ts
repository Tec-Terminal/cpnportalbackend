import { timeStamp } from 'console';
import mongoose, { Schema, Document, Types } from 'mongoose';

// Define the interface for the Admin document
export interface IPaymentplan extends Document {
  _id: Types.ObjectId;
  user_id: mongoose.Schema.Types.ObjectId;
  amount: number;
  paid: number;
  pending: number;
  course_id: mongoose.Schema.Types.ObjectId;
  installments: number;
  per_installment: number;
  estimate: number;
  last_payment_date: string;
  next_payment_date: string;
  reg_date: string;

}


const PaymentplanSchema: Schema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Student'
  },
  amount: {
    type: Number,
    required: true,
  },
  paid:{
    type: Number,
    required: true,
    default: 0,
  },
  pending:{
    type: Number,
    required: true,
    default: 0,

  },
  course_id: {  
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Course'
  },
  installments: {
    type: Number,
    required: true,
    ref: ''
  },
  per_installment: {
    type: Number,
   
  },
  estimate: {
    type: Number,
    required: true,
  },
  last_payment_date: {
    type: String,
    // required: true,
    default: ''
  },
  next_payment_date: {
    type: String,
    required: true,
  },
  reg_date:{
    type:String,
    required: true,
  }
  
},
{timestamps: true}
);


const Paymentplan = mongoose.model<IPaymentplan>('Paymentplan', PaymentplanSchema);
export default Paymentplan;