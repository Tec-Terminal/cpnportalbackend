import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICourses extends Document {
    _id: Types.ObjectId;
    title: string;
    duration: string;
    amount: string;
}

const CourseSchema: Schema = new Schema({
    title: {
    type: String,
    required: true,
    },
    duration: {
    type: String,
    required: true,
    },
    amount: {
    type: String,
    required: true,
    },
},
{timestamps: true}
);




const Course = mongoose.model<ICourses>('Course', CourseSchema);
export default Course;