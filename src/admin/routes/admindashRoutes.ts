import express from 'express';
import { createCenter, editCenter, deleteCenter, getAllCenters, getCenterById, createManager, getAllManagers, deleteManager, getManagerById, editManager,  createCourse, editCourse, getAllCourses, getCourseById, deleteCourse, adminGetAllStaff, adminGetOneStaff, adminGetAllStudents, adminGetOneStudent, deleteStudent, getAllInvoices, getAllPayments, getPaymentById, getInvoiceById, getPaymentsByStudentId, cleanupOrphanedPaymentsAndPlans, cleanupOrphanedInvoices, deleteStudentPayment } from '../controllers/admindashController';
import verifyToken  from '../../middlewares/authMiddleware';
const router = express.Router();


// Admin Create Center Routes
router.post('/create-center', verifyToken, createCenter);
router.patch('/centers/:id', verifyToken, editCenter);
router.delete('/centers/:id', verifyToken, deleteCenter);
router.get('/centers',verifyToken, getAllCenters);
router.get('/centers/:id', verifyToken, getCenterById);


// Admin create Manager

router.post('/create-managers', verifyToken, createManager);
router.get('/managers', verifyToken, getAllManagers);
router.delete('/managers/:id', verifyToken, deleteManager);
router.get('/managers/:id', verifyToken, getManagerById);
router.patch('/managers/:id', verifyToken, editManager)

// Admin Create Courses
router.post('/courses', verifyToken, createCourse);
router.patch('/courses/:id', verifyToken, editCourse);
router.get('/courses', getAllCourses);
router.get('/courses/:id', verifyToken, getCourseById);
router.delete('/courses/:id', verifyToken, deleteCourse);


// Get all and individual staff 
router.get('/staff', verifyToken,  adminGetAllStaff);
router.get('/staff/:id', verifyToken,  adminGetOneStaff);


// Get all and individual students
router.get('/students', verifyToken,  adminGetAllStudents);
router.get('/students/:id', verifyToken,  adminGetOneStudent);
router.delete("/students/:id", verifyToken, deleteStudent);


// Get invoices
router.get("/plan/invoice", verifyToken, getAllInvoices);
router.get("/plan/invoice/:id", verifyToken, getInvoiceById);

// Get all payments
router.get("/student/payments", verifyToken, getAllPayments);
router.get("/student/payment/:id", verifyToken, getPaymentById);
router.get('/payments/student/:id', verifyToken, getPaymentsByStudentId);
router.delete("/student/payment/:id", verifyToken, deleteStudentPayment);

// orphaned clearance

router.post('/cleanup-orphaned-payments-and-plans', verifyToken, cleanupOrphanedPaymentsAndPlans);
router.post('/cleanup-orphaned-invoices', verifyToken, cleanupOrphanedInvoices);


export default router;
