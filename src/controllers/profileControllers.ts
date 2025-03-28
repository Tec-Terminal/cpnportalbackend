import { Request, Response } from 'express';
import Admin from '../models/adminModel';
import { get } from 'http';
import { getUser } from '../utils/getUser';
import bcrypt from 'bcryptjs';
import Manager from '../models/managersModel';

export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ data: 'Unauthorized', status: 401 });
    }
    if (user.isAdmin) {
      return res.status(200).json({ data: user.user, status: 200 });
    }
    throw new Error('User is not an admin');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: 'invalid or expired token', status: 400});
  }
};


export const getManagerProfile = async (req: Request, res: Response) => {
  try {
    const user = await getUser(req);
    if (!user) {
      return res.status(401).json({ data: 'Unauthorized', status: 401 });
    }
    if (!user.isAdmin) {
      return res.status(200).json({ data: user.user, status: 200 });
    }
    throw new Error('User is not a manager');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: 'invalid or expired token', status: 400});
  }
};

// manager change password
export const changePassword = async (req: Request, res: Response) => {
  try {
      const { currentPassword, newPassword } = req.body;

      // Retrieve the authenticated user (admin or manager) from the session
      const authUser = await getUser(req);
      if (!authUser) {
          return res.status(401).json({ data: 'Unauthorized', status: 401 });
      }

      const { user, isAdmin } = authUser;

      // Validate the current password based on user type
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
          return res.status(400).json({ data: 'Current password is incorrect', status: 400 });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the password in the database
      user.password = hashedPassword;
      await user.save();

      return res.status(200).json({ data: 'Password updated successfully', status: 200 });
  } catch (error) {
      console.error('Error updating password:', error);
      return res.status(500).json({ data: 'Internal server error', status: 500 });
  }
};

// Cron Job Endpoint
export const cronJobEndpoint = async (req: Request, res: Response) => {
    try {
        return res.status(200).json({ message: 'Cron job executed successfully' });
    } catch (error) {
        console.error('Error executing cron job:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


