import { timeStamp } from 'console';
import mongoose, { Schema, Document, Types } from 'mongoose';

// Define the interface for the Admin document
export interface IInvoice extends Document {
  _id: Types.ObjectId;
  amount: number;
  payment_plan_id: Types.ObjectId;
  message: string,
  disclaimer: string,
  due_date:string,

}


const InvoiceSchema: Schema = new Schema({
  amount: {
    type: Number,
    required: true,
  },
  payment_plan_id: {
    type: String,
    required: true,
    ref: 'Paymentplan'
  },
  message: {
    type: String,
    default: '',
  },
  disclaimer: {
    type: String,
    default: '',
  },
  due_date: {
    type: String,
    default: '',
  },
},
{timestamps: true}
);


const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export default Invoice;