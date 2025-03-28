import { Request, Response } from "express";
import { getUser } from "../../utils/getUser";
import Student from "../../models/studentModel";
import Course from "../../models/courseModel";
import Paymentplan from "../../models/paymentplanModel";
import { Paginated } from "../../types/pagination.types";
import Staff from "../../models/staffModel";
import mongoose, { Types } from "mongoose";
import { populate } from "dotenv";
import Invoice from "../../models/invoiceModel";
import Payment from "../../models/paymentModel";
import cron from "node-cron";
import Center from "../../models/centerModel";
import nodemailer from 'nodemailer';
import moment from "moment";
import { uploadToCloudinary } from "../../config/cloudinary";
import multer from 'multer';
import Report from "../../models/reportModel";
const upload = multer();

// create student
export const createStudent = async (req: Request, res: Response) => {
  const { fullname, email, phone, reg_date, birth_date, student_id } = req.body;

  // Validate input
  if (
    !fullname ||
    !email ||
    !phone ||
    !reg_date ||
    !birth_date ||
    !student_id
  ) {
    return res
      .status(400)
      .json({ data: "All fields are required", status: 400 });
  }

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const center = user.user.center;

    const newStudent = new Student({
      fullname,
      email,
      phone,
      center,
      reg_date,
      birth_date,
      student_id,
    });

    await newStudent.save();

    return res.status(201).json({
      status: 201,
      data: {
        newStudent,
        message: "Student Created Successfully",
      },
    });
  } catch (error) {
    console.error("Error Creating Student:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Edit Student
export const editStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const student = await Student.findOne({
      _id: id,
      center: user.user.center,
    });
    if (!student) {
      return res.status(404).json({ data: "Student Not Found", status: 404 });
    }

    Object.assign(student, updates);
    await student.save();

    return res.status(200).json({
      status: 200,
      data: {
        student,
        message: "Student Updated Successfully",
      },
    });
  } catch (error) {
    console.error("Error Editing Student:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500 });
  }
};

// Get all students
export const getAllStudents = async (req: Request, res: Response) => {
  try {
      const user = await getUser(req);
      if (!user || user.isAdmin) {
          return res.status(401).json({ data: 'Unauthorized', status: 401 });
      }

      const { page = 1, limit = 20, q, course } = req.query;

      const match: any = {};
      match['center'] = user.user.center;
      // Search functionality
      if (q) {
          match.$or = [
              { fullname: { $regex: q, $options: 'i' } },
              { email: { $regex: q, $options: 'i' } },
          ];
      }

      
      const pipeline: any[] = [
          { $match: match }, // Base match query for students
          {
              $lookup: {
                  from: 'paymentplans',
                  localField: 'plan',
                  foreignField: '_id',
                  as: 'planDetails',
              },
          },
          {
              $lookup:{
                from: 'centers',
                localField: 'center',
                foreignField: '_id',
                as: 'centerDetails',
              }
          },
          {
              $lookup: {
                  from: 'courses',
                  localField: 'planDetails.course_id',
                  foreignField: '_id',
                  as: 'courseDetails',
              },
          },
          
      ];

      // Course filter
      if (course) {
          pipeline.push({
              $match: {
                  'planDetails.course_id': new mongoose.Types.ObjectId(course as string),
              },
          });
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      pipeline.push(
          { $skip: skip },
          { $limit: Number(limit) }
      );

      // Execute the aggregation pipeline
      const students = await Student.aggregate(pipeline);

      const totalDocuments = await Student.countDocuments(match); 
      const totalPages = Math.ceil(totalDocuments / Number(limit));

       // Transform response to match the Students type
       const transformedStudents = students.map((student: any) => ({
          _id: student._id,
          createdAt: student.createdAt,
          fullname: student.fullname,
          email: student.email,
          phone: student.phone,
          center: student.centerDetails[0] || null,
          student_id: student.student_id,
          reg_date: student.reg_date,
          course_id: student.planDetails.length > 0 ? student.planDetails[0].course_id : null,
          birth_date: student.birth_date,
          plan: student.planDetails.map((plan: any) => ({
              ...plan,
              course_id: student.courseDetails[0] || null

              
          })),
          course: student.courseDetails[0] || null,
      }));

      const paginatedResponse: Paginated = {
          saved: [],
          existingRecords: transformedStudents,
          hasPreviousPage: Number(page) > 1,
          previousPages: Number(page) - 1,
          hasNextPage: Number(page) < totalPages,
          nextPages: Number(page) + 1,
          totalPages: totalPages,
          totalDocuments: totalDocuments,
          currentPage: Number(page),
      };

      return res.status(200).json({
          status: 200,
          data: paginatedResponse,
      });
  } catch (error) {
      console.error('Error Fetching Students:', error);
      return res.status(500).json({ data: 'Internal Server Error', status: 500 });
  }
};

// Get Student by ID
export const getStudentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const student = await Student.findById({
      _id: id,
      center: user.user.center,
    }).populate({
      path: "plan",
      model: Paymentplan,
      // populate: {
      // path: '_id', // Adjust based on your needs
      select:
        "amount installments estimate last_payment_date next_payment_date reg_date",
      populate: {
        path: "course_id",
        model: Course,
        select: "title duration amount",
      },
      // }
    });
    if (!student) {
      return res.status(404).json({ data: "Student Not Found", status: 404 });
    }

    return res.status(200).json({
      status: 200,
      data: student,
    });
  } catch (error) {
    console.error("Error Fetching Student:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500 });
  }
};

// Delete Student
export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const student = await Student.findOneAndDelete({
      _id: id,
      center: user.user.center,
    });
    if (!student) {
      return res.status(404).json({ data: "Student Not Found", status: 404 });
    }

    return res.status(200).json({
      status: 200,
      data: { message: "Student Deleted Successfully" },
    });
  } catch (error) {
    console.error("Error Deleting Student:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500 });
  }
};

// Create Staff

export const createStaff = async (req: Request, res: Response) => {
  const { fullname, email, phone, courses, salary } = req.body;

  // Validate input
  if (!fullname || !email || !phone || !courses || !salary) {
    return res
      .status(400)
      .json({ data: "All fields are required", status: 400 });
  }

  // email validatin
  const existingEmail = await Staff.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ data: "Email already exist", status: 400 });
  }

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const center = user.user.center;

    const newStaff = new Staff({
      fullname,
      email,
      phone,
      center,
      courses,
      salary,
    });

    await newStaff.save();

    return res.status(201).json({
      status: 201,
      data: {
        newStaff,
        message: "Staff Created Successfully",
      },
    });
  } catch (error) {
    console.error("Error Creating Staff:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// get all staff
export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const { q } = req.query; // Retrieve the search query parameter

    const query: any = { center: user.user.center }; // Base query to filter by center

    // Add search by name if 'q' is provided
    if (q) {
      query.$or = { fullname: { $regex: q, $options: "i" } }; // Case-insensitive search by name
    }

    const staff = await Staff.find(query) // Use the query with optional search criteria
      .populate("courses")
      .exec();

    return res.status(200).json({
      status: 200,
      data: staff,
    });
  } catch (error) {
    console.error("Error Fetching Staff:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500 });
  }
};

// get individual staff
export const getStaffById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const staff = await Staff.findOne({ _id: id, center: user.user.center });
    if (!staff) {
      return res.status(404).json({ data: "Staff Not Found", status: 404 });
    }

    return res.status(200).json({
      status: 200,
      data: staff,
    });
  } catch (error) {
    console.error("Error Fetching Staff:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500 });
  }
};

// edit staff
export const editStaff = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const staff = await Staff.findOne({ _id: id, center: user.user.center });
    if (!staff) {
      return res.status(404).json({ data: "Staff Not Found", status: 404 });
    }

    Object.assign(staff, updates);
    await staff.save();

    return res.status(200).json({
      status: 200,
      data: {
        staff,
        message: "Staff Updated Successfully",
      },
    });
  } catch (error) {
    console.error("Error Editing Staff:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500 });
  }
};

// Delete staff
export const deleteStaff = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const staff = await Staff.findOneAndDelete({
      _id: id,
      center: user.user.center,
    });
    if (!staff) {
      return res.status(404).json({ data: "Staff Not Found", status: 404 });
    }

    return res.status(200).json({
      status: 200,
      data: { message: "Staff Deleted Successfully" },
    });
  } catch (error) {
    console.error("Error Deleting Staff:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500 });
  }
};

// add course to student


export const addCourse = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, course_id, installments, reg_date } = req.body;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const student = await Student.findById({
      _id: id,
      center: user.user.center,
    });
    if (!student) {
      return res.status(404).json({ data: "Student not found", status: 404 });
    }

    const course = await Course.findById(course_id);
    if (!course) {
      return res.status(404).json({ data: "Course not found", status: 404 });
    }

    // Assuming course.duration is in months
    const courseDuration = Number(course.duration);
    const estimate = +amount / +installments;

    // Calculate interval between payments based on installments and course duration
    const intervalInMonths = courseDuration / +installments;

    // Calculate the next payment date from the registration date
    const next_payment_date = moment(reg_date).add(intervalInMonths, 'months');

    const paymentPlan = new Paymentplan({
      user_id: student._id,
      amount,
      course_id: course._id,
      installments,
      estimate,
      reg_date,
      next_payment_date,
    });

    await paymentPlan.save();

    student.plan.push(paymentPlan._id);
    await student.save();

    return res.status(201).json({
      data: "Payment plan created successfully",
      paymentPlan,
      status: 201,
    });
  } catch (error) {
    console.error("Error adding payment plan:", error);
    return res.status(500).json({
      data: "Internal Server Error",
      error: (error as any).message,
      status: 500,
    });
  }
};

// create invoice
export const createInvoice = async (req: Request, res: Response) => {
  const { amount, payment_plan_id, message, disclaimer, due_date } = req.body;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const newInvoice = new Invoice({
      amount,
      payment_plan_id,
      message,
      disclaimer,
      due_date,
    });

    await newInvoice.save();
    res.status(201).json({
      status: 201,
      data: {
        newInvoice,
        message: "Invoice created successfully",
      },
    });
  } catch (error) {
    res.status(500).json({ "Error creating invoice": error });
  }
};

// get all invoices
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const invoices = await Invoice.find().populate({
      path: "payment_plan_id",
      model: Paymentplan,
      select:
        "amount installments estimate last_payment_date next_payment_date reg_date",
      populate: [
        {
          path: "course_id",
          model: Course,
          select: "title duration amount",
        },
        {
          path: "user_id",
          model: Student,
          select: "fullname email phone center student_id",
          populate:[{
            path: "center",
            model: Center,
            select: "name location code"
          }]
        },
      ],
    });

    res.status(200).json({
      data: invoices,
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching invoices",
      details: error,
    });
  }
};

// get single invoice
export const getInvoiceById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const invoice = await Invoice.findById(id).populate({
      path: "payment_plan_id",
      model: Paymentplan,
      select:
        "amount installments estimate last_payment_date next_payment_date reg_date",
      populate: [
        {
          path: "course_id",
          model: Course,
          select: "title duration amount",
        },
        {
          path: "user_id",
          model: Student,
          select: "fullname email phone center student_id",
          populate:[{
            path: "center",
            model: Center,
            select: "name location code"
          }]
        },
      ],
    });

    if (!invoice) {
      return res.status(404).json({
        data: "Invoice not found",
        status: 404,
      });
    }

    res.status(200).json({
      data: invoice,
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching the invoice",
      details: error,
    });
  }
};

// delete invoice
export const deleteInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const invoice = await Invoice.findByIdAndDelete(id);

    if (!invoice) {
      return res.status(404).json({
        data: "Invoice not found",
        status: 404,
      });
    }

    res.status(200).json({
      data: "Invoice deleted successfully",
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error deleting the invoice",
      details: error,
    });
  }
};

// add payment
export const addPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, payment_plan_id, message, disclaimer, payment_date } =
    req.body;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const student = await Student.findById({
      _id: id,
      center: user.user.center,
    });
    if (!student) {
      return res.status(404).json({ data: "Student not found", status: 404 });
    }
    

        // Find the payment plan to get the last payment date
        const paymentPlan = await Paymentplan.findById(payment_plan_id);
        if (!paymentPlan) {
          return res.status(404).json({ data: "Payment plan not found", status: 404 });
        }

            // Use the next payment date from the payment plan as the last payment date
    const lastPaymentDate = paymentPlan.next_payment_date || payment_date;

    const newPayment = new Payment({
      user_id: student._id,
      amount,
      payment_plan_id,
      message,
      disclaimer,
      payment_date,
      lastPaymentDate,
    });

    await newPayment.save();

    // Update the next payment date in the payment plan
    const nextPaymentDate = moment(lastPaymentDate).add(1, 'months').toISOString(); // Convert Moment to ISO string
    paymentPlan.next_payment_date = nextPaymentDate; // Assign as an ISO string
    await paymentPlan.save();


    res.status(201).json({
      status: 201,
      data: {
        newPayment,
        message: "Payment created successfully",
      },
    });
  } catch (error) {
    res.status(500).json({ "Error creating payment": error });
  }
};



export const getAllPayments = async (req: Request, res: Response) => {
  try {
    // Authenticate user
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      console.log("❌ Unauthorized access");
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const { page = 1, limit = 20, course, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (course && !mongoose.isValidObjectId(course)) {
      return res.status(400).json({ data: "Invalid course ID", status: 400 });
    }

    // Fetch all user IDs that belong to the same center
    let usersInCenter = await Student.find({ center: user.user.center }).select("_id").lean();

   
    if (q) {
      usersInCenter = await Student.find({
        center: user.user.center,
        fullname: { $regex: q, $options: "i" }, 
      }).select("_id").lean();
    }

    const userIds = usersInCenter.map(u => u._id);

    if (userIds.length === 0) {
      return res.status(200).json({ status: 200, data: { existingRecords: [], totalDocuments: 0, totalPages: 0, currentPage: 1 } });
    }

    let query = Payment.find({ user_id: { $in: userIds } })
      .populate({
        path: "payment_plan_id",
        model: Paymentplan,
        select:
          "amount installments estimate last_payment_date next_payment_date reg_date",
        populate: [
          {
            path: "course_id",
            model: Course,
            select: "title duration amount",
          },
          {
            path: "user_id",
            model: Student,
            select: "fullname email phone center student_id",
            populate: [{
              path: "center",
              model: Center,
              select: "name location code"
            }]
          },
        ],
      })
      .sort({ payment_date: -1 })
      .skip(skip)
      .limit(Number(limit));

      if (course) {
        query = query.where("payment_plan_id").in(
          await Paymentplan.find({ course_id: course }).distinct("_id")
        );
      }

    const payments = await query.exec();

    if (payments.length === 0) {
      console.log(" No payments found. Check if documents exist in DB.");
    }

    const totalDocuments = await Payment.countDocuments({ user_id: { $in: userIds } });
    const totalPages = Math.ceil(totalDocuments / Number(limit));

    const paginatedResponse = {
      existingRecords: payments,
      hasPreviousPage: Number(page) > 1,
      previousPages: Number(page) - 1,
      hasNextPage: Number(page) < totalPages,
      nextPages: Number(page) + 1,
      totalPages: totalPages,
      totalDocuments: totalDocuments,
      currentPage: Number(page),
    };
    res.status(200).json({ status: 200, data: paginatedResponse });

  } catch (error) {
    console.error("❌ Error fetching payments:", error);
    res.status(500).json({ data: "Internal Server Error", status: 500, details: error });
  }
};


// get single payment
export const getPaymentById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const payment = await Payment.findById(id).populate({
      path: "payment_plan_id",
      model: Paymentplan,
      select:
        "amount installments estimate last_payment_date next_payment_date reg_date",
      populate: [
        {
          path: "course_id",
          model: Course,
          select: "title duration amount",
        },
        {
          path: "user_id",
          model: Student,
          select: "fullname email phone center student_id",
          populate:[{
            path: "center",
            model: Center,
            select: "name location code"
          }]
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        data: "Payment not found",
        status: 404,
      });
    }

    res.status(200).json({
      data: payment,
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching the payment",
      details: error,
    });
  }
};

// get all payment for a student
export const getPaymentsByStudentId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }

    const payments = await Payment.find({ user_id: id }).populate({
      path: "payment_plan_id",
      model: Paymentplan,
      select:
        "amount installments estimate last_payment_date next_payment_date reg_date",
      populate: [
        {
          path: "course_id",
          model: Course,
          select: "title duration amount",
        },
        {
          path: "user_id",
          model: Student,
          select: "fullname email phone center student_id",
          populate:[{
            path: "center",
            model: Center,
            select: "name location code"
          }]
        },
      ],
    });

    res.status(200).json({
      data: payments,
      status: 200,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching payments for the student",
      details: error,
    });
  }
};



// edit payment
export const editPayment = async (req: Request, res:Response)=>{
  const {id} = req.params;
  const {amount, payment_plan_id, message, disclaimer, payment_date} = req.body;
  try {
    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      {amount, payment_plan_id, message, disclaimer, payment_date},
      { new: true, runValidators: true }
     );
    if(!updatedPayment){
      res.status(404).json({data: "Payment not found"})
    }
    return res.status(200).json({
      status: 200,
      data: {
          updatedPayment,
          message: 'Payment Updated Successfully',
      }
  });
  } catch (error) {
    
  }
}



export async function getPlanBalance(req: Request, res: Response) {
  const { id } = req.params;
  try {

    const plan = await Paymentplan.findById(id);
    if (!plan) {
      return res.status(404).json({ data: "gerrout", status: 404 });
    }

    const payments = await Payment.find({ payment_plan_id: id });
    if (!payments || !payments.length) {
      return res.status(200).json({ data: "0", status: 200 });
    }
    const toBePaid = Number(plan.amount);
    let paid = 0;
    payments.forEach(payment=>{
      paid += Number(payment.amount)
    })

    const balance = Math.abs(toBePaid - paid);


    return res.status(200).json({ data: `${balance}`, status: 200 });


  } catch (error) {
    console.error(error);
    
    res.status(500).json({
      error: "Error fetching balance for the student",
      details: error,
    });
  }
}


export const uploadStaffImage = async(req: Request, res:Response) =>{
    try {
      const { id } = req.params;
      const user = await getUser(req);
      if (!user || user.isAdmin) {
        return res.status(401).json({ data: "Unauthorized", status: 401 });
      }
      if (!req.file) {
        return res.status(400).json({ data: "No file uploaded", status: 400 });
      }
      const result = await uploadToCloudinary(req.file.buffer);
      const staff = await Staff.findById(id);
      if (!staff) {
        return res.status(404).json({ data: "Staff not found", status: 404 });
      }
      staff.image = result.secure_url;
      await staff.save();
      res.status(200).json({ data: "Image uploaded successfully", status: 200 });
      
    } catch (error) {
      console.error(error);
    
      res.status(500).json({
        error: "Error uploading staff image",
        details: error,
      })
    }
}

export const uploadStaffCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const user = await getUser(req);
    if (!user || user.isAdmin) {
      return res.status(401).json({ data: "Unauthorized", status: 401 });
    }
    if (!name) {
      return res.status(400).json({
        data: "Name field is required",
        status: 400,
      });
    }
    if (!req.file) {
      return res.status(400).json({ data: "No file uploaded", status: 400 });
    }
    const result = await uploadToCloudinary(req.file.buffer);
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ data: "Staff not found", status: 404 });
    }
    staff.certificate = [
      ...staff.certificate,
      {
        _id: new mongoose.Types.ObjectId(),
        name: name,
        url: result.secure_url,
      },
    ];
    await staff.save();
    res.status(200).json({
      data: "Certificate uploaded and saved successfully",
      status: 200,
      certificate: staff.certificate,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error uploading staff certificate",
      details: error,
    });
  }
};


export const deleteStaffCertificate = async (req: Request, res: Response) => {
  try {
      const { id, certificateId } = req.params;
      const user = await getUser(req);

      if (!user || user.isAdmin) {
          return res.status(401).json({ data: "Unauthorized", status: 401 });
      }

      const staff = await Staff.findById(id);
      if (!staff) {
          return res.status(404).json({ data: "Staff not found", status: 404 });
      }

      staff.certificate = staff.certificate.filter(cert => cert._id.toString() !== certificateId);
      await staff.save();

      res.status(200).json({
          data: "Certificate deleted successfully",
          status: 200,
          certificate: staff.certificate,
      });
  } catch (error) {
      console.error("Error deleting staff certificate:", error);
      res.status(500).json({
          error: "Error deleting staff certificate",
          details: error,
      });
  }
};





// create reports
export const createReport = async (req: Request, res: Response) => {
  const { title, description, date, reportType, enquiries, totalPayments, summary } = req.body;

  if (!title || !description || !date || !reportType || !enquiries || !totalPayments || !summary) {
      return res.status(400).json({ data: "All fields are required", status: 400 });
  }

  if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
      return res.status(400).json({ data: "Invalid report type", status: 400 });
  }

  try {
      const user = await getUser(req);
      if (!user || user.isAdmin) {
          return res.status(401).json({ data: "Unauthorized", status: 401 });
      }

      const center = user.user.center;

      const newReport = new Report({
          title,
          description,
          date,
          center,
          reportType,
          enquiries,
          totalPayments,
          summary,
          createdBy: user.user._id,
      });

      await newReport.save();

      return res.status(201).json({
          status: 201,
          data: {
              newReport,
              message: "Report Created Successfully",
          },
      });
  } catch (error) {
      console.error("Error Creating Report:", error);
      return res.status(500).json({ message: "Internal Server Error" });
  }
};

// get individual report 
export const getIndividualReport = async ()=>{
  

}

// get all reports for the center of the manager
export async function getAllReports(){

}




