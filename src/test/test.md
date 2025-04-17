export const getReport = async(req: Request, res:Response) =>{
   try {

    const user = await getUser(req);
    if (!user || !user.isAdmin) {
        return res.status(401).json({ data: 'Unauthorized', status: 401 });
    }

    const { from, to } = req.query;

    const query: any = {};
    
    // Apply date filter (reg_date is stored as YYYY-MM-DD string)
    if (from || to) {
      query.reg_date = {};
    
      if (from) query.reg_date.$gte = from as string;
      if (to) query.reg_date.$lte = to as string;
    }
    
    // Fetch plans based on date filter
    const paymentPlans = await Paymentplan.find(query);
    
    // Basic counts
    const totalPaymentPlans = paymentPlans.length;
    const completedPlans = paymentPlans.filter(plan => plan.paid > 0);
    const pendingPlans = paymentPlans.filter(plan => plan.pending > 0);
    
    // Sums
    const TotalCompletedAmount = completedPlans.reduce((acc, plan) => acc + plan.paid, 0);
    const TotalPendingAmount = pendingPlans.reduce((acc, plan) => acc + plan.pending, 0);
    
    return res.status(200).json({
      status: 200,
      filters: { from, to },
      data: {
        totalPaymentPlans,
        completedCount: completedPlans.length,
        pendingCount: pendingPlans.length,
        TotalCompletedAmount: `₦${TotalCompletedAmount.toLocaleString()}`,
        TotalPendingAmount: `₦${TotalPendingAmount.toLocaleString()}`
      }
    });
    
   } catch (error) {
    console.error(" Error fetching report:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500});
   }

    
}








<!-- ====================================================================== -->
export const getReport = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user || !user.isAdmin) {
      return res.status(401).json({ data: 'Unauthorized', status: 401 });
    }

    const { from, to, center, course, q, completed, pending } = req.query;

    const query: any = {};

    // Date filtering (already good)
    if (from || to) {
      query.reg_date = {};
      if (from) query.reg_date.$gte = from as string;
      if (to) query.reg_date.$lte = to as string;
    }

    // Filter by course if provided
    if (course) {
      query.course_id = course;
    }

    // search students by name
    if (q) {
      const students = await Student.find({ fullname: { $regex: q, $options: "i" } }).select("_id").lean();
      const studentIds = students.map(s => s._id);
      query.user_id = {$in: studentIds}
    }


    // Fetch plans with student and course populated
    let plans = await Paymentplan.find(query)
      .populate({
        path: 'user_id',
        select: 'fullname email student_id center isactive',
        populate: {
          path: 'center',
          select: 'name location' 
        }
      })
      .populate({
        path: 'course_id',
        select: 'title duration amount'
      });

    
    if (center) {
      plans = plans.filter(plan =>
        (plan.user_id as any)?.center?._id?.toString() === center
      );
    }

    if (completed === 'true') {
      plans = plans.filter(plan => plan.pending === 0);
    }

    // Filter by pending if specified (pending > 0 means still owing)
    if (pending === 'true') {
      plans = plans.filter(plan => plan.pending > 0);
    }

    // Totals and stats
    const totalPaymentPlans = plans.length;
    const completedPlans = plans.filter(plan => plan.paid > 0);
    const pendingPlans = plans.filter(plan => plan.pending > 0);

    const TotalCompletedAmount = completedPlans.reduce((acc, plan) => acc + plan.paid, 0);
    const TotalPendingAmount = pendingPlans.reduce((acc, plan) => acc + plan.pending, 0);

    return res.status(200).json({
      status: 200,
      filters: { from, to, center, course, completed, pending },
      data: {
        totalPaymentPlans,
        completedCount: completedPlans.length,
        pendingCount: pendingPlans.length,
        TotalCompletedAmount: `₦${TotalCompletedAmount.toLocaleString()}`,
        TotalPendingAmount: `₦${TotalPendingAmount.toLocaleString()}`,
        plans: plans.map(plan => ({
          _id: plan._id,
          paid: plan.paid,
          pending: plan.pending,
          estimate: plan.estimate,
          installments: plan.installments,
          per_installment: plan.per_installment,
          last_payment_date: plan.last_payment_date,
          next_payment_date: plan.next_payment_date,
          reg_date: plan.reg_date,
          student: {
            _id: (plan.user_id as any)?._id,
            fullname: (plan.user_id as any)?.fullname,
            email: (plan.user_id as any)?.email,
            student_id: (plan.user_id as any)?.student_id,
            isactive: (plan.user_id as any)?.isactive,
            center: {
              _id: (plan.user_id as any)?.center?._id,
              name: (plan.user_id as any)?.center?.name,
            }
          },
          course: {
            _id: (plan.course_id as any)?._id,
            title: (plan.course_id as any)?.title,
          }
        }))
      }
    });

  } catch (error) {
    console.error("Error fetching report:", error);
    return res.status(500).json({ data: "Internal Server Error", status: 500 });
  }
};